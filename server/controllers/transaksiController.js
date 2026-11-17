import { ambilData, ubahData } from '../services/excelService.js';
import {
  AppError,
  angkaAtau,
  validasiNominal,
  validasiTanggal,
  validasiTipe,
} from '../utils/validasi.js';

/** Cari kategori berdasarkan nama + tipe (nama kategori dipakai sebagai kunci transaksi). */
function cariKategori(kategoriList, nama, tipe) {
  return kategoriList.find(
    (k) => k.nama.toLowerCase() === String(nama || '').toLowerCase().trim() && k.tipe === tipe,
  );
}

/** Peta warna kategori: "Tipe|nama" -> hex */
function petaWarna(kategoriList) {
  const peta = new Map();
  kategoriList.forEach((k) => peta.set(`${k.tipe}|${k.nama.toLowerCase()}`, k.warna));
  return peta;
}

/** GET /api/transaksi — list dengan filter, pencarian, sorting, pagination. */
export async function daftarTransaksi(req, res, next) {
  try {
    const { transaksi, kategori } = await ambilData();
    const {
      bulan,
      tahun,
      tipe,
      kategori: namaKategori,
      q,
      dari,
      ke,
      sort = 'tanggal',
      order = 'desc',
    } = req.query;

    const prefiksBulan =
      bulan && tahun
        ? `${String(tahun).padStart(4, '0')}-${String(bulan).padStart(2, '0')}`
        : null;

    // Beri indeks awal supaya transaksi terbaru muncul di atas saat tanggalnya sama
    let items = transaksi.map((t, i) => ({ ...t, _urutan: i }));

    if (prefiksBulan) items = items.filter((t) => t.tanggal.startsWith(prefiksBulan));
    if (tipe) items = items.filter((t) => t.tipe === tipe);
    if (namaKategori) {
      const cari = String(namaKategori).toLowerCase();
      items = items.filter((t) => t.kategori.toLowerCase() === cari);
    }
    if (q) {
      const cari = String(q).toLowerCase().trim();
      items = items.filter(
        (t) =>
          t.catatan.toLowerCase().includes(cari) || t.kategori.toLowerCase().includes(cari),
      );
    }
    if (dari) items = items.filter((t) => t.tanggal >= String(dari));
    if (ke) items = items.filter((t) => t.tanggal <= String(ke));

    const arah = String(order).toLowerCase() === 'asc' ? 1 : -1;
    const kunci = sort === 'nominal' ? 'nominal' : 'tanggal';
    items.sort((a, b) => {
      if (a[kunci] < b[kunci]) return -1 * arah;
      if (a[kunci] > b[kunci]) return 1 * arah;
      // Kalau nilainya sama, yang paling baru dicatat tampil lebih dulu
      return b._urutan - a._urutan;
    });

    const total = items.length;
    const batas = angkaAtau(req.query.limit, 10, 1, 200);
    const halaman = angkaAtau(req.query.page, 1, 1, 100000);
    const mulai = (halaman - 1) * batas;
    const warna = petaWarna(kategori);

    const potongan = items.slice(mulai, mulai + batas).map(({ _urutan, ...t }) => ({
      ...t,
      warna: warna.get(`${t.tipe}|${t.kategori.toLowerCase()}`) || '#D9D2E9',
    }));

    res.json({
      items: potongan,
      total,
      page: halaman,
      limit: batas,
      totalPages: Math.max(1, Math.ceil(total / batas)),
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/transaksi — tambah transaksi baru. */
export async function tambahTransaksi(req, res, next) {
  try {
    const { tanggal, tipe, kategori, nominal, catatan } = req.body || {};

    const tgl = validasiTanggal(tanggal);
    const tipeValid = validasiTipe(tipe);
    const nominalValid = validasiNominal(nominal);
    const namaKategori = String(kategori ?? '').trim();
    if (!namaKategori) throw new AppError(400, 'Kategori wajib dipilih.');

    const hasil = await ubahData((data) => {
      const kat = cariKategori(data.kategori, namaKategori, tipeValid);
      if (!kat) {
        throw new AppError(
          400,
          `Kategori "${namaKategori}" tidak ada untuk tipe ${tipeValid}.`,
        );
      }
      const baru = {
        id: crypto.randomUUID(),
        tanggal: tgl,
        tipe: tipeValid,
        kategori: kat.nama,
        nominal: nominalValid,
        catatan: String(catatan ?? '').trim().slice(0, 300),
      };
      data.transaksi.push(baru);
      return { ...baru, warna: kat.warna };
    });

    res.status(201).json(hasil);
  } catch (err) {
    next(err);
  }
}

/** PUT /api/transaksi/:id — edit transaksi. */
export async function ubahTransaksi(req, res, next) {
  try {
    const { tanggal, tipe, kategori, nominal, catatan } = req.body || {};

    const tgl = validasiTanggal(tanggal);
    const tipeValid = validasiTipe(tipe);
    const nominalValid = validasiNominal(nominal);
    const namaKategori = String(kategori ?? '').trim();
    if (!namaKategori) throw new AppError(400, 'Kategori wajib dipilih.');

    const hasil = await ubahData((data) => {
      const target = data.transaksi.find((t) => t.id === req.params.id);
      if (!target) throw new AppError(404, 'Transaksi tidak ditemukan.');

      const kat = cariKategori(data.kategori, namaKategori, tipeValid);
      if (!kat) {
        throw new AppError(
          400,
          `Kategori "${namaKategori}" tidak ada untuk tipe ${tipeValid}.`,
        );
      }

      Object.assign(target, {
        tanggal: tgl,
        tipe: tipeValid,
        kategori: kat.nama,
        nominal: nominalValid,
        catatan: String(catatan ?? '').trim().slice(0, 300),
      });
      return { ...target, warna: kat.warna };
    });

    res.json(hasil);
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/transaksi/:id — hapus transaksi. */
export async function hapusTransaksi(req, res, next) {
  try {
    await ubahData((data) => {
      const index = data.transaksi.findIndex((t) => t.id === req.params.id);
      if (index === -1) throw new AppError(404, 'Transaksi tidak ditemukan.');
      data.transaksi.splice(index, 1);
    });

    res.json({ message: 'Transaksi berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
}
