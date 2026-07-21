import { useEffect } from "react";
import { motion } from "motion/react";
import type React from "react";
import type { ClassId } from "../game/types";
import { skillAsset } from "./skillAssets";

interface Props {
  classId: ClassId;
  onDone: () => void;
  detonation?: boolean;
  useAbility2?: boolean;
  useAttack?: boolean;
  travelDist?: number;
  // Measured sprite positions in viewBox units (see LAUNCH_ANCHOR / IMPACT_ANCHOR).
  launchX?: number;
  impactX?: number;
}

export const ATTACK_EFFECT_CLASSES = new Set<ClassId>([
  "amazon",
  "paladin",
  "barbarian",
  "druid",
]);

// Effects are authored around the player sprite at x≈32 and the monster sprite
// at x≈168 in the 200-wide viewBox. On a wide arena the overlay letterboxes into
// a narrow centre band, so those anchors no longer sit under the sprites.
// CombatScreen measures the real sprite positions and passes them as launchX /
// impactX (in viewBox units); everything is wrapped in a single transform that
// maps 32→launchX and 168→impactX, so all FX line up at any arena width. The
// defaults (32 / 168) make that transform the identity — no measurement needed.
const LAUNCH_ANCHOR = 32;
const IMPACT_ANCHOR = 168;

// Every effect below is driven by `motion` — the animation timeline lives inline
// on each element (initial/animate/transition), not in CSS keyframes. This keeps
// the whole FX self-contained and lets each element orchestrate its own delay.

export function AbilityEffect({
  classId,
  onDone,
  detonation: _detonation = false,
  useAbility2 = false,
  useAttack = false,
  travelDist = 136,
  launchX = LAUNCH_ANCHOR,
  impactX = IMPACT_ANCHOR,
}: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 1200);
    return () => clearTimeout(t);
  }, [onDone]);

  // Effects fall into three positioning modes so they land on the sprites at any
  // arena width WITHOUT bloating on wide screens:
  //  • blobs (buffs, orbs, clouds) — natural size, translated onto a sprite
  //  • projectiles — natural size, self-contained: the orb flies the measured
  //    gap between launchX and impactX
  //  • spanning line effects (whips, slashes, arrows) — scaled, so they stretch
  //    across the gap (stretching a line reads fine; a fat orb does not)
  const scale = (impactX - launchX) / (IMPACT_ANCHOR - LAUNCH_ANCHOR);
  const shiftX = launchX - scale * LAUNCH_ANCHOR;
  const shiftY = 60 - scale * 60;
  const scaleTransform = `translate(${shiftX} ${shiftY}) scale(${scale})`;
  const launchTransform = `translate(${launchX - LAUNCH_ANCHOR} 0)`;
  const impactTransform = `translate(${impactX - IMPACT_ANCHOR} 0)`;
  const impactSlashTransform = `translate(${impactX - IMPACT_ANCHOR + 100} 0)`;

  return (
    <div className="ability-effect-overlay">
      <svg
        viewBox="0 0 200 120"
        className="ability-effect-svg"
        overflow="visible"
        style={{ "--travel-dist": `${travelDist}px` } as React.CSSProperties}
      >
        {/* Blobs at the player — natural size, translated onto the sprite */}
        {classId === "barbarian" && !useAbility2 && !useAttack && (
          <g transform={launchTransform}>
            <BloodFuryFx />
          </g>
        )}
        {classId === "barbarian" && useAttack && (
          <g transform={`${impactSlashTransform} scale(1.1)`}>
            <BarbarianCleaveFx />
          </g>
        )}
        {classId === "sorceress" && useAbility2 && (
          <g transform={launchTransform}>
            <FrostShieldFx />
          </g>
        )}
        {classId === "paladin" && useAttack && (
          <g transform={impactSlashTransform}>
            <PaladinSlashFx />
          </g>
        )}
        {classId === "paladin" && useAbility2 && (
          <g transform={launchTransform}>
            <HolyLightFx />
          </g>
        )}
        {classId === "monk" && useAbility2 && (
          <g transform={launchTransform}>
            <SerenityFx />
          </g>
        )}

        {/* Blobs at the monster — natural size, translated onto the sprite */}
        {classId === "barbarian" && useAbility2 && (
          <g transform={impactTransform}>
            <WhirlwindFx />
          </g>
        )}

        {/* Orb projectiles — natural size, fly the measured gap */}
        {classId === "sorceress" && !useAbility2 && (
          <FrostBoltFx launchX={launchX} impactX={impactX} />
        )}
        {classId === "paladin" && !useAbility2 && !useAttack && (
          <HolyBoltFx launchX={launchX} impactX={impactX} />
        )}
        {classId === "necromancer" && !useAbility2 && (
          <PoisonCloudFx launchX={launchX} impactX={impactX} />
        )}

        {/* Spanning line effects — scaled to stretch across the gap */}
        <g transform={scaleTransform}>
          {classId === "necromancer" && useAbility2 && <GolemRollInFx />}
          {classId === "amazon" && useAttack && <SingleArrowFx />}
          {classId === "amazon" && !useAbility2 && !useAttack && (
            <MultishotFx />
          )}
          {classId === "amazon" && useAbility2 && <FreezingArrowFx />}
          {classId === "druid" && useAttack && <DruidWhipFx />}
          {classId === "druid" && !useAbility2 && !useAttack && <VineWhipFx />}
          {classId === "monk" && !useAbility2 && <SpinningCraneKickFx />}
          {classId === "assassin" && !useAbility2 && <EviscerateFx />}
          {classId === "assassin" && useAbility2 && <VanishFx />}
        </g>
      </svg>
    </div>
  );
}

// Projectile FX self-position: the orb is authored on the monster (x=168) and
// starts at the player's measured position (launchX − impactX offset).
interface ProjectileProps {
  launchX: number;
  impactX: number;
}

function BarbarianCleaveFx() {
  const d = "M 56 14 Q 76 60 32 106";
  // The blade draws itself from top to bottom, holds, then fades.
  const draw = {
    initial: { strokeDashoffset: 130, opacity: 0 },
    animate: { strokeDashoffset: [130, 130, 0, 0], opacity: [0, 1, 1, 0] },
    transition: {
      duration: 0.34,
      times: [0, 0.08, 0.55, 1],
      ease: "easeOut" as const,
    },
  };
  return (
    <g>
      <defs>
        <filter id="ae-barb-glow" x="-200%" y="-3%" width="500%" height="106%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" />
        </filter>
      </defs>
      {/* blurred outer smear */}
      <motion.path
        d={d}
        fill="none"
        stroke="#e04020"
        strokeWidth={9}
        strokeLinecap="round"
        filter="url(#ae-barb-glow)"
        strokeDasharray={130}
        {...draw}
      />
      {/* mid arc */}
      <motion.path
        d={d}
        fill="none"
        stroke="#ff7a3c"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={130}
        {...draw}
      />
      {/* bright leading edge sweeping down the arc */}
      <motion.path
        d={d}
        fill="none"
        stroke="#ffe6cc"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeDasharray="24 140"
        initial={{ strokeDashoffset: 0, opacity: 1 }}
        animate={{ strokeDashoffset: [0, -150, -150], opacity: [1, 0.6, 0] }}
        transition={{ duration: 0.34, times: [0, 0.65, 1], ease: "easeIn" }}
      />
    </g>
  );
}

