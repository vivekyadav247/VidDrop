const fs = require('fs');
const path = require('path');

const DOWNLOADS_DIR = path.join(__dirname, '..', 'downloads');

function ensureDownloadsDir() {
  if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
  }
}

function deleteFile(filePath) {
  if (!filePath) return;
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error(`[FileHelper] Error deleting file ${filePath}:`, err);
    }
  });
}

// Sweeps old temp files out of the downloads folder
function sweepDownloads(maxAgeMs = 10 * 60 * 1000) {
  ensureDownloadsDir();
  fs.readdir(DOWNLOADS_DIR, (err, files) => {
    if (err) {
      console.error('[FileHelper] Error reading downloads directory during sweep:', err);
      return;
    }

    const now = Date.now();
    files.forEach((file) => {
      if (file === '.gitkeep') return;
      const filePath = path.join(DOWNLOADS_DIR, file);

      fs.stat(filePath, (statErr, stats) => {
        if (statErr) {
          console.error(`[FileHelper] Error getting stats for ${filePath}:`, statErr);
          return;
        }

        const age = now - stats.mtimeMs;
        if (age > maxAgeMs) {
          deleteFile(filePath);
        }
      });
    });
  });
}

module.exports = {
  ensureDownloadsDir,
  deleteFile,
  sweepDownloads,
  DOWNLOADS_DIR
};
