import type { ReactNode } from "react";
import type { Item } from "../game/types";

function iconKind(item: Item): string {
  if (item.slot === "weapon") {
    if (item.weaponType) return item.weaponType;
    const name = item.name.toLowerCase();
    if (name.includes("axe")) return "axe";
    if (name.includes("scythe")) return "scythe";
    if (name.includes("mace")) return "mace";
    if (name.includes("staff")) return "staff";
    if (name.includes("bow")) return "bow";
    if (name.includes("totem")) return "totem";
    if (name.includes("claw")) return "claw";
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
  scythe: (
    <g strokeLinecap="round" strokeLinejoin="round">
      <line x1="30" y1="38" x2="10" y2="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M10 10 C14 2 34 2 32 18 C28 12 18 8 10 10 Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
    </g>
  ),
  sword: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="10" y1="34" x2="30" y2="8" />
      <line x1="12" y1="22" x2="20" y2="30" />
      <circle cx="8" cy="36" r="2.5" fill="currentColor" stroke="none" />
    </g>
  ),
  totem: (
    <g strokeLinecap="round" strokeLinejoin="round">
      <line x1="20" y1="38" x2="20" y2="23" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <polygon points="20,6 30,15 20,24 10,15" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10" y1="28" x2="30" y2="28" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="13" y1="32" x2="27" y2="32" stroke="currentColor" strokeWidth="2" fill="none" />
    </g>
  ),
  claw: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10 34 C8 26 12 14 14 5" />
      <path d="M20 37 C20 28 22 16 22 5" />
      <path d="M30 34 C32 26 32 14 28 5" />
      <line x1="8" y1="32" x2="32" y2="37" />
    </g>
  ),
  axe: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="28" y1="38" x2="14" y2="8" />
      <polygon points="14,8 4,3 4,20 14,16" fill="currentColor" />
    </g>
  ),
  mace: (
    <g strokeLinecap="round">
      <line x1="9" y1="36" x2="19" y2="26" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <circle cx="26" cy="15" r="7" fill="currentColor" stroke="currentColor" strokeWidth="1" />
      <line x1="26" y1="8" x2="26" y2="3" stroke="currentColor" strokeWidth="2" />
      <line x1="33" y1="15" x2="38" y2="15" stroke="currentColor" strokeWidth="2" />
      <line x1="31" y1="9" x2="34" y2="5" stroke="currentColor" strokeWidth="2" />
      <line x1="21" y1="9" x2="18" y2="5" stroke="currentColor" strokeWidth="2" />
      <line x1="19" y1="15" x2="14" y2="15" stroke="currentColor" strokeWidth="2" />
      <line x1="21" y1="21" x2="18" y2="25" stroke="currentColor" strokeWidth="2" />
      <line x1="31" y1="21" x2="34" y2="25" stroke="currentColor" strokeWidth="2" />
    </g>
  ),
  staff: (
    <g strokeLinecap="round">
      <line x1="10" y1="36" x2="23" y2="15" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="27" cy="9" r="6" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
    </g>
  ),
  bow: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10 3 C36 3 38 37 10 37" />
      <line x1="10" y1="3" x2="10" y2="37" strokeWidth="1" />
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
