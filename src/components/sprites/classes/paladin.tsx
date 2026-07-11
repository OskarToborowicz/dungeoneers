import type { ReactNode } from "react";

export function body(): ReactNode {
  return (
    <>
      <rect x="18" y="2" width="28" height="28" rx="2" />
      <rect x="22" y="14" width="20" height="9" rx="1" fill="#000" stroke="currentColor" strokeWidth="0.8" />
      <path d="M10 30 L54 30 L56 64 L8 64 Z" />
      <line x1="32" y1="34" x2="32" y2="62" strokeWidth="1.5" stroke="currentColor" strokeOpacity="0.35" />
      <line x1="14" y1="46" x2="50" y2="46" strokeWidth="1.5" stroke="currentColor" strokeOpacity="0.35" />
      <rect x="8" y="64" width="20" height="30" rx="4" />
      <rect x="36" y="64" width="20" height="30" rx="4" />
      <path d="M10 32 L2 56 L10 60 L18 38 Z" />
      <path d="M0 38 L14 32 L16 58 L8 66 Z" />
      <line x1="8" y1="34" x2="8" y2="64" strokeWidth="1.2" stroke="currentColor" strokeOpacity="0.45" />
      <line x1="1" y1="48" x2="15" y2="48" strokeWidth="1.2" stroke="currentColor" strokeOpacity="0.45" />
      <path d="M54 32 L62 52 L56 56 L46 38 Z" />
    </>
  );
}

export function weapon(_color: string): ReactNode {
  return <circle cx="57" cy="54" r="7" />;
}

export function uniqueWeapon(color: string): ReactNode {
  return (
    <>
      <rect x="53" y="46" width="8" height="20" rx="2" />
      <rect x="46" y="51" width="22" height="8" rx="2" />
      <circle cx="57" cy="55" r="4" fill={color} fillOpacity="0.5" stroke="none" />
    </>
  );
}
