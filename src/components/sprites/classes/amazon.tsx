import type { ReactNode } from "react";

export function body(): ReactNode {
  return (
    <>
      <path d="M31 9 C27 3 29 -5 31 -1 C31 3 31 6 31 9 Z" />
      <path d="M29 9 C24 3 26 -5 28 -1 C28 3 28 6 29 9 Z" />
      <path d="M45 9 C49 3 47 -5 45 -1 C45 3 45 6 45 9 Z" />
      <path d="M47 9 C52 3 50 -5 48 -1 C48 3 48 6 47 9 Z" />
      <ellipse cx="38" cy="12" rx="9" ry="10" />
      <rect x="28" y="9" width="20" height="6" rx="2" />
      <path d="M28 24 L48 24 L50 58 L26 58 Z" />
      <rect x="26" y="58" width="11" height="36" rx="3" />
      <rect x="37" y="58" width="11" height="36" rx="3" />
      <path d="M28 28 L10 48 L16 52 L32 34 Z" />
      <path d="M48 28 L58 46 L54 50 L42 34 Z" />
    </>
  );
}

export function weapon(_color: string): ReactNode {
  return (
    <>
      <path d="M54 20 C62 32 62 56 54 68" fill="none" strokeWidth="4" />
      <line x1="54" y1="20" x2="54" y2="68" strokeWidth="1.5" />
      <line x1="10" y1="44" x2="64" y2="44" strokeWidth="1.2" />
      <polygon points="64,44 56,39 56,49" />
    </>
  );
}

export function uniqueWeapon(_color: string): ReactNode {
  return (
    <>
      <path d="M54 22 C64 32 64 56 54 66" fill="none" strokeWidth="4" />
      <path d="M54 22 C50 14 44 12 42 16" fill="none" strokeWidth="2.8" />
      <path d="M54 66 C50 74 44 76 42 72" fill="none" strokeWidth="2.8" />
      <line x1="42" y1="16" x2="42" y2="72" strokeWidth="1.5" />
      <line x1="10" y1="44" x2="64" y2="44" strokeWidth="1.2" />
      <polygon points="64,44 56,39 56,49" />
    </>
  );
}
