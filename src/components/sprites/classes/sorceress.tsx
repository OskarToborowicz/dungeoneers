import type { ReactNode } from "react";

export function body(): ReactNode {
  return (
    <>
      <path d="M16 8 C14 0 50 0 48 8 L52 18 C44 12 20 12 12 18 Z" />
      <ellipse cx="32" cy="19" rx="10" ry="11" />
      <path d="M22 30 L42 30 L44 58 L20 58 Z" />
      <path d="M20 58 L8 92 L56 92 L44 58 Z" />
      <path d="M22 34 L8 54 L14 56 L26 38 Z" />
      <path d="M42 34 L54 50 L50 54 L38 38 Z" />
    </>
  );
}

export function weapon(color: string): ReactNode {
  return (
    <>
      <line x1="56" y1="52" x2="58" y2="2" strokeWidth="3" />
      <circle cx="58" cy="2" r="8" />
      <circle cx="58" cy="2" r="5" fill={color} fillOpacity="0.45" stroke="none" />
    </>
  );
}

export function uniqueWeapon(color: string): ReactNode {
  return (
    <>
      <line x1="56" y1="52" x2="58" y2="2" strokeWidth="3" />
      <path d="M58 -10 L66 2 L58 14 L50 2 Z" />
      <line x1="58" y1="-14" x2="58" y2="-10" strokeWidth="2.2" />
      <line x1="44" y1="2" x2="50" y2="2" strokeWidth="2.2" />
      <line x1="66" y1="2" x2="72" y2="2" strokeWidth="2.2" />
      <line x1="49" y1="-8" x2="52" y2="-5" strokeWidth="2" />
      <line x1="67" y1="-8" x2="64" y2="-5" strokeWidth="2" />
      <path d="M58 -4 L62 2 L58 8 L54 2 Z" fill={color} fillOpacity="0.5" stroke="none" />
    </>
  );
}
