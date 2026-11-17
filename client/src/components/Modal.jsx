import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/** Modal serbaguna: di HP muncul sebagai bottom sheet, di desktop sebagai kartu tengah. */
export default function Modal({ open, onClose, judul, subjudul, children, lebar = 'md:max-w-lg' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const overflowLama = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflowLama;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div
        className="animate-pudar absolute inset-0 bg-ink/25 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        className={`animate-muncul relative max-h-[92vh] w-full overflow-y-auto rounded-t-4xl bg-krem p-5 shadow-naik md:rounded-4xl md:p-6 ${lebar}`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">{judul}</h2>
            {subjudul && <p className="mt-0.5 text-xs text-inkl">{subjudul}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-inkl shadow-lembut transition-colors hover:text-ink"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