function BloodFuryFx() {
  // Rage burst at the player: expanding rings, sound-wave arcs radiating right,
  // and a central flash.
  const ring = (delay: number, from: number, to: number) => ({
    initial: { r: from, opacity: 0 },
    animate: { r: [from, from, to], opacity: [0, 0.9, 0] },
    transition: {
      duration: 0.6,
      delay,
      times: [0, 0.15, 1],
      ease: "easeOut" as const,
    },
  });
  const wave = (delay: number) => ({
    initial: { opacity: 0, scaleX: 0.2 },
    animate: { opacity: [0, 1, 0], scaleX: [0.2, 1, 1] },
    transition: {
      duration: 0.55,
      delay,
      times: [0, 0.25, 1],
      ease: "easeOut" as const,
    },
    style: { transformOrigin: "46px 60px" } as const,
  });
  return (
    <g>
      <motion.circle
        cx="32"
        cy="60"
        fill="none"
        stroke="#cc2200"
        strokeWidth="3"
        {...ring(0, 6, 40)}
      />
      <motion.circle
        cx="32"
        cy="60"
        fill="none"
        stroke="#ff4422"
        strokeWidth="2"
        {...ring(0.08, 6, 34)}
      />
      <motion.path
        d="M 46 42 Q 60 60 46 78"
        fill="none"
        stroke="#ff5533"
        strokeWidth="2.5"
        strokeLinecap="round"
        {...wave(0.1)}
      />
      <motion.path
        d="M 54 36 Q 74 60 54 84"
        fill="none"
        stroke="#ff4422"
        strokeWidth="2"
        strokeLinecap="round"
        {...wave(0.18)}
      />
      <motion.path
        d="M 62 30 Q 88 60 62 90"
        fill="none"
        stroke="#cc2200"
        strokeWidth="1.5"
        strokeLinecap="round"
        {...wave(0.26)}
      />
      <motion.circle
        cx="32"
        cy="60"
        fill="#ff2200"
        style={{ transformOrigin: "32px 60px" }}
        initial={{ r: 2, opacity: 0 }}
        animate={{ r: [2, 16, 14, 10], opacity: [0, 0.85, 0.6, 0] }}
        transition={{
          duration: 0.5,
          times: [0, 0.25, 0.65, 1],
          ease: "easeOut",
        }}
      />
    </g>
  );
}

function WhirlwindFx() {
  // A tornado spun up by the barbarian's whirling axe: a funnel rises from the
  // ground and swirls, with the axe spinning at its crown as the source.
  const red = "#e04020";
  const cx = 168;
  return (
    // Funnel grows upward from the enemy's feet, then holds and fades.
    <motion.g
      style={{ transformOrigin: "168px 100px" }}
      initial={{ opacity: 0, scaleY: 0.15, scaleX: 0.6 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scaleY: [0.15, 1, 1, 1],
        scaleX: [0.6, 1, 1, 1.05],
      }}
      transition={{ duration: 1.05, times: [0, 0.22, 0.8, 1], ease: "easeOut" }}
    >
      {/* translucent funnel silhouette — wide at top, tapering to the tip */}
      <path
        d="M132 24 Q152 40 160 100 L176 100 Q184 44 204 24 Q168 40 132 24 Z"
        fill={red}
        opacity="0.16"
      />

      {/* swirling bands, shrinking toward the tip; the whole stack sways to
          fake the rotation of the funnel */}
      <motion.g
        style={{ transformOrigin: "168px 60px" }}
        animate={{ skewX: [-6, 6, -6] }}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <ellipse
          cx={cx}
          cy="30"
          rx="34"
          ry="7.5"
          fill="none"
          stroke={red}
          strokeWidth="3"
          opacity="0.85"
        />
        <ellipse
          cx={cx}
          cy="45"
          rx="27"
          ry="6.5"
          fill="none"
          stroke={red}
          strokeWidth="2.9"
          opacity="0.82"
        />
        <ellipse
          cx={cx}
          cy="60"
          rx="20"
          ry="5.5"
          fill="none"
          stroke={red}
          strokeWidth="2.7"
          opacity="0.8"
        />
        <ellipse
          cx={cx}
          cy="74"
          rx="14"
          ry="4.5"
          fill="none"
          stroke={red}
          strokeWidth="2.5"
          opacity="0.76"
        />
        <ellipse
          cx={cx}
          cy="87"
          rx="9"
          ry="3.5"
          fill="none"
          stroke={red}
          strokeWidth="2.2"
          opacity="0.72"
        />
        <ellipse
          cx={cx}
          cy="97"
          rx="5"
          ry="2.5"
          fill="none"
          stroke={red}
          strokeWidth="2"
          opacity="0.68"
        />
      </motion.g>

      {/* the axe spinning at the crown, kicking up the tornado. scaleX cycling
          through 0 and -1 turns it edge-on and back, so it reads as a
          horizontal whirl (rotation about the vertical axis) rather than an
          in-plane pinwheel. */}
      <motion.g
        style={{ transformOrigin: "168px 60px" }}
        animate={{ scaleX: [1, 0, -1, 0, 1] }}
        transition={{ duration: 0.34, repeat: Infinity, ease: "linear" }}
      >
        {/* shaft */}
        <line
          x1="150"
          y1="60"
          x2="186"
          y2="60"
          stroke="#7a4a24"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* twin blades */}
        <path
          d="M181 51 Q198 60 181 69 Q188 60 181 51 Z"
          fill="#cfd3d9"
          stroke="#9aa0a8"
          strokeWidth="0.8"
        />
        <path
          d="M155 51 Q138 60 155 69 Q148 60 155 51 Z"
          fill="#cfd3d9"
          stroke="#9aa0a8"
          strokeWidth="0.8"
        />
      </motion.g>
    </motion.g>
  );
}

// A stylized skull silhouette for the toxic cloud, centered on (cx, cy).
function PoisonSkull({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      {/* cranium + tapering jaw */}
      <path
        d="M-6,-3 a6,6 0 0 1 12,0 v3 a3,3 0 0 1 -2,3 l-0.6,3 h-2 l-0.8,-2 h-1.2 l-0.8,2 h-2 l-0.6,-3 a3,3 0 0 1 -2,-3 z"
        fill="#284d15"
      />
      {/* hollow eyes + nose */}
      <ellipse cx="-2.6" cy="-1.6" rx="1.9" ry="2.3" fill="#0c1706" />
      <ellipse cx="2.6" cy="-1.6" rx="1.9" ry="2.3" fill="#0c1706" />
      <path d="M0,0.4 l1.1,2 h-2.2 z" fill="#0c1706" />
    </g>
  );
}

