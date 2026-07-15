import { motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import type { ClassId } from "../../game/types";
import * as barbarian from "./classes/barbarian";
import * as necromancer from "./classes/necromancer";
import * as sorceress from "./classes/sorceress";
import * as amazon from "./classes/amazon";
import * as paladin from "./classes/paladin";
import * as assassin from "./classes/assassin";
import * as druid from "./classes/druid";
import * as monk from "./classes/monk";

export type SpriteState = "idle" | "attack" | "hit" | "dead";

interface Props {
  classId: ClassId;
  size?: number;
  state?: SpriteState;
  isUnique?: boolean;
  statusEffects?: Array<"poison" | "burn">;
}

export const CLASS_COLORS: Record<ClassId, string> = {
  barbarian: "#e04020",
  necromancer: "#aa55ee",
  sorceress: "#5da4f5",
  amazon: "#44bb55",
  paladin: "#ddaa22",
  druid: "#88aa22",
  assassin: "#33aacc",
  monk: "#54E396",
};

const UNIQUE_COLOR = "#ffa040";

const CLASS_GLOW_INTENSITY: Record<ClassId, number> = {
  barbarian: 1,
  necromancer: 1,
  sorceress: 1,
  amazon: 1,
  paladin: 1,
  druid: 1,
  assassin: 1,
  monk: 1,
};

const CLASS_WEAPON_GLOW_INTENSITY: Record<ClassId, number> = {
  barbarian: 1,
  necromancer: 1,
  sorceress: 3,
  amazon: 1,
  paladin: 1,
  druid: 1,
  assassin: 1,
  monk: 1,
};

function GlowFilterDef({
  id,
  color,
  intensity,
}: {
  id: string;
  color: string;
  intensity: number;
}) {
  return (
    <filter id={id} x="-150%" y="-150%" width="400%" height="400%">
      <feDropShadow
        dx="0"
        dy="0"
        stdDeviation={3 * intensity}
        floodColor={color}
        floodOpacity="1"
      />
      <feDropShadow
        dx="0"
        dy="0"
        stdDeviation={1 * intensity}
        floodColor={color}
        floodOpacity="1"
      />
    </filter>
  );
}

type ClassSpriteModule = {
  body: () => React.ReactNode;
  weapon: (color: string) => React.ReactNode;
  uniqueWeapon: (color: string) => React.ReactNode;
  offHand?: () => React.ReactNode;
};

const CLASS_SPRITES: Record<ClassId, ClassSpriteModule> = {
  barbarian,
  necromancer,
  sorceress,
  amazon,
  paladin,
  assassin,
  druid,
  monk,
};

function getAnimate(state: SpriteState) {
  if (state === "idle") return { y: [0, -5, 0] };
  if (state === "attack") return { y: [0, -12, 5, 0] };
  if (state === "hit") return { x: [0, -10, 10, -6, 6, 0] };
  return { y: 28, opacity: 0.25 };
}

function getTransition(state: SpriteState) {
  if (state === "idle")
    return { duration: 2.4, repeat: Infinity, ease: "easeInOut" as const };
  if (state === "attack") return { duration: 0.4 };
  if (state === "hit") return { duration: 0.38 };
  return { duration: 0.55, ease: "easeIn" as const };
}

export function CharacterSprite({
  classId,
  size = 64,
  state = "idle",
  isUnique = false,
  statusEffects = [],
}: Props) {
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [state]);
  const uid = useId();
  const bodyGlowId = `${uid}-body-glow`;
  const weaponGlowId = `${uid}-weapon-glow`;

  const classColor = CLASS_COLORS[classId];
  const weaponColor = isUnique ? UNIQUE_COLOR : classColor;
  const height = Math.round(size * 1.5);
  const sprite = CLASS_SPRITES[classId];
  const glowIntensity = CLASS_GLOW_INTENSITY[classId];
  const weaponGlowIntensity = CLASS_WEAPON_GLOW_INTENSITY[classId];
  const sharedG = {
    fill: "#120e0a" as const,
    strokeWidth: 1.8,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 64 96"
      overflow="visible"
      style={{ display: "block" }}
    >
      <defs>
        <GlowFilterDef id={bodyGlowId} color={classColor} intensity={glowIntensity} />
        <GlowFilterDef id={weaponGlowId} color={weaponColor} intensity={weaponGlowIntensity} />
      </defs>
      <motion.g
        key={animKey}
        animate={getAnimate(state)}
        transition={getTransition(state)}
      >
        {statusEffects.includes("poison") && (
          <ellipse
            cx="32"
            cy="50"
            rx="28"
            ry="48"
            fill="none"
            stroke="#44cc22"
            strokeWidth="2.5"
            className="status-aura-poison"
            strokeOpacity="0.7"
          />
        )}
        {statusEffects.includes("burn") && (
          <ellipse
            cx="32"
            cy="50"
            rx="28"
            ry="48"
            fill="none"
            stroke="#ff6600"
            strokeWidth="2.5"
            className="status-aura-burn"
            strokeOpacity="0.7"
          />
        )}
        <g {...sharedG} stroke={classColor} filter={`url(#${bodyGlowId})`}>
          {sprite.body()}
        </g>
        <g {...sharedG} stroke={classColor} filter={`url(#${bodyGlowId})`}>
          {sprite.body()}
        </g>
        {sprite.offHand && (
          <g {...sharedG} stroke={classColor} filter={`url(#${bodyGlowId})`}>
            {sprite.offHand()}
          </g>
        )}
        <g {...sharedG} stroke={weaponColor} filter={`url(#${weaponGlowId})`}>
          {isUnique
            ? sprite.uniqueWeapon(weaponColor)
            : sprite.weapon(weaponColor)}
        </g>
      </motion.g>
    </svg>
  );
}
