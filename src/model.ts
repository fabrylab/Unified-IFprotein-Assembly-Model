// =============================================================
// Mathematisches Modell – empirische Skalierungsgesetze
// Grundlage: Schween et al. (2026), SI Anhang C, Tabellen C.1/C.2.
// =============================================================

export const C_TILDE = 0.1; // g/L
export const K_TILDE = 1; // dimensionslos

// SI Tabelle C.1 – Längenkonstanten je Persistenzlänge
export const LENGTH_CONSTANTS: Record<
  string,
  { g_lp: number; a_lp: number; eta: number; label: string }
> = {
  '1.0': { g_lp: 92.6, a_lp: 125.7, eta: 0.89, label: '1,0 µm (Vimentin / Desmin)' },
  '0.3': { g_lp: 100.0, a_lp: 134.1, eta: 0.89, label: '0,3 µm (Keratin-ähnlich)' },
};

// SI Tabelle C.2 – SLS-Konstanten je (Persistenzlänge, Wellenlängenpaar)
// Schlüssel: `${lp}|${w1}/${w2}` mit w1 > w2 (kanonische Reihenfolge).
export interface SlsParams {
  tau_tilde: number;
  p_tilde: number;
  alpha: number;
  beta: number;
  a: number;
  b: number;
}

export const SLS_CONSTANTS: Record<string, SlsParams> = {
  '1.0|594/405': { tau_tilde: 0.0128, p_tilde: 1.42, alpha: 2.13, beta: -0.87, a: 0.038, b: 1.12 },
  '1.0|594/365': { tau_tilde: 0.0125, p_tilde: 1.55, alpha: 2.73, beta: -0.85, a: 0.05, b: 1.16 },
  '1.0|436/365': { tau_tilde: 0.0088, p_tilde: 1.17, alpha: 4.95, beta: -0.8, a: 0.022, b: 1.10 },
  '0.3|594/405': { tau_tilde: 0.0122, p_tilde: 1.42, alpha: 1.86, beta: -0.89, a: 0.035, b: 1.11 },
  '0.3|594/365': { tau_tilde: 0.0120, p_tilde: 1.55, alpha: 2.42, beta: -0.86, a: 0.05, b: 1.15 },
  '0.3|436/365': { tau_tilde: 0.0085, p_tilde: 1.17, alpha: 4.66, beta: -0.8, a: 0.021, b: 1.10 },
};

export const SUPPORTED_WAVELENGTHS = [365, 405, 436, 594] as const;
export type Wavelength = (typeof SUPPORTED_WAVELENGTHS)[number];

export interface SlsLookup {
  status: 'calibrated' | 'reciprocal' | 'unsupported';
  params?: SlsParams;
  /** True, wenn die kanonische Reihenfolge umgekehrt wurde -> Anzeige als 1/r. */
  reciprocal: boolean;
  pairLabel: string;
  canonicalLabel: string;
}

/**
 * Findet die SLS-Parameter für ein Wellenlängenpaar (w1, w2).
 * Kanonische Reihenfolge laut SI: (594/405), (594/365), (436/365).
 * Für die umgekehrte Reihenfolge wird das reziproke Verhältnis verwendet.
 */
export function lookupSlsParams(lp: string, w1: number, w2: number): SlsLookup {
  const direct = `${lp}|${w1}/${w2}`;
  const reverse = `${lp}|${w2}/${w1}`;
  const pairLabel = `${w1} / ${w2} nm`;

  if (SLS_CONSTANTS[direct]) {
    return {
      status: 'calibrated',
      params: SLS_CONSTANTS[direct],
      reciprocal: false,
      pairLabel,
      canonicalLabel: `${w1} / ${w2} nm`,
    };
  }
  if (SLS_CONSTANTS[reverse]) {
    return {
      status: 'reciprocal',
      params: SLS_CONSTANTS[reverse],
      reciprocal: true,
      pairLabel,
      canonicalLabel: `${w2} / ${w1} nm`,
    };
  }
  return {
    status: 'unsupported',
    reciprocal: false,
    pairLabel,
    canonicalLabel: pairLabel,
  };
}

/** Liste der für lp kalibrierten Wellenlängenpaare (ungerichtet). */
export function calibratedPairs(lp: string): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (const key of Object.keys(SLS_CONSTANTS)) {
    if (!key.startsWith(`${lp}|`)) continue;
    const [w1, w2] = key.split('|')[1].split('/').map(Number);
    pairs.push([w1, w2]);
  }
  return pairs;
}

