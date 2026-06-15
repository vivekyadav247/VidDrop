import { useState, useRef } from 'react';

import { useTheme }    from './hooks/useTheme';
import { useHistory }  from './hooks/useHistory';
import { useDownload } from './hooks/useDownload';
import { useToast }    from './components/Toast';
import { fetchMediaInfo } from './utils/api';

import Header          from './components/Header';
import UrlInput        from './components/UrlInput';
import FfmpegWarning   from './components/FfmpegWarning';
import MediaResult     from './components/MediaResult';
import FormatsPanel    from './components/FormatsPanel';
import HistorySection  from './components/HistorySection';
import ToastContainer  from './components/Toast';

// Skeleton loader
function SkeletonLoader() {
  return (
    <div className="glass-panel skeleton-loader" id="metadata-skeleton">
      <div className="skeleton-thumb" />
      <div className="skeleton-content">
        <div className="skeleton-line title" />
        <div className="skeleton-line author" />
        <div className="skeleton-line-group">
          <div className="skeleton-line short" />
          <div className="skeleton-line short" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { theme, toggleTheme }             = useTheme();
  const { history, saveItem, deleteItem, clearHistory } = useHistory();
  const { toasts, showToast, removeToast } = useToast();

  const [mediaData, setMediaData]   = useState(null);   // API response
  const [ffmpegWarn, setFfmpegWarn] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  const formatsPanelRef = useRef(null);

  // Download handlers
  const { progress, isDownloading, start: startDl, cancel: cancelDl } = useDownload({
    onSave: saveItem,
    showToast,
  });

  // Fetch metadata
  async function handleFetch(url) {
    setLoading(true);
    setMediaData(null);
    setFfmpegWarn(false);
    setCurrentUrl(url);

    try {
      const data = await fetchMediaInfo(url);
      // Attach ffmpegAvailable into formats for FormatCard
      data.ffmpegAvailable = data.ffmpegAvailable ?? true;
      setFfmpegWarn(data.ffmpegAvailable === false);
      setMediaData(data);
      showToast('Metadata Loaded', 'Formats fetched successfully.', 'success');
    } catch (err) {
      showToast('Fetch Failed', err.message || 'Server encountered an issue.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Download trigger
  function handleDownload(formatId, ext, formatType = 'combined') {
    if (!mediaData) return;
    startDl({ url: currentUrl, formatId, ext, formatType, mediaData });
  }

  return (
    <>
      {/* Ambient glow */}
      <div className="glow-bg">
        <div className="glow-sphere glow-1" />
        <div className="glow-sphere glow-2" />
        <div className="glow-sphere glow-3" />
      </div>

      <div className="app-container">
        <Header theme={theme} onToggleTheme={toggleTheme} />

        {/* FFmpeg warning */}
        {ffmpegWarn && <FfmpegWarning />}

        {/* URL Input */}
        <UrlInput onFetch={handleFetch} loading={loading} />

        {/* Skeleton */}
        {loading && <SkeletonLoader />}

        {/* Two-column result area */}
        {mediaData && !loading && (
          <div className="result-area" id="result-area">
            {/* LEFT — info + progress */}
            <MediaResult
              data={mediaData}
              progress={progress}
              isDownloading={isDownloading}
              onCancel={cancelDl}
              formatsPanelRef={formatsPanelRef}
            />

            {/* RIGHT — format cards */}
            <FormatsPanel
              data={mediaData}
              onDownload={handleDownload}
              formatsPanelRef={formatsPanelRef}
            />
          </div>
        )}

        {/* History */}
        <HistorySection
          history={history}
          onDelete={deleteItem}
          onClear={clearHistory}
        />

        {/* Footer */}
        <footer className="app-footer highlighted-footer">
          <div className="footer-left">
            <span className="footer-brand">Vid<span className="brand-accent">Drop</span></span>
            <span className="footer-tagline highlight-tagline">Drop a Link. Get Your Media.</span>
            <span className="footer-copy">© {new Date().getFullYear()} VidDrop &bull; Free &amp; open tool for everyone.</span>
          </div>
          <div className="footer-right">
            <span className="footer-credit highlight-credit">
              Made with <span className="heart-emoji">❤️</span> by <strong className="dev-name">Vivek Yadav</strong>
            </span>
          </div>
        </footer>
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
