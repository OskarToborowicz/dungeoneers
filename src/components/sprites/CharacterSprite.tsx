import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { ClassId } from "../../game/types";

export type SpriteState = "idle" | "attack" | "hit" | "dead";

interface Props {
  classId: ClassId;
  size?: number;
  state?: SpriteState;
  isUnique?: boolean;
}

const CLASS_COLORS: Record<ClassId, string> = {
  barbarian: "#e04020",
  necromancer: "#aa55ee",
  sorceress: "#4488ff",
  amazon: "#44bb55",
  paladin: "#ddaa22",
};

const UNIQUE_COLOR = "#ffa040";

function getAnimate(state: SpriteState) {
  if (state === "idle") return { y: [0, -5, 0] };
  if (state === "attack") return { y: [0, -12, 5, 0] };
  if (state === "hit") return { x: [0, -10, 10, -6, 6, 0] };
  return { y: 28, opacity: 0.25 };
}

function getTransition(state: SpriteState) {
  if (state === "idle") return { duration: 2.4, repeat: Infinity, ease: "easeInOut" as const };
  if (state === "attack") return { duration: 0.4 };
  if (state === "hit") return { duration: 0.38 };
  return { duration: 0.55, ease: "easeIn" as const };
}

// Body + arms — always rendered in the class color
const BODY_AND_ARMS: Record<ClassId, ReactNode> = {
  barbarian: (
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
  ),
  necromancer: (
    <>
      <polygon points="32,0 46,28 18,28" />
      <ellipse cx="32" cy="24" rx="9" ry="10" />
      <path d="M20 32 L44 32 L46 62 L18 62 Z" />
      <path d="M18 62 L8 94 L56 94 L46 62 Z" />
      <path d="M20 38 L6 56 L12 58 L24 42 Z" />
      <ellipse cx="8" cy="58" rx="5" ry="5" />
      <path d="M44 36 L54 50 L50 54 L40 40 Z" />
    </>
  ),
  sorceress: (
    <>
      <path d="M16 8 C14 0 50 0 48 8 L52 18 C44 12 20 12 12 18 Z" />
      <ellipse cx="32" cy="19" rx="10" ry="11" />
      <path d="M22 30 L42 30 L44 58 L20 58 Z" />
      <path d="M20 58 L8 92 L56 92 L44 58 Z" />
      <path d="M22 34 L8 54 L14 56 L26 38 Z" />
      <path d="M42 34 L54 50 L50 54 L38 38 Z" />
    </>
  ),
  amazon: (
    <>
      <ellipse cx="38" cy="12" rx="9" ry="10" />
      <rect x="28" y="9" width="20" height="6" rx="2" />
      <path d="M28 24 L48 24 L50 58 L26 58 Z" />
      <rect x="26" y="58" width="11" height="36" rx="3" />
      <rect x="37" y="58" width="11" height="36" rx="3" />
      <path d="M28 28 L10 48 L16 52 L32 34 Z" />
      <path d="M48 28 L58 46 L54 50 L42 34 Z" />
    </>
  ),
  paladin: (
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
  ),
};

// Base weapon — rendered in the class color
const WEAPON_BASE: Record<ClassId, (c: string) => ReactNode> = {
  barbarian: () => (
    <>
      <path d="M2 44 Q-2 52 2 60 Q10 66 14 58 Q12 50 10 44 Z" />
      <path d="M62 44 Q66 52 62 60 Q54 66 50 58 Q52 50 54 44 Z" />
    </>
  ),
  necromancer: () => (
    <>
      <rect x="54" y="2" width="4" height="52" rx="2" />
      <ellipse cx="56" cy="10" rx="9" ry="10" />
      <ellipse cx="52" cy="8" rx="3" ry="3.5" fill="#000" stroke="none" />
      <ellipse cx="60" cy="8" rx="3" ry="3.5" fill="#000" stroke="none" />
    </>
  ),
  sorceress: (c) => (
    <>
      <line x1="56" y1="52" x2="58" y2="2" strokeWidth="3" />
      <circle cx="58" cy="2" r="8" />
      <circle cx="58" cy="2" r="5" fill={c} fillOpacity="0.45" stroke="none" />
    </>
  ),
  amazon: () => (
    <>
      <path d="M10 20 C2 32 2 56 10 68" fill="none" strokeWidth="4" />
      <line x1="10" y1="20" x2="10" y2="68" strokeWidth="1.5" />
      <line x1="10" y1="44" x2="58" y2="44" strokeWidth="1.2" />
      <polygon points="10,44 18,39 18,49" />
    </>
  ),
  paladin: () => (
    <circle cx="57" cy="54" r="7" />
  ),
};

