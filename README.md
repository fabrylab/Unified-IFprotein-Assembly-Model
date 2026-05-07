# IF Assembly · Filamentlänge & Lichtstreuung

Interaktive Web-App, die das mathematische Modell der Intermediärfilament-Assemblierung aus **Schween, Herrmann, Mücke, Fabry & Portet (2026)** in den Browser bringt.

Statisches React-/Vite-/Tailwind-Projekt. Keine Backend-Logik, kein `localStorage` – nur React-State.

## Quickstart (lokal)

```bash
cd protein-assembly-app
npm install
npm run dev        # http://127.0.0.1:5173
```

Build:

```bash
npm run build      # erzeugt ./dist
npm run preview    # statische Vorschau auf 4173
```

## Deployment

Da das Projekt vollständig **statisch** ist, kann jeder beliebige Static-Host genutzt werden.

1. **Über das Perplexity-Tool (empfohlen).** Der Eltern-Agent kann direkt
   `deploy_website(project_path="protein-assembly-app/dist", site_name="IF Assembly", entry_point="index.html")` aufrufen, sobald `npm run build` durchgelaufen ist. Liefert eine private Vorschau-URL.
2. **Eigenes Hosting.** Inhalt von `dist/` auf einen beliebigen Static-Host hochladen
   (Netlify, Vercel, GitHub Pages, S3+CloudFront, ...). Beispiel:
   ```bash
   npx serve dist            # lokaler Test
   netlify deploy --dir=dist # Netlify
   ```

`vite.config.ts` setzt `base: './'`, damit das Bundle unter beliebigen Pfaden funktioniert.

## Modellüberblick

| Größe | Formel | Quelle |
| --- | --- | --- |
| Mittlere Länge in ULF | M̄L(t) = a<sub>ℓp</sub>·((c₀·k₀)/(c̃·k̃))<sup>η</sup>·t<sup>η</sup> + 1 | SI Gl. C4 / Manuskript Gl. 9 |
| Median in ULF | m(t) = g<sub>ℓp</sub>·((c₀·k₀)/(c̃·k̃))<sup>η</sup>·t<sup>η</sup> + 1 | SI Anhang C |
| ULF → nm | L = 43·(i − 1) + 60 | SI Anhang A |
| SLS-Verhältnis | r(t) = 1 + (p − 1)·(1 − e<sup>−t/τ</sup>) | Manuskript Gl. 11 |
| Plateau / Zeitkonstante | p = (a·log₁₀(x) + b)·p̃, τ = α·x<sup>β</sup>·τ̃ | Manuskript Gl. 12 |

Konstanten c̃ = 0,1 g/L, k̃ = 1; weitere Werte in `src/model.ts`
(SI Tabellen C.1, C.2).

## Projektstruktur

```
protein-assembly-app/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── model.ts                  # alle Formeln + SI-Konstanten
    └── components/
        ├── Logo.tsx              # Inline-SVG
        ├── Controls.tsx          # Slider, Selects, log-Skala für k₀
        ├── ResultsTable.tsx      # 1 s / 1 / 3 / 5 / 10 min
        ├── Charts.tsx            # Recharts (Länge + SLS)
        └── ModelNote.tsx         # "Warum diese Konstruktion?"
```
