import { useMemo } from 'react';
import {
  SUPPORTED_WAVELENGTHS,
  calibratedPairs,
  lookupSlsParams,
  LENGTH_CONSTANTS,
} from '../model';

export interface ControlState {
  c0: number;
  k0: number;
  lp: '1.0' | '0.3';
  w1: number;
  w2: number;
  f: number;
  showAdvanced: boolean;
}

interface ControlsProps {
  state: ControlState;
  setState: (next: Partial<ControlState>) => void;
}

// log-scale helper: slider 0..100 -> 1e-6..1e-3
const K0_MIN = 1e-6;
const K0_MAX = 1e-3;
function sliderToK0(v: number): number {
  const t = v / 100;
  return K0_MIN * Math.pow(K0_MAX / K0_MIN, t);
}
function k0ToSlider(k0: number): number {
  const t = Math.log(k0 / K0_MIN) / Math.log(K0_MAX / K0_MIN);
  return Math.max(0, Math.min(100, t * 100));
}

function formatScientific(v: number): string {
  if (!isFinite(v)) return '–';
  if (v === 0) return '0';
  const exp = Math.floor(Math.log10(Math.abs(v)));
  const mant = v / Math.pow(10, exp);
  return `${mant.toFixed(2)}·10${superscript(exp)}`;
}

function superscript(n: number): string {
  const map: Record<string, string> = {
    '-': '⁻',
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  };
  return String(n)
    .split('')
    .map((c) => map[c] || c)
    .join('');
}

