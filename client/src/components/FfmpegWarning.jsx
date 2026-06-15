import { AlertTriangle } from 'lucide-react';

export default function FfmpegWarning() {
  return (
    <div className="glass-panel ffmpeg-warning-banner">
      <AlertTriangle />
      <div className="warning-text">
        <h5>FFmpeg missing on server</h5>
        <p>
          MP3 extraction and high-definition merging (1080p/720p) will fall back to pre-merged streams or
          raw files. Use <strong>Advanced Streams</strong> tab for direct downloads.
        </p>
      </div>
    </div>
  );
}
