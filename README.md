# 💰 Duitku — Tracker Keuangan Sederhana

Web app buat nyatet pemasukan & pengeluaran harian, lihat ringkasan, dan grafik.
**Semua data disimpan di satu file Excel** (`data/keuangan.xlsx`) — gampang dibuka,
dibackup, atau diedit manual.

Dibuat mengikuti PRD: React + Vite + Tailwind + Recharts di frontend, Express +
`exceljs` di backend, tanpa database lain. Tanpa login, satu pengguna, jalan lokal.

## 🌐 Pakai online

**https://istu2174.github.io/duitku-web-treking-keuangan-pribadi/**

Versi online jalan penuh di browser (GitHub Pages, tanpa server): data tiap orang
disimpan di browser masing-masing (localStorage), privat, nggak dikirim ke mana-mana.
Tombol **Download Excel** buat cadangan, **Pulihkan dari Excel** buat balikin data / pindah HP.
Hapus data browser = data hilang, jadi rajin download ya.

**Akun (opsional, Supabase):** masuk/daftar pakai nama + sandi, data tersimpan online
dan sama di HP maupun laptop. Catatan yang sudah ada di browser ikut masuk ke akun baru.

Setup sekali (pemilik):
1. Bikin project gratis di [supabase.com](https://supabase.com).
2. SQL Editor → jalankan [`supabase/schema.sql`](supabase/schema.sql).
3. Authentication → Sign In / Providers → Email → matikan **Confirm email** (login pakai nama, bukan email asli).
4. Isi `SUPABASE_URL` dan `SUPABASE_KEY` (publishable/anon key) di `client/src/lib/supabase.js`, lalu push.

Selama belum diisi, web jalan tanpa akun (data di browser saja).

Deploy otomatis lewat GitHub Actions (`.github/workflows/pages.yml`) tiap push ke `main`.
Build manual: `npm --prefix client run build:pages`, tes: `npm --prefix client test`.

---

## ✨ Fitur

**Dashboard**
- Kartu ringkasan bulan terpilih: Total Pemasukan, Total Pengeluaran, Saldo
- Filter bulan & tahun (default bulan ini)
- Grafik donut komposisi pengeluaran per kategori
- Grafik bar pemasukan vs pengeluaran (harian / mingguan)
- 5 transaksi terbaru

**Transaksi (CRUD)**
- Tambah transaksi lewat modal (tanggal default hari ini, nominal auto-format Rupiah)
- Edit & hapus (dengan konfirmasi)
- Pencarian catatan/kategori, filter tipe, kategori, rentang tanggal
- Sorting tanggal/nominal, pagination

**Kategori (CRUD)**
- Dipisah tab Pemasukan / Pengeluaran
- Tambah, edit nama & warna, hapus
- Rename kategori otomatis memperbarui transaksi lama
- Hapus kategori yang masih dipakai → diminta pindahkan transaksinya dulu
- Nama tidak boleh duplikat dalam tipe yang sama

**Backup**
- Tombol **Download Excel** (sidebar & header dashboard)

---

## 🧱 Tech Stack

| Bagian | Teknologi |
|---|---|
| Frontend | React 18, Vite 6, Tailwind CSS 3, Recharts, React Router 6 |
| Backend | Node.js, Express 4 |
| Penyimpanan | File `data/keuangan.xlsx` via `exceljs` |

---

## 📁 Struktur Folder

```
duitku/
├── client/                     # React + Vite
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js          # proxy /api → localhost:3001
│   └── src/
│       ├── App.jsx             # routing
│       ├── index.css           # token gaya + komponen Tailwind
│       ├── components/         # Layout, Modal, Toast, form, dll.
│       ├── lib/                # api.js (fetch wrapper), format.js
│       └── pages/              # Dashboard, Transaksi, Kategori
├── server/                     # Express
│   ├── index.js                # app + error handler
│   ├── routes/                 # transaksi, kategori, ringkasan/export
│   ├── controllers/
│   └── services/excelService.js# baca/tulis Excel + write queue
├── data/keuangan.xlsx          # dibuat otomatis saat server pertama jalan
├── package.json                # script dev (client + server sekaligus)
└── README.md
```

---

## 🚀 Cara Menjalankan

Butuh **Node.js 18+** (disarankan 20/22).

```bash
# 1. install semua dependency (root, server, client)
npm run install:all
#    atau manual:
#    npm install && npm --prefix server install && npm --prefix client install

# 2. jalankan client + server sekaligus
npm run dev
```

Buka **http://localhost:5173** — server API jalan di `http://localhost:3001`.

Saat pertama kali dijalankan, `data/keuangan.xlsx` otomatis dibuat lengkap dengan
13 kategori default (5 pemasukan, 8 pengeluaran).

### Script lain

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan server + client bersamaan (concurrently) |
| `npm run dev:server` | Server Express saja (`node --watch`) |
| `npm run dev:client` | Vite dev server saja |
| `npm run build` | Build frontend ke `client/dist` |
| `npm start` | Jalankan server produksi (sekalian serve `client/dist` kalau ada) |

---

## 📊 Format File Excel

**Sheet `Transaksi`**

| id | tanggal | tipe | kategori | nominal | catatan |
|---|---|---|---|---|---|
| UUID | `YYYY-MM-DD` | Pemasukan / Pengeluaran | nama kategori | angka | teks opsional |

**Sheet `Kategori`**

| id | nama | tipe | warna |
|---|---|---|---|
| UUID | nama kategori | Pemasukan / Pengeluaran | hex `#RRGGBB` |

Kategori default:

- **Pemasukan**: Gaji, Uang Saku, Freelance, Bonus, Lainnya
- **Pengeluaran**: Makan & Minum, Transport, Belanja, Tagihan, Hiburan, Kesehatan, Pendidikan, Lainnya

> Kategori di sheet `Transaksi` disimpan sebagai **nama**, jadi kalau kamu rename
> kategori lewat aplikasi, semua transaksi lama ikut berubah.

---

## 🔌 API

Base URL: `http://localhost:3001/api`

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/transaksi?bulan=&tahun=&tipe=&kategori=&q=&dari=&ke=&sort=&order=&page=&limit=` | List transaksi |
| POST | `/transaksi` | Tambah transaksi |
| PUT | `/transaksi/:id` | Edit transaksi |
| DELETE | `/transaksi/:id` | Hapus transaksi |
| GET | `/ringkasan?bulan=&tahun=` | Total + data grafik |
| GET | `/kategori` | List kategori (+ jumlah pemakaian) |
| POST | `/kategori` | Tambah kategori |
| PUT | `/kategori/:id` | Edit kategori |
| DELETE | `/kategori/:id?pindahKe=<id>` | Hapus kategori (pindahkan transaksi dulu) |
| GET | `/export` | Download `keuangan.xlsx` |
| GET | `/health` | Cek status server |

Semua error memakai format `{ "message": "..." }` berbahasa Indonesia.

Contoh:

```bash
curl -X POST http://localhost:3001/api/transaksi \
  -H "Content-Type: application/json" \
  -d '{"tanggal":"2026-11-17","tipe":"Pengeluaran","kategori":"Makan & Minum","nominal":25000,"catatan":"Kopi"}'
```

---

## 🔒 Catatan Penting

- **File Excel sedang dibuka?** Kalau `data/keuangan.xlsx` sedang terbuka di Excel/
  LibreOffice, penyimpanan bisa gagal. Aplikasi akan menjawab dengan pesan:
  *"Tutup file Excel dulu ya — data/keuangan.xlsx sedang terbuka di aplikasi lain."*
- **Tidak ada penulisan bersamaan.** Semua baca/tulis file lewat satu antrian
  (write queue) di `excelService.js`, jadi file tidak bisa rusak karena dua request
  menulis bareng.
- **Edit manual tetap terbaca.** Data selalu dibaca ulang dari file tiap request,
  jadi perubahan yang kamu lakukan langsung di Excel akan muncul di aplikasi
  (asalkan format kolomnya tetap sama).
- **Backup** cukup copy file `data/keuangan.xlsx`.

---

## 🧪 Uji Manual yang Sudah Dilakukan

- [x] `npm run dev` jalan client + server sekaligus
- [x] Data tetap ada setelah server restart, dan terbaca di Excel (2 sheet, header sesuai PRD)
- [x] Tambah / edit / hapus transaksi & kategori berfungsi
- [x] Validasi backend: nominal > 0, tanggal valid, tipe valid, kategori harus ada (dan tipenya cocok)
- [x] Rename kategori memperbarui transaksi lama
- [x] Hapus kategori yang dipakai ditolak (409) sampai transaksinya dipindahkan
- [x] Ringkasan, donut, dan grafik harian/mingguan sesuai isi Excel
- [x] Export Excel mengunduh file yang valid
- [x] Tampilan rapi di 375px (bottom nav + FAB) dan 1280px (sidebar)

---

## 🌈 Palet Warna

| Token | Hex | Dipakai untuk |
|---|---|---|
| Krem | `#FFFBF5` | Background |
| Mint | `#7ED6B5` | Pemasukan, aksi utama |
| Coral | `#FF9B85` | Pengeluaran |
| Lavender | `#B8A9F0` | Aksen, navigasi aktif |
| Kuning | `#FFD97D` | Aksen tambahan |

Font: **Poppins** (fallback Nunito / system sans).

---

## 🚫 Di Luar Scope

Login/multi-user, anggaran/budget limit, multi-mata-uang, transaksi berulang,
import Excel, dan deploy cloud.