// Unique weapon — rendered in UNIQUE_COLOR (orange-gold)
const WEAPON_UNIQUE: Record<ClassId, (c: string) => ReactNode> = {
  barbarian: () => (
    <>
      {/* Larger crescents with upper spike */}
      <path d="M2 42 Q-6 52 2 64 Q13 70 16 58 Q10 50 10 42 Z" />
      <line x1="2" y1="42" x2="-6" y2="33" strokeWidth="2.2" />
      <path d="M62 42 Q70 52 62 64 Q51 70 48 58 Q54 50 54 42 Z" />
      <line x1="62" y1="42" x2="70" y2="33" strokeWidth="2.2" />
    </>
  ),
  necromancer: () => (
    <>
      <rect x="54" y="2" width="4" height="52" rx="2" />
      {/* Skull with horns */}
      <ellipse cx="56" cy="10" rx="11" ry="12" />
      <path d="M46 4 Q40 -6 46 -10 Q51 -2 48 4" />
      <path d="M66 4 Q72 -6 66 -10 Q61 -2 64 4" />
      <ellipse cx="51" cy="9" rx="3.5" ry="4" fill="#000" stroke="none" />
      <ellipse cx="61" cy="9" rx="3.5" ry="4" fill="#000" stroke="none" />
    </>
  ),
  sorceress: (c) => (
    <>
      <line x1="56" y1="52" x2="58" y2="2" strokeWidth="3" />
      {/* Diamond crystal with radiating spikes */}
      <path d="M58 -10 L66 2 L58 14 L50 2 Z" />
      <line x1="58" y1="-14" x2="58" y2="-10" strokeWidth="2.2" />
      <line x1="44" y1="2" x2="50" y2="2" strokeWidth="2.2" />
      <line x1="66" y1="2" x2="72" y2="2" strokeWidth="2.2" />
      <line x1="49" y1="-8" x2="52" y2="-5" strokeWidth="2" />
      <line x1="67" y1="-8" x2="64" y2="-5" strokeWidth="2" />
      <path d="M58 -4 L62 2 L58 8 L54 2 Z" fill={c} fillOpacity="0.5" stroke="none" />
    </>
  ),
  amazon: () => (
    <>
      {/* Recurve bow with decorated tips */}
      <path d="M10 22 C0 32 0 56 10 66" fill="none" strokeWidth="4" />
      <path d="M10 22 C14 14 20 12 22 16" fill="none" strokeWidth="2.8" />
      <path d="M10 66 C14 74 20 76 22 72" fill="none" strokeWidth="2.8" />
      <line x1="22" y1="16" x2="22" y2="72" strokeWidth="1.5" />
      <line x1="10" y1="44" x2="58" y2="44" strokeWidth="1.2" />
      <polygon points="10,44 18,39 18,49" />
    </>
  ),
  paladin: (c) => (
    <>
      {/* Cross-shaped mace head */}
      <rect x="53" y="46" width="8" height="20" rx="2" />
      <rect x="46" y="51" width="22" height="8" rx="2" />
      <circle cx="57" cy="55" r="4" fill={c} fillOpacity="0.5" stroke="none" />
    </>
  ),
};

export function CharacterSprite({ classId, size = 64, state = "idle", isUnique = false }: Props) {
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => { setAnimKey((k) => k + 1); }, [state]);

  const classColor = CLASS_COLORS[classId];
  const weaponColor = isUnique ? UNIQUE_COLOR : classColor;
  const height = Math.round(size * 1.5);

  const sharedG = {
    fill: "#120e0a" as const,
    strokeWidth: 1.8,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };

  return (
    <svg width={size} height={height} viewBox="0 0 64 96" overflow="visible" style={{ display: "block" }}>
      <motion.g key={animKey} animate={getAnimate(state)} transition={getTransition(state)}>
        <g
          {...sharedG}
          stroke={classColor}
          style={{ filter: `drop-shadow(0 0 6px ${classColor}) drop-shadow(0 0 2px ${classColor})` }}
        >
          {BODY_AND_ARMS[classId]}
        </g>
        <g
          {...sharedG}
          stroke={weaponColor}
          style={{ filter: `drop-shadow(0 0 ${isUnique ? 8 : 6}px ${weaponColor}) drop-shadow(0 0 ${isUnique ? 3 : 2}px ${weaponColor})` }}
        >
          {isUnique ? WEAPON_UNIQUE[classId](weaponColor) : WEAPON_BASE[classId](weaponColor)}
        </g>
      </motion.g>
    </svg>
  );
}
