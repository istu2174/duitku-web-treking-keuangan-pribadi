import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../lib/api.js';
import {
  NAMA_BULAN,
  emojiKategori,
  formatRupiah,
  formatTanggal,
  formatTanggalPanjang,
} from '../lib/format.js';
import EmptyState from '../components/EmptyState.jsx';

/** Tooltip grafik dengan format Rupiah. */
function TooltipRupiah({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl bg-white px-3 py-2 text-xs shadow-naik">
      <p className="mb-1 font-semibold text-ink">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="tabular" style={{ color: p.color }}>
          {p.name}: {formatRupiah(p.value)}
        </p>
      ))}
    </div>
  );
}

function KartuRingkasan({ ikon, label, nilai, petunjuk, kelas }) {
  return (
    <div className={`rounded-3xl p-5 shadow-lembut ${kelas}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/70 text-base">
          {ikon}
        </span>
        {label}
      </div>
      <p className="tabular mt-3 text-xl font-semibold md:text-2xl">{nilai}</p>
      <p className="mt-1 text-[11px] opacity-80">{petunjuk}</p>
    </div>
  );
}

export default function Dashboard() {
  const sekarang = useMemo(() => new Date(), []);
  const [bulan, setBulan] = useState(sekarang.getMonth() + 1);
  const [tahun, setTahun] = useState(sekarang.getFullYear());
  const [modeBar, setModeBar] = useState('harian');
  const [data, setData] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState('');

  const muat = useCallback(async () => {
    setMemuat(true);
    setError('');
    try {
      const hasil = await api.ringkasan({ bulan, tahun });
      setData(hasil);
    } catch (err) {
      setError(err.message);
    } finally {
      setMemuat(false);
    }
  }, [bulan, tahun]);

  useEffect(() => {
    muat();
  }, [muat]);

  const daftarTahun = useMemo(() => {
    const ini = sekarang.getFullYear();
    return [ini + 1, ini, ini - 1, ini - 2, ini - 3];
  }, [sekarang]);

  const grafikBar = modeBar === 'harian' ? data?.harian || [] : data?.mingguan || [];
  const belumAdaData = data && data.jumlahTransaksi === 0;

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Kepala halaman */}
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-inkl">Halo! 👋</p>
          <h1 className="text-xl font-semibold text-ink md:text-2xl">
            Ringkasan duit bulan {NAMA_BULAN[bulan - 1]}&nbsp;{tahun}
          </h1>
          <p className="mt-1 text-xs text-inkl">
            {formatTanggalPanjang(
              `${tahun}-${String(bulan).padStart(2, '0')}-01`,
            ).replace(/^\w+, /, '')}{' '}
            · {data?.jumlahTransaksi ?? 0} transaksi tercatat
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Pilih bulan"
            className="rounded-2xl bg-white px-3 py-2.5 text-sm font-medium text-ink shadow-lembut outline-none focus:ring-4 focus:ring-lavender/25"
            value={bulan}
            onChange={(e) => setBulan(Number(e.target.value))}
          >
            {NAMA_BULAN.map((nama, i) => (
              <option key={nama} value={i + 1}>
                {nama}
              </option>
            ))}
          </select>
          <select
            aria-label="Pilih tahun"
            className="rounded-2xl bg-white px-3 py-2.5 text-sm font-medium text-ink shadow-lembut outline-none focus:ring-4 focus:ring-lavender/25"
            value={tahun}
            onChange={(e) => setTahun(Number(e.target.value))}
          >
            {daftarTahun.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <a href={api.urlExport} download className="tombol-lembut hidden sm:inline-flex">
            ⬇️ <span>Download Excel</span>
          </a>
        </div>
      </header>

      {error && (
        <div className="kartu flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-coralink">
          <span>😕 {error}</span>
          <button type="button" onClick={muat} className="tombol-bahaya">
            Coba lagi
          </button>
        </div>
      )}

      {/* Kartu ringkasan */}
      <section className="grid gap-3 sm:grid-cols-3">
        <KartuRingkasan
          ikon="💰"
          label="Pemasukan"
          nilai={formatRupiah(data?.totalPemasukan ?? 0)}
          petunjuk="Uang yang masuk bulan ini"
          kelas="bg-mints text-mintink"
        />
        <KartuRingkasan
          ikon="💸"
          label="Pengeluaran"
          nilai={formatRupiah(data?.totalPengeluaran ?? 0)}
          petunjuk="Uang yang keluar bulan ini"
          kelas="bg-corals text-coralink"
        />
        <KartuRingkasan
          ikon="🧺"
          label="Saldo"
          nilai={formatRupiah(data?.saldo ?? 0)}
          petunjuk={
            (data?.saldo ?? 0) >= 0 ? 'Masih aman, lanjut nabung!' : 'Boncos nih, pelan-pelan ya'
          }
          kelas={
            (data?.saldo ?? 0) >= 0
              ? 'bg-lavenders text-lavenderink'
              : 'bg-kunings text-amberink'
          }
        />
      </section>

      {/* Donut pengeluaran */}
      <section className="kartu p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Ke mana aja duitnya? 🕵️</h2>
            <p className="text-xs text-inkl">Komposisi pengeluaran per kategori</p>
          </div>
        </div>

        {memuat && !data ? (
          <div className="grid h-56 place-items-center text-sm text-inkl">Memuat…</div>
        ) : data?.donut?.length ? (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <div className="relative h-56 w-56 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.donut}
                    dataKey="total"
                    nameKey="kategori"
                    innerRadius="58%"
                    outerRadius="88%"
                    paddingAngle={2}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {data.donut.map((d) => (
                      <Cell key={d.kategori} fill={d.warna} />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipRupiah />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] text-inkl">Total keluar</span>
                <span className="tabular text-base font-semibold text-ink">
                  {formatRupiah(data.totalPengeluaran)}
                </span>
              </div>
            </div>

            <ul className="w-full flex-1 space-y-2.5 sm:max-w-md">
              {data.donut.map((d) => (
                <li key={d.kategori} className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: d.warna }}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">
                    {emojiKategori(d.kategori, 'Pengeluaran')} {d.kategori}
                  </span>
                  <span className="tabular shrink-0 text-sm font-medium text-ink">
                    {formatRupiah(d.total)}
                  </span>
                  <span className="tabular w-12 shrink-0 text-right text-xs text-inkl">
                    {d.persen.toFixed(0)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState
            ikon="🫙"
            judul="Belum ada pengeluaran bulan ini"
            pesan="Yuk catat pengeluaran pertama biar grafiknya mulai keisi."
            aksi={
              <Link to="/transaksi?baru=1" className="tombol-utama">
                ＋ Catat sekarang
              </Link>
            }
          />
        )}
      </section>

      {/* Bar chart pemasukan vs pengeluaran */}
      <section className="kartu p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-ink">Arus duit 📊</h2>
            <p className="text-xs text-inkl">Pemasukan vs pengeluaran dalam bulan ini</p>
          </div>
          <div className="flex rounded-full bg-krem p-1">
            {[
              { id: 'harian', label: 'Harian' },
              { id: 'mingguan', label: 'Mingguan' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModeBar(m.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  modeBar === m.id
                    ? 'bg-white text-ink shadow-lembut ring-1 ring-ink/5'
                    : 'text-inkl hover:text-ink'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={grafikBar}
              margin={{ top: 6, right: 4, left: -18, bottom: 0 }}
              barGap={2}
              maxBarSize={20}
            >
              <CartesianGrid vertical={false} stroke="#F1E9DD" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#8C8177' }}
                interval={modeBar === 'harian' ? 2 : 0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#8C8177' }}
                tickFormatter={(v) =>
                  v >= 1000000
                    ? `${(v / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`
                    : v >= 1000
                      ? `${Math.round(v / 1000)} rb`
                      : v
                }
              />
              <Tooltip content={<TooltipRupiah />} cursor={{ fill: 'rgba(184,169,240,0.08)' }} />
              <Bar
                dataKey="pemasukan"
                name="Pemasukan"
                fill="#7ED6B5"
                radius={[6, 6, 0, 0]}
                isAnimationActive={false}
              />
              <Bar
                dataKey="pengeluaran"
                name="Pengeluaran"
                fill="#FF9B85"
                radius={[6, 6, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center justify-center gap-5 text-xs text-inkl">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-mint" /> Pemasukan
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-coral" /> Pengeluaran
          </span>
        </div>
      </section>

      {/* 5 transaksi terbaru */}
      <section className="kartu p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">Terakhir dicatat 🕒</h2>
            <p className="text-xs text-inkl">Transaksi paling baru bulan ini</p>
          </div>
          <Link
            to="/transaksi"
            className="rounded-full px-3 py-1.5 text-xs font-medium text-lavender transition-colors hover:bg-lavenders hover:text-ink"
          >
            Lihat semua →
          </Link>
        </div>

        {!data ? (
          <div className="grid h-24 place-items-center text-sm text-inkl">Memuat…</div>
        ) : belumAdaData ? (
          <EmptyState
            ikon="📝"
            judul="Belum ada transaksi nih, yuk catat yang pertama!"
            pesan="Cukup isi tanggal, kategori, dan nominal. Selesai."
            aksi={
              <Link to="/transaksi?baru=1" className="tombol-utama">
                ＋ Catat transaksi
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-krem">
            {data.terbaru.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-base"
                  style={{ backgroundColor: `${t.warna}33` }}
                >
                  {emojiKategori(t.kategori, t.tipe)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{t.kategori}</p>
                  <p className="truncate text-xs text-inkl">
                    {formatTanggal(t.tanggal)}
                    {t.catatan ? ` · ${t.catatan}` : ''}
                  </p>
                </div>
                <span
                  className={`tabular shrink-0 text-sm font-semibold ${
                    t.tipe === 'Pemasukan' ? 'text-mintink' : 'text-coralink'
                  }`}
                >
                  {t.tipe === 'Pemasukan' ? '+' : '−'} {formatRupiah(t.nominal)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
