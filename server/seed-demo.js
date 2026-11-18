import crypto from 'node:crypto';
import { pastikanSiap, ambilData, ubahData } from './services/excelService.js';

/**
 * Data contoh untuk demo online (Render).
 * Hanya jalan kalau env SEED_DEMO=1 dan file data masih kosong,
 * jadi aman dipanggil setiap kali container start.
 */
if (process.env.SEED_DEMO !== '1') {
  console.log('SEED_DEMO tidak aktif — lewati pengisian data contoh.');
  process.exit(0);
}

await pastikanSiap();

const awal = await ambilData();
if (awal.transaksi.length > 0) {
  console.log(`Data sudah ada (${awal.transaksi.length} transaksi) — lewati seed.`);
  process.exit(0);
}

/** tanggal ISO (YYYY-MM-DD) n hari lalu */
function hariLalu(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// Skenario 4 bulan terakhir: gaji bulanan, sesekali freelance/bonus, pengeluaran harian
const paket = [
  { hari: 1, tipe: 'Pemasukan', kategori: 'Gaji', nominal: 8500000, catatan: 'Gaji bulanan' },
  { hari: 3, tipe: 'Pengeluaran', kategori: 'Tagihan', nominal: 850000, catatan: 'Sewa kos' },
  { hari: 4, tipe: 'Pengeluaran', kategori: 'Tagihan', nominal: 320000, catatan: 'Listrik & air' },
  { hari: 6, tipe: 'Pengeluaran', kategori: 'Makan & Minum', nominal: 275000, catatan: 'Belanja bulanan' },
  { hari: 9, tipe: 'Pengeluaran', kategori: 'Transport', nominal: 150000, catatan: 'Bensin & parkir' },
  { hari: 12, tipe: 'Pemasukan', kategori: 'Freelance', nominal: 1200000, catatan: 'Desain logo' },
  { hari: 14, tipe: 'Pengeluaran', kategori: 'Belanja', nominal: 430000, catatan: 'Sepatu kerja' },
  { hari: 18, tipe: 'Pengeluaran', kategori: 'Hiburan', nominal: 180000, catatan: 'Nonton & kopi' },
  { hari: 21, tipe: 'Pengeluaran', kategori: 'Kesehatan', nominal: 260000, catatan: 'Vitamin & obat' },
  { hari: 24, tipe: 'Pengeluaran', kategori: 'Pendidikan', nominal: 350000, catatan: 'Kursus online' },
];

const transaksi = [];
for (let bulan = 0; bulan < 4; bulan += 1) {
  paket.forEach((p, i) => {
    // selisih nominal dibuat bervariasi supaya grafiknya tidak rata
    const variasi = 1 + ((bulan * 7 + i * 3) % 5 - 2) * 0.05;
    transaksi.push({
      id: crypto.randomUUID(),
      tanggal: hariLalu(bulan * 30 + p.hari),
      tipe: p.tipe,
      kategori: p.kategori,
      nominal: Math.round((p.nominal * variasi) / 1000) * 1000,
      catatan: bulan === 0 ? p.catatan : `${p.catatan}`,
    });
  });
}

// beberapa transaksi harian tambahan di bulan berjalan
for (let i = 0; i < 8; i += 1) {
  transaksi.push({
    id: crypto.randomUUID(),
    tanggal: hariLalu(i),
    tipe: 'Pengeluaran',
    kategori: i % 2 === 0 ? 'Makan & Minum' : 'Transport',
    nominal: 25000 + i * 7500,
    catatan: i % 2 === 0 ? 'Makan siang' : 'Ojek online',
  });
}

await ubahData((data) => {
  data.transaksi = transaksi;
});

console.log(`Data contoh Duitku diisi: ${transaksi.length} transaksi.`);
process.exit(0);
