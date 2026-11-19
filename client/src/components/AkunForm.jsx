import { useState } from 'react';
import Modal from './Modal.jsx';
import { DOMAIN_EMAIL, db } from '../lib/supabase.js';

const PESAN = {
  'Invalid login credentials': 'Nama atau sandi salah.',
  'User already registered': 'Nama itu sudah dipakai, coba yang lain.',
};

/** Masuk / daftar pakai nama + sandi. Kalau sudah login, isinya info akun + tombol keluar. */
export default function AkunForm({ open, onClose, nama: namaAktif }) {
  const [mode, setMode] = useState('masuk');
  const [nama, setNama] = useState('');
  const [sandi, setSandi] = useState('');
  const [proses, setProses] = useState(false);
  const [error, setError] = useState('');

  const keluar = async () => {
    setProses(true);
    await db.auth.signOut().catch(() => {});
    window.location.reload();
  };

  const kirim = async (e) => {
    e.preventDefault();
    setError('');
    const n = nama.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(n)) {
      return setError('Nama 3–20 karakter: huruf kecil, angka, atau _ saja.');
    }
    if (sandi.length < 6) return setError('Sandi minimal 6 karakter.');

    setProses(true);
    const kredensial = { email: n + DOMAIN_EMAIL, password: sandi };
    const { data, error: err } =
      mode === 'daftar'
        ? await db.auth.signUp(kredensial)
        : await db.auth.signInWithPassword(kredensial);
    if (err) {
      setProses(false);
      return setError(PESAN[err.message] || err.message);
    }
    if (!data.session) {
      setProses(false);
      return setError('Akun dibuat, tapi "Confirm email" di Supabase masih nyala. Minta admin matiin dulu ya.');
    }
    window.location.reload(); // semua halaman ambil ulang data dari akun
  };

  if (namaAktif) {
    return (
      <Modal open={open} onClose={onClose} judul="Akun kamu" subjudul="Data tersimpan online & sinkron di semua device.">
        <p className="kartu p-4 text-sm text-ink">
          Masuk sebagai <span className="font-semibold">{namaAktif}</span>
        </p>
        <button type="button" onClick={keluar} disabled={proses} className="tombol-bahaya mt-4 w-full">
          Keluar
        </button>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      judul={mode === 'masuk' ? 'Masuk' : 'Daftar akun'}
      subjudul="Biar datamu tersimpan online & sama di HP maupun laptop."
    >
      <form onSubmit={kirim} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1.5 shadow-lembut">
          {[
            ['masuk', 'Masuk'],
            ['daftar', 'Daftar'],
          ].map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError('');
              }}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                mode === m ? 'bg-mint text-white' : 'text-inkl hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div>
          <label className="label" htmlFor="akun-nama">
            Nama akun
          </label>
          <input
            id="akun-nama"
            type="text"
            className="input"
            placeholder="misal: budi_hemat"
            autoComplete="username"
            autoCapitalize="none"
            maxLength={20}
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="label" htmlFor="akun-sandi">
            Sandi
          </label>
          <input
            id="akun-sandi"
            type="password"
            className="input"
            autoComplete={mode === 'daftar' ? 'new-password' : 'current-password'}
            value={sandi}
            onChange={(e) => setSandi(e.target.value)}
          />
        </div>

        {mode === 'daftar' && (
          <p className="text-[11px] leading-relaxed text-inkl">
            Catatan yang sudah ada di browser ini ikut masuk ke akun barumu. Sandi nggak bisa
            di-reset, jadi jangan lupa ya.
          </p>
        )}

        {error && <p className="rounded-2xl bg-corals px-4 py-3 text-sm text-coralink">{error}</p>}

        <button type="submit" disabled={proses} className="tombol-utama w-full">
          {proses ? 'Sebentar…' : mode === 'masuk' ? 'Masuk' : 'Daftar'}
        </button>
      </form>
    </Modal>
  );
}
