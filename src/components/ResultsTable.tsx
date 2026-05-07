import {
  TIME_POINTS_S,
  arithmeticMeanULF,
  medianULF,
  ulfToNm,
  slsRatio,
  rescaledRate,
} from '../model';
import type { ControlState } from './Controls';

interface ResultsTableProps {
  state: ControlState;
}

function fmt(v: number, p = 2) {
  if (!isFinite(v)) return '–';
  if (Math.abs(v) >= 1000) return v.toFixed(0);
  return v.toFixed(p);
}

export function ResultsTable({ state }: ResultsTableProps) {
  const x = rescaledRate(state);
  const rows = TIME_POINTS_S.map((tp) => {
    const ml = arithmeticMeanULF(state, tp.t);
    const med = medianULF(state, tp.t);
    const nm = ulfToNm(ml);
    const sls = slsRatio({ ...state, f: state.f }, tp.t);
    return { ...tp, ml, med, nm, sls };
  });

  return (
    <div data-testid="results-table">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-ink-800 dark:text-ink-100">
          Vorhergesagte Werte
        </h3>
        <div className="text-[11px] font-mono text-ink-400 dark:text-ink-200/70 tabular-nums">
          c₀·k₀ / (c̃·k̃) = {x.toExponential(2)}
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border border-ink-100 dark:border-ink-600">
        <table className="w-full text-sm">
          <thead className="bg-paper-100/60 dark:bg-ink-800/60 text-ink-600 dark:text-ink-100">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">Zeit</th>
              <th className="px-3 py-2 font-medium text-right">M̄L [ULF]</th>
              <th className="px-3 py-2 font-medium text-right">Länge [nm]</th>
              <th className="px-3 py-2 font-medium text-right">[µm]</th>
              <th className="px-3 py-2 font-medium text-right">Median [ULF]</th>
              <th className="px-3 py-2 font-medium text-right">SLS-Verhältnis r</th>
            </tr>
          </thead>
          <tbody className="font-mono tabular-nums text-ink-800 dark:text-ink-100">
            {rows.map((r, i) => (
              <tr
                key={r.t}
                className={
                  i % 2 === 0
                    ? 'bg-white dark:bg-ink-900'
                    : 'bg-paper-50/60 dark:bg-ink-800/40'
                }
                data-testid={`row-time-${r.t}`}
              >
                <td className="px-3 py-2 font-sans text-xs text-ink-600 dark:text-ink-100">
                  {r.label}
                </td>
                <td
                  className="px-3 py-2 text-right"
                  data-testid={`cell-ml-${r.t}`}
                >
                  {fmt(r.ml, 1)}
                </td>
                <td className="px-3 py-2 text-right">{fmt(r.nm, 0)}</td>
                <td className="px-3 py-2 text-right text-ink-400 dark:text-ink-200/70">
                  {(r.nm / 1000).toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right text-ink-400 dark:text-ink-200/70">
                  {fmt(r.med, 1)}
                </td>
                <td
                  className="px-3 py-2 text-right"
                  data-testid={`cell-sls-${r.t}`}
                >
                  {isFinite(r.sls.r) ? r.sls.r.toFixed(3) : '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