function PoisonCloudFx({ launchX, impactX }: ProjectileProps) {
  // Poison Orb: charge → projectile with trail → impact flash → toxic skull
  // cloud → falling droplets. Orchestrated in time with `motion` delays.
  // Palette (dark → pale): #16240d #284d15 #4e8a24 #7bc23a #a9dc6e
  // Authored around the caster (x≈46) and the enemy (x=168); the two wrapper
  // groups translate those onto the measured sprite positions, and the orb
  // starts at the player (startX) and flies the full gap to the monster.
  const mx = 168;
  const my = 60;
  const startX = launchX - impactX;

  return (
    <g>
      {/* 1 — charge: an orb forms and pulses in the caster's hand */}
      <g transform={`translate(${launchX - 46} 0)`}>
        <motion.g
          style={{ transformOrigin: "46px 54px" }}
          initial={{ opacity: 0, scale: 0.2 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.2, 1, 1, 0.5] }}
          transition={{
            duration: 0.34,
            times: [0, 0.5, 0.8, 1],
            ease: "easeOut",
          }}
        >
          <circle cx="46" cy="54" r="9" fill="#284d15" opacity="0.55" />
          <circle cx="46" cy="54" r="5.5" fill="#4e8a24" />
          <circle cx="44" cy="52" r="2.2" fill="#a9dc6e" />
        </motion.g>
      </g>

      {/* monster-side: flight + impact, translated onto the enemy sprite */}
      <g transform={`translate(${impactX - mx} 0)`}>
        {/* 2 — projectile: orb flies from the player, trailing green smoke */}
        <motion.g
          initial={{ x: startX, opacity: 0 }}
          animate={{ x: [startX, startX, 0, 0], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 0.36,
            delay: 0.24,
            times: [0, 0.05, 0.85, 1],
            ease: "easeIn",
          }}
        >
          {/* fading smoke tail behind the orb */}
          <circle
            cx={mx - 30}
            cy={my - 3}
            r="6"
            fill="#4e8a24"
            opacity="0.18"
          />
          <circle
            cx={mx - 20}
            cy={my + 2}
            r="8"
            fill="#4e8a24"
            opacity="0.28"
          />
          <circle
            cx={mx - 11}
            cy={my - 1}
            r="9"
            fill="#4e8a24"
            opacity="0.42"
          />
          {/* the orb */}
          <circle cx={mx} cy={my} r="11" fill="#284d15" />
          <circle cx={mx} cy={my} r="8.5" fill="#4e8a24" />
          <circle cx={mx - 2} cy={my - 2} r="3.5" fill="#7bc23a" />
          <circle cx={mx - 3} cy={my - 3} r="1.5" fill="#a9dc6e" />
        </motion.g>

        {/* 3 — impact flash: radial spikes burst on the enemy */}
        <motion.g
          style={{ transformOrigin: "168px 60px" }}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: [0, 1, 0], scale: [0.3, 1.25, 1.7] }}
          transition={{ duration: 0.26, delay: 0.54, ease: "easeOut" }}
        >
          {([0, 45, 90, 135, 180, 225, 270, 315] as number[]).map((deg) => (
            <g key={deg} transform={`translate(168,60) rotate(${deg})`}>
              <polygon points="0,-3 26,0 0,3" fill="#7bc23a" opacity="0.85" />
            </g>
          ))}
          <circle cx="168" cy="60" r="9" fill="#eaffca" />
          <circle cx="168" cy="60" r="5" fill="#a9dc6e" />
        </motion.g>

        {/* 4 — toxic cloud billowing up, with skulls surfacing inside it */}
        <motion.g
          style={{ transformOrigin: "168px 58px" }}
          initial={{ opacity: 0, scale: 0.45 }}
          animate={{ opacity: [0, 0.9, 0.85, 0], scale: [0.45, 1, 1.06, 1.16] }}
          transition={{
            duration: 0.62,
            delay: 0.56,
            times: [0, 0.3, 0.7, 1],
            ease: "easeOut",
          }}
        >
          <circle cx="168" cy="56" r="21" fill="#4e8a24" opacity="0.8" />
          <circle cx="153" cy="48" r="14" fill="#3a6b1c" opacity="0.75" />
          <circle cx="184" cy="47" r="13" fill="#3a6b1c" opacity="0.72" />
          <circle cx="167" cy="40" r="12" fill="#6aa62f" opacity="0.7" />
          <circle cx="150" cy="62" r="12" fill="#284d15" opacity="0.7" />
          <circle cx="188" cy="62" r="11" fill="#284d15" opacity="0.68" />
          <circle cx="176" cy="66" r="9" fill="#3a6b1c" opacity="0.6" />
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0.2] }}
            transition={{ duration: 0.5, delay: 0.68, ease: "easeOut" }}
          >
            <PoisonSkull cx={166} cy={52} s={1.35} />
            <PoisonSkull cx={152} cy={54} s={0.85} />
            <PoisonSkull cx={182} cy={53} s={0.95} />
          </motion.g>
        </motion.g>

        {/* 5 — droplets rain down from the cloud and settle */}
        {[
          { x: 150, r: 2.6, d: 0.6 },
          { x: 162, r: 2, d: 0.66 },
          { x: 172, r: 3, d: 0.62 },
          { x: 184, r: 2.2, d: 0.68 },
          { x: 158, r: 1.8, d: 0.7 },
          { x: 178, r: 2.4, d: 0.64 },
        ].map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={68}
            r={p.r}
            fill="#7bc23a"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 0.85, 0], y: [0, 24] }}
            transition={{ duration: 0.45, delay: p.d, ease: "easeIn" }}
          />
        ))}
      </g>
    </g>
  );
}

