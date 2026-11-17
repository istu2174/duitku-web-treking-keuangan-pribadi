/** Tampilan saat data masih kosong — microcopy santai. */
export default function EmptyState({ ikon = '🌱', judul, pesan, aksi }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <span className="mb-3 grid h-14 w-14 place-items-center rounded-3xl bg-white text-2xl shadow-lembut">
        {ikon}
      </span>
      <p className="text-sm font-semibold text-ink">{judul}</p>
      {pesan && <p className="mt-1 max-w-xs text-xs leading-relaxed text-inkl">{pesan}</p>}
      {aksi && <div className="mt-4">{aksi}</div>}
    </div>
  );
}
