/** Helper format & konstanta tampilan. */

export const NAMA_BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const NAMA_BULAN_SINGKAT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

/** 12 warna pastel untuk dipilih saat bikin kategori. */
export const PALET_WARNA = [
  '#7ED6B5',
  '#A8E6CF',
  '#9BD9C6',
  '#FF9B85',
  '#FFC9A9',
  '#FFB4A2',
  '#B8A9F0',
  '#D9D2E9',
  '#A5C8F0',
  '#FFD97D',
  '#FFE9A8',
  '#CDEAC0',
];

/** Emoji lucu berdasarkan nama kategori (fallback ke 💰/💸). */
const EMOJI_KATEGORI = [
  ['makan', '🍜'],
  ['minum', '🍜'],
  ['kopi', '☕'],
  ['transport', '🚌'],
  ['bensin', '⛽'],
  ['belanja', '🛍️'],
  ['tagihan', '🧾'],
  ['listrik', '💡'],
  ['internet', '🌐'],
  ['hiburan', '🎮'],
  ['nonton', '🎬'],
  ['kesehatan', '💊'],
  ['olahraga', '🏃'],
  ['pendidikan', '📚'],
  ['gaji', '💼'],
  ['saku', '👛'],
  ['freelance', '💻'],
  ['bonus', '🎁'],
  ['tabungan', '🏦'],
  ['lainnya', '✨'],
];

export function emojiKategori(nama = '', tipe = 'Pengeluaran') {
  const cari = String(nama).toLowerCase();
  const ketemu = EMOJI_KATEGORI.find(([kata]) => cari.includes(kata));
  if (ketemu) return ketemu[1];
  return tipe === 'Pemasukan' ? '💰' : '💸';
}

export function formatRupiah(angka) {
  const n = Number(angka) || 0;
  return `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n)}`;
}

/** Format ribuan tanpa "Rp" — dipakai di input nominal. */
export function formatAngka(angka) {
  const n = Number(angka) || 0;
  return new Intl.NumberFormat('id-ID').format(n);
}

/** Ambil angka murni dari teks berpemisah titik. */
export function keAngka(teks) {
  const bersih = String(teks ?? '').replace(/[^\d]/g, '');
  return bersih ? Number(bersih) : 0;
}

export function hariIni() {
  const d = new Date();
  const bulan = String(d.getMonth() + 1).padStart(2, '0');
  const hari = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${bulan}-${hari}`;
}

/** 2026-11-17 -> "17 Nov 2026" */
export function formatTanggal(iso) {
  if (!iso) return '-';
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${NAMA_BULAN_SINGKAT[m - 1]} ${y}`;
}

/** 2026-11-17 -> "Senin, 17 November 2026" */
export function formatTanggalPanjang(iso) {
  if (!iso) return '-';
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return iso;
  const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const hari = namaHari[new Date(y, m - 1, d).getDay()];
  return `${hari}, ${d} ${NAMA_BULAN[m - 1]} ${y}`;
}

export function kelasNominal(tipe) {
  return tipe === 'Pemasukan' ? 'text-emerald-600' : 'text-coral';
}
