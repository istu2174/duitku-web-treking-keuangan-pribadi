import { ambilData } from '../services/excelService.js';
import { angkaAtau } from '../utils/validasi.js';

function duaDigit(n) {
  return String(n).padStart(2, '0');
}

function hariDalamBulan(tahun, bulan) {
  return new Date(tahun, bulan, 0).getDate(); // bulan 1-12
}

/**
 * GET /api/ringkasan?bulan=&tahun=
 * Total pemasukan/pengeluaran/saldo + data grafik donut & bar + 5 transaksi terbaru.
 */
export async function ringkasan(req, res, next) {
  try {
    const sekarang = new Date();
    const bulan = angkaAtau(req.query.bulan, sekarang.getMonth() + 1, 1, 12);
    const tahun = angkaAtau(req.query.tahun, sekarang.getFullYear(), 1970, 9999);
    const prefiks = `${tahun}-${duaDigit(bulan)}`;

    const { transaksi, kategori } = await ambilData();
    const bulanIni = transaksi
      .map((t, i) => ({ ...t, _urutan: i }))
      .filter((t) => t.tanggal.startsWith(prefiks));

    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    const perKategori = new Map();

    bulanIni.forEach((t) => {
      if (t.tipe === 'Pemasukan') {
        totalPemasukan += t.nominal;
      } else {
        totalPengeluaran += t.nominal;
        const kunci = t.kategori.toLowerCase();
        const lama = perKategori.get(kunci) || { kategori: t.kategori, total: 0 };
        lama.total += t.nominal;
        perKategori.set(kunci, lama);
      }
    });

    // Warna diambil dari sheet Kategori (fallback kalau kategorinya sudah dihapus)
    const warnaKategori = new Map();
    kategori
      .filter((k) => k.tipe === 'Pengeluaran')
      .forEach((k) => warnaKategori.set(k.nama.toLowerCase(), k.warna));

    const donut = [...perKategori.values()]
      .map((k) => ({
        kategori: k.kategori,
        total: k.total,
        warna: warnaKategori.get(k.kategori.toLowerCase()) || '#D9D2E9',
        persen: totalPengeluaran > 0 ? (k.total / totalPengeluaran) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Grafik bar harian
    const jumlahHari = hariDalamBulan(tahun, bulan);
    const harian = Array.from({ length: jumlahHari }, (_, i) => ({
      hari: i + 1,
      label: String(i + 1),
      pemasukan: 0,
      pengeluaran: 0,
    }));
    // Grafik bar mingguan (minggu 1 = tanggal 1-7, dst.)
    const mingguan = Array.from({ length: Math.ceil(jumlahHari / 7) }, (_, i) => ({
      minggu: i + 1,
      label: `Minggu ${i + 1}`,
      pemasukan: 0,
      pengeluaran: 0,
    }));

    bulanIni.forEach((t) => {
      const hari = Number(t.tanggal.slice(8, 10));
      const minggu = Math.floor((hari - 1) / 7);
      const kunci = t.tipe === 'Pemasukan' ? 'pemasukan' : 'pengeluaran';
      if (harian[hari - 1]) harian[hari - 1][kunci] += t.nominal;
      if (mingguan[minggu]) mingguan[minggu][kunci] += t.nominal;
    });

    const terbaru = [...bulanIni]
      .sort((a, b) => {
        if (a.tanggal !== b.tanggal) return a.tanggal < b.tanggal ? 1 : -1;
        return b._urutan - a._urutan;
      })
      .slice(0, 5)
      .map(({ _urutan, ...t }) => ({
        ...t,
        warna: warnaKategori.get(t.kategori.toLowerCase()) || '#D9D2E9',
      }));

    res.json({
      bulan,
      tahun,
      totalPemasukan,
      totalPengeluaran,
      saldo: totalPemasukan - totalPengeluaran,
      jumlahTransaksi: bulanIni.length,
      donut,
      harian,
      mingguan,
      terbaru,
    });
  } catch (err) {
    next(err);
  }
}
