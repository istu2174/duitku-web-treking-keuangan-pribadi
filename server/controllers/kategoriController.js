import { ambilData, ubahData } from '../services/excelService.js';
import {
  AppError,
  validasiNamaKategori,
  validasiTipe,
  validasiWarna,
} from '../utils/validasi.js';

function samaNama(a, b) {
  return a.toLowerCase() === b.toLowerCase();
}

/** GET /api/kategori — semua kategori + jumlah transaksi yang memakainya. */
export async function daftarKategori(req, res, next) {
  try {
    const { transaksi, kategori } = await ambilData();
    const hitung = new Map();
    transaksi.forEach((t) => {
      const kunci = `${t.tipe}|${t.kategori.toLowerCase()}`;
      hitung.set(kunci, (hitung.get(kunci) || 0) + 1);
    });

    let hasil = kategori.map((k) => ({
      ...k,
      dipakai: hitung.get(`${k.tipe}|${k.nama.toLowerCase()}`) || 0,
    }));

    if (req.query.tipe) {
      const tipe = validasiTipe(req.query.tipe);
      hasil = hasil.filter((k) => k.tipe === tipe);
    }

    res.json({ items: hasil });
  } catch (err) {
    next(err);
  }
}

/** POST /api/kategori — tambah kategori baru. */
export async function tambahKategori(req, res, next) {
  try {
    const { nama, tipe, warna } = req.body || {};
    const namaValid = validasiNamaKategori(nama);
    const tipeValid = validasiTipe(tipe);
    const warnaValid = validasiWarna(warna);

    const hasil = await ubahData((data) => {
      const duplikat = data.kategori.some(
        (k) => k.tipe === tipeValid && samaNama(k.nama, namaValid),
      );
      if (duplikat) {
        throw new AppError(
          409,
          `Kategori "${namaValid}" sudah ada di ${tipeValid}. Pakai nama lain ya.`,
        );
      }

      const baru = { id: crypto.randomUUID(), nama: namaValid, tipe: tipeValid, warna: warnaValid };
      data.kategori.push(baru);
      return { ...baru, dipakai: 0 };
    });

    res.status(201).json(hasil);
  } catch (err) {
    next(err);
  }
}

/** PUT /api/kategori/:id — edit nama/warna; nama lama di transaksi ikut diperbarui. */
export async function ubahKategori(req, res, next) {
  try {
    const { nama, warna } = req.body || {};

    const hasil = await ubahData((data) => {
      const target = data.kategori.find((k) => k.id === req.params.id);
      if (!target) throw new AppError(404, 'Kategori tidak ditemukan.');

      const namaValid = validasiNamaKategori(nama ?? target.nama);
      const warnaValid = validasiWarna(warna ?? target.warna);

      const duplikat = data.kategori.some(
        (k) => k.id !== target.id && k.tipe === target.tipe && samaNama(k.nama, namaValid),
      );
      if (duplikat) {
        throw new AppError(
          409,
          `Kategori "${namaValid}" sudah ada di ${target.tipe}. Pakai nama lain ya.`,
        );
      }

      const namaLama = target.nama;
      target.nama = namaValid;
      target.warna = warnaValid;

      // Nama kategori dipakai di sheet Transaksi → ikut dirapikan
      if (!samaNama(namaLama, namaValid)) {
        data.transaksi.forEach((t) => {
          if (t.tipe === target.tipe && samaNama(t.kategori, namaLama)) {
            t.kategori = namaValid;
          }
        });
      }

      return { ...target };
    });

    res.json(hasil);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/kategori/:id?pindahKe=<id kategori tujuan>
 * Kategori yang masih dipakai transaksi hanya bisa dihapus kalau transaksinya dipindahkan.
 */
export async function hapusKategori(req, res, next) {
  try {
    const pindahKe = req.query.pindahKe ? String(req.query.pindahKe) : null;

    const hasil = await ubahData((data) => {
      const target = data.kategori.find((k) => k.id === req.params.id);
      if (!target) throw new AppError(404, 'Kategori tidak ditemukan.');

      const dipakai = data.transaksi.filter(
        (t) => t.tipe === target.tipe && samaNama(t.kategori, target.nama),
      );

      if (dipakai.length > 0) {
        if (!pindahKe) {
          const err = new AppError(
            409,
            `Kategori "${target.nama}" masih dipakai ${dipakai.length} transaksi. Pindahkan transaksinya dulu ke kategori lain ya.`,
          );
          err.kode = 'KATEGORI_DIPAKAI';
          err.dipakai = dipakai.length;
          err.kategoriId = target.id;
          throw err;
        }

        const tujuan = data.kategori.find((k) => k.id === pindahKe);
        if (!tujuan) throw new AppError(400, 'Kategori tujuan pemindahan tidak ditemukan.');
        if (tujuan.id === target.id) {
          throw new AppError(400, 'Kategori tujuan harus berbeda dari kategori yang dihapus.');
        }
        if (tujuan.tipe !== target.tipe) {
          throw new AppError(
            400,
            'Kategori tujuan harus punya tipe yang sama dengan kategori yang dihapus.',
          );
        }

        data.transaksi.forEach((t) => {
          if (t.tipe === target.tipe && samaNama(t.kategori, target.nama)) {
            t.kategori = tujuan.nama;
          }
        });
      }

      data.kategori = data.kategori.filter((k) => k.id !== target.id);
      return { message: 'Kategori berhasil dihapus.', dipindahkan: dipakai.length };
    });

    res.json(hasil);
  } catch (err) {
    next(err);
  }
}
