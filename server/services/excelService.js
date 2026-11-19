import ExcelJS from 'exceljs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { KATEGORI_DEFAULT, bacaData, tulisSheets } from './sheets.js';

export { KATEGORI_DEFAULT };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Lokasi file Excel penyimpanan data */
export const DATA_DIR = path.resolve(__dirname, '../../data');
export const FILE_PATH = path.join(DATA_DIR, 'keuangan.xlsx');

// ── Mutex sederhana: semua baca/tulis file dijalankan berurutan ─────────────
let antrian = Promise.resolve();

/** Menjalankan tugas secara eksklusif supaya file tidak ditulis bersamaan. */
function denganKunci(tugas) {
  const jalan = antrian.then(() => tugas());
  // Antrian tetap lanjut walau tugas sebelumnya gagal
  antrian = jalan.then(
    () => {},
    () => {},
  );
  return jalan;
}

/** Error dengan status HTTP, pesannya sudah ramah dibaca pengguna. */
function buatError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// ── Persiapan file ─────────────────────────────────────────────────────────
async function pastikanFileAda() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE_PATH);
    return; // sudah ada, tidak perlu dibuat
  } catch {
    // lanjut membuat file baru
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Duitku';
  tulisSheets(wb, {
    transaksi: [],
    kategori: KATEGORI_DEFAULT.map((k) => ({ id: crypto.randomUUID(), ...k })),
  });
  await simpanWorkbook(wb);
}

async function simpanWorkbook(wb) {
  try {
    await wb.xlsx.writeFile(FILE_PATH);
  } catch (err) {
    // File biasanya terkunci karena sedang dibuka di Excel/LibreOffice
    if (['EBUSY', 'EPERM', 'EACCES', 'ENOTEMPTY'].includes(err.code)) {
      throw buatError(
        409,
        'Tutup file Excel dulu ya — data/keuangan.xlsx sedang terbuka di aplikasi lain.',
      );
    }
    throw buatError(500, 'Gagal menyimpan file Excel. Coba lagi sebentar lagi.');
  }
}

async function bukaWorkbook() {
  await pastikanFileAda();
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.readFile(FILE_PATH);
  } catch {
    throw buatError(500, 'File data/keuangan.xlsx tidak bisa dibaca. Pastikan filenya utuh.');
  }
  return wb;
}

// ── API service ────────────────────────────────────────────────────────────

/** Baca seluruh data (selalu dari file terbaru, jadi edit manual di Excel ikut terbaca). */
export function ambilData() {
  return denganKunci(async () => {
    const wb = await bukaWorkbook();
    return bacaData(wb);
  });
}

/**
 * Ubah data lalu simpan ke Excel dalam satu operasi terkunci.
 * `mutator(data)` boleh mengubah array `transaksi` / `kategori`, dan
 * mengembalikan nilai apa pun untuk diteruskan ke pemanggil.
 */
export function ubahData(mutator) {
  return denganKunci(async () => {
    const wb = await bukaWorkbook();
    const data = bacaData(wb);
    const hasil = await mutator(data);
    tulisSheets(wb, data);
    await simpanWorkbook(wb);
    return hasil;
  });
}

/** Pastikan file Excel sudah ada (dipanggil saat server start). */
export async function pastikanSiap() {
  return denganKunci(async () => {
    await pastikanFileAda();
    return FILE_PATH;
  });
}
