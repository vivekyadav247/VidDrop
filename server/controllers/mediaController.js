const crypto = require('crypto');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const ytDlpService = require('../services/ytDlpService');
const fileHelper = require('../utils/fileHelper');

const activeDownloads = new Map();

function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

async function getMediaInfo(req, res) {
  const { url } = req.body;

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Please enter a valid HTTP or HTTPS URL.' });
  }

  try {
    const metadata = await ytDlpService.fetchMetadata(url);
    const ffmpegAvailable = ytDlpService.ffmpegAvailable();
    const availableFormats = [];

    availableFormats.push({
      id: 'best',
      label: 'Best Quality',
      type: 'video',
      ext: 'mp4',
      description: 'Highest video & audio merged'
    });

    const presets = [
      { id: '1080p', label: '1080p Full HD', height: 1080 },
      { id: '720p', label: '720p HD', height: 720 },
      { id: '480p', label: '480p SD', height: 480 },
      { id: '360p', label: '360p SD', height: 360 },
      { id: '144p', label: '144p Mobile', height: 144 }
    ];

    presets.forEach(preset => {
      if (preset.height <= metadata.maxHeight) {
        availableFormats.push({
          id: preset.id,
          label: preset.label,
          type: 'video',
          ext: 'mp4',
          description: `Video stream up to ${preset.height}p`
        });
      }
    });

    availableFormats.push({
      id: 'mp3',
      label: 'Audio Only (MP3)',
      type: 'audio',
      ext: 'mp3',
      description: ffmpegAvailable 
        ? 'Extract best quality MP3' 
        : 'Native audio format (FFmpeg missing)'
    });

    // Parse raw formats for Advanced tab
    const rawFormatsList = (metadata.formats || [])
      .filter(f => f.format_id && (f.vcodec !== 'none' || f.acodec !== 'none'))
      .map(f => {
        const isVideo = f.vcodec && f.vcodec !== 'none';
        const isAudio = f.acodec && f.acodec !== 'none';
        
        let type = 'combined';
        if (isVideo && !isAudio) type = 'video-only';
        if (!isVideo && isAudio) type = 'audio-only';
        
        let sizeStr = 'Unknown';
        if (f.filesize) {
          sizeStr = (f.filesize / 1024 / 1024).toFixed(1) + ' MB';
        } else if (f.filesize_approx) {
          sizeStr = '~' + (f.filesize_approx / 1024 / 1024).toFixed(1) + ' MB';
        }

        let resolution = 'Audio';
        if (f.resolution) {
          resolution = f.resolution;
        } else if (f.width && f.height) {
          resolution = `${f.width}x${f.height}`;
        } else if (f.height) {
          resolution = `${f.height}p`;
        }

        return {
          id: f.format_id,
          resolution,
          ext: f.ext || 'mp4',
          type,
          size: sizeStr,
          fps: f.fps || null,
          note: f.format_note || f.format_id
        };
      });

    const getHeight = (resolutionStr) => {
      const match = resolutionStr.match(/(\d+)x(\d+)/);
      if (match) return parseInt(match[2]);
      const matchP = resolutionStr.match(/(\d+)p/);
      if (matchP) return parseInt(matchP[1]);
      return 0;
    };

    rawFormatsList.sort((a, b) => {
      if (a.type === 'audio-only' && b.type !== 'audio-only') return 1;
      if (a.type !== 'audio-only' && b.type === 'audio-only') return -1;
      
      const hA = getHeight(a.resolution);
      const hB = getHeight(b.resolution);
      if (hA !== hB) return hB - hA;
      
      return 0;
    });

    const limitedRawFormats = rawFormatsList.slice(0, 15);

    return res.json({
      metadata: {
        title: metadata.title,
        uploader: metadata.uploader,
        duration: metadata.duration,
        thumbnail: metadata.thumbnail,
        views: metadata.views,
        platform: metadata.platform
      },
      formats: availableFormats,
      rawFormats: limitedRawFormats,
      ffmpegAvailable
    });

  } catch (err) {
    console.error('[MediaController] Error in getMediaInfo:', err.message);
    return res.status(500).json({ error: err.message || 'An error occurred while fetching media metadata.' });
  }
}

