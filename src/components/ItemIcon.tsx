import type { ReactNode } from "react";
import type { Item } from "../game/types";

function iconKind(item: Item): string {
  if (item.slot === "weapon") {
    const name = item.name.toLowerCase();
    if (name.includes("axe")) return "axe";
    if (name.includes("mace")) return "mace";
    if (name.includes("staff")) return "staff";
    if (name.includes("bow")) return "bow";
    return "sword";
  }
  if (item.slot === "ring1" || item.slot === "ring2") return "ring";
  return item.slot;
}

export function ItemIcon({ item, size = 34 }: { item: Item; size?: number }) {
  const kind = iconKind(item);
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="item-icon">
      {ICONS[kind] ?? ICONS.armor}
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  sword: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="30" x2="30" y2="12" />
      <line x1="24" y1="8" x2="34" y2="18" />
      <line x1="9" y1="24" x2="16" y2="31" />
      <line x1="7" y1="33" x2="12" y2="28" />
    </g>
  ),
  axe: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="28" y1="38" x2="14" y2="8" />
      <polygon points="14,8 4,3 4,20 14,16" fill="currentColor" />
    </g>
  ),
  mace: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="24" cy="14" r="7" />
      <circle cx="24" cy="14" r="2.2" fill="currentColor" stroke="none" />
      <line x1="19" y1="19" x2="11" y2="32" />
    </g>
  ),
  staff: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="14" y1="32" x2="28" y2="8" />
      <circle cx="29" cy="7" r="3.4" />
    </g>
  ),
  bow: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14 8 C24 14 24 26 14 32" />
      <line x1="14" y1="8" x2="14" y2="32" />
    </g>
  ),
  shield: (
    <path
      d="M20 6 L31 10 V19 C31 27 26 32 20 34 C14 32 9 27 9 19 V10 Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  ),
  helm: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M10 22 C10 12 15 7 20 7 C25 7 30 12 30 22 Z" />
      <line x1="20" y1="10" x2="20" y2="22" />
      <rect x="9" y="22" width="22" height="4" />
    </g>
  ),
  armor: (
    <path
      d="M14 8 L20 11 L26 8 L30 13 L27 16 L27 32 H13 V16 L10 13 Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  ),
  gloves: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 34 V18 C14 15 17 15 17 18 V22" />
      <path d="M17 22 V15 C17 12 20 12 20 15 V22" />
      <path d="M20 22 V14 C20 11 23 11 23 14 V22" />
      <path d="M23 22 V16 C23 13 26 13 26 16 V25 C26 31 22 34 17 34 Z" />
    </g>
  ),
  boots: (
    <path
      d="M16 6 H24 V20 L30 26 C32 28 31 32 27 32 H13 C11 32 10 30 10 28 V6 Z M16 6 V20 H10"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  ),
  belt: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <rect x="7" y="16" width="26" height="8" rx="1" />
      <rect x="16" y="14" width="8" height="12" rx="1" />
    </g>
  ),
  amulet: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M13 7 L20 13 L27 7" />
      <circle cx="20" cy="24" r="8" />
      <circle cx="20" cy="24" r="3" fill="currentColor" stroke="none" />
    </g>
  ),
  ring: (
    <g fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="20" cy="23" r="9" />
      <path d="M15 15 L20 8 L25 15 Z" strokeLinejoin="round" />
    </g>
  ),
};
