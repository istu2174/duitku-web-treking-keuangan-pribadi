/** Pembungkus fetch ke API Duitku. Semua error dilempar sebagai Error berpesan Indonesia. */
const BASE = '/api';
/** Build GitHub Pages (vite --mode pages): tanpa server, data di localStorage. */
export const LOKAL = import.meta.env.MODE === 'pages';

async function minta(path, opsi = {}) {
  if (LOKAL) return (await import('./lokal.js')).minta(path, opsi);
  let res;
  try {
    res = await fetch(BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...opsi,
    });
  } catch {
    throw new Error('Tidak bisa menghubungi server. Pastikan backend jalan ya.');
  }

  const teks = await res.text();
  let data = null;
  if (teks) {
    try {
      data = JSON.parse(teks);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const err = new Error(data?.message || 'Ada yang gagal nih, coba lagi ya.');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/** Buang query yang kosong biar URL-nya bersih. */
function qs(params = {}) {
  const bersih = Object.entries(params).filter(
    ([, v]) => v !== '' && v !== null && v !== undefined,
  );
  return bersih.length ? `?${new URLSearchParams(bersih).toString()}` : '';
}

export const api = {
  // Transaksi
  daftarTransaksi: (params) => minta(`/transaksi${qs(params)}`),
  tambahTransaksi: (body) =>
    minta('/transaksi', { method: 'POST', body: JSON.stringify(body) }),
  ubahTransaksi: (id, body) =>
    minta(`/transaksi/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  hapusTransaksi: (id) => minta(`/transaksi/${id}`, { method: 'DELETE' }),

  // Kategori
  daftarKategori: (params) => minta(`/kategori${qs(params)}`),
  tambahKategori: (body) =>
    minta('/kategori', { method: 'POST', body: JSON.stringify(body) }),
  ubahKategori: (id, body) =>
    minta(`/kategori/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  hapusKategori: (id, pindahKe) =>
    minta(`/kategori/${id}${qs({ pindahKe })}`, { method: 'DELETE' }),

  // Ringkasan & export
  ringkasan: (params) => minta(`/ringkasan${qs(params)}`),
  urlExport: '/api/export',
  /** onClick link Download Excel: di mode lokal file dibuat di browser. */
  onExport: LOKAL
    ? (e) => {
        e.preventDefault();
        import('./lokal.js')
          .then((m) => m.eksporExcel())
          .catch(() => window.alert('Gagal membuat file Excel, coba lagi ya.'));
      }
    : undefined,
  imporExcel: (file) => import('./lokal.js').then((m) => m.imporExcel(file)),
};