// -----------------------------------------------------------------
// Längenmodell (SI Gl. C4 / Manuskript Gl. 9)
// -----------------------------------------------------------------

export interface LengthInputs {
  c0: number; // g/L
  k0: number; // dimensionslos (skaliert)
  lp: '1.0' | '0.3';
}

/** Skalierungsverhältnis (c0·k0)/(c̃·k̃). */
export function rescaledRate({ c0, k0 }: { c0: number; k0: number }) {
  return (c0 * k0) / (C_TILDE * K_TILDE);
}

/** Arithmetische mittlere Filamentlänge in ULF zur Zeit t [s]. */
export function arithmeticMeanULF(inputs: LengthInputs, t: number): number {
  const { a_lp, eta } = LENGTH_CONSTANTS[inputs.lp];
  const x = rescaledRate(inputs);
  return a_lp * Math.pow(x, eta) * Math.pow(t, eta) + 1;
}

/** Geometrische / Median-Filamentlänge in ULF zur Zeit t [s]. */
export function medianULF(inputs: LengthInputs, t: number): number {
  const { g_lp, eta } = LENGTH_CONSTANTS[inputs.lp];
  const x = rescaledRate(inputs);
  return g_lp * Math.pow(x, eta) * Math.pow(t, eta) + 1;
}

/** ULF-Anzahl i in Konturlänge [nm] umrechnen (SI Anhang A). */
export function ulfToNm(i: number): number {
  return 43 * (i - 1) + 60;
}

// -----------------------------------------------------------------
// SLS-Verhältnis (Manuskript Gl. 11–12)
// -----------------------------------------------------------------

export interface SlsInputs extends LengthInputs {
  w1: number;
  w2: number;
  /** Optionaler Korrekturfaktor f (Manuskript Gl. 6). */
  f?: number;
}

export interface SlsResult {
  r: number; // angezeigtes Verhältnis (ggf. mit f skaliert / reziprok)
  rRaw: number; // unskaliertes r(t)
  p: number;
  tau: number;
  status: SlsLookup['status'];
  reciprocal: boolean;
  pairLabel: string;
  canonicalLabel: string;
}

/**
 * Berechnet das SLS-Intensitätsverhältnis r(t) gemäß
 *   r(t) = 1 + (p − 1)(1 − exp(−t/τ)),
 *   p   = (a·log10(c0·k0/c̃·k̃) + b) · p̃,
 *   τ   = α · (c0·k0/c̃·k̃)^β · τ̃.
 * p wird auf ≥ 1.001 geclamped, τ auf > 0.
 */
export function slsRatio(inputs: SlsInputs, t: number): SlsResult {
  const lookup = lookupSlsParams(inputs.lp, inputs.w1, inputs.w2);
  if (lookup.status === 'unsupported' || !lookup.params) {
    return {
      r: NaN,
      rRaw: NaN,
      p: NaN,
      tau: NaN,
      status: 'unsupported',
      reciprocal: false,
      pairLabel: lookup.pairLabel,
      canonicalLabel: lookup.canonicalLabel,
    };
  }
  const { tau_tilde, p_tilde, alpha, beta, a, b } = lookup.params;
  const x = rescaledRate(inputs);
  const logX = Math.log10(Math.max(x, 1e-12));
  let p = (a * logX + b) * p_tilde;
  if (!isFinite(p) || p < 1.001) p = 1.001;
  let tau = alpha * Math.pow(x, beta) * tau_tilde;
  if (!isFinite(tau) || tau <= 0) tau = 1e-6;

  const rRaw = 1 + (p - 1) * (1 - Math.exp(-t / tau));
  let r = rRaw;
  if (lookup.reciprocal) r = 1 / r;
  if (inputs.f !== undefined) r = inputs.f * r;

  return {
    r,
    rRaw,
    p,
    tau,
    status: lookup.status,
    reciprocal: lookup.reciprocal,
    pairLabel: lookup.pairLabel,
    canonicalLabel: lookup.canonicalLabel,
  };
}

// -----------------------------------------------------------------
// Tabellenpunkte
// -----------------------------------------------------------------

export const TIME_POINTS_S: Array<{ t: number; label: string }> = [
  { t: 1, label: '1 s' },
  { t: 60, label: '1 min' },
  { t: 180, label: '3 min' },
  { t: 300, label: '5 min' },
  { t: 600, label: '10 min' },
];