function GolemRollInFx() {
  // A stone boulder rolls in from the caster toward the enemy, kicking up dust.
  const dust = (delay: number) => ({
    initial: { opacity: 0, scaleX: 0.3 },
    animate: { opacity: [0, 0.55, 0.4, 0], scaleX: [0.3, 1, 1.4, 1.9] },
    transition: {
      duration: 0.45,
      delay,
      times: [0, 0.18, 0.65, 1],
      ease: "easeOut" as const,
    },
    style: { transformBox: "fill-box", transformOrigin: "center" } as const,
  });
  return (
    <g>
      {/* Trail dust — positioned along the boulder's path, staggered delays */}
      <motion.ellipse
        cx="55"
        cy="86"
        rx="13"
        ry="4"
        fill="#b8a888"
        {...dust(0.08)}
      />
      <motion.ellipse
        cx="85"
        cy="84"
        rx="10"
        ry="3.5"
        fill="#c0b090"
        {...dust(0.25)}
      />
      <motion.ellipse
        cx="112"
        cy="83"
        rx="8"
        ry="3"
        fill="#b8a888"
        {...dust(0.41)}
      />
      {/* Spinning boulder — rolls from ~x=130 rightward while rotating, then fades */}
      <motion.g
        style={{ transformOrigin: "130px 70px" }}
        initial={{ x: -70, rotate: 0, scale: 0.3, opacity: 0 }}
        animate={{
          x: [-70, 18, 18],
          rotate: [0, 660, 720],
          scale: [0.3, 1, 0.9],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 0.85,
          times: [0, 0.78, 1],
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        <circle cx="130" cy="70" r="22" fill="#7a7060" opacity="0.92" />
        <circle cx="130" cy="70" r="14" fill="#8a8070" opacity="0.88" />
        <line
          x1="130"
          y1="48"
          x2="130"
          y2="92"
          stroke="#4a4030"
          strokeWidth="2"
          opacity="0.5"
        />
        <line
          x1="108"
          y1="70"
          x2="152"
          y2="70"
          stroke="#4a4030"
          strokeWidth="2"
          opacity="0.5"
        />
        <line
          x1="114"
          y1="54"
          x2="146"
          y2="86"
          stroke="#4a4030"
          strokeWidth="1.5"
          opacity="0.4"
        />
        <motion.circle
          cx="130"
          cy="70"
          r="6"
          fill="#aadd88"
          animate={{ opacity: [0.85, 0.3, 0.85] }}
          transition={{ duration: 0.25, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.g>
    </g>
  );
}

// Frost bolt projectile art loaded from src/assets/skills/sorceress/ability_1/.
// If the SVG is present it renders as the flying orb; otherwise a drawn shard is
// used. Aspect of the file is 230:153 — height derived so it never distorts.
const FROST_BOLT_ART = skillAsset(
  "sorceress",
  "ability_1",
  "frost_bolt_projectile",
);
const FROST_BOLT_W = 69;
const FROST_BOLT_H = (FROST_BOLT_W * 153.03) / 230;
// Optional impact art — if present it replaces the drawn flash + shards.
const FROST_BURST_ART = skillAsset(
  "sorceress",
  "ability_1",
  "frost_bolt_impact",
);
const FROST_BURST_SIZE = 96;

function FrostBoltFx({ launchX, impactX }: ProjectileProps) {
  // Icy shard flies from the caster and shatters into a frost burst on the enemy.
  const mx = 168;
  const my = 60;
  const startX = launchX - impactX;
  return (
    <g transform={`translate(${impactX - mx} 0)`}>
      {/* projectile: SVG art if authored, else a drawn shard with a pale trail.
          Fades out right as it lands, handing off to the impact burst (delay 0.4). */}
      <motion.g
        initial={{ x: startX, opacity: 0 }}
        animate={{ x: [startX, startX, 0, 0], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 0.7, times: [0, 0.05, 0.9, 1], ease: "easeIn" }}
      >
        {FROST_BOLT_ART ? (
          <image
            href={FROST_BOLT_ART}
            x={mx - FROST_BOLT_W / 2}
            y={my - FROST_BOLT_H / 2}
            width={FROST_BOLT_W}
            height={FROST_BOLT_H}
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <>
            <ellipse
              cx={mx - 14}
              cy={my}
              rx="14"
              ry="4"
              fill="#bfe9ff"
              opacity="0.4"
            />
            <polygon
              points={`${mx - 13},${my} ${mx - 2},${my - 8} ${mx + 13},${my} ${mx - 2},${my + 8}`}
              fill="#3fb6f0"
              opacity="0.95"
            />
            <circle
              cx={mx - 5}
              cy={my - 3}
              r="3.2"
              fill="white"
              opacity="0.6"
            />
          </>
        )}
      </motion.g>
      {FROST_BURST_ART ? (
        /* SVG impact art — scale up, hold, fade; a touch of rotation so a
           static "already exploded" drawing still reads as a burst */
        <motion.g
          style={{ transformOrigin: "168px 60px" }}
          initial={{ scale: 0.2, opacity: 0, rotate: -12 }}
          animate={{
            scale: [0.2, 1, 1.15],
            opacity: [0, 1, 0],
            rotate: [-12, 0, 6],
          }}
          transition={{
            duration: 0.45,
            delay: 0.66,
            times: [0, 0.35, 1],
            ease: "easeOut",
          }}
        >
          <image
            href={FROST_BURST_ART}
            x={mx - FROST_BURST_SIZE / 2}
            y={my - FROST_BURST_SIZE / 2}
            width={FROST_BURST_SIZE}
            height={FROST_BURST_SIZE}
            preserveAspectRatio="xMidYMid meet"
          />
        </motion.g>
      ) : (
        <>
          {/* impact flash */}
          <motion.circle
            cx={mx}
            cy={my}
            r="20"
            fill="#eafcff"
            style={{ transformOrigin: "168px 60px" }}
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: [0.2, 1, 1.7], opacity: [0, 0.85, 0] }}
            transition={{
              duration: 0.4,
              delay: 0.66,
              times: [0, 0.3, 1],
              ease: "easeOut",
            }}
          />
          {/* radiating ice shards */}
          {([0, 45, 90, 135, 180, 225, 270, 315] as number[]).map((deg, i) => (
            <motion.g
              key={deg}
              transform={`translate(${mx},${my}) rotate(${deg})`}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{
                duration: 0.4,
                delay: 0.66 + i * 0.012,
                ease: "easeOut",
              }}
            >
              <motion.polygon
                points="0,-3 15,0 0,3 3,0"
                fill="#8fd9ff"
                initial={{ x: 0, scale: 1 }}
                animate={{ x: [0, 32], scale: [1, 0.3] }}
                transition={{
                  duration: 0.4,
                  delay: 0.66 + i * 0.012,
                  ease: "easeOut",
                }}
              />
            </motion.g>
          ))}
        </>
      )}
    </g>
  );
}

// Amazon arrow — shaft, arrowhead and feather fletching, drawn tip-forward from
// the origin so the whole group can just translate across the arena.
function Arrow({
  y,
  color,
  scale = 1,
}: {
  y: number;
  color: string;
  scale?: number;
}) {
  // Drawn around y=0 (nock at origin, tip toward +x) so `scale` shrinks it in
  // place on its flight line without shifting off the row.
  return (
    <g transform={`translate(0 ${y}) scale(${scale})`}>
      <line
        x1="0"
        y1="0"
        x2="30"
        y2="0"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <polygon points="30,-4.5 44,0 30,4.5" fill={color} />
      {/* twin feather fletching at the nock */}
      <path d="M0 0 l-7 -5 l4 5 l-4 5 z" fill={color} opacity="0.9" />
      <path d="M6 0 l-6 -4 l3 4 l-3 4 z" fill={color} opacity="0.6" />
    </g>
  );
}

const ARROW_SCALE = 0.3;

function SingleArrowFx() {
  return (
    <motion.g
      initial={{ x: -12, opacity: 0 }}
      animate={{ x: [-12, 120, 132], opacity: [0, 1, 0] }}
      transition={{ duration: 0.42, times: [0, 0.85, 1], ease: "easeOut" }}
    >
      <Arrow y={60} color="#5fd36e" scale={ARROW_SCALE} />
    </motion.g>
  );
}

function MultishotFx() {
  // Three arrows fan out from the archer and converge on the enemy.
  const arrows = [
    { y: 66, delay: 0.1 },
    { y: 58, delay: 0.1 },
  ];
  return (
    <g>
      {arrows.map((a, i) => (
        <motion.g
          key={i}
          initial={{ x: -12, opacity: 0 }}
          animate={{ x: [-12, 118, 130], opacity: [0, 1, 0] }}
          transition={{
            duration: 0.44,
            delay: a.delay,
            times: [0, 0.82, 1],
            ease: "easeOut",
          }}
        >
          <Arrow y={a.y} color="#5fd36e" scale={ARROW_SCALE} />
        </motion.g>
      ))}
    </g>
  );
}

function FreezingArrowFx() {
  return (
    <g>
      {/* Frozen arrow flying toward the monster */}
      <motion.g
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: [-50, 34, 40], opacity: [0, 1, 0] }}
        transition={{
          duration: 0.4,
          times: [0, 0.85, 1],
          ease: [0.15, 0, 0.7, 1],
        }}
      >
        <line
          x1="28"
          y1="60"
          x2="118"
          y2="60"
          stroke="#88ddff"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <polygon points="118,55 136,60 118,65" fill="#aaeeff" />
        {/* Ice crystal ridges along the shaft */}
        <line
          x1="60"
          y1="54"
          x2="60"
          y2="66"
          stroke="#cceeff"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.8"
        />
        <line
          x1="82"
          y1="53"
          x2="82"
          y2="67"
          stroke="#cceeff"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.8"
        />
        <line
          x1="104"
          y1="55"
          x2="104"
          y2="65"
          stroke="#cceeff"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.8"
        />
        {/* Frost sparkles */}
        <circle cx="70" cy="55" r="1.8" fill="#88eeff" opacity="0.9" />
        <circle cx="93" cy="65" r="1.8" fill="#88eeff" opacity="0.9" />
        <circle cx="114" cy="54" r="1.5" fill="#bbf0ff" opacity="0.85" />
      </motion.g>
      {/* Icy explosion at impact */}
      <motion.g
        style={{ transformOrigin: "168px 60px" }}
        initial={{ scale: 0.05, opacity: 0 }}
        animate={{ scale: [0.05, 1.18, 1], opacity: [0, 1, 0] }}
        transition={{
          duration: 0.7,
          delay: 0.38,
          times: [0, 0.55, 1],
          ease: "easeOut",
        }}
      >
        <circle cx="168" cy="60" r="11" fill="#aaeeff" opacity="0.92" />
        <circle cx="168" cy="60" r="5" fill="#eef9ff" opacity="0.97" />
        <polygon points="168,40 164,53 172,53" fill="#55aacc" opacity="0.9" />
        <polygon points="188,60 175,56 175,64" fill="#55aacc" opacity="0.9" />
        <polygon points="168,80 172,67 164,67" fill="#55aacc" opacity="0.9" />
        <polygon points="148,60 161,64 161,56" fill="#55aacc" opacity="0.9" />
        <polygon points="183,45 173,56 179,49" fill="#88ccee" opacity="0.78" />
        <polygon points="183,75 179,62 173,65" fill="#88ccee" opacity="0.78" />
        <polygon points="153,75 159,65 153,62" fill="#88ccee" opacity="0.78" />
        <polygon points="153,45 159,55 153,49" fill="#88ccee" opacity="0.78" />
        <circle
          cx="168"
          cy="60"
          r="27"
          fill="none"
          stroke="#88ccee"
          strokeWidth="1.5"
          opacity="0.4"
          strokeDasharray="5 3"
        />
      </motion.g>
    </g>
  );
}

