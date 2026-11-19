/**
 * Pengganti server/services/excelService.js untuk versi GitHub Pages (vite --mode pages).
 * Belum login: data di localStorage browser. Sudah login: data di Supabase (tabel duitku_data).
 */
import { KATEGORI_DEFAULT } from '../../../server/services/sheets.js';
import { db } from './supabase.js';

const KUNCI = 'duitku-data';

function galat(message) {
  const err = new Error(message);
  err.status = 500;
  return err;
}

function bacaBrowser() {
  try {
    const data = JSON.parse(localStorage.getItem(KUNCI));
    if (data?.transaksi && data?.kategori) return data;
  } catch {
    // localStorage diblokir / rusak → mulai dari data bawaan
  }
  const awal = {
    transaksi: [],
    kategori: KATEGORI_DEFAULT.map((k) => ({ id: crypto.randomUUID(), ...k })),
  };
  // Langsung disimpan supaya id kategori bawaan stabil antar-baca
  try {
    localStorage.setItem(KUNCI, JSON.stringify(awal));
  } catch {
    // tidak bisa simpan → ubahData yang akan memberi pesan error
  }
  return awal;
}

async function userId() {
  if (!db) return null;
  const { data } = await db.auth.getSession();
  return data.session?.user.id ?? null;
}

/** Akun yang belum punya data di server mulai dari data browser ini (ikut ter-upload saat simpan pertama). */
async function baca(id) {
  if (!id) return bacaBrowser();
  const { data, error } = await db.from('duitku_data').select('data').eq('user_id', id).maybeSingle();
  if (error) throw galat('Gagal ambil data dari server. Cek internet kamu ya.');
  return data?.data ?? bacaBrowser();
}

// Baca-ubah-tulis dijalankan berurutan (sama seperti mutex di excelService)
let antrian = Promise.resolve();

export async function ambilData() {
  return baca(await userId());
}

export function ubahData(mutator) {
  const jalan = antrian.then(async () => {
    const id = await userId();
    const data = await baca(id);
    const hasil = await mutator(data);
    if (id) {
      const { error } = await db
        .from('duitku_data')
        .upsert({ user_id: id, data, updated_at: new Date().toISOString() });
      if (error) throw galat('Gagal menyimpan ke server. Cek internet kamu ya.');
    } else {
      try {
        localStorage.setItem(KUNCI, JSON.stringify(data));
      } catch {
        throw galat('Gagal menyimpan di browser. Cek mode incognito / ruang penyimpanan ya.');
      }
    }
    return hasil;
  });
  antrian = jalan.then(
    () => {},
    () => {},
  );
  return jalan;
}
