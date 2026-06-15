import { useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ICONS = { success: CheckCircle, error: AlertTriangle, warning: AlertCircle, info: Info };
const DURATION = 4000;

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((title, message, type = 'info') => {
    const id = ++toastId;
    setToasts(t => [...t, { id, title, message, type }]);
    setTimeout(() => removeToast(id), DURATION + 300);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(t => t.filter(toast => toast.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}

export default function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function Toast({ id, title, message, type, onRemove }) {
  const [closing, setClosing] = useState(false);
  const timerRef = useRef(null);

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => onRemove(id), 300);
  }, [id, onRemove]);

  useEffect(() => {
    timerRef.current = setTimeout(close, DURATION);
    return () => clearTimeout(timerRef.current);
  }, [close]);

  const Icon = ICONS[type] || Info;

  return (
    <div
      className={`toast toast-${type}${closing ? ' toast-closing' : ''}`}
      style={{ '--toast-duration': `${DURATION}ms` }}
    >
      <Icon className="toast-icon" />
      <div className="toast-content">
        <div className="toast-title">{title}</div>
        <div className="toast-msg">{message}</div>
      </div>
      <button className="toast-close" onClick={close} aria-label="Close"><X size={14} /></button>
      <div className="toast-progress" />
    </div>
  );
}
