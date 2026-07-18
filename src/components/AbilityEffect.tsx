import { useEffect } from "react";
import type React from "react";
import type { ClassId } from "../game/types";

interface Props {
  classId: ClassId;
  onDone: () => void;
  detonation?: boolean;
  useAbility2?: boolean;
  useAttack?: boolean;
  travelDist?: number;
}

export const ATTACK_EFFECT_CLASSES = new Set<ClassId>([
  "amazon",
  "paladin",
  "barbarian",
  "druid",
]);

export function AbilityEffect({
  classId,
  onDone,
  detonation: _detonation = false,
  useAbility2 = false,
  useAttack = false,
  travelDist = 136,
}: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 1200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="ability-effect-overlay">
      <svg
        viewBox="0 0 200 120"
        className="ability-effect-svg"
        overflow="visible"
        style={{ "--travel-dist": `${travelDist}px` } as React.CSSProperties}
      >
        {classId === "barbarian" && useAttack && <BarbarianCleaveFx />}
        {classId === "barbarian" && !useAbility2 && !useAttack && (
          <BloodFuryFx />
        )}
        {classId === "barbarian" && useAbility2 && <WhirlwindFx />}
        {classId === "necromancer" && !useAbility2 && <PoisonCloudFx />}
        {classId === "necromancer" && useAbility2 && <GolemRollInFx />}
        {classId === "sorceress" && !useAbility2 && <FrostBoltFx />}
        {classId === "sorceress" && useAbility2 && <FrostShieldFx />}
        {classId === "amazon" && useAttack && <SingleArrowFx />}
        {classId === "amazon" && !useAbility2 && !useAttack && <MultishotFx />}
        {classId === "amazon" && useAbility2 && <FreezingArrowFx />}
        {classId === "paladin" && useAttack && <PaladinSlashFx />}
        {classId === "paladin" && !useAbility2 && !useAttack && <HolyBoltFx />}
        {classId === "paladin" && useAbility2 && <HolyLightFx />}
        {classId === "druid" && useAttack && <DruidWhipFx />}
        {classId === "druid" && !useAbility2 && !useAttack && <VineWhipFx />}
        {classId === "monk" && !useAbility2 && <SpinningCraneKickFx />}
        {classId === "monk" && useAbility2 && <SerenityFx />}
        {classId === "assassin" && !useAbility2 && <EviscerateFx />}
        {classId === "assassin" && useAbility2 && <VanishFx />}
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
      <circle cx="32" cy="60" r="28" fill="none" stroke="#cc2200" strokeWidth="3"
        opacity="0" className="ae-bloodfury-ring ae-bf-r1" />
      <circle cx="32" cy="60" r="20" fill="none" stroke="#ff4422" strokeWidth="2"
        opacity="0" className="ae-bloodfury-ring ae-bf-r2" />
      {/* Shout sound-wave arcs radiating rightward */}
      <path d="M 46 42 Q 60 60 46 78" fill="none" stroke="#ff5533" strokeWidth="2.5"
        strokeLinecap="round" opacity="0" className="ae-bloodfury-wave ae-bf-w1" />
      <path d="M 54 36 Q 74 60 54 84" fill="none" stroke="#ff4422" strokeWidth="2"
        strokeLinecap="round" opacity="0" className="ae-bloodfury-wave ae-bf-w2" />
      <path d="M 62 30 Q 88 60 62 90" fill="none" stroke="#cc2200" strokeWidth="1.5"
        strokeLinecap="round" opacity="0" className="ae-bloodfury-wave ae-bf-w3" />
      {/* Central rage flash */}
      <circle cx="32" cy="60" r="14" fill="#ff2200" opacity="0"
        className="ae-bloodfury-core" />
    </g>
  );
}

