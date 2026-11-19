import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LOKAL, api } from '../lib/api.js';
import { useToast } from './Toast.jsx';

const MENU = [
  { ke: '/', label: 'Dashboard', ikon: '🏠' },
  { ke: '/transaksi', label: 'Transaksi', ikon: '🧾' },
  { ke: '/kategori', label: 'Kategori', ikon: '🏷️' },
];

function kelasMenu(aktif) {
  return [
    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200',
    aktif
      ? 'bg-lavenders text-ink shadow-lembut'
      : 'text-inkl hover:bg-white hover:text-ink',
  ].join(' ');
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-mint text-lg shadow-tombol">
        💰
      </span>
      <div className="leading-tight">
        <p className="text-base font-semibold text-ink">Duitku</p>
        <p className="text-[11px] text-inkl">catatan duit santai</p>
      </div>
    </div>
  );
}

/** Versi online: pulihkan data dari file hasil "Download Excel" (mengganti data di browser). */
function TombolPulihkan({ className, children, ...props }) {
  const toast = useToast();
  const pilih = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!window.confirm('Semua data di browser ini akan diganti dengan isi file. Lanjut?')) return;
    try {
      await api.imporExcel(file);
      window.location.reload();
    } catch (err) {
      toast.error(err.message);
    }
  };
  return (
    <label className={`cursor-pointer focus-within:ring-4 focus-within:ring-lavender/25 ${className}`} {...props}>
      {children}
      <input type="file" accept=".xlsx" className="sr-only" onChange={pilih} />
    </label>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const lokasi = useLocation();

  // Tombol "+ Catat" di mobile langsung membuka form di halaman Transaksi
  const bukaFormBaru = () => {
    if (lokasi.pathname === '/transaksi') {
      navigate('/transaksi?baru=1', { replace: true });
    } else {
      navigate('/transaksi?baru=1');
    }
  };

  return (
    <div className="min-h-screen">
      {/* ── Sidebar (desktop) ─────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-6 border-r border-white/60 bg-white/55 px-5 py-7 backdrop-blur-md md:flex">
        <Logo />

        <nav className="flex flex-col gap-1.5">
          {MENU.map((m) => (
            <NavLink
              key={m.ke}
              to={m.ke}
              end={m.ke === '/'}
              className={({ isActive }) => kelasMenu(isActive)}
            >
              <span className="text-base">{m.ikon}</span>
              {m.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <a href={api.urlExport} onClick={api.onExport} className="tombol-utama w-full" download>
            ⬇️ Download Excel
          </a>
          {LOKAL ? (
            <>
              <TombolPulihkan className="tombol-lembut w-full">⬆️ Pulihkan dari Excel</TombolPulihkan>
              <p className="px-1 text-[11px] leading-relaxed text-inkl/80">
                Data cuma tersimpan di browser ini, nggak dikirim ke mana-mana. Rajin{' '}
                <span className="font-medium">Download Excel</span> buat cadangan / pindah HP.
              </p>
            </>
          ) : (
            <p className="px-1 text-[11px] leading-relaxed text-inkl/80">
              Semua catatan tersimpan di <span className="font-medium">data/keuangan.xlsx</span>.
              Bisa dibuka & diedit manual pakai Excel.
            </p>
          )}
        </div>
      </aside>

      {/* ── Konten utama ──────────────────────────────────────────────── */}
      <div className="md:pl-64">
        {/* Topbar mobile */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/60 bg-krem/85 px-4 py-3 backdrop-blur-md md:hidden">
          <Logo />
          <div className="flex gap-2">
            {LOKAL && (
              <TombolPulihkan
                className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-lg shadow-lembut"
                title="Pulihkan dari Excel"
                aria-label="Pulihkan dari Excel"
              >
                ⬆️
              </TombolPulihkan>
            )}
            <a
              href={api.urlExport}
              onClick={api.onExport}
              download
              className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-lg shadow-lembut"
              title="Download Excel"
              aria-label="Download Excel"
            >
              ⬇️
            </a>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-9">
          <Outlet />
        </main>
      </div>

      {/* ── Bottom navigation + FAB (mobile) ──────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/80 bg-white/90 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(74,64,56,0.06)] backdrop-blur-md md:hidden">
        <div className="flex items-center justify-around py-1.5">
          {MENU.map((m) => (
            <NavLink
              key={m.ke}
              to={m.ke}
              end={m.ke === '/'}
              className={({ isActive }) =>
                `flex w-full flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-ink' : 'text-inkl'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`grid h-8 w-12 place-items-center rounded-full text-base transition-colors ${
                      isActive ? 'bg-lavenders' : ''
                    }`}
                  >
                    {m.ikon}
                  </span>
                  {m.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <button
        type="button"
        onClick={bukaFormBaru}
        className="fixed bottom-24 right-4 z-30 flex items-center gap-2 rounded-full bg-mint px-5 py-3.5 text-sm font-semibold text-white shadow-tombol transition-transform active:scale-95 md:hidden"
      >
        <span className="text-lg leading-none">＋</span> Catat
      </button>
    </div>
  );
}