function PaladinSlashFx() {
  const d = "M36 10 L42 108";
  const draw = {
    initial: { strokeDashoffset: 100, opacity: 0 },
    animate: { strokeDashoffset: [100, 100, 0, 0], opacity: [0, 1, 1, 0] },
    transition: {
      duration: 0.26,
      times: [0, 0.1, 0.55, 1],
      ease: "easeOut" as const,
    },
  };
  return (
    <g>
      <defs>
        <filter id="ae-pal-glow" x="-200%" y="-3%" width="500%" height="106%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
      </defs>
      {/* blurred outer glow — trail smear */}
      <motion.path
        d={d}
        fill="none"
        stroke="#ddaa22"
        strokeWidth={7}
        strokeLinecap="round"
        filter="url(#ae-pal-glow)"
        strokeDasharray={100}
        {...draw}
      />
      {/* gold mid trail */}
      <motion.path
        d={d}
        fill="none"
        stroke="#ffcc44"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray={100}
        {...draw}
      />
      {/* white bright tip travelling top to bottom */}
      <motion.path
        d={d}
        fill="none"
        stroke="#ffffff"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray="20 100"
        initial={{ strokeDashoffset: 0, opacity: 1 }}
        animate={{ strokeDashoffset: [0, -120, -120], opacity: [1, 0.6, 0] }}
        transition={{ duration: 0.24, times: [0, 0.7, 1], ease: "easeIn" }}
      />
    </g>
  );
}

function HolyBoltFx({ launchX, impactX }: ProjectileProps) {
  // A radiant bolt of light streaks to the enemy and detonates in a holy nova:
  // twin crossing beams flash, rings expand, gilded spokes radiate, and motes of
  // light scatter from a white-hot core.
  const mx = 168;
  const my = 60;
  const startX = launchX - impactX;
  const burstDelay = 0.3;
  return (
    <g transform={`translate(${impactX - mx} 0)`}>
      {/* projectile: glowing orb with a comet trail */}
      <motion.g
        initial={{ x: startX, opacity: 0 }}
        animate={{ x: [startX, startX, 0], opacity: [0, 1, 1] }}
        transition={{ duration: 0.3, times: [0, 0.1, 1], ease: "easeIn" }}
      >
        <ellipse
          cx={mx - 16}
          cy={my}
          rx="14"
          ry="3.5"
          fill="#ffe066"
          opacity="0.35"
        />
        <circle cx={mx} cy={my} r="8" fill="#fff4c0" />
        <circle cx={mx} cy={my} r="5" fill="#ffe066" />
        <circle cx={mx - 2} cy={my - 2} r="2" fill="#ffffff" opacity="0.9" />
      </motion.g>

      {/* nova group — everything below fires on impact */}
      {/* expanding light rings */}
      {[
        { r: 44, sw: 2, delay: 0, col: "#ffdd66" },
        { r: 32, sw: 2.5, delay: 0.06, col: "#fff0a0" },
      ].map((ring, i) => (
        <motion.circle
          key={i}
          cx={mx}
          cy={my}
          fill="none"
          stroke={ring.col}
          strokeWidth={ring.sw}
          style={{ transformOrigin: "168px 60px" }}
          initial={{ r: 4, opacity: 0 }}
          animate={{ r: [4, ring.r], opacity: [0, 0.9, 0] }}
          transition={{
            duration: 0.6,
            delay: burstDelay + ring.delay,
            times: [0, 0.25, 1],
            ease: "easeOut",
          }}
        />
      ))}

      {/* gilded spokes radiating out (8 directions) */}
      <motion.g
        style={{ transformOrigin: "168px 60px" }}
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 1.15, 1.5], opacity: [0, 1, 0] }}
        transition={{
          duration: 0.5,
          delay: burstDelay + 0.02,
          times: [0, 0.4, 1],
          ease: "easeOut",
        }}
      >
        {([0, 45, 90, 135, 180, 225, 270, 315] as number[]).map((deg) => (
          <g key={deg} transform={`translate(${mx},${my}) rotate(${deg})`}>
            <polygon points="0,-2.5 30,0 0,2.5" fill="#ffcc44" opacity="0.85" />
          </g>
        ))}
      </motion.g>

      {/* crossing light beams — vertical + horizontal flash of the cross */}
      <motion.g
        style={{ transformOrigin: "168px 60px" }}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 1.1] }}
        transition={{
          duration: 0.42,
          delay: burstDelay + 0.02,
          times: [0, 0.35, 1],
          ease: "easeOut",
        }}
      >
        <line
          x1={mx}
          y1={my - 40}
          x2={mx}
          y2={my + 40}
          stroke="#fffbe0"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <line
          x1={mx - 40}
          y1={my}
          x2={mx + 40}
          y2={my}
          stroke="#fffbe0"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <line
          x1={mx}
          y1={my - 40}
          x2={mx}
          y2={my + 40}
          stroke="#ffdd66"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1={mx - 40}
          y1={my}
          x2={mx + 40}
          y2={my}
          stroke="#ffdd66"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </motion.g>

      {/* white-hot core pop */}
      <motion.g
        style={{ transformOrigin: "168px 60px" }}
        initial={{ scale: 0.15, opacity: 0 }}
        animate={{ scale: [0.15, 1.2, 1], opacity: [0, 1, 0] }}
        transition={{
          duration: 0.5,
          delay: burstDelay,
          times: [0, 0.3, 1],
          ease: "easeOut",
        }}
      >
        <circle cx={mx} cy={my} r="13" fill="#ffee88" opacity="0.9" />
        <circle cx={mx} cy={my} r="7" fill="#ffffff" />
      </motion.g>

      {/* scattering motes of light */}
      {[
        { a: 20, dist: 30, r: 2.4, d: 0.06 },
        { a: 70, dist: 34, r: 1.8, d: 0.1 },
        { a: 150, dist: 28, r: 2, d: 0.04 },
        { a: 210, dist: 32, r: 2.6, d: 0.12 },
        { a: 300, dist: 30, r: 1.6, d: 0.08 },
        { a: 340, dist: 26, r: 2.2, d: 0.05 },
      ].map((m, i) => {
        const rad = (m.a * Math.PI) / 180;
        return (
          <motion.circle
            key={i}
            cx={mx}
            cy={my}
            r={m.r}
            fill="#fff0a0"
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{
              x: [0, Math.cos(rad) * m.dist],
              y: [0, Math.sin(rad) * m.dist],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 0.5,
              delay: burstDelay + m.d,
              times: [0, 0.4, 1],
              ease: "easeOut",
            }}
          />
        );
      })}
    </g>
  );
}

