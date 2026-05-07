import { useState } from 'react';

export function ModelNote() {
  const [open, setOpen] = useState(false);
  return (
    <section
      className="rounded-lg border border-ink-100 dark:border-ink-600 bg-white dark:bg-ink-800/60 shadow-panel"
      data-testid="model-note"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 text-left"
        data-testid="button-toggle-note"
      >
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="text-accent-700 dark:text-accent-400 text-xs font-mono"
            style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block', transition: 'transform 150ms' }}
          >
            ▸
          </span>
          <h3 className="text-sm font-semibold text-ink-800 dark:text-ink-100">
            Warum diese Konstruktion?
          </h3>
        </span>
        <span className="text-[11px] font-mono text-ink-400 dark:text-ink-200/70">
          Modellnotiz
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3 text-sm leading-relaxed text-ink-600 dark:text-ink-100/90">
          <p>
            Mechanistische Grundlage ist die Smoluchowski-Koagulationsgleichung für
            semiflexible Polymere, die die längsständige Aneinanderlagerung (annealing) von
            Intermediärfilamenten beschreibt. Ihre numerische Auswertung dauert typischerweise
            Stunden – ungeeignet für interaktive Schieber.
          </p>
          <p>
            Schween et al. (2026) zeigen, dass sich das mechanistische Modell durch
            <em> empirische Skalierungsgesetze </em>(SI Anhang C) sehr gut reproduzieren lässt:
            sublineares Längenwachstum mit t<sup>η</sup> (η ≈ 0,89) und ein
            saturierendes Exponentialprofil für das SLS-Verhältnis. Diese Surrogate liefern
            innerhalb von Millisekunden Werte, die die theoretischen und experimentellen Resultate
            des vollen Modells reproduzieren – ideal für ein Browser-Frontend.
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>
              Das Produkt <span className="font-mono">c₀·k₀</span> bestimmt allein die kinetische
              Geschwindigkeit (Zeit-Reskalierung mit c̃ = 0,1 g/L, k̃ = 1).
            </li>
            <li>
              <span className="font-mono">k₀</span> ist der einzige freie Fitparameter und
              verbindet quantitativ mikroskopisch gemessene Längenverteilungen mit dem
              SLS-Intensitätsverhältnis.
            </li>
            <li>
              Die Persistenzlänge <span className="font-mono">ℓ<sub>p</sub></span> ändert die
              empirischen Konstanten (a<sub>ℓp</sub>, g<sub>ℓp</sub>; SI Tab. C.1).
            </li>
            <li>
              Das Wellenlängenpaar bestimmt Plateauwert <span className="font-mono">p</span> und
              Zeitkonstante <span className="font-mono">τ</span> (SI Tab. C.2). Für unkalibrierte
              Reihenfolgen wird das reziproke Verhältnis ausgewiesen.
            </li>
          </ul>
          <div className="mt-4 rounded-md bg-paper-100/80 dark:bg-ink-900/60 border border-paper-200 dark:border-ink-600 px-4 py-3 text-xs space-y-1.5">
            <p className="font-semibold text-ink-800 dark:text-ink-100">Gültigkeitsbereich</p>
            <ul className="list-disc list-inside space-y-1 text-ink-600 dark:text-ink-100/90">
              <li>
                Validiert primär für die erste Stunde der Assemblierung. Das SLS-Surrogat ist
                vor allem bis ca. 6–7 ULF informativ.
              </li>
              <li>
                Konstanten kalibriert für die Wellenlängenpaare 594/405, 594/365, 436/365 nm.
              </li>
              <li>Konzentration in g/L; k₀ ist ein gefitteter intrinsischer Vorfaktor.</li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
