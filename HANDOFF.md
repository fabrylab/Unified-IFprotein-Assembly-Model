# Project Handoff — Protein Assembly App

**Status:** Built and visually QA'd. Ready to deploy.

## Stack
Static React 18 + Vite 5 + Tailwind 3 + Recharts. No backend, no localStorage / cookies, hash-free single page.

## Where to deploy
The build output is at:

```
/home/user/workspace/protein-assembly-app/dist
```

Deploy with:

```python
deploy_website(
  project_path="/home/user/workspace/protein-assembly-app/dist",
  site_name="IF Assembly · Filamentlänge & Lichtstreuung",
  entry_point="index.html",
)
```

`vite.config.ts` sets `base: './'`, so it works under any URL prefix.

## Key files

| Path | Purpose |
| --- | --- |
| `src/model.ts` | All math + SI Table C.1/C.2 constants. Pure functions, easy to unit-test. |
| `src/App.tsx` | Layout, theme toggle, default state, summary strip, caveats, footer. |
| `src/components/Controls.tsx` | Sliders (c₀ linear, k₀ log-scale 1e-6…1e-3), persistence-length pills, dependent λ selects, advanced f-factor. |
| `src/components/ResultsTable.tsx` | Time-point table at 1 s, 1, 3, 5, 10 min — ML(ULF), length nm/µm, median ULF, SLS r. |
| `src/components/Charts.tsx` | Two Recharts line charts (length nm + SLS r) over 0–600 s. |
| `src/components/ModelNote.tsx` | Collapsible "Warum diese Konstruktion?" with caveats. |
| `src/components/Logo.tsx` | Inline SVG mark (filament-chain + scattering wave). |
| `README.md` | User-facing build/deploy instructions (German + English mix). |

## Implementation decisions

- **Static-only Vite project, not the fullstack template.** The user asked for a React/Vite/Tailwind app and "keep static-only if possible". Express + Drizzle would be dead weight here — every value is computed in the browser from closed-form expressions. Build is one HTML + one CSS + one JS bundle (≈160 kB gzip).
- **Empirical surrogates instead of full Smoluchowski.** The model code in `src/model.ts` mirrors SI Eq. C4 (length) and manuscript Eq. 11–12 (SLS) verbatim — these are explicitly described in the paper as "computationally efficient approximations" suitable for interactive UIs. A note panel ("Warum diese Konstruktion?") explains the choice in German.
- **Dependent wavelength selects.** Once the user picks λ₁, λ₂ only offers the wavelengths that form a *calibrated* pair with λ₁ for the current persistence length. This prevents "not calibrated" dead ends. If the user reverses a calibrated pair (e.g. picks 405 then 594), the app uses the canonical SI parameters and reports `r = 1/r̃` with a visible "reziprok" badge in the summary strip and a note under the selects.
- **k₀ on a log slider.** The natural range spans three decades (1e-6 to 1e-3); a linear slider would be useless. Slider position 0…100 maps to log-uniform k₀, with scientific notation in the readout.
- **Constants extracted into a single module.** `LENGTH_CONSTANTS` and `SLS_CONSTANTS` in `model.ts` mirror SI Tables C.1 and C.2 1:1 so a reviewer can audit the values in one place.
- **Clamping.** `p` is clamped to ≥ 1.001 and `τ` to > 0 (matching the task spec) so edge cases like vanishing c₀·k₀ never break the chart.
- **Visual language.** Warm paper surface (`#fbf8f2`) in light mode, near-black in dark, single teal accent (`#0f766e`) plus an amber accent for the SLS series. Inter (variable) for UI, mono with tabular nums for all numeric output. Subtle stippled background gives a lab-notebook feel without leaning into AI gradients.
- **Test IDs everywhere.** Sliders, selects, table cells, summary stat blocks, the theme toggle, the reset button and the model-note toggle all carry `data-testid` attributes so downstream automation can drive the UI.

## Sanity checks (already validated visually)
- Defaults c₀ = 0.2 g/L, k₀ = 6.3·10⁻⁵, ℓp = 1.0 µm, 594/405 nm: ML(10 min) ≈ 13.6 ULF (≈ 603 nm), r(10 min) ≈ 1.380, τ ≈ 67.3 s — matches hand-derived values from the published constants.
- Switching to ℓp = 0.3 µm raises ML(10 min) to 14.5 ULF, p slightly to 1.382 (matches SI Tab. C.2 differences).
- Reversing λ to 405 → 594: status switches to "reziprok", r(10 min) → 0.725 ≈ 1/1.380. Chart inverts to a decay curve.
- Mobile (390 px): controls stack above results, table scrolls horizontally.
- Dark mode toggles cleanly; chart axes/tooltips adapt.

## How the user deploys (for the parent agent's reply)
1. Tell them you'll publish it for them and call `deploy_website(...)` with the path above. They get a private S3 URL.
2. For self-hosting they can run `npm run build` in the project folder and upload `dist/` anywhere static (Netlify drag-and-drop, GitHub Pages, S3, ...).
