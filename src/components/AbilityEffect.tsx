import { useEffect } from "react";
import { motion } from "motion/react";
import type React from "react";
import type { ClassId } from "../game/types";

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

// Projectile FX split their launch group (onto the player) from their impact
// group (onto the monster); the parent supplies the two translate transforms.
interface SplitProps {
  launchTransform: string;
  impactTransform: string;
}

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
  //  • projectiles — natural size, launch/impact groups translated onto each
  //    sprite; the orb travels the measured gap (local --travel-dist)
  //  • spanning line effects (whips, slashes, arrows) — scaled, so they stretch
  //    across the gap (stretching a line reads fine; a fat orb does not)
  const scale = (impactX - launchX) / (IMPACT_ANCHOR - LAUNCH_ANCHOR);
  const shiftX = launchX - scale * LAUNCH_ANCHOR;
  const shiftY = 60 - scale * 60;
  const scaleTransform = `translate(${shiftX} ${shiftY}) scale(${scale})`;
  const launchTransform = `translate(${launchX - LAUNCH_ANCHOR} 0)`;
  const impactTransform = `translate(${impactX - IMPACT_ANCHOR} 0)`;
  const impactSlashTransform = `translate(${impactX - IMPACT_ANCHOR + 100} 0)`;
  const projectileStyle = {
    "--travel-dist": `${impactX - launchX}px`,
  } as React.CSSProperties;

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

        {/* Orb projectiles — natural size, split launch/impact, travel the gap */}
        {classId === "sorceress" && !useAbility2 && (
          <g style={projectileStyle}>
            <FrostBoltFx
              launchTransform={launchTransform}
              impactTransform={impactTransform}
            />
          </g>
        )}
        {classId === "paladin" && !useAbility2 && !useAttack && (
          <g style={projectileStyle}>
            <HolyBoltFx
              launchTransform={launchTransform}
              impactTransform={impactTransform}
            />
          </g>
        )}
        {classId === "necromancer" && !useAbility2 && (
          <PoisonCloudFx launchX={launchX} impactX={impactX} />
        )}

        {/* Spanning line effects — scaled to stretch across the gap */}
        <g transform={scaleTransform}>
          {/* {classId === "barbarian" && useAttack && <BarbarianCleaveFx />} */}
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

function BarbarianCleaveFx() {
  return (
    <g>
      <defs>
        <filter id="ae-barb-glow" x="-200%" y="-3%" width="500%" height="106%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" />
        </filter>
      </defs>
      {/* blurred outer smear */}
      <path
        d="M 56 14 Q 76 60 32 106"
        fill="none"
        stroke="#e04020"
        strokeWidth="9"
        strokeLinecap="round"
        filter="url(#ae-barb-glow)"
        strokeDasharray="130"
        strokeDashoffset="130"
        className="ae-b-trail"
      />
      {/* mid arc */}
      <path
        d="M 56 14 Q 76 60 32 106"
        fill="none"
        stroke="#ff7a3c"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="130"
        strokeDashoffset="130"
        className="ae-b-trail"
      />
      {/* bright leading edge */}
      <path
        d="M 56 14 Q 76 60 32 106"
        fill="none"
        stroke="#ffe6cc"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="24 140"
        strokeDashoffset="0"
        className="ae-b-tip"
      />
    </g>
  );
}

