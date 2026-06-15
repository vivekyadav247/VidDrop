import { useRef, useState, useCallback } from 'react';
import { Link, X, Clipboard, Search, Copy } from 'lucide-react';
import { isValidUrl } from '../utils/api';

export default function UrlInput({ onFetch, loading }) {
  const [url, setUrl] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFetch = useCallback(() => {
    if (!url.trim()) return;
    if (!isValidUrl(url.trim())) return;
    onFetch(url.trim());
  }, [url, onFetch]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleFetch();
    if (e.key === 'Escape') { setUrl(''); inputRef.current?.focus(); }
  }, [handleFetch]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      setUrl(trimmed);
      if (isValidUrl(trimmed)) onFetch(trimmed);
    } catch {
      // clipboard permission denied — silent fail
    }
  }, [onFetch]);

  // Drag & drop
  const onDragEnter = (e) => { e.preventDefault(); setDragging(true); };
  const onDragOver  = (e) => { e.preventDefault(); };
  const onDragLeave = (e) => { e.preventDefault(); setDragging(false); };
  const onDrop      = (e) => {
    e.preventDefault();
    setDragging(false);
    const text = e.dataTransfer.getData('text');
    if (text) {
      const trimmed = text.trim();
      setUrl(trimmed);
      if (isValidUrl(trimmed)) onFetch(trimmed);
    }
  };

  return (
    <div
      className={`glass-panel input-panel${dragging ? ' dragover' : ''}`}
      id="drop-zone"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="panel-header">
        <h2>Download Public Media</h2>
        <p>Paste any video URL from YouTube, Instagram, TikTok, Facebook, Vimeo &amp; more — VidDrop handles the rest</p>
      </div>

      <div className="url-row">
        <div className="url-input-wrapper">
          <Link className="input-icon" size={17} />
          <input
            ref={inputRef}
            type="text"
            id="video-url"
            placeholder="Paste video URL here…"
            autoComplete="off"
            spellCheck="false"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="input-actions">
            {url && (
              <button className="icon-btn" title="Clear" onClick={() => { setUrl(''); inputRef.current?.focus(); }}>
                <X size={16} />
              </button>
            )}
            <button className="icon-btn" title="Paste from Clipboard" onClick={handlePaste}>
              <Clipboard size={16} />
            </button>
          </div>
        </div>

        <button
          id="fetch-btn"
          className="btn btn-primary"
          onClick={handleFetch}
          disabled={loading || !url.trim()}
        >
          <Search size={16} />
          <span>{loading ? 'Fetching…' : 'Fetch Details'}</span>
        </button>
      </div>

      {/* Drag-drop overlay */}
      <div className="drag-drop-overlay">
        <div className="overlay-content">
          <Copy size={44} style={{ marginBottom: 10 }} />
          <p>Drop URL to Fetch Details</p>
        </div>
      </div>
    </div>
  );
}