function VineWhipFx() {
  // A vine lashes out from the player and cracks against the enemy.
  const lashPath = "M34 46 C74 38 112 46 152 60";

  // The lash draws itself, holds, then fades. Shared by both stroke passes.
  const lash = {
    initial: { strokeDashoffset: 200, opacity: 0 },
    animate: { strokeDashoffset: [200, 0, 0], opacity: [0, 1, 1, 0] },
    transition: {
      duration: 0.5,
      times: [0, 0.4, 0.75, 1],
      ease: "easeIn" as const,
    },
  };

  // A leaf flicks off the vine, pops, and drifts down.
  const leaf = (delay: number) => ({
    initial: { opacity: 0, scale: 0.3, rotate: -20, y: 0 },
    animate: {
      opacity: [0, 1, 0],
      scale: [0.3, 1, 0.9],
      rotate: [-20, 0, 15],
      y: [0, 0, 8],
    },
    transition: {
      duration: 0.45,
      delay,
      times: [0, 0.4, 1],
      ease: "easeOut" as const,
    },
    style: { transformBox: "fill-box", transformOrigin: "center" } as const,
  });

  return (
    <g>
      {/* the lash — thick vine curving toward the enemy */}
      <motion.path
        d={lashPath}
        fill="none"
        stroke="#4f9e33"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray={200}
        {...lash}
      />
      {/* bright highlight running along the lash */}
      <motion.path
        d={lashPath}
        fill="none"
        stroke="#a6ec72"
        strokeWidth={0.6}
        strokeLinecap="round"
        strokeDasharray={200}
        {...lash}
      />
      {/* small leaves flicking off the vine */}
      <motion.path d="M92 30 l7 -5 -1 8 z" fill="#6bbf4a" {...leaf(0.16)} />
      <motion.path d="M122 42 l7 4 -6 4 z" fill="#6bbf4a" {...leaf(0.22)} />
      {/* crack / impact burst where the tip snaps against the enemy */}
      <motion.g
        style={{ transformOrigin: "156px 60px" }}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: [0, 1, 0], scale: [0.3, 1.15, 1.5] }}
        transition={{ duration: 0.34, delay: 0.2, ease: "easeOut" }}
      >
        <circle cx="156" cy="60" r="5.5" fill="#e4ffb8" />
        <line
          x1="156"
          y1="60"
          x2="174"
          y2="49"
          stroke="#c8f59a"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="156"
          y1="60"
          x2="177"
          y2="62"
          stroke="#a6ec72"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="156"
          y1="60"
          x2="171"
          y2="74"
          stroke="#c8f59a"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </motion.g>
    </g>
  );
}

function DruidWhipFx() {
  // Basic attack: a quick leather-whip crack — tan/brown, no leaves, so it
  // reads distinct from the green Vine Whip ability.
  const p = "M32 52 C72 32 116 54 158 58";

  const lash = {
    initial: { strokeDashoffset: 200, opacity: 0 },
    animate: { strokeDashoffset: [200, 0, 0, 0], opacity: [0, 1, 1, 0] },
    transition: {
      duration: 0.7,
      times: [0, 0.55, 0.75, 1],
      ease: "easeIn" as const,
    },
  };

  return (
    <g>
      <motion.path
        d={p}
        fill="none"
        stroke="#a9793a"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeDasharray={200}
        {...lash}
      />
      <motion.path
        d={p}
        fill="none"
        stroke="#e6c98a"
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeDasharray={200}
        {...lash}
      />
    </g>
  );
}

function EviscerateFx() {
  const slash = (
    delay: number,
    stroke: string,
    sw: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ) => (
    <motion.line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeDasharray={260}
      initial={{ strokeDashoffset: 260, opacity: 0 }}
      animate={{ strokeDashoffset: [260, 0, 0], opacity: [0, 1, 0.9, 0] }}
      transition={{
        duration: 0.38,
        delay,
        times: [0, 0.4, 0.6, 1],
        ease: [0.1, 0, 0.4, 1],
      }}
    />
  );
  return (
    <g>
      {/* Fast diagonal slashes crossing from player to monster */}
      {slash(0, "#ff3333", 3, 50, 90, 175, 35)}
      {slash(0.04, "#ff6655", 1.5, 60, 95, 185, 40)}
      {/* Impact burst on monster */}
      <motion.g
        style={{ transformOrigin: "168px 60px" }}
        initial={{ scale: 0.1, opacity: 0 }}
        animate={{ scale: [0.1, 1.3, 1, 1.1], opacity: [0, 1, 0.85, 0] }}
        transition={{
          duration: 0.45,
          delay: 0.28,
          times: [0, 0.3, 0.7, 1],
          ease: "easeOut",
        }}
      >
        <circle cx="168" cy="60" r="18" fill="#cc1111" opacity="0.6" />
        <circle cx="168" cy="60" r="9" fill="#ff4444" opacity="0.85" />
        <circle cx="168" cy="60" r="4" fill="#ffaaaa" opacity="0.9" />
      </motion.g>
      {/* Poison drip after impact */}
      <motion.circle
        cx="168"
        cy="60"
        fill="#66cc44"
        initial={{ r: 2, opacity: 0, y: 0 }}
        animate={{ r: [2, 8, 3], opacity: [0, 0.85, 0], y: [0, 0, 12] }}
        transition={{
          duration: 0.5,
          delay: 0.5,
          times: [0, 0.4, 1],
          ease: "easeOut",
        }}
      />
    </g>
  );
}

