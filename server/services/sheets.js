/** Bagian murni (tanpa fs) — dipakai server dan versi browser (GitHub Pages). */

const SHEET_TRANSAKSI = 'Transaksi';
const SHEET_KATEGORI = 'Kategori';
const HEADER_TRANSAKSI = ['id', 'tanggal', 'tipe', 'kategori', 'nominal', 'catatan'];
const HEADER_KATEGORI = ['id', 'nama', 'tipe', 'warna'];

/** Kategori bawaan saat file Excel pertama kali dibuat */
export const KATEGORI_DEFAULT = [
  { nama: 'Gaji', tipe: 'Pemasukan', warna: '#7ED6B5' },
  { nama: 'Uang Saku', tipe: 'Pemasukan', warna: '#A8E6CF' },
  { nama: 'Freelance', tipe: 'Pemasukan', warna: '#B8A9F0' },
  { nama: 'Bonus', tipe: 'Pemasukan', warna: '#FFD97D' },
  { nama: 'Lainnya', tipe: 'Pemasukan', warna: '#CDEAC0' },
  { nama: 'Makan & Minum', tipe: 'Pengeluaran', warna: '#FF9B85' },
  { nama: 'Transport', tipe: 'Pengeluaran', warna: '#FFC9A9' },
  { nama: 'Belanja', tipe: 'Pengeluaran', warna: '#FFB4A2' },
  { nama: 'Tagihan', tipe: 'Pengeluaran', warna: '#B8A9F0' },
  { nama: 'Hiburan', tipe: 'Pengeluaran', warna: '#FFD97D' },
  { nama: 'Kesehatan', tipe: 'Pengeluaran', warna: '#9BD9C6' },
  { nama: 'Pendidikan', tipe: 'Pengeluaran', warna: '#A5C8F0' },
  { nama: 'Lainnya', tipe: 'Pengeluaran', warna: '#D9D2E9' },
];

export function tulisSheets(wb, { transaksi, kategori }) {
  for (const nama of [SHEET_TRANSAKSI, SHEET_KATEGORI]) {
    const lama = wb.getWorksheet(nama);
    if (lama) wb.removeWorksheet(lama.id);
  }

  const sT = wb.addWorksheet(SHEET_TRANSAKSI, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  sT.columns = [
    { header: 'id', key: 'id', width: 38 },
    { header: 'tanggal', key: 'tanggal', width: 14 },
    { header: 'tipe', key: 'tipe', width: 14 },
    { header: 'kategori', key: 'kategori', width: 20 },
    { header: 'nominal', key: 'nominal', width: 14 },
    { header: 'catatan', key: 'catatan', width: 40 },
  ];
  transaksi.forEach((t) => {
    sT.addRow({
      id: t.id,
      tanggal: t.tanggal,
      tipe: t.tipe,
      kategori: t.kategori,
      nominal: t.nominal,
      catatan: t.catatan || '',
    });
  });

  const sK = wb.addWorksheet(SHEET_KATEGORI, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  sK.columns = [
    { header: 'id', key: 'id', width: 38 },
    { header: 'nama', key: 'nama', width: 20 },
    { header: 'tipe', key: 'tipe', width: 14 },
    { header: 'warna', key: 'warna', width: 12 },
  ];
  kategori.forEach((k) => {
    sK.addRow({ id: k.id, nama: k.nama, tipe: k.tipe, warna: k.warna });
  });

  // Header dibuat tebal + latar lembut biar enak dibaca manual di Excel
  for (const sheet of [sT, sK]) {
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF3E0' },
    };
  }

  return wb;
}

// ── Konversi nilai sel ─────────────────────────────────────────────────────
function teks(cell) {
  const v = cell?.value;
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') {
    if (v instanceof Date) return formatTanggal(v);
    if (v.text !== undefined) return String(v.text).trim(); // rich text
    if (v.result !== undefined) return String(v.result).trim(); // formula
    if (Array.isArray(v.richText)) return v.richText.map((r) => r.text).join('').trim();
    return '';
  }
  return String(v).trim();
}

function formatTanggal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function bacaBaris(sheet, header) {
  const hasil = [];
  if (!sheet) return hasil;
  sheet.eachRow((row, index) => {
    if (index === 1) return; // lewati header
    const obj = {};
    header.forEach((key, i) => {
      obj[key] = teks(row.getCell(i + 1));
    });
    // lewati baris kosong
    const adaIsi = header.some((key) => obj[key] !== '');
    if (adaIsi) hasil.push(obj);
  });
  return hasil;
}

export function bacaData(wb) {
  const transaksi = bacaBaris(wb.getWorksheet(SHEET_TRANSAKSI), HEADER_TRANSAKSI).map((t) => ({
    id: t.id || crypto.randomUUID(),
    tanggal: t.tanggal,
    tipe: t.tipe,
    kategori: t.kategori,
    nominal: Number(String(t.nominal).replace(/[^\d.-]/g, '')) || 0,
    catatan: t.catatan || '',
  }));

  const kategori = bacaBaris(wb.getWorksheet(SHEET_KATEGORI), HEADER_KATEGORI).map((k) => ({
    id: k.id || crypto.randomUUID(),
    nama: k.nama,
    tipe: k.tipe,
    warna: k.warna || '#D9D2E9',
  }));

  return { transaksi, kategori };
}