function WhirlwindFx() {
  return (
    <g className="ae-whirlwind" style={{ transformOrigin: "168px 60px" }}>
      <circle cx="168" cy="60" r="7" fill="#e04020" opacity="0.85" />
      <path
        d="M168 60 Q191 41 210 60"
        fill="none"
        stroke="#e04020"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M168 60 Q196 70 189 97"
        fill="none"
        stroke="#e04020"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M168 60 Q173 89 147 97"
        fill="none"
        stroke="#e04020"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M168 60 Q146 79 126 60"
        fill="none"
        stroke="#e04020"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M168 60 Q140 50 147 23"
        fill="none"
        stroke="#e04020"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M168 60 Q163 31 189 23"
        fill="none"
        stroke="#e04020"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle
        cx="168"
        cy="60"
        r="42"
        fill="none"
        stroke="#e04020"
        strokeWidth="1.5"
        opacity="0.35"
        strokeDasharray="6 4"
      />
    </g>
  );
}

function PoisonCloudFx() {
  return (
    <g>
      {/* Main cloud body traveling right toward enemy */}
      <g className="ae-pcloud-travel" style={{ transformOrigin: "80px 60px" }}>
        <circle cx="80" cy="60" r="18" fill="#33bb22" opacity="0.78" />
        <circle cx="68" cy="54" r="13" fill="#44cc33" opacity="0.7" />
        <circle cx="94" cy="52" r="12" fill="#22aa11" opacity="0.65" />
        <circle cx="78" cy="74" r="10" fill="#55dd44" opacity="0.6" />
        <circle cx="96" cy="68" r="9" fill="#33bb22" opacity="0.58" />
        {/* Dripping toxic drops */}
        <circle cx="72" cy="82" r="3" fill="#77ee55" opacity="0.7" />
        <circle cx="90" cy="80" r="2.5" fill="#66dd44" opacity="0.65" />
        <circle cx="82" cy="86" r="2" fill="#55cc33" opacity="0.6" />
      </g>
      {/* Impact billow on monster side */}
      <g className="ae-pcloud-burst" style={{ transformOrigin: "168px 60px" }}>
        <circle cx="168" cy="60" r="22" fill="#33bb22" opacity="0.75" />
        <circle cx="156" cy="50" r="16" fill="#44cc33" opacity="0.7" />
        <circle cx="182" cy="48" r="14" fill="#22aa11" opacity="0.65" />
        <circle cx="168" cy="78" r="13" fill="#55dd44" opacity="0.6" />
        <circle cx="186" cy="70" r="11" fill="#33bb22" opacity="0.58" />
        <circle cx="148" cy="42" r="7" fill="#66ee44" opacity="0.5" />
        <circle cx="192" cy="40" r="6" fill="#44cc22" opacity="0.48" />
        <circle cx="198" cy="65" r="8" fill="#33bb11" opacity="0.5" />
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

function FrostBoltFx() {
  return (
    <g>
      <g className="ae-frost-orb" style={{ transformOrigin: "32px 60px" }}>
        <ellipse cx="18" cy="60" rx="14" ry="4" fill="#bfe9ff" opacity="0.4" />
        <polygon points="19,60 30,52 45,60 30,68" fill="#3fb6f0" opacity="0.95" />
        <circle cx="27" cy="57" r="3.2" fill="white" opacity="0.6" />
      </g>
      <g>
        <circle cx="168" cy="60" r="20" fill="#eafcff" className="ae-frost-flash" />
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
      <line x1="36" y1="10" x2="42" y2="108"
        stroke="#ddaa22" strokeWidth="7" strokeLinecap="round"
        filter="url(#ae-pal-glow)"
        strokeDasharray="100" strokeDashoffset="100"
        className="ae-p-trail" />
      {/* gold mid trail */}
      <line x1="36" y1="10" x2="42" y2="108"
        stroke="#ffcc44" strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray="100" strokeDashoffset="100"
        className="ae-p-trail" />
      {/* white bright tip — travels top to bottom */}
      <line x1="36" y1="10" x2="42" y2="108"
        stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round"
        strokeDasharray="20 100" strokeDashoffset="0"
        className="ae-p-tip" />
    </g>
  );
}

function HolyBoltFx() {
  return (
    <g>
      <g className="ae-hb-orb" style={{ transformOrigin: "32px 60px" }}>
        <ellipse cx="20" cy="60" rx="11" ry="3.5" fill="white" opacity="0.3" />
        <circle cx="32" cy="60" r="9" fill="#ffe066" opacity="0.95" />
        <circle cx="29" cy="57" r="3.5" fill="white" opacity="0.5" />
      </g>
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
  );
}

function VineWhipFx() {
  // A vine lashes out from the player and cracks against the enemy.
  const lashPath = "M34 46 C74 20 112 46 152 60";
  return (
    <g className="ae-vinewhip">
      {/* the lash — thick vine curving toward the enemy */}
      <path
        className="ae-vw-lash"
        d={lashPath}
        fill="none"
        stroke="#4f9e33"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeDasharray="200"
        strokeDashoffset="200"
      />
      {/* bright highlight running along the lash */}
      <path
        className="ae-vw-lash"
        d={lashPath}
        fill="none"
        stroke="#a6ec72"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="200"
        strokeDashoffset="200"
      />
      {/* small leaves flicking off the vine */}
      <path className="ae-vw-leaf ae-vw-leaf-1" d="M92 30 l7 -5 -1 8 z" fill="#6bbf4a" />
      <path className="ae-vw-leaf ae-vw-leaf-2" d="M122 42 l7 4 -6 4 z" fill="#6bbf4a" />
      {/* crack / impact burst where the tip snaps against the enemy */}
      <g className="ae-vw-crack" style={{ transformOrigin: "156px 60px" }}>
        <circle cx="156" cy="60" r="5.5" fill="#e4ffb8" />
        <line x1="156" y1="60" x2="174" y2="49" stroke="#c8f59a" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="156" y1="60" x2="177" y2="62" stroke="#a6ec72" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="156" y1="60" x2="171" y2="74" stroke="#c8f59a" strokeWidth="2" strokeLinecap="round" />
      </g>
    </g>
  );
}

function DruidWhipFx() {
  // Basic attack: a quick leather-whip crack — tan/brown, no leaves, so it
  // reads distinct from the green Vine Whip ability.
  const p = "M32 52 C72 32 116 54 158 58";
  return (
    <g className="ae-whipatk">
      <path
        className="ae-wa-lash"
        d={p}
        fill="none"
        stroke="#a9793a"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="200"
        strokeDashoffset="200"
      />
      <path
        className="ae-wa-lash"
        d={p}
        fill="none"
        stroke="#e6c98a"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeDasharray="200"
        strokeDashoffset="200"
      />
      {/* snap at the tip */}
      <g className="ae-wa-snap" style={{ transformOrigin: "160px 58px" }}>
        <line x1="160" y1="58" x2="177" y2="49" stroke="#f2e0b0" strokeWidth="2" strokeLinecap="round" />
        <line x1="160" y1="58" x2="179" y2="60" stroke="#e6c98a" strokeWidth="2" strokeLinecap="round" />
        <line x1="160" y1="58" x2="174" y2="69" stroke="#f2e0b0" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    </g>
  );
}

function EviscerateFx() {
  return (
    <g>
      {/* Fast diagonal slash crossing from player to monster */}
      <line
        x1="50" y1="90" x2="175" y2="35"
        stroke="#ff3333" strokeWidth="3" strokeLinecap="round"
        className="ae-eviscerate-slash ae-ev-s1"
        opacity="0"
      />
      <line
        x1="60" y1="95" x2="185" y2="40"
        stroke="#ff6655" strokeWidth="1.5" strokeLinecap="round"
        className="ae-eviscerate-slash ae-ev-s2"
        opacity="0"
      />
      {/* Impact burst on monster */}
      <g className="ae-eviscerate-burst" style={{ transformOrigin: "168px 60px" }} opacity="0">
        <circle cx="168" cy="60" r="18" fill="#cc1111" opacity="0.6" />
        <circle cx="168" cy="60" r="9" fill="#ff4444" opacity="0.85" />
        <circle cx="168" cy="60" r="4" fill="#ffaaaa" opacity="0.9" />
      </g>
      {/* Poison drip after impact */}
      <circle cx="168" cy="60" r="6" fill="#66cc44" opacity="0"
        className="ae-eviscerate-poison" />
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
      <circle cx="32" cy="60" r="22" fill="none" stroke="#ddaa22" strokeWidth="2.5"
        opacity="0.9" style={{ transformOrigin: "32px 60px" }}
        className="ae-hl-ring" />
      {/* Glow core */}
      <g className="ae-hl-core" style={{ transformOrigin: "32px 60px" }}>
        <circle cx="32" cy="60" r="14" fill="#ddaa22" opacity="0.35" />
        <circle cx="32" cy="60" r="7" fill="#ffdd55" opacity="0.8" />
        <circle cx="32" cy="60" r="3" fill="#ffffff" opacity="0.95" />
      </g>
      {/* Rising gold sparks */}
      <circle cx="32" cy="40" r="2" fill="#ffdd55" opacity="0.9"
        style={{ transformOrigin: "32px 40px" }} className="ae-hl-spark ae-hl-s1" />
      <circle cx="18" cy="50" r="1.6" fill="#ddaa22" opacity="0.8"
        style={{ transformOrigin: "18px 50px" }} className="ae-hl-spark ae-hl-s2" />
      <circle cx="46" cy="48" r="1.6" fill="#ffcc44" opacity="0.8"
        style={{ transformOrigin: "46px 48px" }} className="ae-hl-spark ae-hl-s3" />
      <circle cx="24" cy="35" r="1.3" fill="#ffffaa" opacity="0.85"
        style={{ transformOrigin: "24px 35px" }} className="ae-hl-spark ae-hl-s4" />
      <circle cx="42" cy="34" r="1.3" fill="#ffffaa" opacity="0.8"
        style={{ transformOrigin: "42px 34px" }} className="ae-hl-spark ae-hl-s5" />
    </g>
  );
}

function VanishFx() {
  return (
    <g>
      {/* Metal powder burst at player position */}
      <g className="ae-vanish-burst" style={{ transformOrigin: "32px 65px" }} opacity="0">
        <circle cx="32" cy="65" r="20" fill="#888899" opacity="0.55" />
        <circle cx="32" cy="65" r="12" fill="#aabbcc" opacity="0.7" />
        <circle cx="32" cy="65" r="5" fill="#ddeeff" opacity="0.85" />
      </g>
      {/* Smoke tendrils */}
      <ellipse cx="32" cy="40" rx="8" ry="14" fill="#667788" opacity="0"
        className="ae-vanish-smoke ae-vs-1" />
      <ellipse cx="20" cy="50" rx="6" ry="10" fill="#778899" opacity="0"
        className="ae-vanish-smoke ae-vs-2" />
      <ellipse cx="44" cy="50" rx="6" ry="10" fill="#667788" opacity="0"
        className="ae-vanish-smoke ae-vs-3" />
      {/* Metal shards on monster */}
      <g className="ae-vanish-shards" style={{ transformOrigin: "168px 65px" }} opacity="0">
        <line x1="160" y1="55" x2="148" y2="42" stroke="#aabbcc" strokeWidth="2" strokeLinecap="round" />
        <line x1="172" y1="52" x2="180" y2="38" stroke="#99aabb" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="178" y1="65" x2="194" y2="65" stroke="#aabbcc" strokeWidth="2" strokeLinecap="round" />
        <line x1="172" y1="78" x2="180" y2="92" stroke="#99aabb" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="160" y1="75" x2="148" y2="88" stroke="#aabbcc" strokeWidth="2" strokeLinecap="round" />
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

