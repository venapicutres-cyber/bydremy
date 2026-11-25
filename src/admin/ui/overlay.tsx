import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

// Modal bisa bertumpuk (mis. media picker di atas form kategori).
const closeStack: (() => void)[] = [];
let bodyLocks = 0;

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  wide,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    closeStack.push(onClose);
    bodyLocks += 1;
    document.body.style.overflow = 'hidden';

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeStack[closeStack.length - 1] === onClose) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      const index = closeStack.lastIndexOf(onClose);
      if (index >= 0) closeStack.splice(index, 1);
      bodyLocks = Math.max(0, bodyLocks - 1);
      if (bodyLocks === 0) document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="adm-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="adm-modal__backdrop" onClick={onClose} />
      <div className={`adm-modal__panel ${wide ? 'adm-modal__panel--wide' : ''}`}>
        <header className="adm-modal__head">
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </header>
        <div className="adm-modal__body">{children}</div>
        {footer && <footer className="adm-modal__foot">{footer}</footer>}
      </div>
    </div>
  );
}
