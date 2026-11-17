import { formatAngka, keAngka } from '../lib/format.js';

/** Input nominal dengan format ribuan otomatis (Rp 1.250.000). */
export default function NominalInput({ nilai, onUbah, id = 'nominal' }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-inkl">
        Rp
      </span>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        className="input pl-11 text-right text-base font-semibold tabular"
        placeholder="0"
        value={nilai ? formatAngka(nilai) : ''}
        onChange={(e) => onUbah(keAngka(e.target.value))}
        onFocus={(e) => e.target.select()}
      />
    </div>
  );
}
