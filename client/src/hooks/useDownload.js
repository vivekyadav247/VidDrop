import { useState, useRef, useCallback } from 'react';
import { startDownload, createProgressStream, cancelDownload, getFileDownloadUrl } from '../utils/api';

const INITIAL_PROGRESS = {
  status: 'idle',   // idle | starting | downloading | merging | extracting | completed | error | cancelled
  percent: 0,
  speed: '-- MB/s',
  eta: '--:--',
  size: '-- MB',
  statusText: '',
};

export function useDownload({ onSave, showToast }) {
  const [progress, setProgress] = useState(INITIAL_PROGRESS);
  const [isDownloading, setIsDownloading] = useState(false);
  const downloadIdRef = useRef(null);
  const esRef = useRef(null);       // EventSource ref

  const resetState = useCallback(() => {
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
    downloadIdRef.current = null;
    // keep progress visible for 3.5s then hide
    setTimeout(() => setProgress(INITIAL_PROGRESS), 3500);
    setIsDownloading(false);
  }, []);

  const triggerFileDownload = useCallback((downloadId) => {
    const a = document.createElement('a');
    a.href = getFileDownloadUrl(downloadId);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 1000);
  }, []);

  const start = useCallback(async ({ url, formatId, ext, formatType, mediaData }) => {
    if (isDownloading) {
      showToast('Download in Progress', 'Please wait for the current download to finish.', 'warning');
      return;
    }

    setIsDownloading(true);
    setProgress({ ...INITIAL_PROGRESS, status: 'starting', statusText: 'Queueing download…' });

    try {
      const { downloadId } = await startDownload({
        url,
        quality: formatId,
        formatType,
        title: mediaData.metadata.title,
        thumbnail: mediaData.metadata.thumbnail,
      });

      downloadIdRef.current = downloadId;

      const es = createProgressStream(downloadId);
      esRef.current = es;

      es.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.status === 'downloading') {
          const pct = Math.round(data.progress || 0);
          setProgress({
            status: 'downloading',
            statusText: 'Downloading media stream…',
            percent: pct,
            speed: data.speed || '-- MB/s',
            eta: data.eta || '--:--',
            size: data.size || '-- MB',
          });
        } else if (data.status === 'merging') {
          setProgress(p => ({ ...p, status: 'merging', statusText: 'Merging video + audio…', percent: 99 }));
        } else if (data.status === 'extracting') {
          setProgress(p => ({ ...p, status: 'extracting', statusText: 'Extracting audio…', percent: 99 }));
        } else if (data.status === 'completed') {
          setProgress(p => ({ ...p, status: 'completed', statusText: 'Preparing download…', percent: 100 }));

          if (data.fallback) {
            showToast('Done (Fallback)', 'Downloaded using native stream — FFmpeg missing.', 'warning');
          } else {
            showToast('Download Ready', 'Processing complete. Starting browser download.', 'success');
          }

          triggerFileDownload(downloadId);
          onSave({
            id: downloadId,
            title: mediaData.metadata.title,
            thumbnail: mediaData.metadata.thumbnail,
            duration: mediaData.metadata.duration,
            platform: mediaData.metadata.platform,
            quality: (formatType === 'audio-only' || formatId === 'mp3') ? 'MP3' : formatId.toUpperCase(),
            ext,
            timestamp: Date.now(),
          });
          resetState();
        } else if (data.status === 'error') {
          showToast('Download Failed', data.message || 'An error occurred.', 'error');
          setProgress(p => ({ ...p, status: 'error', statusText: data.message || 'Error' }));
          resetState();
        } else if (data.status === 'cancelled') {
          showToast('Cancelled', 'Download stopped by user.', 'info');
          setProgress(p => ({ ...p, status: 'cancelled', statusText: 'Cancelled' }));
          resetState();
        }
      };

      es.onerror = () => {
        showToast('Connection Error', 'Lost sync with download tracker.', 'error');
        resetState();
      };
    } catch (err) {
      showToast('Download Error', err.message, 'error');
      setProgress(INITIAL_PROGRESS);
      setIsDownloading(false);
    }
  }, [isDownloading, onSave, showToast, triggerFileDownload, resetState]);

  const cancel = useCallback(async () => {
    if (!downloadIdRef.current) return;
    try {
      await cancelDownload(downloadIdRef.current);
    } catch (err) {
      showToast('Cancel Error', err.message, 'error');
    }
  }, [showToast]);

  return { progress, isDownloading, start, cancel };
}
