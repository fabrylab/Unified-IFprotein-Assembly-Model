import {fitSls} from "./fitting.js";

// React is supplied by the existing production bundle. This readable module
// replaces the old upload panel without rebuilding third-party dependencies.
export function createFittingPanel(React, {parseCsv, fitLengths, calibrations}) {
  const h = React.createElement;
  const number = value => Number.isFinite(value) ? value.toPrecision(6) : "—";
  const buttonClass = "text-xs font-medium px-3 py-1.5 rounded-md border border-ink-100 dark:border-ink-600";
  const sample = "time_s,sls_ratio\n" + [0,5,15,30,60,120,180,300,600]
    .map(t => `${t},${1 + .42 * -Math.expm1(-t / 60)}`).join("\n");
  return function FittingPanel({state, setState}) {
    const [file, setFile] = React.useState(null);
    const [error, setError] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const input = React.useRef(null);
    const request = React.useRef(0);
    const parsed = React.useMemo(() => file ? parseCsv(file.text) : null, [file]);
    // Derive results from data + settings. No stored fit can outlive its inputs.
    const results = React.useMemo(() => {
      if (!parsed) return null;
      const settings = {c0: state.c0, lp: state.lp, w1: state.w1, w2: state.w2, f: state.f};
      const sls = parsed.observations.filter(o => o.kind === "sls");
      const lengths = parsed.observations.filter(o => o.kind !== "sls");
      return {
        sls: sls.length ? fitSls(sls, settings, calibrations) : null,
        length: lengths.length ? fitLengths(lengths, settings) : null
      };
    }, [parsed, state.c0, state.lp, state.w1, state.w2, state.f]);
    async function upload(event) {
      const selected = event.target.files?.[0];
      if (!selected) return;
      const id = ++request.current;
      setFile(null); setError(null); setLoading(true);
      try {
        const text = await selected.text();
        if (request.current === id) setFile({name: selected.name, text});
      } catch (e) {
        if (request.current === id) setError(`Could not read file: ${e.message}`);
      } finally {
        if (request.current === id) setLoading(false);
      }
    }
    function loadSample() {
      ++request.current; setLoading(false); setError(null);
      setFile({name: "Eq. 12 sample (594/405 nm, τ = 60 s)", text: sample});
    }
    function clear() {
      ++request.current; setFile(null); setError(null); setLoading(false);
      if (input.current) input.current.value = "";
    }
    function table(headers, rows, testId) {
      return h("div", {className: "overflow-x-auto"},
        h("table", {className: "w-full text-xs", "data-testid": testId},
          h("thead", null, h("tr", null, ...headers.map(v => h("th", {key:v, className:"p-2 text-left"}, v)))),
          h("tbody", null, ...rows.map((row, i) => h("tr", {key:i},
            ...row.map((v,j) => h("td", {key:j, className:"p-2 font-mono"}, String(v))))))));
    }
    const sls = results?.sls, length = results?.length;
    return h("section", {className:"rounded-lg border border-ink-100 dark:border-ink-600 bg-white dark:bg-ink-800/60 p-5 shadow-panel space-y-4", "data-testid":"estimate-k0"},
      h("h3", {className:"text-sm font-semibold"}, "Estimate k₀ from data"),
      h("p", {className:"text-xs"}, "SLS: fit the raw plateau → estimate f → divide the whole ratio by f → refit Eq. (12) for τ with the reference plateau fixed → calculate k₀ using Eq. (13). Results automatically update when settings change."),
      h("div", {className:"flex items-center gap-2 flex-wrap"},
        h("input", {ref:input, type:"file", accept:".csv,text/csv,text/plain", onChange:upload,
          "aria-label":"Upload CSV", "data-testid":"input-csv-upload", className:"text-xs"}),
        h("button", {className:buttonClass, onClick:loadSample, "data-testid":"button-load-sample"}, "Load sample"),
        file && h("button", {className:buttonClass, onClick:clear}, "clear")),
      file && h("p", {className:"text-xs"}, file.name),
      h("details", {className:"text-xs"},
        h("summary", {className:"cursor-pointer"}, "Accepted columns & fitting convention"),
        h("p", null, "Time: time_s, time_min, t, t_s, t_min. SLS: sls_ratio, r, ratio. Length: mean_ulf, mean_nm, mean_um, median_ulf, median_nm, median_um. Lengths are converted by ULF = (nm − 60)/43 + 1. Supply precomputed length summaries, not individual filament distributions."),
        h("p", null, "Both SLS fits use ordinary least squares. First fit: baseline 1, free plateau and τ. f = raw fitted plateau / reference plateau. Second fit: divide the entire measured ratio by f, then fit τ with baseline 1 and the reference plateau fixed. The manual prediction f slider is not used to estimate f."),
        h("p", null, "Reversed wavelength pairs are inverted to the calibrated orientation before fitting. If length and SLS columns coexist, independent estimates are shown instead of merging the two measurements into one fit."),
        h("pre", {className:"overflow-x-auto"}, sample)),
      loading && h("p", {role:"status"}, "Reading CSV…"),
      error && h("p", {role:"alert"}, error),
      parsed?.problems.length > 0 && h("ul", {className:"text-xs"}, ...parsed.problems.map((p,i) => h("li", {key:i}, p.message))),
      sls && !sls.ok && h("p", {role:"alert", "data-testid":"sls-error"}, sls.message),
      sls?.ok && h("div", {className:"space-y-3", "data-testid":"sls-result"},
        h("h4", {className:"text-sm font-semibold"}, "Two-stage SLS result"),
        table(["Stage", "Parameter", "Estimate"], [
          ["First fit", "Unscaled plateau", number(sls.pUnscaled)],
          ["First fit", "Provisional τ [s]", number(sls.firstTau)],
          ["Calibration", "f = p_unscaled / p_reference", number(sls.f)],
          ["Calibration", "Multiplier 1/f", number(1/sls.f)],
          ["Second fit", "Fixed reference plateau", number(sls.pReference)],
          ["Second fit", "τ [s]", number(sls.tau)],
          ["Eq. (13)", "k₀", number(sls.k0)],
          ["Second fit", "Corrected-ratio RMSE", number(sls.rmse)],
          ["Input", "Points used", sls.used]
        ], "sls-summary"),
        sls.reciprocal && h("p", {className:"text-xs"}, "Results and f refer to the inverted, calibrated wavelength orientation."),
        ...sls.warnings.map((w,i) => h("p", {key:i, role:"status", className:"text-xs"}, w)),
        h("button", {className:buttonClass, "data-testid":"apply-sls", onClick:() => setState({
          k0:sls.k0, f:sls.reciprocal ? 1/sls.f : sls.f
        })}, "Apply SLS k₀ and f to predictions"),
        table(["Time [s]", "Raw ratio*", "Rescaled ratio*", "Eq. (12)", "Residual"], sls.predictions.slice(0,30)
          .map(o => [number(o.t), number(o.raw), number(o.value), number(o.predicted), number(o.residual)]), "sls-residuals"),
        h("p", {className:"text-xs"}, "*Calibrated wavelength orientation. Showing up to 30 rows. Residual = fitted − rescaled ratio.")),
      length && h("div", {className:"space-y-2", "data-testid":"length-result"},
        h("h4", {className:"text-sm font-semibold"}, "Independent microscopy estimate"),
        length.ok ? h(React.Fragment, null,
          h("p", {className:"text-xs"}, `k₀ = ${number(length.k0)}; relative RMS residual = ${number(length.nrmse)}; ${length.used} points.`),
          h("button", {className:buttonClass, onClick:() => setState({k0:length.k0})}, "Apply microscopy k₀"))
          : h("p", {role:"alert"}, length.message)),
      h("p", {className:"text-xs"}, `Current settings: c₀ = ${state.c0} g/L; persistence length ${state.lp} µm; ${state.w1}/${state.w2} nm. The manuscript validity range is the first 30 minutes.`));
  };
}
