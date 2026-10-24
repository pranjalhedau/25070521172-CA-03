import { useEffect } from 'react';
import { IconCheck, IconAlertCircle, IconX } from './Icons';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div className={`toast-container ${isError ? 'toast-error' : 'toast-success'}`} role="status">
      <div className="toast-icon">
        {isError ? <IconAlertCircle size={18} /> : <IconCheck size={16} />}
      </div>
      <div className="toast-message">{toast.message}</div>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Close notification">
        <IconX size={14} />
      </button>
    </div>
  );
}
