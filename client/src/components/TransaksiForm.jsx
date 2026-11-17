import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal.jsx';
import NominalInput from './NominalInput.jsx';
import { api } from '../lib/api.js';
import { emojiKategori, hariIni } from '../lib/format.js';
import { useToast } from './Toast.jsx';

const TIPE = ['Pemasukan', 'Pengeluaran'];

/** Form tambah/edit transaksi di dalam modal. */
export default function TransaksiForm({ open, onClose, transaksi, kategoriList, onSimpan }) {
  const toast = useToast();
  const [tipe, setTipe] = useState('Pengeluaran');
  const [tanggal, setTanggal] = useState(hariIni());
  const [kategori, setKategori] = useState('');
  const [nominal, setNominal] = useState(0);
  const [catatan, setCatatan] = useState('');
  const [sedangSimpan, setSedangSimpan] = useState(false);
  const [error, setError] = useState('');

  const modeEdit = Boolean(transaksi?.id);

  // Isi ulang form tiap kali modal dibuka / data yang diedit berganti
  useEffect(() => {
    if (!open) return;
    if (transaksi) {
      setTipe(transaksi.tipe);
      setTanggal(transaksi.tanggal);
      setKategori(transaksi.kategori);
      setNominal(Number(transaksi.nominal) || 0);
      setCatatan(transaksi.catatan || '');
    } else {
      setTipe('Pengeluaran');
      setTanggal(hariIni());
      setNominal(0);
      setCatatan('');
      const pertama = kategoriList.find((k) => k.tipe === 'Pengeluaran');
      setKategori(pertama?.nama || '');
    }
    setError('');
  }, [open, transaksi, kategoriList]);

  const opsiKategori = useMemo(
    () => kategoriList.filter((k) => k.tipe === tipe),
    [kategoriList, tipe],
  );

  const gantiTipe = (nilai) => {
    setTipe(nilai);
    // Kategori harus sesuai tipe — reset kalau tidak ada di daftar baru
    const masihAda = kategoriList.some((k) => k.tipe === nilai && k.nama === kategori);
    if (!masihAda) {
      const pertama = kategoriList.find((k) => k.tipe === nilai);
      setKategori(pertama?.nama || '');
    }
  };

  const simpan = async (e) => {
    e.preventDefault();
    setError('');

    if (!tanggal) return setError('Tanggalnya diisi dulu ya.');
    if (!kategori) return setError('Pilih kategori dulu ya.');
    if (!nominal || nominal <= 0) return setError('Nominalnya harus lebih dari 0.');

    setSedangSimpan(true);
    try {
      const body = { tanggal, tipe, kategori, nominal, catatan: catatan.trim() };
      if (modeEdit) {
        await api.ubahTransaksi(transaksi.id, body);
        toast.sukses('Transaksi sudah diperbarui.');
      } else {
        await api.tambahTransaksi(body);
        toast.sukses('Transaksi tersimpan. Mantap! 🎉');
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
      judul={modeEdit ? 'Edit transaksi' : 'Catat transaksi baru'}
      subjudul={modeEdit ? 'Ubah datanya kalau ada yang keliru.' : 'Nggak sampai 30 detik, janji.'}
    >
      <form onSubmit={simpan} className="space-y-4">
        {/* Pilih tipe */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1.5 shadow-lembut">
          {TIPE.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => gantiTipe(t)}
              className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                tipe === t
                  ? t === 'Pemasukan'
                    ? 'bg-mint text-white shadow-tombol'
                    : 'bg-coral text-white shadow-[0_8px_20px_rgba(255,155,133,0.45)]'
                  : 'text-inkl hover:text-ink'
              }`}
            >
              {t === 'Pemasukan' ? '💰 Pemasukan' : '💸 Pengeluaran'}
            </button>
          ))}
        </div>

        <div>
          <label className="label" htmlFor="tanggal">
            Tanggal
          </label>
          <input
            id="tanggal"
            type="date"
            className="input"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="kategori">
            Kategori
          </label>
          <select
            id="kategori"
            className="input appearance-none"
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
          >
            {opsiKategori.length === 0 && <option value="">Belum ada kategori</option>}
            {opsiKategori.map((k) => (
              <option key={k.id} value={k.nama}>
                {emojiKategori(k.nama, k.tipe)} {k.nama}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="nominal">
            Nominal
          </label>
          <NominalInput nilai={nominal} onUbah={setNominal} />
        </div>

        <div>
          <label className="label" htmlFor="catatan">
            Catatan <span className="font-normal text-inkl/60">(opsional)</span>
          </label>
          <input
            id="catatan"
            type="text"
            className="input"
            placeholder="Misal: nasi goreng + es teh"
            maxLength={300}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />
        </div>

        {error && (
          <p className="rounded-2xl bg-corals px-4 py-3 text-sm text-coralink">{error}</p>
        )}

        <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-white/70 bg-krem/95 px-5 pb-1 pt-3 backdrop-blur md:-mx-6 md:px-6">
          <button type="button" onClick={onClose} className="tombol-lembut flex-1">
            Batal
          </button>
          <button type="submit" disabled={sedangSimpan} className="tombol-utama flex-1">
            {sedangSimpan ? 'Menyimpan…' : modeEdit ? 'Simpan perubahan' : 'Simpan'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