async function startDownload(req, res) {
  const { url, quality, title, thumbnail, formatType } = req.body;

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'A valid URL is required to download.' });
  }

  if (!quality) {
    return res.status(400).json({ error: 'A quality format must be selected.' });
  }

  // Prevent overload by limiting concurrent operations
  const activeCount = Array.from(activeDownloads.values()).filter(state =>
    ['starting', 'downloading', 'merging', 'extracting'].includes(state.status)
  ).length;

  if (activeCount >= 3) {
    return res.status(429).json({ error: 'Server is busy handling other downloads. Please wait and try again.' });
  }

  const downloadId = crypto.randomUUID();
  const emitter = new EventEmitter();

  const downloadState = {
    id: downloadId,
    url,
    quality,
    formatType: formatType || 'combined',
    title: title || 'Media Download',
    thumbnail: thumbnail || '',
    status: 'starting',
    progress: 0,
    speed: '0 B/s',
    eta: '00:00',
    size: '0 B',
    filePath: null,
    filename: null,
    error: null,
    emitter
  };

  activeDownloads.set(downloadId, downloadState);

  // Download processing
  ytDlpService.downloadMedia(downloadId, url, quality, emitter, downloadState.formatType)
    .then((result) => {
      downloadState.status = 'completed';
      downloadState.filePath = result.filePath;
      downloadState.filename = `${ytDlpService.sanitizeFilename(downloadState.title)}.${result.ext}`;
      
      emitter.emit('progress', {
        status: downloadState.status,
        progress: 100,
        filename: downloadState.filename,
        fallback: result.ffmpegFallback
      });
    })
    .catch((err) => {
      console.error(`[MediaController] Download failed for ID ${downloadId}:`, err.message);
      downloadState.status = 'error';
      downloadState.error = err.message;
      emitter.emit('progress', {
        status: 'error',
        message: err.message
      });
    });

  return res.json({ downloadId });
}

function getDownloadProgress(req, res) {
  const { id } = req.params;
  const state = activeDownloads.get(id);

  if (!state) {
    return res.status(404).json({ error: 'Download session not found.' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  res.write(`data: ${JSON.stringify({
    status: state.status,
    progress: state.progress,
    speed: state.speed,
    eta: state.eta,
    size: state.size,
    title: state.title,
    error: state.error
  })}\n\n`);

  const onProgress = (data) => {
    if (data.progress !== undefined) state.progress = data.progress;
    if (data.speed) state.speed = data.speed;
    if (data.eta) state.eta = data.eta;
    if (data.size) state.size = data.size;
    if (data.status) state.status = data.status;

    res.write(`data: ${JSON.stringify(data)}\n\n`);

    if (data.status === 'completed' || data.status === 'error' || data.status === 'cancelled') {
      cleanupConnection();
    }
  };

  state.emitter.on('progress', onProgress);

  function cleanupConnection() {
    clearInterval(heartbeat);
    state.emitter.off('progress', onProgress);
    res.end();
  }

  req.on('close', () => {
    cleanupConnection();
  });
}

function cancelDownload(req, res) {
  const { id } = req.params;
  const state = activeDownloads.get(id);

  if (!state) {
    return res.status(404).json({ error: 'Download session not found.' });
  }

  if (state.status === 'downloading' || state.status === 'starting' || state.status === 'merging' || state.status === 'extracting') {
    if (state.emitter.process) {
      state.emitter.process.kill('SIGTERM');
    }
    state.status = 'cancelled';
    state.emitter.emit('progress', { status: 'cancelled', message: 'Download cancelled by user.' });
    
    const downloadsDir = fileHelper.DOWNLOADS_DIR;
    fs.readdir(downloadsDir, (err, files) => {
      if (!err) {
        files.forEach(file => {
          if (file.startsWith(id)) {
            fileHelper.deleteFile(path.join(downloadsDir, file));
          }
        });
      }
    });

    activeDownloads.delete(id);
    return res.json({ message: 'Download cancelled successfully.' });
  }

  return res.status(400).json({ error: 'Download is not in a cancellable state.' });
}

function deliverFile(req, res) {
  const { id } = req.params;
  const state = activeDownloads.get(id);

  if (!state) {
    return res.status(404).json({ error: 'Download not found or expired.' });
  }

  if (state.status !== 'completed' || !state.filePath || !fs.existsSync(state.filePath)) {
    return res.status(400).json({ error: 'File is not ready for download or does not exist.' });
  }

  res.download(state.filePath, state.filename, (err) => {
    if (err) {
      console.error(`[MediaController] Error sending download response for ID ${id}:`, err.message);
    }
    fileHelper.deleteFile(state.filePath);
    activeDownloads.delete(id);
  });
}

module.exports = {
  getMediaInfo,
  startDownload,
  getDownloadProgress,
  cancelDownload,
  deliverFile
};
