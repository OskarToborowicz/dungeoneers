import type { ReactNode } from "react";

export function body(): ReactNode {
  return (
    <>
      <path d="M20 22 L12 4 L14 4 L22 20 Z" />
      <path d="M14 12 L6 10 L8 8 L16 10 Z" />
      <path d="M44 22 L52 4 L54 4 L46 20 Z" />
      <path d="M50 12 L58 10 L56 8 L48 10 Z" />
      <path d="M18 28 C18 14 46 14 46 28 L46 30 L18 30 Z" />
      <ellipse cx="32" cy="24" rx="9" ry="10" />
      <path d="M20 32 L44 32 L46 62 L18 62 Z" />
      <path d="M18 62 L8 94 L56 94 L46 62 Z" />
      <path d="M20 36 L8 54 L14 58 L24 40 Z" />
      <path d="M44 36 L54 52 L50 56 L40 40 Z" />
    </>
  );
}

export function weapon(_color: string): ReactNode {
  return (
    <>
      <rect x="54" y="2" width="4" height="56" rx="2" />
      <path d="M56 4 C48 -4 48 -14 56 -12 C64 -14 64 -4 56 4 Z" />
    </>
  );
}

export function uniqueWeapon(color: string): ReactNode {
  return (
    <>
      <rect x="54" y="2" width="4" height="56" rx="2" />
      <path d="M56 4 C46 -6 46 -18 56 -14 C66 -18 66 -6 56 4 Z" />
      <path d="M54 6 C46 0 44 -8 50 -8 C54 -2 54 2 54 6 Z" />
      <path d="M58 6 C66 0 68 -8 62 -8 C58 -2 58 2 58 6 Z" />
      <path d="M56 0 C52 -6 52 -12 56 -10 C60 -12 60 -6 56 0 Z" fill={color} fillOpacity="0.5" stroke="none" />
    </>
  );
}
