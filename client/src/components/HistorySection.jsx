import { useState } from 'react';
import { History, FolderOpen, Trash2, ChevronsDown } from 'lucide-react';

const THUMB_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='90' viewBox='0 0 160 90'%3E%3Crect width='160' height='90' fill='%231e2136'/%3E%3Crect x='60' y='30' width='40' height='30' rx='4' fill='%23374162'/%3E%3Cpolygon points='72,38 72,52 88,45' fill='%234b5280'/%3E%3C/svg%3E";

const VISIBLE = 4;

function HistoryItem({ item, onDelete }) {
  const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="history-item">
      <div className="history-thumb">
        <img
          src={item.thumbnail || THUMB_FALLBACK}
          alt="Thumb"
          onError={e => { e.target.src = THUMB_FALLBACK; }}
        />
      </div>
      <div className="history-meta">
        <div className="history-title" title={item.title}>{item.title}</div>
        <div className="history-info">
          <span>{item.duration}</span>
          &bull; <span>{item.quality}</span>
          &bull; <span>{dateStr}</span>
        </div>
      </div>
      <div className="history-actions">
        <button
          className="icon-btn"
          title="Remove"
          onClick={e => { e.stopPropagation(); onDelete(item.id); }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function HistorySection({ history, onDelete, onClear }) {
  const [seeMoreOpen, setSeeMoreOpen] = useState(false);

  const visible = history.slice(0, VISIBLE);
  const extra   = history.slice(VISIBLE);

  return (
    <section className="history-section glass-panel" id="history-section">
      <div className="history-header">
        <h3><History size={16} /> Download History</h3>
        {history.length > 0 && (
          <button id="clear-history-btn" className="text-btn" onClick={onClear}>
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div id="history-empty" className="history-empty">
          <FolderOpen size={30} />
          <p>No downloads yet</p>
          <span className="hint-text">Completed downloads will appear here</span>
        </div>
      ) : (
        <div id="history-list-wrap">
          <div className="history-strip" id="history-strip">
            {visible.map(item => (
              <HistoryItem key={item.id} item={item} onDelete={onDelete} />
            ))}
          </div>

          {extra.length > 0 && (
            <div className="see-more-wrap" id="see-more-wrap">
              <button
                className={`see-more-btn${seeMoreOpen ? ' open' : ''}`}
                id="see-more-btn"
                onClick={() => setSeeMoreOpen(o => !o)}
              >
                <ChevronsDown size={15} />
                <span id="see-more-label">
                  {seeMoreOpen ? 'Show Less' : `See More (${extra.length})`}
                </span>
              </button>

              {seeMoreOpen && (
                <div className="history-expanded" id="history-expanded">
                  {extra.map(item => (
                    <HistoryItem key={item.id} item={item} onDelete={onDelete} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
