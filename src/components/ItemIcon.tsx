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

export function SlotIcon({ slot, size = 34 }: { slot: string; size?: number }) {
  const key =
    slot === "ring1" || slot === "ring2"
      ? "ring"
      : slot === "weapon"
        ? "sword"
        : slot;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="item-icon">
      {ICONS[key] ?? ICONS.armor}
    </svg>
  );
}

export function ItemIcon({ item, size = 34 }: { item: Item; size?: number }) {
  const kind = iconKind(item);
  if (kind === "fist")
    return (
      <svg width={size} height={size} viewBox="0 0 327.96268 279.40289" className="item-icon">
        <g transform="translate(-481.94648,-117.3777)">
          <path fill="currentColor" d="m 538.64744,117.66446 0.22852,2.38086 c 0.18182,1.8923 1.5228,4.78778 6.53711,14.11328 8.20178,15.2535 9.30566,17.41505 9.03515,17.68555 -0.3826,0.38262 -6.32834,-1.38631 -16.40234,-4.88086 -26.07798,-9.04614 -29.27771,-9.88685 -29.58008,-7.76758 -0.25508,1.78788 1.60865,6.3628 7.64258,18.75976 5.53431,11.3705 8.18555,17.01582 8.18555,17.42969 0,0.51417 -3.28267,-0.12621 -17.50195,-3.41211 -15.5632,-3.59647 -20.61515,-4.59847 -23.20508,-4.60547 l -1.38282,-0.004 0.19727,3.01562 c 0.25515,3.90648 1.37888,6.09843 13.23633,25.79688 l 8.78515,14.5957 c 0.82804,0.48627 1.54506,1.57728 1.72852,3.27148 0.003,0.0322 0.006,0.0635 0.01,0.0957 1.41353,0.45041 2.17962,1.2808 2.38867,2.12109 0.37612,0.43155 0.70732,1.02736 0.95117,1.80469 0.60273,1.92133 1.08271,3.87654 1.52734,5.83984 0.48904,1.1576 0.86782,2.36246 1.25,3.5586 0.63864,1.93764 1.22787,3.90604 2.05078,5.77539 0.78633,1.82876 1.8638,3.49056 2.93555,5.1582 0.0548,0.0924 0.10943,0.18486 0.16406,0.27734 0.0931,0.11133 0.18627,0.22269 0.2793,0.33399 1.22756,1.50239 2.72992,2.73747 4.07227,4.12891 1.10881,1.14931 1.22871,1.34665 2.25586,2.59179 2.0661,2.59187 3.84486,5.39104 5.59375,8.20117 0.65645,1.0295 1.29792,2.06846 1.92968,3.11328 2.00214,1.88509 3.24498,3.10541 3.34961,3.23438 12.25491,15.10443 19.74133,24.48913 23.80469,29.79688 1.39003,1.26191 2.75202,2.55208 4.07617,3.88867 1.48963,1.57717 3.09028,3.03993 4.64453,4.55078 1.16605,1.19264 2.34487,2.37107 3.5293,3.54492 0.95082,0.68733 1.92274,1.34593 2.88672,2.01563 1.01646,0.70614 1.58519,1.496 1.80078,2.23046 0.13302,0.12645 0.2646,0.2531 0.39648,0.38086 2.14137,2.07097 4.28462,4.14949 6.59375,6.03516 2.00254,1.67268 3.96315,3.39555 6.04297,4.97461 2.23402,1.79274 4.47117,3.58865 6.8125,5.24023 2.18728,1.53354 4.38318,3.05097 6.59375,4.55078 1.32172,0.91885 2.65332,1.82437 4.06446,2.60157 0.78131,0.47149 1.58721,0.89599 2.39257,1.32226 0.79936,0.21254 1.8362,0.60678 3.21485,1.15625 2.4474,0.97541 8.01949,2.86594 12.38281,4.20117 10.1878,3.11759 12.12392,4.06597 16.99805,8.33204 6.62519,5.79868 26.83441,27.30353 42.3789,45.0957 l 4.28321,4.9043 h 0.002 c 0.97475,0.52089 1.96172,1.01878 2.98242,1.43945 h 0.002 l 1.17382,-0.004 c 4.44356,-0.0203 8.39486,-0.86543 31.54688,-6.86914 2.697,-0.75699 5.38944,-1.53322 8.07031,-2.34961 7.70859,-2.51111 15.39968,-5.0717 23.08203,-7.66211 9.12994,-3.06627 18.1994,-6.31081 27.2461,-9.61328 6.72652,-2.48309 13.63066,-4.41971 20.30859,-7.03515 2.4683,-0.97613 4.90446,-2.02798 7.3457,-3.06836 -1.34334,-2.36234 -3.19104,-5.31136 -5.58789,-8.95508 -9.98326,-15.17686 -15.71502,-22.90085 -21.26367,-28.6582 -5.21042,-5.40646 -7.03475,-6.73017 -38.39453,-27.82813 -26.96775,-18.14313 -35.47454,-24.0328 -38.58984,-26.72461 -4.73843,-4.0942 -14.05964,-13.64433 -19.11915,-19.58789 -9.23892,-10.85322 -34.08996,-43.60631 -54.7207,-72.11914 -5.69935,-7.87682 -9.76968,-13.27637 -13.23828,-17.32422 -0.89366,0.61652 -2.40767,0.51261 -3.96289,-0.93359 -1.26395,-1.17536 -2.57604,-2.29544 -3.85156,-3.45703 -0.61666,-0.14265 -1.23158,-0.29473 -1.84375,-0.45704 -3.74541,-1.03776 -7.44739,-2.27621 -10.78711,-4.31054 -0.19468,-0.11733 -0.38745,-0.2371 -0.58008,-0.35742 -2.50925,-1.07199 -4.96643,-2.25666 -7.34766,-3.60157 -1.56856,-0.88592 -2.21146,-2.03711 -2.18164,-3.00195 -4.30213,-4.20302 -6.76456,-6.20112 -11.6914,-9.49023 -11.28373,-7.5329 -25.61186,-13.99707 -32.78516,-14.78907 -1.20797,-0.13337 -2.82236,-0.33914 -3.58594,-0.45898 z" />
        </g>
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="item-icon">
      {ICONS[kind] ?? ICONS.armor}
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  scythe: (
    <g strokeLinecap="round" strokeLinejoin="round">
      <line
        x1="30"
        y1="38"
        x2="10"
        y2="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M10 10 C14 2 34 2 32 18 C28 12 18 8 10 10 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
      />
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
      <line
        x1="20"
        y1="38"
        x2="20"
        y2="23"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      <polygon
        points="20,6 30,15 20,24 10,15"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="10"
        y1="28"
        x2="30"
        y2="28"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <line
        x1="13"
        y1="32"
        x2="27"
        y2="32"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
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
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="28" y1="38" x2="14" y2="8" />
      <polygon points="14,8 4,3 4,20 14,16" fill="currentColor" />
    </g>
  ),
  mace: (
    <g strokeLinecap="round">
      <line
        x1="9"
        y1="36"
        x2="19"
        y2="26"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      <circle
        cx="26"
        cy="15"
        r="7"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
      />
      <line
        x1="26"
        y1="8"
        x2="26"
        y2="3"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="33"
        y1="15"
        x2="38"
        y2="15"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="31"
        y1="9"
        x2="34"
        y2="5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="21"
        y1="9"
        x2="18"
        y2="5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="19"
        y1="15"
        x2="14"
        y2="15"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="21"
        y1="21"
        x2="18"
        y2="25"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="31"
        y1="21"
        x2="34"
        y2="25"
        stroke="currentColor"
        strokeWidth="2"
      />
    </g>
  ),
  staff: (
    <g strokeLinecap="round">
      <line
        x1="10"
        y1="36"
        x2="23"
        y2="15"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <circle
        cx="27"
        cy="9"
        r="6"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
      />
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
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
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
