import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { emojiKategori, formatRupiah, formatTanggal } from '../lib/format.js';
import Modal from '../components/Modal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import TransaksiForm from '../components/TransaksiForm.jsx';
import { useToast } from '../components/Toast.jsx';

const FILTER_AWAL = {
  q: '',
  tipe: '',
  kategori: '',
  dari: '',
  ke: '',
  sort: 'tanggal',
  order: 'desc',
};

/** Chip kategori berwarna, dipakai di tabel & kartu mobile. */
function ChipKategori({ nama, warna, tipe }) {
  return (
    <span
      className="chip max-w-full"
      style={{ backgroundColor: `${warna}33`, color: '#4A4038' }}
      title={nama}
    >
      <span>{emojiKategori(nama, tipe)}</span>
      <span className="truncate">{nama}</span>
    </span>
  );
}

export default function Transaksi() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filter, setFilter] = useState(FILTER_AWAL);
  const [cari, setCari] = useState('');
  const [halaman, setHalaman] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, page: 1, totalPages: 1 });
  const [kategoriList, setKategoriList] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState('');

  const [formBuka, setFormBuka] = useState(false);
  const [diedit, setDiedit] = useState(null);
  const [akanHapus, setAkanHapus] = useState(null);
  const [sedangHapus, setSedangHapus] = useState(false);

  const muatKategori = useCallback(async () => {
    try {
      const hasil = await api.daftarKategori();
      setKategoriList(hasil.items);
    } catch (err) {
      toast.error(err.message);
    }
  }, [toast]);

  const muatTransaksi = useCallback(async () => {
    setMemuat(true);
    setError('');
    try {
      const hasil = await api.daftarTransaksi({ ...filter, page: halaman, limit: 10 });
      setData(hasil);
    } catch (err) {
      setError(err.message);
    } finally {
      setMemuat(false);
    }
  }, [filter, halaman]);

  useEffect(() => {
    muatKategori();
  }, [muatKategori]);

  useEffect(() => {
    muatTransaksi();
  }, [muatTransaksi]);

  // Pencarian ditunda sedikit biar nggak nembak API tiap ketukan
  useEffect(() => {
    const t = setTimeout(() => {
      setFilter((f) => (f.q === cari ? f : { ...f, q: cari }));
      setHalaman(1);
    }, 350);
    return () => clearTimeout(t);
  }, [cari]);

  // Tombol "+ Catat" dari halaman lain datang lewat ?baru=1
  const sudahBukaDariUrl = useRef(false);
  useEffect(() => {
    if (searchParams.get('baru') === '1' && !sudahBukaDariUrl.current) {
      sudahBukaDariUrl.current = true;
      setDiedit(null);
      setFormBuka(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const ubahFilter = (kunci, nilai) => {
    setFilter((f) => ({ ...f, [kunci]: nilai }));
    setHalaman(1);
  };

  const resetFilter = () => {
    setFilter(FILTER_AWAL);
    setCari('');
    setHalaman(1);
  };

  const toggleSort = (kunci) => {
    setFilter((f) =>
      f.sort === kunci
        ? { ...f, order: f.order === 'asc' ? 'desc' : 'asc' }
        : { ...f, sort: kunci, order: 'desc' },
    );
    setHalaman(1);
  };

  const panahSort = (kunci) => {
    if (filter.sort !== kunci) return '↕';
    return filter.order === 'asc' ? '↑' : '↓';
  };

  const opsiKategoriFilter = useMemo(
    () => kategoriList.filter((k) => (filter.tipe ? k.tipe === filter.tipe : true)),
    [kategoriList, filter.tipe],
  );

  const bukaTambah = () => {
    setDiedit(null);
    setFormBuka(true);
  };

  const bukaEdit = (t) => {
    setDiedit(t);
    setFormBuka(true);
  };

  const setelahSimpan = async () => {
    await Promise.all([muatTransaksi(), muatKategori()]);
  };

  const hapus = async () => {
    if (!akanHapus) return;
    setSedangHapus(true);
    try {
      await api.hapusTransaksi(akanHapus.id);
      toast.sukses('Transaksi dihapus.');
      setAkanHapus(null);
      // Kalau halaman terakhir jadi kosong, mundur satu halaman
      if (data.items.length === 1 && halaman > 1) setHalaman(halaman - 1);
      else await muatTransaksi();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSedangHapus(false);
    }
  };

  const adaFilter =
    filter.q || filter.tipe || filter.kategori || filter.dari || filter.ke;

  const mulai = data.total === 0 ? 0 : (data.page - 1) * data.limit + 1;
  const selesai = Math.min(data.page * data.limit, data.total);

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink md:text-2xl">Transaksi 🧾</h1>
          <p className="mt-1 text-xs text-inkl">
            Semua pemasukan & pengeluaran yang pernah dicatat.
          </p>
        </div>
        <button type="button" onClick={bukaTambah} className="tombol-utama hidden md:inline-flex">
          ＋ Catat
        </button>
      </header>

      {/* Filter */}
      <section className="kartu space-y-3 p-4">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-inkl">
            🔍
          </span>
          <input
            type="search"
            className="input pl-10"
            placeholder="Cari catatan atau kategori…"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <select
            aria-label="Filter tipe"
            className="input py-2.5 text-xs"
            value={filter.tipe}
            onChange={(e) => {
              ubahFilter('tipe', e.target.value);
              ubahFilter('kategori', '');
            }}
          >
            <option value="">Semua tipe</option>
            <option value="Pemasukan">💰 Pemasukan</option>
            <option value="Pengeluaran">💸 Pengeluaran</option>
          </select>

          <select
            aria-label="Filter kategori"
            className="input py-2.5 text-xs"
            value={filter.kategori}
            onChange={(e) => ubahFilter('kategori', e.target.value)}
          >
            <option value="">Semua kategori</option>
            {opsiKategoriFilter.map((k) => (
              <option key={k.id} value={k.nama}>
                {k.nama}
              </option>
            ))}
          </select>

          <input
            type="date"
            aria-label="Dari tanggal"
            className="input py-2.5 text-xs"
            value={filter.dari}
            onChange={(e) => ubahFilter('dari', e.target.value)}
          />
          <input
            type="date"
            aria-label="Sampai tanggal"
            className="input py-2.5 text-xs"
            value={filter.ke}
            onChange={(e) => ubahFilter('ke', e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Urutkan"
            className="input w-auto flex-1 py-2.5 text-xs md:flex-none"
            value={`${filter.sort}-${filter.order}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split('-');
              setFilter((f) => ({ ...f, sort, order }));
              setHalaman(1);
            }}
          >
            <option value="tanggal-desc">Tanggal terbaru</option>
            <option value="tanggal-asc">Tanggal terlama</option>
            <option value="nominal-desc">Nominal terbesar</option>
            <option value="nominal-asc">Nominal terkecil</option>
          </select>

          {adaFilter && (
            <button type="button" onClick={resetFilter} className="tombol-lembut py-2 text-xs">
              ✕ Reset filter
            </button>
          )}
        </div>
      </section>

      {error && (
        <div className="kartu flex items-center justify-between gap-3 p-4 text-sm text-coralink">
          <span>😕 {error}</span>
          <button type="button" onClick={muatTransaksi} className="tombol-bahaya">
            Coba lagi
          </button>
        </div>
      )}

      {/* Daftar transaksi — kartu di HP, tabel di desktop */}
      <section className="kartu overflow-hidden">
        {memuat && data.items.length === 0 ? (
          <div className="grid h-40 place-items-center text-sm text-inkl">Memuat transaksi…</div>
        ) : data.items.length === 0 ? (
          <EmptyState
            ikon={adaFilter ? '🔍' : '📝'}
            judul={
              adaFilter ? 'Nggak ada yang cocok nih' : 'Belum ada transaksi nih, yuk catat yang pertama!'
            }
            pesan={
              adaFilter
                ? 'Coba ubah kata kunci atau filternya.'
                : 'Tinggal isi tanggal, kategori, dan nominalnya.'
            }
            aksi={
              adaFilter ? (
                <button type="button" onClick={resetFilter} className="tombol-lembut">
                  Reset filter
                </button>
              ) : (
                <button type="button" onClick={bukaTambah} className="tombol-utama">
                  ＋ Catat transaksi
                </button>
              )
            }
          />
        ) : (
          <>
            {/* Mobile */}
            <ul className="divide-y divide-krem md:hidden">
              {data.items.map((t) => (
                <li key={t.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <ChipKategori nama={t.kategori} warna={t.warna} tipe={t.tipe} />
                      </div>
                      <p className="mt-1.5 truncate text-xs text-inkl">
                        {formatTanggal(t.tanggal)}
                        {t.catatan ? ` · ${t.catatan}` : ''}
                      </p>
                    </div>
                    <span
                      className={`tabular shrink-0 text-sm font-semibold ${
                        t.tipe === 'Pemasukan' ? 'text-mintink' : 'text-coralink'
                      }`}
                    >
                      {t.tipe === 'Pemasukan' ? '+' : '−'} {formatRupiah(t.nominal)}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => bukaEdit(t)}
                      className="rounded-full bg-krem px-3 py-1.5 text-xs font-medium text-ink"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setAkanHapus(t)}
                      className="rounded-full bg-corals px-3 py-1.5 text-xs font-medium text-coralink"
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-inkl">
                    <th className="px-5 py-3 font-medium">
                      <button
                        type="button"
                        onClick={() => toggleSort('tanggal')}
                        className="inline-flex items-center gap-1 transition-colors hover:text-ink"
                      >
                        Tanggal <span className="text-[10px]">{panahSort('tanggal')}</span>
                      </button>
                    </th>
                    <th className="px-3 py-3 font-medium">Kategori</th>
                    <th className="px-3 py-3 font-medium">Catatan</th>
                    <th className="px-3 py-3 text-right font-medium">
                      <button
                        type="button"
                        onClick={() => toggleSort('nominal')}
                        className="inline-flex items-center gap-1 transition-colors hover:text-ink"
                      >
                        Nominal <span className="text-[10px]">{panahSort('nominal')}</span>
                      </button>
                    </th>
                    <th className="px-5 py-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-krem">
                  {data.items.map((t) => (
                    <tr key={t.id} className="transition-colors hover:bg-krem/60">
                      <td className="whitespace-nowrap px-5 py-3 text-inkl">
                        {formatTanggal(t.tanggal)}
                      </td>
                      <td className="px-3 py-3">
                        <ChipKategori nama={t.kategori} warna={t.warna} tipe={t.tipe} />
                      </td>
                      <td className="max-w-[16rem] truncate px-3 py-3 text-inkl">
                        {t.catatan || '—'}
                      </td>
                      <td
                        className={`tabular whitespace-nowrap px-3 py-3 text-right font-semibold ${
                          t.tipe === 'Pemasukan' ? 'text-mintink' : 'text-coralink'
                        }`}
                      >
                        {t.tipe === 'Pemasukan' ? '+' : '−'} {formatRupiah(t.nominal)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            onClick={() => bukaEdit(t)}
                            className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-krem"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => setAkanHapus(t)}
                            className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-corals"
                            title="Hapus"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-krem px-4 py-3">
              <p className="text-xs text-inkl">
                Menampilkan {mulai}–{selesai} dari {data.total} transaksi
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHalaman((h) => Math.max(1, h - 1))}
                  disabled={data.page <= 1}
                  className="tombol-lembut px-3 py-1.5 text-xs"
                >
                  ← Sebelumnya
                </button>
                <span className="tabular px-1 text-xs text-inkl">
                  {data.page} / {data.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setHalaman((h) => Math.min(data.totalPages, h + 1))}
                  disabled={data.page >= data.totalPages}
                  className="tombol-lembut px-3 py-1.5 text-xs"
                >
                  Berikutnya →
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <TransaksiForm
        open={formBuka}
        onClose={() => setFormBuka(false)}
        transaksi={diedit}
        kategoriList={kategoriList}
        onSimpan={setelahSimpan}
      />

      {/* Konfirmasi hapus */}
      <Modal
        open={Boolean(akanHapus)}
        onClose={() => setAkanHapus(null)}
        judul="Hapus transaksi ini?"
        subjudul="Data yang dihapus nggak bisa dibalikin ya."
        lebar="md:max-w-md"
      >
        {akanHapus && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-4 text-sm shadow-lembut">
              <div className="flex items-center justify-between gap-3">
                <ChipKategori
                  nama={akanHapus.kategori}
                  warna={akanHapus.warna}
                  tipe={akanHapus.tipe}
                />
                <span
                  className={`tabular font-semibold ${
                    akanHapus.tipe === 'Pemasukan' ? 'text-mintink' : 'text-coralink'
                  }`}
                >
                  {formatRupiah(akanHapus.nominal)}
                </span>
              </div>
              <p className="mt-2 text-xs text-inkl">
                {formatTanggal(akanHapus.tanggal)}
                {akanHapus.catatan ? ` · ${akanHapus.catatan}` : ''}
              </p>
            </div>
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
                disabled={sedangHapus}
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
