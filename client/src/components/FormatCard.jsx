import { Download } from 'lucide-react';

const THUMB_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='90' viewBox='0 0 160 90'%3E%3Crect width='160' height='90' fill='%231e2136'/%3E%3Crect x='60' y='30' width='40' height='30' rx='4' fill='%23374162'/%3E%3Cpolygon points='72,38 72,52 88,45' fill='%234b5280'/%3E%3C/svg%3E";

export default function FormatCard({ fmt, ffmpegAvailable, onDownload, isAdvanced }) {
  if (isAdvanced) {
    let badgeClass = 'direct-badge', typeLabel = 'Combined';
    if (fmt.type === 'video-only') {
      badgeClass = 'video-only-badge';
      typeLabel = ffmpegAvailable ? 'Auto-merge Audio' : 'No Audio (FFmpeg ⚠️)';
    } else if (fmt.type === 'audio-only') {
      badgeClass = 'audio-only-badge';
      typeLabel = 'Audio Only';
    }

    return (
      <div className="format-card">
        <div className="format-header">
          <div className="format-quality" style={{ fontSize: '0.86rem' }}>ID: {fmt.id}</div>
          <span className={`format-badge ${badgeClass}`}>{fmt.ext.toUpperCase()}</span>
        </div>
        <div className="format-details">
          <div className="format-detail-item">
            <span>Res</span>
            <span>{fmt.resolution}{fmt.fps ? ` · ${fmt.fps}fps` : ''}</span>
          </div>
          <div className="format-detail-item">
            <span>Size</span>
            <span>{fmt.size}</span>
          </div>
          <div className="format-detail-item">
            <span>Stream</span>
            <span>{typeLabel}</span>
          </div>
        </div>
        <button
          className="format-btn"
          onClick={() => onDownload(fmt.id, fmt.ext, fmt.type)}
        >
          <Download size={13} /><span>Download</span>
        </button>
      </div>
    );
  }

  // Quick download card
  const isAudio = fmt.type === 'audio';
  const isHighQuality = ['1080p', '720p', 'best'].includes(fmt.id);
  let sourceLabel = isAudio ? 'Audio Only' : 'Video + Audio';
  if (!ffmpegAvailable && isHighQuality) sourceLabel = 'Fallback (FFmpeg ⚠️)';
  else if (!ffmpegAvailable && fmt.id === 'mp3') sourceLabel = 'Native (FFmpeg ⚠️)';

  return (
    <div className="format-card">
      <div className="format-header">
        <div className="format-quality">{fmt.label}</div>
        <span className={`format-badge${isAudio ? ' audio-badge' : ''}`}>{fmt.ext.toUpperCase()}</span>
      </div>
      <div className="format-details">
        <div className="format-detail-item">
          <span>Type</span><span>{isAudio ? 'Audio Only' : 'Video + Audio'}</span>
        </div>
        <div className="format-detail-item">
          <span>Source</span><span>{sourceLabel}</span>
        </div>
      </div>
      <button
        className="format-btn"
        onClick={() => onDownload(fmt.id, fmt.ext, fmt.type)}
      >
        <Download size={13} /><span>Download</span>
      </button>
    </div>
  );
}
