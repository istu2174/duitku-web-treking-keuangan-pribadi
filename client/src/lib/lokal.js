/**
 * Versi GitHub Pages: controller Express yang sama dijalankan langsung di browser.
 * excelService.js di-alias ke simpanLokal.js lewat vite.config.js (mode "pages").
 */
import * as transaksi from '../../../server/controllers/transaksiController.js';
import * as kategori from '../../../server/controllers/kategoriController.js';
import { ringkasan } from '../../../server/controllers/ringkasanController.js';
import { bacaData, tulisSheets } from '../../../server/services/sheets.js';
import { TIPE_VALID, validasiTanggal } from '../../../server/utils/validasi.js';
import { ambilData, ubahData } from './simpanLokal.js';

const RUTE = {
  'GET transaksi': transaksi.daftarTransaksi,
  'POST transaksi': transaksi.tambahTransaksi,
  'PUT transaksi/:id': transaksi.ubahTransaksi,
  'DELETE transaksi/:id': transaksi.hapusTransaksi,
  'GET kategori': kategori.daftarKategori,
  'POST kategori': kategori.tambahKategori,
  'PUT kategori/:id': kategori.ubahKategori,
  'DELETE kategori/:id': kategori.hapusKategori,
  'GET ringkasan': ringkasan,
};

/** Sama kontraknya dengan minta() di api.js: resolve JSON, atau lempar Error berpesan. */
export function minta(path, opsi = {}) {
  const [jalur, query = ''] = path.split('?');
  const [, sumber, id] = jalur.split('/');
  const handler = RUTE[`${opsi.method || 'GET'} ${sumber}${id ? '/:id' : ''}`];
  if (!handler) return Promise.reject(new Error('Endpoint tidak ditemukan.'));

  const req = {
    params: { id },
    query: Object.fromEntries(new URLSearchParams(query)),
    body: opsi.body ? JSON.parse(opsi.body) : {},
  };
  return new Promise((resolve, reject) => {
    const res = { status: () => res, json: resolve };
    handler(req, res, reject);
  });
}

export async function eksporExcel() {
  const [{ default: ExcelJS }, data] = await Promise.all([import('exceljs'), ambilData()]);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Duitku';
  tulisSheets(wb, data);
  const url = URL.createObjectURL(new Blob([await wb.xlsx.writeBuffer()]));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'keuangan.xlsx';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function tanggalValid(t) {
  try {
    validasiTanggal(t);
    return true;
  } catch {
    return false;
  }
}

/** Ganti semua data di browser dengan isi file hasil "Download Excel". Baris rusak dilewati. */
export async function imporExcel(file) {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(await file.arrayBuffer());
  } catch {
    throw new Error('File-nya nggak bisa dibaca. Pastikan formatnya .xlsx ya.');
  }
  const isi = bacaData(wb);
  const kategoriBersih = isi.kategori
    .filter((k) => k.nama && TIPE_VALID.includes(k.tipe))
    .map((k) => ({ ...k, warna: /^#[0-9a-f]{6}$/i.test(k.warna) ? k.warna : '#D9D2E9' }));
  if (!kategoriBersih.length) {
    throw new Error('Sheet Kategori kosong. Pakai file hasil "Download Excel" dari Duitku ya.');
  }
  const transaksiBersih = isi.transaksi.filter(
    (t) => tanggalValid(t.tanggal) && TIPE_VALID.includes(t.tipe) && t.kategori && t.nominal > 0,
  );
  await ubahData((data) => {
    data.kategori = kategoriBersih;
    data.transaksi = transaksiBersih;
  });
  return { transaksi: transaksiBersih.length, dilewati: isi.transaksi.length - transaksiBersih.length };
}
