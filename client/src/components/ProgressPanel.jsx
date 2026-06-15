import { Ban } from 'lucide-react';

export default function ProgressPanel({ progress, onCancel }) {
  const { statusText, percent, speed, eta, size } = progress;

  return (
    <div className="progress-panel" id="progress-panel">
      <div className="progress-header">
        <div className="status-indicator">
          <div className="spinner-small" />
          <span id="progress-status">{statusText}</span>
        </div>
        <span className="progress-percent" id="progress-percent">{percent}%</span>
      </div>

      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          id="progress-bar"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="progress-details-grid">
        <div className="progress-detail">
          <span className="detail-label">Speed</span>
          <span className="detail-val" id="progress-speed">{speed}</span>
        </div>
        <div className="progress-detail">
          <span className="detail-label">ETA</span>
          <span className="detail-val" id="progress-eta">{eta}</span>
        </div>
        <div className="progress-detail">
          <span className="detail-label">Size</span>
          <span className="detail-val" id="progress-size">{size}</span>
        </div>
      </div>

      <div className="progress-footer">
        <button id="cancel-download-btn" className="btn btn-secondary btn-sm" onClick={onCancel}>
          <Ban size={14} /><span>Cancel</span>
        </button>
      </div>
    </div>
  );
}