export function Controls({ state, setState }: ControlsProps) {
  // Welche Pärchen sind kalibriert? Daraus filtern wir die Optionen für w2.
  const validW2ForW1 = useMemo(() => {
    const out = new Set<number>();
    for (const [a, b] of calibratedPairs(state.lp)) {
      if (a === state.w1) out.add(b);
      if (b === state.w1) out.add(a);
    }
    return out;
  }, [state.lp, state.w1]);

  const allW1 = useMemo(() => {
    const out = new Set<number>();
    for (const [a, b] of calibratedPairs(state.lp)) {
      out.add(a);
      out.add(b);
    }
    return out;
  }, [state.lp]);

  const lookup = lookupSlsParams(state.lp, state.w1, state.w2);

  return (
    <div className="space-y-6" data-testid="controls-panel">
      <Slider
        testId="slider-c0"
        label="Proteinkonzentration c₀"
        unit="g/L"
        value={state.c0}
        min={0.02}
        max={0.4}
        step={0.01}
        precision={2}
        onChange={(c0) => setState({ c0 })}
        helper="Anfangskonzentration des Tetramer-Pools."
      />

      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <label className="text-sm font-medium text-ink-800 dark:text-ink-100">
            Intrinsische Ratenkonstante k₀
          </label>
          <span
            className="font-mono text-xs text-accent-700 dark:text-accent-400 tabular-nums"
            data-testid="value-k0"
          >
            {formatScientific(state.k0)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={k0ToSlider(state.k0)}
          onChange={(e) => setState({ k0: sliderToK0(parseFloat(e.target.value)) })}
          data-testid="slider-k0"
        />
        <div className="flex justify-between text-[10px] mt-1 font-mono text-ink-400 dark:text-ink-200/60">
          <span>10⁻⁶</span>
          <span>10⁻⁵</span>
          <span>10⁻⁴</span>
          <span>10⁻³</span>
        </div>
        <p className="text-xs text-ink-400 dark:text-ink-200/70 mt-1.5 leading-relaxed">
          Logarithmische Skala. Das Produkt c₀·k₀ steuert die kinetische Geschwindigkeit.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-ink-800 dark:text-ink-100 block mb-1.5">
          Persistenzlänge ℓ<sub>p</sub>
        </label>
        <div className="grid grid-cols-2 gap-2" data-testid="select-lp">
          {(Object.keys(LENGTH_CONSTANTS) as Array<'1.0' | '0.3'>).map((lp) => {
            const active = state.lp === lp;
            return (
              <button
                key={lp}
                type="button"
                onClick={() => setState({ lp })}
                data-testid={`button-lp-${lp}`}
                className={
                  'rounded-md px-3 py-2 text-xs font-medium transition-colors border ' +
                  (active
                    ? 'bg-accent-700 dark:bg-accent-600 text-white border-accent-700 dark:border-accent-600'
                    : 'border-ink-100 dark:border-ink-600 text-ink-600 dark:text-ink-100 hover:bg-paper-100 dark:hover:bg-ink-800')
                }
              >
                {LENGTH_CONSTANTS[lp].label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-ink-400 dark:text-ink-200/70 mt-1.5 leading-relaxed">
          Bestimmt die empirischen Konstanten <span className="font-mono">a<sub>ℓp</sub></span>,{' '}
          <span className="font-mono">g<sub>ℓp</sub></span>, η.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <WavelengthSelect
          label="λ₁"
          value={state.w1}
          options={SUPPORTED_WAVELENGTHS.filter((w) => allW1.has(w))}
          onChange={(w1) => {
            const candidates = new Set<number>();
            for (const [a, b] of calibratedPairs(state.lp)) {
              if (a === w1) candidates.add(b);
              if (b === w1) candidates.add(a);
            }
            const w2 = candidates.has(state.w2)
              ? state.w2
              : (Array.from(candidates)[0] ?? state.w2);
            setState({ w1, w2 });
          }}
          testId="select-w1"
        />
        <WavelengthSelect
          label="λ₂"
          value={state.w2}
          options={SUPPORTED_WAVELENGTHS.filter((w) => validW2ForW1.has(w))}
          onChange={(w2) => setState({ w2 })}
          testId="select-w2"
        />
      </div>
      <div className="text-xs leading-relaxed">
        {lookup.status === 'calibrated' && (
          <span className="text-accent-700 dark:text-accent-400">
            Kalibriertes Paar (SI Tab. C.2): {lookup.canonicalLabel}.
          </span>
        )}
        {lookup.status === 'reciprocal' && (
          <span className="text-warn dark:text-amber-400">
            Reziprok berechnet aus kanonischem Paar {lookup.canonicalLabel}: r = 1/r̃.
          </span>
        )}
        {lookup.status === 'unsupported' && (
          <span className="text-warn dark:text-amber-400">
            Nicht kalibriert für ℓ<sub>p</sub> = {state.lp} µm.
          </span>
        )}
      </div>

      <div className="border-t border-ink-100 dark:border-ink-600 pt-4">
        <button
          type="button"
          onClick={() => setState({ showAdvanced: !state.showAdvanced })}
          className="text-xs font-medium text-ink-600 dark:text-ink-100 hover:text-accent-700 dark:hover:text-accent-400 inline-flex items-center gap-1.5"
          data-testid="button-toggle-advanced"
        >
          <span
            className="transition-transform inline-block"
            style={{ transform: state.showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            ▸
          </span>
          Erweitert
        </button>
        {state.showAdvanced && (
          <div className="mt-4">
            <Slider
              testId="slider-f"
              label="Korrekturfaktor f"
              unit=""
              value={state.f}
              min={0.5}
              max={2.0}
              step={0.01}
              precision={2}
              onChange={(f) => setState({ f })}
              helper="Optisch-strukturelle Skalierung (Manuskript Gl. 6). Standard f = 1,00."
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface SliderProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  precision?: number;
  onChange: (v: number) => void;
  helper?: string;
  testId?: string;
}

function Slider({
  label,
  unit,
  value,
  min,
  max,
  step,
  precision = 2,
  onChange,
  helper,
  testId,
}: SliderProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-sm font-medium text-ink-800 dark:text-ink-100">{label}</label>
        <span className="font-mono text-xs text-accent-700 dark:text-accent-400 tabular-nums">
          {value.toFixed(precision)}
          {unit && <span className="text-ink-400 dark:text-ink-200/70 ml-1">{unit}</span>}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        data-testid={testId}
      />
      <div className="flex justify-between text-[10px] mt-1 font-mono text-ink-400 dark:text-ink-200/60">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      {helper && (
        <p className="text-xs text-ink-400 dark:text-ink-200/70 mt-1.5 leading-relaxed">{helper}</p>
      )}
    </div>
  );
}

interface WavelengthSelectProps {
  label: string;
  value: number;
  options: readonly number[];
  onChange: (v: number) => void;
  testId?: string;
}

function WavelengthSelect({ label, value, options, onChange, testId }: WavelengthSelectProps) {
  return (
    <div>
      <label className="text-sm font-medium text-ink-800 dark:text-ink-100 block mb-1.5">
        {label}
      </label>
      <select
        className="w-full rounded-md border border-ink-100 dark:border-ink-600 bg-white dark:bg-ink-800 text-sm px-3 py-2 font-mono tabular-nums text-ink-800 dark:text-ink-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        data-testid={testId}
      >
        {options.map((w) => (
          <option key={w} value={w}>
            {w} nm
          </option>
        ))}
      </select>
    </div>
  );
}
