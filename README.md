# IF Assembly application

This repository contains the static production application. Serve its root with
any static HTTP server; `index.html` loads the existing React bundle and the
readable fitting modules in `src/`. No build or dependency installation is needed.

Run numerical regression tests with `npm test` (Node.js).

## Manuscript fitting convention

The SLS upload workflow uses ordinary least squares in two stages:

1. Fit Eq. (12), `r = 1 + (p - 1) (1 - exp(-t/tau))`, to raw ratios,
   with baseline 1 and free plateau and provisional time constant.
2. Estimate `f = p_unscaled / p_reference`.
3. Divide the **whole measured ratio** by `f`.
4. Refit Eq. (12) to these corrected ratios, holding baseline 1 and
   plateau `p_reference` fixed and fitting only the final `tau`.
5. Calculate `k0 = (alpha * tau_reference / tau)^(-1/beta) * 0.1/c0`.

Time is in seconds and concentration in g/L. The second-fit fixed plateau is
an explicit implementation choice consistent with alignment to the manuscript's
reference plateau. Whole-ratio scaling changes an initial unit baseline to `1/f`;
the UI flags this for nonunit `f`. It does not silently substitute an
amplitude-only normalization or fit a baseline offset.

Reciprocal wavelength pairs are inverted to their calibrated orientation first.
Microscopy columns give an independent estimate. The manual `f` slider controls
predictions, not automatic SLS calibration. Applying an SLS result sets both
`k0` and the prediction scale (the reciprocal scale for reversed wavelengths).

The upload panel derives results from the parsed file and current settings,
so concentration, persistence length, wavelength, or scale changes cannot leave
a stored fit from previous settings. Asynchronous file reads are guarded against
out-of-order completion.

The original React/Vite sources were not present in the repository. The existing
compiled bundle now imports `src/fitting-panel.js`; `src/fitting.js` contains the
independently testable numerical implementation. Future rebuilds from any
external original source must preserve this integration and the reference-plateau
prediction correction.
