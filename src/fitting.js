// PRL Eqs. (12)-(13). Times are seconds, concentrations are g/L.
// Calibration convention: divide the WHOLE measured ratio by f.
// Second fit: baseline = 1, plateau = reference p_tilde.
export function exponential(t, plateau, tau) {
  return 1 + (plateau - 1) * -Math.expm1(-t / tau);
}

function minimizeLogTau(objective, times) {
  const positive = times.filter(t => t > 0);
  // Do not spread measured time arrays into function arguments: original
  // millisecond SLS traces exceed JavaScript engines' argument-count limits.
  const minTime = positive.reduce((a, b) => Math.min(a, b), Infinity);
  const maxTime = positive.reduce((a, b) => Math.max(a, b), -Infinity);
  const lo = Math.log(Math.max(minTime * 1e-5, 1e-9));
  const hi = Math.log(maxTime * 1e5);
  const n = 240;
  let best = 0, score = Infinity;
  for (let i = 0; i <= n; i++) {
    const value = objective(Math.exp(lo + (hi - lo) * i / n));
    if (value < score) { score = value; best = i; }
  }
  let a = lo + (hi - lo) * Math.max(0, best - 1) / n;
  let b = lo + (hi - lo) * Math.min(n, best + 1) / n;
  const golden = (Math.sqrt(5) - 1) / 2;
  let c = b - golden * (b - a), d = a + golden * (b - a);
  let fc = objective(Math.exp(c)), fd = objective(Math.exp(d));
  for (let i = 0; i < 100 && b - a > 1e-11; i++) {
    if (fc < fd) {
      b = d; d = c; fd = fc; c = b - golden * (b - a);
      fc = objective(Math.exp(c));
    } else {
      a = c; c = d; fc = fd; d = a + golden * (b - a);
      fd = objective(Math.exp(d));
    }
  }
  return {tau: Math.exp((a + b) / 2), boundary: best === 0 || best === n};
}

export function fitSls(observations, settings, calibrations) {
  try {
    const {c0, lp, w1, w2} = settings;
    if (!(c0 > 0) || !Number.isFinite(c0)) throw Error("Concentration must be positive.");
    const direct = calibrations[`${lp}|${w1}/${w2}`];
    const calibration = direct || calibrations[`${lp}|${w2}/${w1}`];
    if (!calibration) throw Error("Choose a calibrated wavelength pair.");
    const reciprocal = !direct;
    if (observations.some(o => !Number.isFinite(o.value) || o.value <= 0 ||
        !Number.isFinite(o.t) || o.t < 0)) {
      throw Error("SLS ratios must be positive and times must be non-negative.");
    }
    const data = observations.map(o => ({t: o.t, raw: reciprocal ? 1 / o.value : o.value}));
    if (data.length < 4 || new Set(data.filter(o => o.t > 0).map(o => o.t)).size < 3) {
      throw Error("At least four SLS points and three distinct positive times are required.");
    }
    const times = data.map(o => o.t);
    const maxTime = times.reduce((a, b) => Math.max(a, b), -Infinity);
    // Profile out the amplitude analytically: ordinary least squares,
    // baseline fixed at 1, plateau and provisional tau free.
    function firstAt(tau) {
      let numerator = 0, denominator = 0;
      for (const o of data) {
        const q = -Math.expm1(-o.t / tau);
        numerator += q * (o.raw - 1); denominator += q * q;
      }
      const amplitude = Math.max(0, numerator / denominator);
      const plateau = 1 + amplitude;
      const sse = data.reduce((sum, o) =>
        sum + (exponential(o.t, plateau, tau) - o.raw) ** 2, 0);
      return {plateau, sse};
    }
    const first = minimizeLogTau(tau => firstAt(tau).sse, times);
    const {plateau: pUnscaled} = firstAt(first.tau);
    if (pUnscaled - 1 < 1e-8) throw Error("No resolvable rising SLS signal; tau is not identifiable.");
    if (first.boundary) throw Error("The first fit cannot resolve a finite plateau/tau within the search range.");
    const {p_tilde: pReference, alpha, beta, tau_tilde: tauReference} = calibration;
    const f = pUnscaled / pReference;
    const corrected = data.map(o => ({...o, value: o.raw / f}));
    const second = minimizeLogTau(tau => corrected.reduce((sum, o) =>
      sum + (exponential(o.t, pReference, tau) - o.value) ** 2, 0), times);
    if (second.boundary) throw Error("The second fit cannot resolve tau within the search range.");
    const tau = second.tau;
    const k0 = (alpha * tauReference / tau) ** (-1 / beta) * 0.1 / c0;
    if (!(k0 > 0) || !Number.isFinite(k0)) throw Error("The fit did not produce a finite positive k0.");
    const predictions = corrected.map(o => ({
      ...o, predicted: exponential(o.t, pReference, tau),
      residual: exponential(o.t, pReference, tau) - o.value
    }));
    const rmse = Math.sqrt(predictions.reduce((s, o) => s + o.residual ** 2, 0) / data.length);
    const warnings = [];
    if (maxTime < 3 * first.tau) warnings.push(
      "The data do not span three first-fit time constants. The plateau and f may be poorly constrained.");
    if (Math.abs(f - 1) > 0.001) warnings.push(
      "Whole-ratio calibration changes a unit baseline to 1/f. The second fit keeps baseline 1 as in Eq. (12); inspect the residuals.");
    if (maxTime > 1800) warnings.push("Some data exceed the manuscript's first-30-minute validity range.");
    if (k0 < 1e-6 || k0 > 1e-3) warnings.push("The estimate is outside the prediction slider's displayed range.");
    return {ok: true, k0, tau, f, pUnscaled, pReference, firstTau: first.tau,
      reciprocal, rmse, predictions, warnings, used: data.length};
  } catch (error) {
    return {ok: false, message: error.message};
  }
}
