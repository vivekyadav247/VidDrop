import { useRef, useEffect } from 'react';
import { User, Video, Eye } from 'lucide-react';
import ProgressPanel from './ProgressPanel';

const THUMB_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'%3E%3Crect width='320' height='180' fill='%231e2136'/%3E%3Crect x='120' y='60' width='80' height='60' rx='8' fill='%23374162'/%3E%3Cpolygon points='144,76 144,104 176,90' fill='%234b5280'/%3E%3C/svg%3E";

export default function MediaResult({ data, progress, isDownloading, onCancel, formatsPanelRef }) {
  const infoPanelRef = useRef(null);
  const { metadata } = data;

  // Sync height of formats panel to 1.1x info panel height on desktop
  useEffect(() => {
    const infoEl = infoPanelRef.current;
    const fmtEl  = formatsPanelRef?.current;
    if (!infoEl || !fmtEl) return;

    const syncHeight = () => {
      if (window.innerWidth > 980) {
        const h = infoEl.offsetHeight;
        if (h > 0) fmtEl.style.height = `${h * 1.1}px`;
      } else {
        fmtEl.style.height = '';
      }
    };

    const ro = new ResizeObserver(syncHeight);
    ro.observe(infoEl);
    window.addEventListener('resize', syncHeight);
    syncHeight();
    return () => { ro.disconnect(); window.removeEventListener('resize', syncHeight); };
  }, [formatsPanelRef]);

  return (
    <div className="glass-panel info-panel" id="result-panel" ref={infoPanelRef}>

      {/* Thumbnail + meta */}
      <div className="media-details">
        <div className="thumbnail-wrapper">
          <img
            id="media-thumb"
            src={metadata.thumbnail || THUMB_FALLBACK}
            alt="Video Thumbnail"
            onError={e => { e.target.src = THUMB_FALLBACK; }}
          />
          <span id="media-duration" className="badge-duration">{metadata.duration}</span>
        </div>
        <div className="media-info">
          <h3 id="media-title">{metadata.title}</h3>
          <p id="media-uploader" className="uploader-name">
            <User size={12} /><span>{metadata.uploader}</span>
          </p>
          <div className="meta-row">
            <span className="badge" id="media-platform">
              <Video size={10} /><span>{metadata.platform}</span>
            </span>
            <span className="badge" id="media-views">
              <Eye size={10} /><span>{metadata.views} views</span>
            </span>
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* Progress panel */}
      {isDownloading && (
        <ProgressPanel progress={progress} onCancel={onCancel} />
      )}
    </div>
  );
}
