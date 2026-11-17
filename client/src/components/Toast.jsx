import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

/** Notifikasi kecil di pojok atas — biar tiap aksi ada balasannya. */
export function ToastProvider({ children }) {
  const [daftar, setDaftar] = useState([]);

  const tambah = useCallback((pesan, tipe) => {
    const id = Math.random().toString(36).slice(2);
    setDaftar((lama) => [...lama, { id, pesan, tipe }]);
    setTimeout(() => {
      setDaftar((lama) => lama.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const nilai = useMemo(
    () => ({
      sukses: (pesan) => tambah(pesan, 'sukses'),
      error: (pesan) => tambah(pesan, 'error'),
      info: (pesan) => tambah(pesan, 'info'),
    }),
    [tambah],
  );

  return (
    <ToastContext.Provider value={nilai}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4">
        {daftar.map((t) => (
          <div
            key={t.id}
            className={`animate-muncul pointer-events-auto max-w-sm rounded-2xl px-4 py-3 text-sm font-medium shadow-naik ${
              t.tipe === 'error'
                ? 'bg-coral text-white'
                : t.tipe === 'info'
                  ? 'bg-lavender text-white'
                  : 'bg-mint text-white'
            }`}
          >
            {t.tipe === 'error' ? '😕 ' : t.tipe === 'info' ? 'ℹ️ ' : '✅ '}
            {t.pesan}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast harus dipakai di dalam ToastProvider');
  return ctx;
}
