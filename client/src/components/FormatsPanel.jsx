import { useState } from 'react';
import { Zap, Sliders } from 'lucide-react';
import FormatCard from './FormatCard';

export default function FormatsPanel({ data, onDownload, formatsPanelRef }) {
  const [activeTab, setActiveTab] = useState('quick');
  const { formats, rawFormats, ffmpegAvailable } = data;

  return (
    <div className="formats-panel glass-panel" id="formats-panel" ref={formatsPanelRef}>

      {/* Shared Tab Switcher — at the top, outside both panes */}
      <div className="tab-menu" style={{ marginBottom: 14, flexShrink: 0 }}>
        <button
          className={`tab-btn${activeTab === 'quick' ? ' active' : ''}`}
          id="tab-btn-quick"
          onClick={() => setActiveTab('quick')}
        >
          <Zap size={13} /><span>Quick Downloads</span>
        </button>
        <button
          className={`tab-btn${activeTab === 'advanced' ? ' active' : ''}`}
          id="tab-btn-advanced"
          onClick={() => setActiveTab('advanced')}
        >
          <Sliders size={13} /><span>Advanced Streams</span>
        </button>
      </div>

      {/* Quick Downloads */}
      {activeTab === 'quick' && (
        <div className="tab-content" id="tab-content-quick">
          <div className="formats-scroll-area">
            <div className="formats-grid" id="formats-list">
              {formats.map(fmt => (
                <FormatCard
                  key={fmt.id}
                  fmt={fmt}
                  ffmpegAvailable={ffmpegAvailable}
                  onDownload={onDownload}
                  isAdvanced={false}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Streams */}
      {activeTab === 'advanced' && (
        <div className="tab-content" id="tab-content-advanced">
          <div className="formats-scroll-area">
            <div className="formats-grid" id="advanced-formats-list">
              {rawFormats && rawFormats.length > 0 ? (
                rawFormats.map(fmt => (
                  <FormatCard
                    key={fmt.id}
                    fmt={fmt}
                    ffmpegAvailable={ffmpegAvailable}
                    onDownload={onDownload}
                    isAdvanced={true}
                  />
                ))
              ) : (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '24px', color: 'var(--t3)' }}>
                  No raw streams found for this URL.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
