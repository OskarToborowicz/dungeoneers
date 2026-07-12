import type { ReactNode } from "react";

export function body(): ReactNode {
  return (
    <>
      {/* Head — shaved, slightly angular */}
      <ellipse cx="32" cy="18" rx="8" ry="9" />
      {/* Neck */}
      <rect x="29" y="26" width="6" height="4" rx="1" />
      {/* Robe torso — wide, flowing */}
      <path d="M20 30 C18 28 16 32 18 60 L46 60 C48 32 46 28 44 30 L32 27 Z" />
      {/* Belt sash */}
      <path d="M18 48 L46 48" fill="none" strokeWidth="3" strokeLinecap="round" />
      {/* Legs — wide robe openings */}
      <path d="M18 60 C16 70 14 82 16 94 L26 94 L28 62 Z" />
      <path d="M46 60 C48 70 50 82 48 94 L38 94 L36 62 Z" />
      {/* Left arm raised — combat stance */}
      <path d="M20 30 C10 26 4 30 6 42 C8 52 16 50 20 46" />
      {/* Right arm forward — strike pose */}
      <path d="M44 30 C54 28 60 34 58 44 C56 52 48 50 44 46" />
      {/* Wrapped hands */}
      <circle cx="6" cy="44" r="4" />
      <circle cx="58" cy="46" r="4" />
      {/* Hand wraps detail lines */}
      <line x1="3" y1="42" x2="9" y2="42" fill="none" strokeWidth="1.2" strokeOpacity="0.6" />
      <line x1="3" y1="45" x2="9" y2="45" fill="none" strokeWidth="1.2" strokeOpacity="0.6" />
      <line x1="55" y1="44" x2="61" y2="44" fill="none" strokeWidth="1.2" strokeOpacity="0.6" />
      <line x1="55" y1="47" x2="61" y2="47" fill="none" strokeWidth="1.2" strokeOpacity="0.6" />
    </>
  );
}

export function weapon(color: string): ReactNode {
  return (
    <>
      {/* Katar — punching blade mounted on right fist */}
      <path d="M58 38 C62 36 66 38 64 46 L60 50" fill="none" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M56 40 C60 34 65 32 64 40" fill={color} fillOpacity="0.3" strokeWidth="1.5" />
    </>
  );
}

export function uniqueWeapon(color: string): ReactNode {
  return (
    <>
      {/* Unique Katar — ornate, with gem and twin blades */}
      <path d="M58 36 C63 32 68 35 66 44 L61 50" fill="none" strokeWidth="3" strokeLinecap="round" />
      <path d="M60 38 C65 30 70 28 68 38" fill={color} fillOpacity="0.25" strokeWidth="1.8" />
      <path d="M62 36 C66 28 72 26 70 34" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
      <circle cx="66" cy="34" r="2.5" fill={color} fillOpacity="0.8" stroke="none" />
    </>
  );
}
