import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { pastikanSiap, FILE_PATH } from './services/excelService.js';
import ruteTransaksi from './routes/transaksi.js';
import ruteKategori from './routes/kategori.js';
import ruteLainnya from './routes/lainnya.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ── API ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', file: FILE_PATH });
});
app.use('/api/transaksi', ruteTransaksi);
app.use('/api/kategori', ruteKategori);
app.use('/api', ruteLainnya);

// Endpoint API yang tidak dikenal → JSON, bukan HTML
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan.' });
});

// ── Frontend hasil build (opsional, untuk mode produksi) ───────────────────
const distClient = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(distClient)) {
  app.use(express.static(distClient));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distClient, 'index.html'));
  });
}

// ── Penanganan error terpusat ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  const status = err.status || 500;
  const body = { message: err.message || 'Terjadi kesalahan di server.' };
  if (err.kode) body.kode = err.kode;
  if (err.kategoriId) body.kategoriId = err.kategoriId;
  if (typeof err.dipakai === 'number') body.dipakai = err.dipakai;

  if (status >= 500) console.error('[duitku]', err);
  res.status(status).json(body);
});

// Siapkan file Excel sebelum server menerima request
await pastikanSiap();
app.listen(PORT, () => {
  console.log(`💰 Duitku server jalan di http://localhost:${PORT}`);
  console.log(`   Data tersimpan di ${FILE_PATH}`);
});
