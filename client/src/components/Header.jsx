import { DownloadCloud, Sun, Moon } from 'lucide-react';

export default function Header({ theme, onToggleTheme }) {
  return (
    <header className="app-header">
      <div className="logo-area">
        <DownloadCloud className="logo-icon" />
        <h1>Vid<span>Drop</span></h1>
      </div>
      <div className="header-actions">
        <button
          id="theme-toggle"
          className="icon-btn"
          title="Toggle Theme"
          aria-label="Toggle Theme"
          onClick={onToggleTheme}
        >
          {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
