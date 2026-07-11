import type { ReactNode } from "react";

export function body(): ReactNode {
  return (
    <>
      <polygon points="20,26 14,0 30,22" />
      <polygon points="44,26 50,0 34,22" />
      <path d="M14 16 L50 16 L52 30 L12 30 Z" />
      <ellipse cx="32" cy="22" rx="12" ry="11" />
      <path d="M4 32 L60 32 L56 66 L8 66 Z" />
      <rect x="8" y="66" width="20" height="28" rx="4" />
      <rect x="36" y="66" width="20" height="28" rx="4" />
      <path d="M8 34 L2 54 L10 58 L16 38 Z" />
      <path d="M56 34 L62 54 L54 58 L48 38 Z" />
    </>
  );
}

export function weapon(_color: string): ReactNode {
  return (
    <>
      <line x1="14" y1="56" x2="-2" y2="18" strokeWidth="4.5" strokeLinecap="round" />
      <ellipse cx="14" cy="57" rx="4" ry="3" />
      <g transform="rotate(-23, -2, 18)">
        <path d="M-2 12 L-26 6 L-26 30 L-2 24 Z" />
        <line x1="-2" y1="12" x2="-2" y2="24" strokeWidth="2" />
      </g>
      <line x1="50" y1="56" x2="66" y2="18" strokeWidth="4.5" strokeLinecap="round" />
      <ellipse cx="50" cy="57" rx="4" ry="3" />
      <g transform="rotate(23, 66, 18)">
        <path d="M66 12 L92 6 L92 30 L66 24 Z" />
        <line x1="66" y1="12" x2="66" y2="24" strokeWidth="2" />
      </g>
    </>
  );
}

export function uniqueWeapon(color: string): ReactNode {
  return (
    <>
      <line x1="14" y1="56" x2="-2" y2="18" strokeWidth="4.5" strokeLinecap="round" />
      <ellipse cx="14" cy="57" rx="4" ry="3" />
      <g transform="rotate(-23, -2, 18)">
        <path d="M-2 10 L-30 4 L-30 32 L-2 26 Z" />
        <line x1="-2" y1="10" x2="-2" y2="26" strokeWidth="2" />
        <circle cx="-18" cy="18" r="3" fill={color} fillOpacity="0.6" stroke="none" />
      </g>
      <line x1="50" y1="56" x2="66" y2="18" strokeWidth="4.5" strokeLinecap="round" />
      <ellipse cx="50" cy="57" rx="4" ry="3" />
      <g transform="rotate(23, 66, 18)">
        <path d="M66 10 L94 4 L94 32 L66 26 Z" />
        <line x1="66" y1="10" x2="66" y2="26" strokeWidth="2" />
        <circle cx="82" cy="18" r="3" fill={color} fillOpacity="0.6" stroke="none" />
      </g>
    </>
  );
}
