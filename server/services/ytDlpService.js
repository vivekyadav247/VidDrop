const ytDlp = require('yt-dlp-exec');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { DOWNLOADS_DIR } = require('../utils/fileHelper');

// Use bundled ffmpeg-static binary — no system installation required
let ffmpegPath = null;
let ffmpegAvailable = false;
try {
  ffmpegPath = require('ffmpeg-static');
  if (ffmpegPath) {
    ffmpegAvailable = true;
  }
} catch (e) {
  console.warn('[ytDlpService] ffmpeg-static not found. Merging & MP3 extraction will be limited.');
}

/**
 * Clean characters that are forbidden in filenames.
 */
function sanitizeFilename(name) {
  if (!name) return 'download';
  return name
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format duration from seconds to HH:MM:SS or MM:SS
 */
function formatDuration(seconds) {
  if (!seconds) return 'Unknown';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Simple in-memory cache for metadata to optimize server load
const metadataCache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes cache

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of metadataCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      metadataCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

/**
 * Fetch video metadata from URL using yt-dlp
 */
async function fetchMetadata(url) {
  const cacheKey = url.trim();
  const cached = metadataCache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  try {
    const info = await ytDlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificates: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
      addHeader: [
        'referer:youtube.com',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    });

    const thumbnail = info.thumbnail || 
                      (info.thumbnails && info.thumbnails.length > 0 ? info.thumbnails[info.thumbnails.length - 1].url : '');
    
    const availableHeights = [...new Set(
      (info.formats || [])
        .filter(f => f.vcodec !== 'none' && f.height)
        .map(f => f.height)
    )];

    const maxHeight = info.height || Math.max(...availableHeights, 0);

    const result = {
      title: info.title || 'Unknown Video',
      uploader: info.uploader || info.channel || 'Unknown Uploader',
      duration: formatDuration(info.duration),
      durationSeconds: info.duration || 0,
      thumbnail: thumbnail,
      views: info.view_count ? info.view_count.toLocaleString() : 'Unknown',
      platform: info.extractor_key || info.extractor || 'Direct Link',
      maxHeight,
      formats: info.formats || []
    };

    metadataCache.set(cacheKey, {
      timestamp: Date.now(),
      data: result
    });

    return result;
  } catch (err) {
    console.error('[ytDlpService] Error fetching metadata:', err);
    throw new Error('Failed to extract media details. Please make sure the URL is public and valid.');
  }
}

/**
 * Parse a line of yt-dlp stdout for progress details
 */
function parseProgressLine(line) {
  // Regex to match percentage, speed, ETA, and size
  // Example: [download]  12.5% of 10.00MiB at 1.25MiB/s ETA 00:07
  const pctMatch = line.match(/(\d+(?:\.\d+)?)%/);
  if (!pctMatch) {
    if (line.includes('[Merger]') || line.includes('Merging formats')) {
      return { status: 'merging', progress: 99 };
    }
    if (line.includes('[ExtractAudio]') || line.includes('Extracting audio')) {
      return { status: 'extracting', progress: 99 };
    }
    return null;
  }

  const progress = parseFloat(pctMatch[1]);
  const sizeMatch = line.match(/of\s+([^\s]+)/);
  const speedMatch = line.match(/at\s+([^\s]+)/);
  const etaMatch = line.match(/ETA\s+([^\s]+)/);

  return {
    status: 'downloading',
    progress,
    size: sizeMatch ? sizeMatch[1] : 'Unknown',
    speed: speedMatch ? speedMatch[1] : 'Unknown',
    eta: etaMatch ? etaMatch[1] : 'Unknown'
  };
}

/**
 * Downloads a video/audio asynchronously and reports progress via emitter.
 */
function downloadMedia(downloadId, url, quality, emitter, formatType) {
  return new Promise((resolve, reject) => {
    const outputPattern = path.join(DOWNLOADS_DIR, `${downloadId}.%(ext)s`);
    
    // Set up standard options
    const flags = {
      output: outputPattern,
      noCheckCertificates: true,
      noWarnings: true,
      addHeader: [
        'referer:youtube.com',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    };

    // Always point yt-dlp to the bundled FFmpeg binary
    if (ffmpegPath) {
      flags.ffmpegLocation = ffmpegPath;
    }

    const presets = ['best', '1080p', '720p', '480p', '360p', '144p', 'mp3'];
    const isPreset = presets.includes(quality);

    // Determine format settings
    if (isPreset) {
      if (quality === 'mp3') {
        if (ffmpegAvailable) {
          flags.format = 'bestaudio/best';
          flags.extractAudio = true;
          flags.audioFormat = 'mp3';
          flags.audioQuality = '0';
        } else {
          // Fallback: download best raw audio stream without conversion
          flags.format = 'bestaudio/best';
        }
      } else {
        let maxH = 0;
        if (quality === '1080p') maxH = 1080;
        else if (quality === '720p') maxH = 720;
        else if (quality === '480p') maxH = 480;
        else if (quality === '360p') maxH = 360;
        else if (quality === '144p') maxH = 144;

        if (maxH > 0) {
          if (ffmpegAvailable) {
            flags.format = `bestvideo[height<=${maxH}]+bestaudio/best[height<=${maxH}]`;
            flags.mergeOutputFormat = 'mp4';
          } else {
            // Fallback to combined stream to avoid merging without ffmpeg
            flags.format = `best[height<=${maxH}]/best`;
          }
        } else {
          // 'best' quality requested
          if (ffmpegAvailable) {
            flags.format = 'bestvideo+bestaudio/best';
            flags.mergeOutputFormat = 'mp4';
          } else {
            flags.format = 'best';
          }
        }
      }
    } else {
      // Raw format ID selected
      if (formatType === 'video-only' && ffmpegAvailable) {
        flags.format = `${quality}+bestaudio/best`;
        flags.mergeOutputFormat = 'mp4';
      } else {
        flags.format = quality;
      }
    }



    try {
      const child = ytDlp.exec(url, flags);
      
      const rl = readline.createInterface({
        input: child.stdout,
        terminal: false
      });

      rl.on('line', (line) => {
        const progressData = parseProgressLine(line);
        if (progressData) {
          emitter.emit('progress', progressData);
        }
      });

      let stderrMsg = '';
      child.stderr.on('data', (data) => {
        stderrMsg += data.toString();
      });

      child.then(() => {
        // Look up the created file in downloads/
        fs.readdir(DOWNLOADS_DIR, (err, files) => {
          if (err) {
            return reject(new Error('Failed to access downloads folder after download completion.'));
          }

          const file = files.find(f => f.startsWith(downloadId) && f !== '.gitkeep');
          if (!file) {
            return reject(new Error('Downloaded file could not be located on disk.'));
          }

          const filePath = path.join(DOWNLOADS_DIR, file);
          const ext = path.extname(file).slice(1);
          
          resolve({
            filePath,
            ext,
            ffmpegFallback: ((quality === 'mp3' || quality.endsWith('p') || formatType === 'video-only') && !ffmpegAvailable)
          });
        });
      }).catch((err) => {
        console.error('[ytDlpService] Process error:', err);
        console.error('[ytDlpService] Stderr:', stderrMsg);
        reject(new Error(stderrMsg || err.message || 'Download process terminated unexpectedly.'));
      });
      
      // Store process in emitter so we can cancel it
      emitter.process = child;
      
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  fetchMetadata,
  downloadMedia,
  ffmpegAvailable: () => ffmpegAvailable,
  sanitizeFilename
};
