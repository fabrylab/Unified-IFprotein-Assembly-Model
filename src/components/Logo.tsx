export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-label="IF Assembly Logo"
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="1" width="38" height="38" rx="8" stroke="currentColor" strokeWidth="1.5" />
      {/* Stylisierte Filament-Kette: drei verbundene Knoten */}
      <circle cx="11" cy="20" r="3" fill="currentColor" />
      <circle cx="20" cy="20" r="3" fill="currentColor" />
      <circle cx="29" cy="20" r="3" fill="currentColor" />
      <path
        d="M14 20 H17 M23 20 H26"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Wellige Linie unten = Lichtstreuung */}
      <path
        d="M8 30 Q 14 26, 20 30 T 32 30"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}