function HolyLightFx() {
  // Paladin buff at the player: a gold pulse ring, glowing core, rising sparks.
  const spark = (
    cx: number,
    cy: number,
    r: number,
    fill: string,
    delay: number,
  ) => (
    <motion.circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      initial={{ y: 0, scale: 0.4, opacity: 0 }}
      animate={{ y: [0, -20], scale: [0.4, 1.1], opacity: [0, 1, 0] }}
      transition={{
        duration: 0.7,
        delay,
        times: [0, 0.35, 1],
        ease: "easeOut",
      }}
    />
  );
  return (
    <g>
      {/* Gold pulse ring */}
      <motion.circle
        cx="32"
        cy="60"
        fill="none"
        stroke="#ddaa22"
        strokeWidth="2.5"
        style={{ transformOrigin: "32px 60px" }}
        initial={{ r: 5, opacity: 0.95 }}
        animate={{ r: [5, 36], opacity: [0.95, 0] }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      />
      {/* Glow core */}
      <motion.g
        style={{ transformOrigin: "32px 60px" }}
        initial={{ scale: 0.1, opacity: 0 }}
        animate={{ scale: [0.1, 1.3, 1], opacity: [0, 1, 0] }}
        transition={{ duration: 0.7, times: [0, 0.45, 1], ease: "easeOut" }}
      >
        <circle cx="32" cy="60" r="14" fill="#ddaa22" opacity="0.35" />
        <circle cx="32" cy="60" r="7" fill="#ffdd55" opacity="0.8" />
        <circle cx="32" cy="60" r="3" fill="#ffffff" opacity="0.95" />
      </motion.g>
      {/* Rising gold sparks */}
      {spark(32, 40, 2, "#ffdd55", 0.08)}
      {spark(18, 50, 1.6, "#ddaa22", 0.14)}
      {spark(46, 48, 1.6, "#ffcc44", 0.14)}
      {spark(24, 35, 1.3, "#ffffaa", 0.22)}
      {spark(42, 34, 1.3, "#ffffaa", 0.22)}
    </g>
  );
}

function VanishFx() {
  const smoke = (
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    fill: string,
    delay: number,
  ) => (
    <motion.ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill={fill}
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
      initial={{ y: 0, scale: 0.5, opacity: 0 }}
      animate={{ y: [0, -8, -22], scale: [0.5, 1, 1.3], opacity: [0, 0.6, 0] }}
      transition={{ duration: 0.6, delay, times: [0, 0.3, 1], ease: "easeOut" }}
    />
  );
  return (
    <g>
      {/* Metal powder burst at player position */}
      <motion.g
        style={{ transformOrigin: "32px 65px" }}
        initial={{ scale: 0.1, opacity: 0 }}
        animate={{ scale: [0.1, 1.2, 1, 1.4], opacity: [0, 1, 0.7, 0] }}
        transition={{
          duration: 0.5,
          times: [0, 0.25, 0.6, 1],
          ease: "easeOut",
        }}
      >
        <circle cx="32" cy="65" r="20" fill="#888899" opacity="0.55" />
        <circle cx="32" cy="65" r="12" fill="#aabbcc" opacity="0.7" />
        <circle cx="32" cy="65" r="5" fill="#ddeeff" opacity="0.85" />
      </motion.g>
      {/* Smoke tendrils */}
      {smoke(32, 40, 8, 14, "#667788", 0.15)}
      {smoke(20, 50, 6, 10, "#778899", 0.22)}
      {smoke(44, 50, 6, 10, "#667788", 0.19)}
      {/* Metal shards flying at monster */}
      <motion.g
        style={{ transformOrigin: "168px 65px" }}
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 1.1, 1, 1.2], opacity: [0, 1, 0.8, 0] }}
        transition={{
          duration: 0.55,
          delay: 0.3,
          times: [0, 0.2, 0.7, 1],
          ease: "easeOut",
        }}
      >
        <line
          x1="160"
          y1="55"
          x2="148"
          y2="42"
          stroke="#aabbcc"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="172"
          y1="52"
          x2="180"
          y2="38"
          stroke="#99aabb"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="178"
          y1="65"
          x2="194"
          y2="65"
          stroke="#aabbcc"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="172"
          y1="78"
          x2="180"
          y2="92"
          stroke="#99aabb"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="160"
          y1="75"
          x2="148"
          y2="88"
          stroke="#aabbcc"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </motion.g>
    </g>
  );
}

function FrostShieldFx() {
  // Sorceress ability2 buff: expanding frost rings, an icy core, radiating
  // crystal shards, and twinkling sparks — all centred on the player at x=70.
  const ORIGIN = "70px 60px";
  const shard = (
    points: string,
    fill: string,
    opacity: number,
    delay: number,
  ) => (
    <motion.polygon
      points={points}
      fill={fill}
      opacity={opacity}
      style={{ transformOrigin: ORIGIN }}
      initial={{ scale: 0, y: 0, opacity: 0 }}
      animate={{ scale: [0, 1, 1.4], y: [0, 0, -6], opacity: [0, opacity, 0] }}
      transition={{
        duration: 0.65,
        delay,
        times: [0, 0.5, 1],
        ease: "easeOut",
      }}
    />
  );
  const spark = (
    cx: number,
    cy: number,
    r: number,
    fill: string,
    delay: number,
  ) => (
    <motion.circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.5, 0.8], opacity: [0, 1, 0] }}
      transition={{
        duration: 0.55,
        delay,
        times: [0, 0.4, 1],
        ease: "easeOut",
      }}
    />
  );
  return (
    <g>
      {/* Expanding frost rings */}
      {[
        { sw: 2.5, col: "#aaeeff", op: 0.8, delay: 0 },
        { sw: 2, col: "#88ccff", op: 0.9, delay: 0.1 },
      ].map((r, i) => (
        <motion.circle
          key={i}
          cx="70"
          cy="60"
          fill="none"
          stroke={r.col}
          strokeWidth={r.sw}
          style={{ transformOrigin: ORIGIN }}
          initial={{ r: 4, opacity: r.op }}
          animate={{ r: [4, 46], opacity: [r.op, 0] }}
          transition={{ duration: 0.7, delay: r.delay, ease: "easeOut" }}
        />
      ))}
      {/* Icy glow core around player */}
      <motion.g
        style={{ transformOrigin: ORIGIN }}
        initial={{ scale: 0.1, opacity: 0 }}
        animate={{ scale: [0.1, 1.3, 1], opacity: [0, 1, 0.9] }}
        transition={{ duration: 0.6, times: [0, 0.5, 1], ease: "easeOut" }}
      >
        <circle cx="70" cy="60" r="18" fill="#aaeeff" opacity="0.22" />
        <circle cx="70" cy="60" r="10" fill="#cceeff" opacity="0.35" />
        <circle cx="70" cy="60" r="5" fill="#eef8ff" opacity="0.75" />
      </motion.g>
      {/* Ice crystal shards radiating out */}
      {shard("70,20 67,33 73,33", "#88ccee", 0.85, 0.1)}
      {shard("110,60 97,57 97,63", "#88ccee", 0.85, 0.14)}
      {shard("70,100 73,87 67,87", "#88ccee", 0.85, 0.1)}
      {shard("30,60 43,63 43,57", "#88ccee", 0.85, 0.14)}
      {shard("99,31 90,41 96,44", "#aaddff", 0.7, 0.18)}
      {shard("99,89 96,76 90,79", "#aaddff", 0.7, 0.18)}
      {shard("41,89 44,76 50,79", "#aaddff", 0.7, 0.18)}
      {shard("41,31 50,41 44,44", "#aaddff", 0.7, 0.18)}
      {/* Sparkle dots */}
      {spark(70, 38, 2, "#ddf4ff", 0.12)}
      {spark(95, 48, 1.8, "#bbecff", 0.18)}
      {spark(45, 48, 1.8, "#bbecff", 0.18)}
      {spark(95, 72, 1.8, "#bbecff", 0.22)}
      {spark(45, 72, 1.8, "#bbecff", 0.22)}
    </g>
  );
}

