import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import { PALET_WARNA } from '../lib/format.js';
import { api } from '../lib/api.js';
import { useToast } from './Toast.jsx';

/** Form tambah/edit kategori + pemilih warna pastel. */
export default function KategoriForm({ open, onClose, kategori, tipeAwal, onSimpan }) {
  const toast = useToast();
  const modeEdit = Boolean(kategori?.id);

  const [nama, setNama] = useState('');
  const [tipe, setTipe] = useState('Pengeluaran');
  const [warna, setWarna] = useState(PALET_WARNA[0]);
  const [sedangSimpan, setSedangSimpan] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (kategori) {
      setNama(kategori.nama);
      setTipe(kategori.tipe);
      setWarna(kategori.warna || PALET_WARNA[0]);
    } else {
      setNama('');
      setTipe(tipeAwal || 'Pengeluaran');
      setWarna(PALET_WARNA[0]);
    }
    setError('');
  }, [open, kategori, tipeAwal]);

  const simpan = async (e) => {
    e.preventDefault();
    setError('');
    if (!nama.trim()) return setError('Nama kategorinya belum diisi.');

    setSedangSimpan(true);
    try {
      if (modeEdit) {
        await api.ubahKategori(kategori.id, { nama: nama.trim(), warna });
        toast.sukses('Kategori diperbarui.');
      } else {
        await api.tambahKategori({ nama: nama.trim(), tipe, warna });
        toast.sukses('Kategori baru ditambahkan.');
      }
      onSimpan?.();
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSedangSimpan(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      judul={modeEdit ? 'Edit kategori' : 'Kategori baru'}
      subjudul={
        modeEdit
          ? 'Ganti nama atau warnanya. Transaksi lama ikut menyesuaikan.'
          : 'Bikin kategori sesuai gaya kamu.'
      }
    >
      <form onSubmit={simpan} className="space-y-4">
        <div>
          <label className="label" htmlFor="nama-kategori">
            Nama kategori
          </label>
          <input
            id="nama-kategori"
            type="text"
            className="input"
            placeholder="Misal: Kopi & Jajan"
            maxLength={40}
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            autoFocus
          />
        </div>

        {!modeEdit && (
          <div>
            <span className="label">Tipe</span>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1.5 shadow-lembut">
              {['Pemasukan', 'Pengeluaran'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipe(t)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                    tipe === t
                      ? t === 'Pemasukan'
                        ? 'bg-mint text-white'
                        : 'bg-coral text-white'
                      : 'text-inkl hover:text-ink'
                  }`}
                >
                  {t === 'Pemasukan' ? '💰 Pemasukan' : '💸 Pengeluaran'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <span className="label">Warna</span>
          <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow-lembut">
            {PALET_WARNA.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWarna(w)}
                title={w}
                aria-label={`Pilih warna ${w}`}
                className={`h-9 w-9 rounded-xl transition-transform duration-150 ${
                  warna === w ? 'scale-110 ring-2 ring-ink/25 ring-offset-2' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: w }}
              />
            ))}
          </div>
        </div>

        {error && <p className="rounded-2xl bg-corals px-4 py-3 text-sm text-coralink">{error}</p>}

        <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-white/70 bg-krem/95 px-5 pb-1 pt-3 backdrop-blur md:-mx-6 md:px-6">
          <button type="button" onClick={onClose} className="tombol-lembut flex-1">
            Batal
          </button>
          <button type="submit" disabled={sedangSimpan} className="tombol-utama flex-1">
            {sedangSimpan ? 'Menyimpan…' : modeEdit ? 'Simpan perubahan' : 'Tambah'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
