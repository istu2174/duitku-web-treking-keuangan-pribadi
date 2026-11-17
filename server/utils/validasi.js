/**
 * Validasi input yang dipakai bersama oleh controller.
 * Semua pesan error berbahasa Indonesia dan siap dikirim ke frontend.
 */

export const TIPE_VALID = ['Pemasukan', 'Pengeluaran'];

/** Error dengan status HTTP. */
export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Validasi format tanggal YYYY-MM-DD dan pastikan tanggalnya benar-benar ada. */
export function validasiTanggal(nilai, namaField = 'tanggal') {
  if (typeof nilai !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(nilai)) {
    throw new AppError(400, `${namaField} harus berformat YYYY-MM-DD.`);
  }
  const [y, m, d] = nilai.split('-').map(Number);
  const cek = new Date(Date.UTC(y, m - 1, d));
  if (
    cek.getUTCFullYear() !== y ||
    cek.getUTCMonth() !== m - 1 ||
    cek.getUTCDate() !== d
  ) {
    throw new AppError(400, `${namaField} tidak valid.`);
  }
  return nilai;
}

export function validasiTipe(nilai) {
  if (!TIPE_VALID.includes(nilai)) {
    throw new AppError(400, 'Tipe harus "Pemasukan" atau "Pengeluaran".');
  }
  return nilai;
}

/** Nominal harus angka > 0 (string "Rp 1.250.000" juga diterima). */
export function validasiNominal(nilai) {
  const angka =
    typeof nilai === 'number'
      ? nilai
      : Number(String(nilai ?? '').replace(/[^\d]/g, ''));
  if (!Number.isFinite(angka) || angka <= 0) {
    throw new AppError(400, 'Nominal harus berupa angka lebih dari 0.');
  }
  return Math.round(angka * 100) / 100;
}

export function validasiWarna(nilai) {
  const warna = String(nilai ?? '').trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(warna)) {
    throw new AppError(400, 'Warna harus berformat hex, contoh #7ED6B5.');
  }
  return warna.toUpperCase();
}

export function validasiNamaKategori(nilai) {
  const nama = String(nilai ?? '').trim();
  if (!nama) throw new AppError(400, 'Nama kategori tidak boleh kosong.');
  if (nama.length > 40) throw new AppError(400, 'Nama kategori maksimal 40 karakter.');
  return nama;
}

/** Helper: ambil parameter angka dengan batas aman. */
export function angkaAtau(nilai, bawaan, min, max) {
  const n = Number(nilai);
  if (!Number.isFinite(n)) return bawaan;
  return Math.min(Math.max(n, min), max);
}