function SpinningCraneKickFx() {
  // Monk ability1 (3 hits): the monk becomes a green cyclone, and three impact
  // flashes land in sequence — one per hit of the multi-strike.
  // Authored around (70,60); the outer transform shrinks it and moves the centre
  // onto the monster's left edge so the spin lands on the enemy, not mid-arena.
  const ORIGIN = "70px 60px";
  return (
    <g transform="translate(150 60) scale(0.6) translate(-70 -60)">
      {/* Whirling cyclone — the wind ring genuinely rotates via motion */}
      <motion.g
        style={{ transformOrigin: ORIGIN }}
        initial={{ rotate: 0, scale: 0.3, opacity: 0 }}
        animate={{
          rotate: [0, 900],
          scale: [0.3, 1.1, 1.15],
          opacity: [0, 1, 0.9, 0],
        }}
        transition={{
          duration: 0.95,
          times: [0, 0.12, 0.8, 1],
          ease: [0.2, 0, 0.5, 1],
        }}
      >
        <circle
          cx="70"
          cy="60"
          r="38"
          fill="none"
          stroke="#54E396"
          strokeWidth="2.2"
          opacity="0.7"
          strokeDasharray="18 10"
        />
        <circle
          cx="70"
          cy="60"
          r="28"
          fill="none"
          stroke="#54E396"
          strokeWidth="1.5"
          opacity="0.5"
          strokeDasharray="12 8"
        />
        {/* Wind arms — 4 curved sweeping arcs */}
        <path
          d="M70 22 Q108 28 108 60"
          fill="none"
          stroke="#54E396"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M108 60 Q102 98 70 98"
          fill="none"
          stroke="#54E396"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M70 98 Q32 92 32 60"
          fill="none"
          stroke="#54E396"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M32 60 Q38 22 70 22"
          fill="none"
          stroke="#54E396"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.85"
        />
        {/* Inner swirl */}
        <path
          d="M70 38 Q88 44 88 60 Q88 76 70 82 Q52 76 52 60 Q52 44 70 38"
          fill="none"
          stroke="#54E396"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
        <circle cx="70" cy="60" r="8" fill="#54E396" opacity="0.3" />
        <circle cx="70" cy="60" r="4" fill="#54E396" opacity="0.6" />
      </motion.g>

      {/* Three sequential kick-impact flashes — one per hit */}
      {[
        { cx: 96, cy: 46, delay: 0.12 },
        { cx: 100, cy: 62, delay: 0.34 },
        { cx: 92, cy: 74, delay: 0.54 },
      ].map((k, i) => (
        <motion.g
          key={i}
          style={{ transformOrigin: `${k.cx}px ${k.cy}px` }}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: [0.2, 1.3, 1.6], opacity: [0, 1, 0] }}
          transition={{
            duration: 0.3,
            delay: k.delay,
            times: [0, 0.4, 1],
            ease: "easeOut",
          }}
        >
          <circle cx={k.cx} cy={k.cy} r="8" fill="#c8ffe0" opacity="0.9" />
          <circle cx={k.cx} cy={k.cy} r="4" fill="#ffffff" />
          {/* little sparks bursting from the strike */}
          {[0, 72, 144, 216, 288].map((deg) => (
            <g
              key={deg}
              transform={`translate(${k.cx},${k.cy}) rotate(${deg})`}
            >
              <polygon
                points="0,-1.6 12,0 0,1.6"
                fill="#54E396"
                opacity="0.9"
              />
            </g>
          ))}
        </motion.g>
      ))}

      {/* Wind particles flung outward from the spin */}
      {[
        { cx: 70, cy: 22, delay: 0.12 },
        { cx: 108, cy: 60, delay: 0.24 },
        { cx: 70, cy: 98, delay: 0.18 },
        { cx: 32, cy: 60, delay: 0.3 },
      ].map((p, i) => (
        <motion.circle
          key={i}
          cx={p.cx}
          cy={p.cy}
          r="3"
          fill="#54E396"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          initial={{ scale: 1, y: 0, opacity: 0.9 }}
          animate={{ scale: [1, 2.5], y: [0, -6], opacity: [0.9, 0] }}
          transition={{ duration: 0.65, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </g>
  );
}

function SerenityFx() {
  // Monk ability2 (heal + cleanse): a tranquil blooming lotus of green light —
  // calm expanding rings, unfolding petals, a soft core, and rising motes.
  const ORIGIN = "70px 60px";
  const petals = [0, 45, 90, 135, 180, 225, 270, 315];
  const mote = (cx: number, cy: number, r: number, delay: number) => (
    <motion.circle
      cx={cx}
      cy={cy}
      r={r}
      fill="#8affc0"
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
      initial={{ y: 0, scale: 0.5, opacity: 0 }}
      animate={{ y: [0, -18], scale: [0.5, 1.2], opacity: [0, 1, 0] }}
      transition={{
        duration: 0.75,
        delay,
        times: [0, 0.4, 1],
        ease: "easeOut",
      }}
    />
  );
  return (
    <g>
      {/* Calm expanding rings */}
      {[
        { sw: 2.5, col: "#54E396", op: 0.8, delay: 0 },
        { sw: 2, col: "#aaffcc", op: 0.7, delay: 0.12 },
      ].map((r, i) => (
        <motion.circle
          key={i}
          cx="70"
          cy="60"
          fill="none"
          stroke={r.col}
          strokeWidth={r.sw}
          style={{ transformOrigin: ORIGIN }}
          initial={{ r: 4, opacity: r.op }}
          animate={{ r: [4, 40], opacity: [r.op, 0] }}
          transition={{ duration: 0.7, delay: r.delay, ease: "easeOut" }}
        />
      ))}

      {/* Blooming lotus petals unfolding outward */}
      <motion.g
        style={{ transformOrigin: ORIGIN }}
        initial={{ scale: 0.2, opacity: 0, rotate: -20 }}
        animate={{
          scale: [0.2, 1, 1.05],
          opacity: [0, 0.9, 0],
          rotate: [-20, 0, 8],
        }}
        transition={{ duration: 0.8, times: [0, 0.45, 1], ease: "easeOut" }}
      >
        {petals.map((deg) => (
          <g key={deg} transform={`translate(70,60) rotate(${deg})`}>
            <path
              d="M0 0 Q6 -14 0 -26 Q-6 -14 0 0 Z"
              fill="#54E396"
              opacity="0.55"
            />
            <path
              d="M0 0 Q3 -12 0 -22 Q-3 -12 0 0 Z"
              fill="#aaffcc"
              opacity="0.5"
            />
          </g>
        ))}
      </motion.g>

      {/* Soft glowing core */}
      <motion.g
        style={{ transformOrigin: ORIGIN }}
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 1.2, 1], opacity: [0, 1, 0.6] }}
        transition={{ duration: 0.7, times: [0, 0.4, 1], ease: "easeOut" }}
      >
        <circle cx="70" cy="60" r="13" fill="#54E396" opacity="0.2" />
        <circle cx="70" cy="60" r="7" fill="#54E396" opacity="0.45" />
        <circle cx="70" cy="60" r="3" fill="#efffef" opacity="0.9" />
      </motion.g>

      {/* Rising motes of restored life */}
      {mote(70, 46, 2.2, 0.1)}
      {mote(54, 54, 1.8, 0.16)}
      {mote(86, 54, 1.8, 0.16)}
      {mote(60, 44, 1.5, 0.24)}
      {mote(82, 46, 1.5, 0.24)}
    </g>
  );
}
