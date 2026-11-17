import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import { emojiKategori } from '../lib/format.js';
import Modal from '../components/Modal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import KategoriForm from '../components/KategoriForm.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Kategori() {
  const toast = useToast();
  const [daftar, setDaftar] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('Pengeluaran');

  const [formBuka, setFormBuka] = useState(false);
  const [diedit, setDiedit] = useState(null);
  const [akanHapus, setAkanHapus] = useState(null);
  const [pindahKe, setPindahKe] = useState('');
  const [sedangHapus, setSedangHapus] = useState(false);

  const muat = useCallback(async () => {
    setMemuat(true);
    setError('');
    try {
      const hasil = await api.daftarKategori();
      setDaftar(hasil.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    muat();
  }, [muat]);

  const terfilter = useMemo(() => daftar.filter((k) => k.tipe === tab), [daftar, tab]);
  const jumlahPerTipe = useMemo(
    () => ({
      Pemasukan: daftar.filter((k) => k.tipe === 'Pemasukan').length,
      Pengeluaran: daftar.filter((k) => k.tipe === 'Pengeluaran').length,
    }),
    [daftar],
  );

  const tujuanPindah = useMemo(
    () => (akanHapus ? daftar.filter((k) => k.tipe === akanHapus.tipe && k.id !== akanHapus.id) : []),
    [daftar, akanHapus],
  );

  const bukaTambah = () => {
    setDiedit(null);
    setFormBuka(true);
  };

  const bukaEdit = (k) => {
    setDiedit(k);
    setFormBuka(true);
  };

  const bukaHapus = (k) => {
    setAkanHapus(k);
    setPindahKe('');
  };

  const hapus = async () => {
    if (!akanHapus) return;
    setSedangHapus(true);
    try {
      const hasil = await api.hapusKategori(
        akanHapus.id,
        akanHapus.dipakai > 0 ? pindahKe : undefined,
      );
      toast.sukses(
        hasil.dipindahkan > 0
          ? `Kategori dihapus, ${hasil.dipindahkan} transaksi dipindahkan.`
          : 'Kategori dihapus.',
      );
      setAkanHapus(null);
      await muat();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSedangHapus(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink md:text-2xl">Kategori 🏷️</h1>
          <p className="mt-1 text-xs text-inkl">
            Atur nama & warna kategori. Transaksi lama ikut menyesuaikan.
          </p>
        </div>
        <button type="button" onClick={bukaTambah} className="tombol-utama">
          ＋ Kategori
        </button>
      </header>

      {/* Tab tipe */}
      <div className="flex gap-2 rounded-full bg-white p-1.5 shadow-lembut sm:w-fit">
        {['Pengeluaran', 'Pemasukan'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 sm:flex-none ${
              tab === t
                ? t === 'Pemasukan'
                  ? 'bg-mint text-white shadow-tombol'
                  : 'bg-coral text-white shadow-[0_8px_20px_rgba(255,155,133,0.4)]'
                : 'text-inkl hover:text-ink'
            }`}
          >
            {t === 'Pemasukan' ? '💰' : '💸'} {t} ({jumlahPerTipe[t]})
          </button>
        ))}
      </div>

      {error && (
        <div className="kartu flex items-center justify-between gap-3 p-4 text-sm text-coralink">
          <span>😕 {error}</span>
          <button type="button" onClick={muat} className="tombol-bahaya">
            Coba lagi
          </button>
        </div>
      )}

      {memuat && daftar.length === 0 ? (
        <div className="kartu grid h-40 place-items-center text-sm text-inkl">Memuat kategori…</div>
      ) : terfilter.length === 0 ? (
        <div className="kartu">
          <EmptyState
            ikon="🏷️"
            judul={`Belum ada kategori ${tab.toLowerCase()}`}
            pesan="Bikin satu dulu biar bisa dipakai saat mencatat transaksi."
            aksi={
              <button type="button" onClick={bukaTambah} className="tombol-utama">
                ＋ Kategori {tab}
              </button>
            }
          />
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {terfilter.map((k) => (
            <li key={k.id} className="kartu group flex items-center gap-3 p-4">
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg"
                style={{ backgroundColor: `${k.warna}55` }}
              >
                {emojiKategori(k.nama, k.tipe)}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{k.nama}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-inkl">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: k.warna }}
                  />
                  {k.dipakai > 0 ? `${k.dipakai} transaksi` : 'Belum dipakai'}
                </p>
              </div>

              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => bukaEdit(k)}
                  className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-krem"
                  title="Edit kategori"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={() => bukaHapus(k)}
                  className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-corals"
                  title="Hapus kategori"
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <KategoriForm
        open={formBuka}
        onClose={() => setFormBuka(false)}
        kategori={diedit}
        tipeAwal={tab}
        onSimpan={muat}
      />

      {/* Hapus kategori */}
      <Modal
        open={Boolean(akanHapus)}
        onClose={() => setAkanHapus(null)}
        judul={`Hapus kategori "${akanHapus?.nama ?? ''}"?`}
        subjudul={
          akanHapus?.dipakai > 0
            ? 'Kategori ini masih dipakai. Pindahkan transaksinya dulu ya.'
            : 'Kategori ini belum dipakai transaksi mana pun.'
        }
        lebar="md:max-w-md"
      >
        {akanHapus && (
          <div className="space-y-4">
            {akanHapus.dipakai > 0 ? (
              <>
                <div className="rounded-2xl bg-kunings p-4 text-sm text-amberink">
                  ⚠️ Ada <b>{akanHapus.dipakai} transaksi</b> yang masih pakai kategori ini.
                  Pilih kategori tujuan biar catatannya nggak hilang.
                </div>

                {tujuanPindah.length === 0 ? (
                  <p className="rounded-2xl bg-corals px-4 py-3 text-sm text-coralink">
                    Belum ada kategori {akanHapus.tipe.toLowerCase()} lain. Bikin kategori baru
                    dulu, baru hapus yang ini.
                  </p>
                ) : (
                  <div>
                    <label className="label" htmlFor="pindah-ke">
                      Pindahkan transaksi ke
                    </label>
                    <select
                      id="pindah-ke"
                      className="input"
                      value={pindahKe}
                      onChange={(e) => setPindahKe(e.target.value)}
                    >
                      <option value="">— pilih kategori —</option>
                      {tujuanPindah.map((k) => (
                        <option key={k.id} value={k.id}>
                          {emojiKategori(k.nama, k.tipe)} {k.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            ) : (
              <p className="rounded-2xl bg-white p-4 text-sm text-inkl shadow-lembut">
                Setelah dihapus, kategori ini nggak bisa dipakai lagi saat mencatat transaksi.
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAkanHapus(null)}
                className="tombol-lembut flex-1"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={hapus}
                disabled={
                  sedangHapus || (akanHapus.dipakai > 0 && (!pindahKe || tujuanPindah.length === 0))
                }
                className="tombol flex-1 bg-coral text-white hover:brightness-105"
              >
                {sedangHapus ? 'Menghapus…' : 'Ya, hapus'}
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