function BloodFuryFx() {
  return (
    <g>
      {/* Rage burst — expanding red ring from player */}
      <circle
        cx="32"
        cy="60"
        r="28"
        fill="none"
        stroke="#cc2200"
        strokeWidth="3"
        opacity="0"
        className="ae-bloodfury-ring ae-bf-r1"
      />
      <circle
        cx="32"
        cy="60"
        r="20"
        fill="none"
        stroke="#ff4422"
        strokeWidth="2"
        opacity="0"
        className="ae-bloodfury-ring ae-bf-r2"
      />
      {/* Shout sound-wave arcs radiating rightward */}
      <path
        d="M 46 42 Q 60 60 46 78"
        fill="none"
        stroke="#ff5533"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0"
        className="ae-bloodfury-wave ae-bf-w1"
      />
      <path
        d="M 54 36 Q 74 60 54 84"
        fill="none"
        stroke="#ff4422"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0"
        className="ae-bloodfury-wave ae-bf-w2"
      />
      <path
        d="M 62 30 Q 88 60 62 90"
        fill="none"
        stroke="#cc2200"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0"
        className="ae-bloodfury-wave ae-bf-w3"
      />
      {/* Central rage flash */}
      <circle
        cx="32"
        cy="60"
        r="14"
        fill="#ff2200"
        opacity="0"
        className="ae-bloodfury-core"
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

function PoisonCloudFx({
  launchX,
  impactX,
}: {
  launchX: number;
  impactX: number;
}) {
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
  return (
    <g>
      {/* Trail dust — positioned along the boulder's path, staggered delays */}
      <ellipse
        className="ae-grd-1"
        cx="55"
        cy="86"
        rx="13"
        ry="4"
        fill="#b8a888"
        style={{
          transformBox: "fill-box",
          transformOrigin: "center",
          opacity: 0,
        }}
      />
      <ellipse
        className="ae-grd-2"
        cx="85"
        cy="84"
        rx="10"
        ry="3.5"
        fill="#c0b090"
        style={{
          transformBox: "fill-box",
          transformOrigin: "center",
          opacity: 0,
        }}
      />
      <ellipse
        className="ae-grd-3"
        cx="112"
        cy="83"
        rx="8"
        ry="3"
        fill="#b8a888"
        style={{
          transformBox: "fill-box",
          transformOrigin: "center",
          opacity: 0,
        }}
      />
      {/* Spinning boulder — origin at (130,70), travels to ~x=148 (translateX 18px) */}
      <g className="ae-groll-boulder" style={{ transformOrigin: "130px 70px" }}>
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
        <circle
          cx="130"
          cy="70"
          r="6"
          fill="#aadd88"
          opacity="0.85"
          className="ae-groll-eye"
        />
      </g>
    </g>
  );
}

function FrostBoltFx({ launchTransform, impactTransform }: SplitProps) {
  return (
    <g>
      <g transform={launchTransform}>
        <g className="ae-frost-orb" style={{ transformOrigin: "32px 60px" }}>
          <ellipse
            cx="18"
            cy="60"
            rx="14"
            ry="4"
            fill="#bfe9ff"
            opacity="0.4"
          />
          <polygon
            points="19,60 30,52 45,60 30,68"
            fill="#3fb6f0"
            opacity="0.95"
          />
          <circle cx="27" cy="57" r="3.2" fill="white" opacity="0.6" />
        </g>
      </g>
      <g transform={impactTransform}>
        <circle
          cx="168"
          cy="60"
          r="20"
          fill="#eafcff"
          className="ae-frost-flash"
        />
        {([0, 45, 90, 135, 180, 225, 270, 315] as number[]).map((deg, i) => (
          <g key={deg} transform={`translate(168,60) rotate(${deg})`}>
            <polygon
              className="ae-frost-shard"
              style={{ animationDelay: `${i * 0.015}s` }}
              points="0,-3 15,0 0,3 3,0"
              fill="#8fd9ff"
            />
          </g>
        ))}
      </g>
    </g>
  );
}

function SingleArrowFx() {
  return (
    <g className="ae-single-arrow">
      <line
        x1="28"
        y1="60"
        x2="104"
        y2="60"
        stroke="#44bb55"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <polygon points="104,55 122,60 104,65" fill="#44bb55" />
    </g>
  );
}

function MultishotFx() {
  return (
    <g>
      {/* Two arrows flying right */}
      <g className="ae-arrow ae-arrow-1">
        <line
          x1="60"
          y1="47"
          x2="96"
          y2="47"
          stroke="#44bb55"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <polygon points="96,43 110,47 96,51" fill="#44bb55" />
      </g>
      <g className="ae-arrow ae-arrow-2">
        <line
          x1="55"
          y1="73"
          x2="91"
          y2="73"
          stroke="#44bb55"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <polygon points="91,69 105,73 91,77" fill="#44bb55" />
      </g>
    </g>
  );
}

function PaladinSlashFx() {
  return (
    <g>
      <defs>
        <filter id="ae-pal-glow" x="-200%" y="-3%" width="500%" height="106%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
      </defs>
      {/* blurred outer glow — trail smear */}
      <line
        x1="36"
        y1="10"
        x2="42"
        y2="108"
        stroke="#ddaa22"
        strokeWidth="7"
        strokeLinecap="round"
        filter="url(#ae-pal-glow)"
        strokeDasharray="100"
        strokeDashoffset="100"
        className="ae-p-trail"
      />
      {/* gold mid trail */}
      <line
        x1="36"
        y1="10"
        x2="42"
        y2="108"
        stroke="#ffcc44"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="100"
        strokeDashoffset="100"
        className="ae-p-trail"
      />
      {/* white bright tip — travels top to bottom */}
      <line
        x1="36"
        y1="10"
        x2="42"
        y2="108"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="20 100"
        strokeDashoffset="0"
        className="ae-p-tip"
      />
    </g>
  );
}

function HolyBoltFx({ launchTransform, impactTransform }: SplitProps) {
  return (
    <g>
      <g transform={launchTransform}>
        <g className="ae-hb-orb" style={{ transformOrigin: "32px 60px" }}>
          <ellipse
            cx="20"
            cy="60"
            rx="11"
            ry="3.5"
            fill="white"
            opacity="0.3"
          />
          <circle cx="32" cy="60" r="9" fill="#ffe066" opacity="0.95" />
          <circle cx="29" cy="57" r="3.5" fill="white" opacity="0.5" />
        </g>
      </g>
      <g transform={impactTransform}>
        <g className="ae-hb-burst" style={{ transformOrigin: "168px 60px" }}>
          <circle
            cx="168"
            cy="60"
            r="38"
            fill="none"
            stroke="#ddaa22"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <line
            x1="168"
            y1="22"
            x2="168"
            y2="98"
            stroke="#ddaa22"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="130"
            y1="60"
            x2="206"
            y2="60"
            stroke="#ddaa22"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="168" cy="60" r="9" fill="#ffee44" opacity="0.95" />
          <circle cx="168" cy="60" r="5" fill="#ffffff" opacity="0.8" />
        </g>
      </g>
    </g>
  );
}

function VineWhipFx() {
  // A vine lashes out from the player and cracks against the enemy.
  // Reworked with `motion` — the whole timeline is declared inline per element
  // instead of living in CSS keyframes.
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
  // reads distinct from the green Vine Whip ability. Animated with `motion`.
  const p = "M32 52 C72 32 116 54 158 58";

  // Lash draws itself, holds briefly, then fades. Shared by both stroke passes.
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
  return (
    <g>
      {/* Fast diagonal slash crossing from player to monster */}
      <line
        x1="50"
        y1="90"
        x2="175"
        y2="35"
        stroke="#ff3333"
        strokeWidth="3"
        strokeLinecap="round"
        className="ae-eviscerate-slash ae-ev-s1"
        opacity="0"
      />
      <line
        x1="60"
        y1="95"
        x2="185"
        y2="40"
        stroke="#ff6655"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="ae-eviscerate-slash ae-ev-s2"
        opacity="0"
      />
      {/* Impact burst on monster */}
      <g
        className="ae-eviscerate-burst"
        style={{ transformOrigin: "168px 60px" }}
        opacity="0"
      >
        <circle cx="168" cy="60" r="18" fill="#cc1111" opacity="0.6" />
        <circle cx="168" cy="60" r="9" fill="#ff4444" opacity="0.85" />
        <circle cx="168" cy="60" r="4" fill="#ffaaaa" opacity="0.9" />
      </g>
      {/* Poison drip after impact */}
      <circle
        cx="168"
        cy="60"
        r="6"
        fill="#66cc44"
        opacity="0"
        className="ae-eviscerate-poison"
      />
    </g>
  );
}

function FreezingArrowFx() {
  return (
    <g>
      {/* Frozen arrow flying toward the monster */}
      <g className="ae-ice-arrow" style={{ transformOrigin: "80px 60px" }}>
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
      </g>
      {/* Icy explosion at impact */}
      <g className="ae-ice-burst" style={{ transformOrigin: "168px 60px" }}>
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
      </g>
    </g>
  );
}

function HolyLightFx() {
  return (
    <g>
      {/* Gold pulse ring */}
      <circle
        cx="32"
        cy="60"
        r="22"
        fill="none"
        stroke="#ddaa22"
        strokeWidth="2.5"
        opacity="0.9"
        style={{ transformOrigin: "32px 60px" }}
        className="ae-hl-ring"
      />
      {/* Glow core */}
      <g className="ae-hl-core" style={{ transformOrigin: "32px 60px" }}>
        <circle cx="32" cy="60" r="14" fill="#ddaa22" opacity="0.35" />
        <circle cx="32" cy="60" r="7" fill="#ffdd55" opacity="0.8" />
        <circle cx="32" cy="60" r="3" fill="#ffffff" opacity="0.95" />
      </g>
      {/* Rising gold sparks */}
      <circle
        cx="32"
        cy="40"
        r="2"
        fill="#ffdd55"
        opacity="0.9"
        style={{ transformOrigin: "32px 40px" }}
        className="ae-hl-spark ae-hl-s1"
      />
      <circle
        cx="18"
        cy="50"
        r="1.6"
        fill="#ddaa22"
        opacity="0.8"
        style={{ transformOrigin: "18px 50px" }}
        className="ae-hl-spark ae-hl-s2"
      />
      <circle
        cx="46"
        cy="48"
        r="1.6"
        fill="#ffcc44"
        opacity="0.8"
        style={{ transformOrigin: "46px 48px" }}
        className="ae-hl-spark ae-hl-s3"
      />
      <circle
        cx="24"
        cy="35"
        r="1.3"
        fill="#ffffaa"
        opacity="0.85"
        style={{ transformOrigin: "24px 35px" }}
        className="ae-hl-spark ae-hl-s4"
      />
      <circle
        cx="42"
        cy="34"
        r="1.3"
        fill="#ffffaa"
        opacity="0.8"
        style={{ transformOrigin: "42px 34px" }}
        className="ae-hl-spark ae-hl-s5"
      />
    </g>
  );
}

function VanishFx() {
  return (
    <g>
      {/* Metal powder burst at player position */}
      <g
        className="ae-vanish-burst"
        style={{ transformOrigin: "32px 65px" }}
        opacity="0"
      >
        <circle cx="32" cy="65" r="20" fill="#888899" opacity="0.55" />
        <circle cx="32" cy="65" r="12" fill="#aabbcc" opacity="0.7" />
        <circle cx="32" cy="65" r="5" fill="#ddeeff" opacity="0.85" />
      </g>
      {/* Smoke tendrils */}
      <ellipse
        cx="32"
        cy="40"
        rx="8"
        ry="14"
        fill="#667788"
        opacity="0"
        className="ae-vanish-smoke ae-vs-1"
      />
      <ellipse
        cx="20"
        cy="50"
        rx="6"
        ry="10"
        fill="#778899"
        opacity="0"
        className="ae-vanish-smoke ae-vs-2"
      />
      <ellipse
        cx="44"
        cy="50"
        rx="6"
        ry="10"
        fill="#667788"
        opacity="0"
        className="ae-vanish-smoke ae-vs-3"
      />
      {/* Metal shards on monster */}
      <g
        className="ae-vanish-shards"
        style={{ transformOrigin: "168px 65px" }}
        opacity="0"
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
      </g>
    </g>
  );
}

function FrostShieldFx() {
  return (
    <g style={{ transformOrigin: "70px 60px" }}>
      {/* Outer expanding frost ring */}
      <circle
        className="ae-frost-ring-1"
        cx="70"
        cy="60"
        r="36"
        fill="none"
        stroke="#aaeeff"
        strokeWidth="2.5"
        opacity="0.8"
        style={{ transformOrigin: "70px 60px" }}
      />
      {/* Mid ring with slight delay */}
      <circle
        className="ae-frost-ring-2"
        cx="70"
        cy="60"
        r="24"
        fill="none"
        stroke="#88ccff"
        strokeWidth="2"
        opacity="0.9"
        style={{ transformOrigin: "70px 60px" }}
      />
      {/* Icy glow core around player */}
      <g className="ae-frost-core" style={{ transformOrigin: "70px 60px" }}>
        <circle cx="70" cy="60" r="18" fill="#aaeeff" opacity="0.22" />
        <circle cx="70" cy="60" r="10" fill="#cceeff" opacity="0.35" />
        <circle cx="70" cy="60" r="5" fill="#eef8ff" opacity="0.75" />
      </g>
      {/* Ice crystal shards radiating out */}
      <polygon
        className="ae-frost-shard ae-fs-1"
        points="70,20 67,33 73,33"
        fill="#88ccee"
        opacity="0.85"
        style={{ transformOrigin: "70px 60px" }}
      />
      <polygon
        className="ae-frost-shard ae-fs-2"
        points="110,60 97,57 97,63"
        fill="#88ccee"
        opacity="0.85"
        style={{ transformOrigin: "70px 60px" }}
      />
      <polygon
        className="ae-frost-shard ae-fs-3"
        points="70,100 73,87 67,87"
        fill="#88ccee"
        opacity="0.85"
        style={{ transformOrigin: "70px 60px" }}
      />
      <polygon
        className="ae-frost-shard ae-fs-4"
        points="30,60 43,63 43,57"
        fill="#88ccee"
        opacity="0.85"
        style={{ transformOrigin: "70px 60px" }}
      />
      {/* Diagonal shards */}
      <polygon
        className="ae-frost-shard ae-fs-5"
        points="99,31 90,41 96,44"
        fill="#aaddff"
        opacity="0.7"
        style={{ transformOrigin: "70px 60px" }}
      />
      <polygon
        className="ae-frost-shard ae-fs-6"
        points="99,89 96,76 90,79"
        fill="#aaddff"
        opacity="0.7"
        style={{ transformOrigin: "70px 60px" }}
      />
      <polygon
        className="ae-frost-shard ae-fs-7"
        points="41,89 44,76 50,79"
        fill="#aaddff"
        opacity="0.7"
        style={{ transformOrigin: "70px 60px" }}
      />
      <polygon
        className="ae-frost-shard ae-fs-8"
        points="41,31 50,41 44,44"
        fill="#aaddff"
        opacity="0.7"
        style={{ transformOrigin: "70px 60px" }}
      />
      {/* Sparkle dots */}
      <circle
        className="ae-frost-spark ae-fsp-1"
        cx="70"
        cy="38"
        r="2"
        fill="#ddf4ff"
        opacity="0.9"
        style={{ transformOrigin: "70px 38px" }}
      />
      <circle
        className="ae-frost-spark ae-fsp-2"
        cx="95"
        cy="48"
        r="1.8"
        fill="#bbecff"
        opacity="0.85"
        style={{ transformOrigin: "95px 48px" }}
      />
      <circle
        className="ae-frost-spark ae-fsp-3"
        cx="45"
        cy="48"
        r="1.8"
        fill="#bbecff"
        opacity="0.85"
        style={{ transformOrigin: "45px 48px" }}
      />
      <circle
        className="ae-frost-spark ae-fsp-4"
        cx="95"
        cy="72"
        r="1.8"
        fill="#bbecff"
        opacity="0.8"
        style={{ transformOrigin: "95px 72px" }}
      />
      <circle
        className="ae-frost-spark ae-fsp-5"
        cx="45"
        cy="72"
        r="1.8"
        fill="#bbecff"
        opacity="0.8"
        style={{ transformOrigin: "45px 72px" }}
      />
    </g>
  );
}

function SpinningCraneKickFx() {
  return (
    <g style={{ transformOrigin: "70px 60px" }}>
      {/* Outer spinning wind ring */}
      <g className="ae-crane-spin" style={{ transformOrigin: "70px 60px" }}>
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
        {/* Center glow */}
        <circle cx="70" cy="60" r="8" fill="#54E396" opacity="0.3" />
        <circle cx="70" cy="60" r="4" fill="#54E396" opacity="0.6" />
      </g>
      {/* Flying wind particles */}
      <circle
        className="ae-crane-p1"
        cx="70"
        cy="22"
        r="3"
        fill="#54E396"
        opacity="0.85"
      />
      <circle
        className="ae-crane-p2"
        cx="108"
        cy="60"
        r="3"
        fill="#54E396"
        opacity="0.8"
      />
      <circle
        className="ae-crane-p3"
        cx="70"
        cy="98"
        r="3"
        fill="#54E396"
        opacity="0.85"
      />
      <circle
        className="ae-crane-p4"
        cx="32"
        cy="60"
        r="3"
        fill="#54E396"
        opacity="0.8"
      />
    </g>
  );
}

function SerenityFx() {
  return (
    <g style={{ transformOrigin: "70px 60px" }}>
      <circle
        className="ae-serenity-ring-1"
        cx="70"
        cy="60"
        r="32"
        fill="none"
        stroke="#54E396"
        strokeWidth="2.5"
        opacity="0.8"
        style={{ transformOrigin: "70px 60px" }}
      />
      <circle
        className="ae-serenity-ring-2"
        cx="70"
        cy="60"
        r="20"
        fill="none"
        stroke="#aaffcc"
        strokeWidth="2"
        opacity="0.7"
        style={{ transformOrigin: "70px 60px" }}
      />
      <g className="ae-serenity-core" style={{ transformOrigin: "70px 60px" }}>
        <circle cx="70" cy="60" r="13" fill="#54E396" opacity="0.2" />
        <circle cx="70" cy="60" r="7" fill="#54E396" opacity="0.45" />
        <circle cx="70" cy="60" r="3" fill="#efffef" opacity="0.9" />
      </g>
      <circle
        className="ae-regen-spark ae-rs-1"
        cx="70"
        cy="40"
        r="2.2"
        fill="#54E396"
        opacity="0.9"
        style={{ transformOrigin: "70px 40px" }}
      />
      <circle
        className="ae-regen-spark ae-rs-2"
        cx="52"
        cy="50"
        r="1.8"
        fill="#54E396"
        opacity="0.85"
        style={{ transformOrigin: "52px 50px" }}
      />
      <circle
        className="ae-regen-spark ae-rs-3"
        cx="88"
        cy="50"
        r="1.8"
        fill="#54E396"
        opacity="0.85"
        style={{ transformOrigin: "88px 50px" }}
      />
    </g>
  );
}
