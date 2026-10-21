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
   fitting both plateau and the final `tau`.
5. Calculate `k0 = (alpha * tau_reference / tau)^(-1/beta) * 0.1/c0`.

Time is in seconds and concentration in g/L. The free-plateau second fit reproduces the project's May 2026 empirical
fit export; fixing that plateau was an incorrect earlier implementation choice. Whole-ratio scaling changes an initial unit baseline to `1/f`;
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

## Calibration provenance (1.0 µm)

See `calibration-provenance.json`. Reference plateaus are recovered from
`p_unscaled/f` in `ResultsAnalysis_LS_with_f_May2026.csv` (August 23 project
archive). Beta comes from the corresponding wavelength-specific
`May2026_Tau_relong_geom_full_formula_1000_*.csv` files. The product
A = alpha * tau_reference is recovered as tau / (k0*c0/0.1)^beta.
For 594/405, all 13 exported rows agree to relative 2e-11; the other pairs
have one row each. These are reconstructed calibration products, not independently
recovered alpha and tau_reference. The bundle retains its tau_reference and
sets alpha=A/tau_reference, preserving exactly the recovered product.
The 0.3 µm calibration remains the previous rounded approximation; a matching
full-precision reference plateau and A were not established for it.

The recovered 594/405 reference plateau 1.41659783 rounds to the manuscript's
1.42; beta -0.873531825184124 rounds to -0.87. Its A=0.027349056195628628
agrees with the rounded manuscript product 2.13*0.0128 to 0.32%.
Empirical Eq. (12) estimates need not equal the mechanistic Figure 2 estimates.
