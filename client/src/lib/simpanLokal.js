/**
 * Pengganti server/services/excelService.js untuk versi GitHub Pages (vite --mode pages).
 * Data disimpan di localStorage browser masing-masing pengguna.
 */
import { KATEGORI_DEFAULT } from '../../../server/services/sheets.js';

const KUNCI = 'duitku-data';

function baca() {
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

export async function ambilData() {
  return baca();
}

export async function ubahData(mutator) {
  const data = baca();
  const hasil = await mutator(data);
  try {
    localStorage.setItem(KUNCI, JSON.stringify(data));
  } catch {
    const err = new Error('Gagal menyimpan di browser. Cek mode incognito / ruang penyimpanan ya.');
    err.status = 500;
    throw err;
  }
  return hasil;
}
