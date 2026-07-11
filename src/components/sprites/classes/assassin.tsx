import type { ReactNode } from "react";

export function body(): ReactNode {
  return (
    <>
      <path d="M24 28 C22 10 42 10 40 28 L38 30 L26 30 Z" />
      <ellipse cx="32" cy="23" rx="8" ry="9" />
      <path d="M24 24 L40 24 L40 30 L24 30 Z" />
      <line x1="25" y1="22" x2="30" y2="22" strokeWidth="2" stroke="currentColor" strokeOpacity="1" />
      <line x1="34" y1="22" x2="39" y2="22" strokeWidth="2" stroke="currentColor" strokeOpacity="1" />
      <path d="M26 32 L42 30 L40 62 L24 64 Z" />
      <path d="M24 56 L42 54" fill="none" strokeWidth="3" strokeLinecap="round" />
      <rect x="22" y="64" width="11" height="30" rx="3" />
      <rect x="35" y="62" width="11" height="30" rx="3" />
      <path d="M26 34 L6 50 L12 56 L30 42 Z" />
      <path d="M42 32 L56 46 L52 52 L38 38 Z" />
      <path d="M26 32 C18 28 12 34 10 40" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.7" />
    </>
  );
}

export function weapon(_color: string): ReactNode {
  return (
    <>
      <rect x="1" y="50" width="14" height="6" rx="1.5" />
      <circle cx="4"  cy="50" r="1.5" />
      <circle cx="8"  cy="50" r="1.5" />
      <circle cx="12" cy="50" r="1.5" />
      <path d="M3  50 C0  44 -4 36 -2 28 C-1 22  3 20  4 26" fill="none" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M8  50 C6  43  3 34  5 26 C6  20 10 18 11 24" fill="none" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M13 50 C12 43 11 34 13 26 C14 20 18 19 18 25" fill="none" strokeWidth="2.2" strokeLinecap="round" />
    </>
  );
}

export function uniqueWeapon(color: string): ReactNode {
  return (
    <>
      <rect x="0" y="49" width="18" height="7" rx="2" />
      <circle cx="9" cy="52" r="3" fill={color} fillOpacity="0.7" stroke="none" />
      <circle cx="3"  cy="49" r="1.5" />
      <circle cx="15" cy="49" r="1.5" />
      <path d="M2  49 C-2 41 -6 32 -3 22 C-2 16  2 14  4 20" fill="none" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M7  49 C4  40  1 30  4 20 C5  14  9 12 10 18" fill="none" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 49 C10 40  9 30 12 20 C13 14 17 13 17 19" fill="none" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 50 C15 41 15 32 18 22 C20 16 24 16 23 22" fill="none" strokeWidth="2" strokeLinecap="round" />
    </>
  );
}
