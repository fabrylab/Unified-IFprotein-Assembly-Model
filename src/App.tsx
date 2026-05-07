import { useEffect, useMemo, useState } from 'react';
import { Logo } from './components/Logo';
import { Controls, type ControlState } from './components/Controls';
import { ResultsTable } from './components/ResultsTable';
import { Charts } from './components/Charts';
import { ModelNote } from './components/ModelNote';
import { slsRatio, rescaledRate } from './model';

const DEFAULT_STATE: ControlState = {
  c0: 0.2,
  k0: 6.3e-5,
  lp: '1.0',
  w1: 594,
  w2: 405,
  f: 1.0,
  showAdvanced: false,
};

export default function App() {
  const [state, setState] = useState<ControlState>(DEFAULT_STATE);
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const update = (next: Partial<ControlState>) => setState((s) => ({ ...s, ...next }));

  // Snapshot der aktuellen kinetischen Kennzahlen
  const summary = useMemo(() => {
    const x = rescaledRate(state);
    const sls300 = slsRatio({ ...state, f: state.f }, 300);
    return { x, sls300 };
  }, [state]);

  return (
    <div className="relative min-h-screen text-ink-800 dark:text-ink-100">
      <div className="relative max-w-[1280px] mx-auto px-5 sm:px-8 py-8">
        <Header dark={dark} setDark={setDark} />

        <main className="mt-8 grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-8">
          <aside
            className="lg:sticky lg:top-8 self-start rounded-lg border border-ink-100 dark:border-ink-600 bg-white dark:bg-ink-800/60 p-5 shadow-panel"
            data-testid="sidebar-controls"
          >
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-sm font-semibold tracking-tight text-ink-800 dark:text-ink-100">
                Parameter
              </h2>
              <button
                type="button"
                className="text-[11px] font-mono text-ink-400 dark:text-ink-200/70 hover:text-accent-700 dark:hover:text-accent-400"
                onClick={() => setState(DEFAULT_STATE)}
                data-testid="button-reset"
              >
                zurücksetzen
              </button>
            </div>
            <Controls state={state} setState={update} />
          </aside>

          <section className="space-y-6 min-w-0">
            <SummaryStrip
              x={summary.x}
              p={summary.sls300.p}
              tau={summary.sls300.tau}
              status={summary.sls300.status}
            />
            <ResultsTable state={state} />
            <Charts state={state} dark={dark} />
            <ModelNote />
            <Caveats />
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}

function Header({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  return (
    <header className="flex items-center justify-between gap-6">
      <div className="flex items-center gap-3 text-accent-700 dark:text-accent-400">
        <Logo className="w-9 h-9" />
        <div>
          <h1 className="text-base font-semibold tracking-tight text-ink-800 dark:text-ink-100">
            IF Assembly · Längenwachstum &amp; Lichtstreuung
          </h1>
          <p className="text-xs text-ink-400 dark:text-ink-200/70">
            Empirische Skalierungsgesetze nach Schween et al. (2026)
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setDark(!dark)}
        className="text-xs font-medium px-3 py-1.5 rounded-md border border-ink-100 dark:border-ink-600 text-ink-600 dark:text-ink-100 hover:bg-paper-100 dark:hover:bg-ink-800 transition-colors"
        data-testid="button-theme-toggle"
      >
        {dark ? 'Hell' : 'Dunkel'}
      </button>
    </header>
  );
}

function SummaryStrip({
  x,
  p,
  tau,
  status,
}: {
  x: number;
  p: number;
  tau: number;
  status: 'calibrated' | 'reciprocal' | 'unsupported';
}) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      data-testid="summary-strip"
    >
      <Stat label="(c₀·k₀)/(c̃·k̃)" value={x.toExponential(2)} />
      <Stat
        label="Plateau p"
        value={isFinite(p) ? p.toFixed(3) : '–'}
      />
      <Stat
        label="Zeitkonstante τ [s]"
        value={isFinite(tau) ? tau.toFixed(1) : '–'}
      />
      <Stat
        label="Kalibrierung"
        value={
          status === 'calibrated'
            ? 'direkt'
            : status === 'reciprocal'
            ? 'reziprok'
            : 'nicht kal.'
        }
        warn={status !== 'calibrated'}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-md border border-ink-100 dark:border-ink-600 bg-white dark:bg-ink-800/60 px-3 py-2.5 shadow-panel">
      <div className="text-[10px] uppercase tracking-wide text-ink-400 dark:text-ink-200/70 font-medium">
        {label}
      </div>
      <div
        className={
          'text-sm font-mono tabular-nums mt-0.5 ' +
          (warn ? 'text-warn dark:text-amber-400' : 'text-ink-800 dark:text-ink-100')
        }
      >
        {value}
      </div>
    </div>
  );
}

function Caveats() {
  return (
    <aside
      className="text-xs leading-relaxed text-ink-400 dark:text-ink-200/70 border-l-2 border-paper-200 dark:border-ink-600 pl-4 py-1"
      data-testid="caveats"
    >
      <p>
        Hinweis: Die empirischen Konstanten sind kalibriert für Vimentin/Desmin (ℓ<sub>p</sub> ≈ 1
        µm) und Keratin-ähnliche Filamente (ℓ<sub>p</sub> ≈ 0,3 µm). Die Längenformel entspricht
        SI Gl. C4 / Manuskript Gl. 9 (sublineares Wachstum mit t<sup>η</sup>, η = 0,89). Das
        SLS-Surrogat folgt Manuskript Gl. 11–12. Aussagekraft primär in der ersten Stunde, das
        SLS-Verhältnis ist informativ bis etwa 6–7 ULF.
      </p>
    </aside>
  );
}

function Footer() {
  return (
    <footer className="mt-16 pt-6 border-t border-paper-200 dark:border-ink-600 text-[11px] text-ink-400 dark:text-ink-200/70 flex flex-wrap items-center justify-between gap-2">
      <span>
        Quelle: L. Schween, H. Herrmann, N. Mücke, B. Fabry, S. Portet (2026), Suppl. Anhang C.
      </span>
      <span className="font-mono">v0.1 · static React/Vite/Tailwind</span>
    </footer>
  );
}
