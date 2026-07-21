import { motion, useAnimationControls } from "motion/react";
import { useEffect, useId } from "react";
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
  isUniqueWeapon?: boolean;
  isUniqueOffHand?: boolean;

  statusEffects?: Array<"poison" | "burn" | "bleed">;
  /** Idle/attack/hit/dead motion — only combat needs this in motion. */
  animated?: boolean;
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

function GlowFilterDef({
  id,
  color,
  intensity,
}: {
  id: string;
  color: string;
  intensity: number;
}) {
  // Two passes (wide soft halo + tight core) — the tight sd1 pass fills the area
  // right against the strokes so thin parts don't show gaps ("prześwity"). The
  // perf win comes from the tight 200% filter region (was 400% ≈ 16× the element
  // area) plus no longer remounting the sprite each attack/hit; the glow itself
  // is unchanged.
  return (
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
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
  offHand?: (color: string) => React.ReactNode;
  uniqueOffhand?: (color: string) => React.ReactNode;
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

/** Ranged and caster classes get knocked back by their own shot instead of
 *  hopping forward — they never close the distance. Sprites face right, so
 *  "backwards" is negative x. */
const RECOIL_ATTACK_CLASSES = new Set<ClassId>([
  "amazon",
  "sorceress",
  "necromancer",
]);

function getAnimate(state: SpriteState, scale: number, classId: ClassId) {
  if (state === "idle") return { x: 0, y: 0 };
  if (state === "attack")
    return RECOIL_ATTACK_CLASSES.has(classId)
      ? { x: [0, -8 * scale, 0] }
      : { y: [0, -12 * scale, 5 * scale, 0] };
  if (state === "hit")
    return { x: [0, -10 * scale, 10 * scale, -6 * scale, 6 * scale, 0] };
  return { y: 28 * scale, opacity: 0.25 };
}

function getTransition(state: SpriteState, classId: ClassId) {
  if (state === "idle") return { duration: 0 };
  if (state === "attack")
    return RECOIL_ATTACK_CLASSES.has(classId)
      ? // snap back fast, drift forward slowly — reads as absorbing the shot
        { duration: 0.4, times: [0, 0.18, 1], ease: "easeOut" as const }
      : { duration: 0.4 };
  if (state === "hit") return { duration: 0.38 };
  return { duration: 0.55, ease: "easeIn" as const };
}

export function CharacterSprite({
  classId,
  size = 64,
  state = "idle",
  isUniqueOffHand = false,
  isUniqueWeapon = false,
  statusEffects = [],
  animated = true,
}: Props) {
  // Replay the pose on each state change WITHOUT remounting the SVG. The old
  // `key={animKey}` remount repainted all three glow-filtered groups on every
  // attack/hit — expensive on phones. Driving motion via controls keeps the SVG
  // (and its already-painted filters) mounted and just re-runs the transform.
  const controls = useAnimationControls();
  useEffect(() => {
    controls.start(
      getAnimate(state, scale, classId),
      getTransition(state, classId),
    );
    // scale is stable per mount; state is the real trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  const uid = useId();
  const bodyGlowId = `${uid}-body-glow`;
  const weaponGlowId = `${uid}-weapon-glow`;
  const offhandGlowId = `${uid}-offhand-glow`;
  const classColor = CLASS_COLORS[classId];
  const weaponColor = isUniqueWeapon ? UNIQUE_COLOR : classColor;
  const offhandColor = isUniqueOffHand ? UNIQUE_COLOR : classColor;
  const height = Math.round(size * 1.5);
  const scale = size / 64;
  const sprite = CLASS_SPRITES[classId];
  const glowIntensity = CLASS_GLOW_INTENSITY[classId];
  const sharedG = {
    fill: "#120e0a" as const,
    strokeWidth: 1.8,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };

  const svg = (
    <svg
      width={size}
      height={height}
      viewBox="0 0 64 96"
      overflow="visible"
      style={{ display: "block" }}
    >
      <defs>
        <GlowFilterDef
          id={bodyGlowId}
          color={classColor}
          intensity={glowIntensity}
        />
        <GlowFilterDef
          id={weaponGlowId}
          color={weaponColor}
          intensity={glowIntensity}
        />
        <GlowFilterDef
          id={offhandGlowId}
          color={offhandColor}
          intensity={glowIntensity}
        />
      </defs>
      <g {...sharedG} stroke={classColor} filter={`url(#${bodyGlowId})`}>
        {sprite.body()}
      </g>

      <g {...sharedG} stroke={offhandColor} filter={`url(#${offhandGlowId})`}>
        {isUniqueOffHand
          ? (sprite.uniqueOffhand?.(offhandColor) ??
            sprite.offHand?.(offhandColor))
          : sprite.offHand?.(offhandColor)}
      </g>
      <g {...sharedG} stroke={weaponColor} filter={`url(#${weaponGlowId})`}>
        {isUniqueWeapon
          ? sprite.uniqueWeapon(weaponColor)
          : sprite.weapon(weaponColor)}
      </g>
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
      {animated && statusEffects.includes("poison") && (
        <>
          <circle cx="20" cy="55" r="2.5" className="poisoned" />
          <circle cx="34" cy="48" r="2" className="poisoned delay1" />
          <circle cx="44" cy="58" r="3" className="poisoned delay2" />
        </>
      )}
      {statusEffects.includes("bleed") && (
        <g className="bleed bleeding">
          <ellipse className="blood-drop drop-1" cx="30" cy="60" rx="1.5" ry="2" />
          <ellipse className="blood-drop drop-2" cx="34" cy="62" rx="1.4" ry="1.8" />
          <ellipse className="blood-drop drop-3" cx="28" cy="64" rx="1.2" ry="1.6" />
        </g>
      )}
    </svg>
  );

  if (!animated) {
    // Static pose only — e.g. the Hub sidebar and character select list
    // shouldn't idle-bob forever, but a dead sprite should still read as
    // fallen/faded rather than snapping back to a normal standing pose.
    const staticStyle =
      state === "dead"
        ? {
            display: "inline-block" as const,
            transform: `translateY(${28 * scale}px)`,
            opacity: 0.25,
          }
        : { display: "inline-block" as const };
    return <div style={staticStyle}>{svg}</div>;
  }

  return (
    <motion.div animate={controls} style={{ display: "inline-block" }}>
      {svg}
    </motion.div>
  );
}
