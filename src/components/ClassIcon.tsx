import type { ReactNode } from "react";
import type { ClassId } from "../game/types";

export function ClassIcon({ classId, size = 34 }: { classId: ClassId; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="class-icon">
      {ICONS[classId]}
    </svg>
  );
}

const AXE_BLADE = "M20 10 C13 8 8 12 10 17 C12 21 18 19 20 15 Z";

const ICONS: Record<ClassId, ReactNode> = {
  barbarian: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <g transform="rotate(45 20 20)">
        <line x1="20" y1="10" x2="20" y2="32" />
        <path d={AXE_BLADE} />
      </g>
      <g transform="rotate(-45 20 20)">
        <line x1="20" y1="10" x2="20" y2="32" />
        <path d={AXE_BLADE} />
      </g>
    </g>
  ),
  sorceress: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="31" x2="27" y2="10" />
      <path d="M27 10 L31 6 M27 10 L33 10 M27 10 L25 4" />
      <circle cx="27" cy="10" r="2" fill="currentColor" stroke="none" />
    </g>
  ),
  necromancer: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 18 C13 10 27 10 27 18 C27 22 25 23 25 26 L15 26 C15 23 13 22 13 18 Z" />
      <circle cx="17" cy="18" r="2" fill="currentColor" stroke="none" />
      <circle cx="23" cy="18" r="2" fill="currentColor" stroke="none" />
      <path d="M19 21 L20 23 L21 21" />
      <line x1="16" y1="27" x2="16" y2="30" />
      <line x1="20" y1="27" x2="20" y2="31" />
      <line x1="24" y1="27" x2="24" y2="30" />
    </g>
  ),
  amazon: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 10 C19 14 19 26 11 30" />
      <line x1="11" y1="10" x2="11" y2="30" />
      <line x1="8" y1="32" x2="32" y2="8" />
      <path d="M32 8 L26 9 M32 8 L31 14" />
    </g>
  ),
  paladin: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="20" cy="8" rx="6" ry="2.4" />
      <line x1="20" y1="14" x2="20" y2="33" />
      <rect x="13" y="14" width="14" height="8" rx="1" />
    </g>
  ),
  druid: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Staff */}
      <line x1="20" y1="18" x2="20" y2="33" />
      {/* Leaf */}
      <path d="M20 18 C12 12 12 4 20 6 C28 4 28 12 20 18 Z" />
      {/* Leaf vein */}
      <line x1="20" y1="18" x2="20" y2="7" />
    </g>
  ),
  assassin: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="20" cy="8" rx="6" ry="2.4" />
      <line x1="20" y1="14" x2="20" y2="33" />
      <rect x="13" y="14" width="14" height="8" rx="1" />
    </g>
  ),
};
