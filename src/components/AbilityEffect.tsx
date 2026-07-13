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

export const ATTACK_EFFECT_CLASSES = new Set<ClassId>(["amazon"]);

export function AbilityEffect({
  classId,
  onDone,
  detonation = false,
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
        {classId === "barbarian" && <WhirlwindFx />}
        {classId === "necromancer" && !useAbility2 && <PoisonCloudFx />}
        {classId === "necromancer" && useAbility2 && <GolemRollInFx />}
        {classId === "sorceress" && !useAbility2 && <FireballFx />}
        {classId === "sorceress" && useAbility2 && <FrostShieldFx />}
        {classId === "amazon" && useAttack && <SingleArrowFx />}
        {classId === "amazon" && !useAbility2 && !useAttack && <MultishotFx />}
        {classId === "amazon" && useAbility2 && <FreezingArrowFx />}
        {classId === "paladin" && !useAbility2 && <HolyBoltFx />}
        {classId === "paladin" && useAbility2 && <RegenNovaFx />}
        {classId === "druid" && <BiteFx />}
        {classId === "monk" && !useAbility2 && <SpinningCraneKickFx />}
        {classId === "monk" && useAbility2 && <SerenityFx />}
        {classId === "assassin" && !detonation && !useAbility2 && (
          <TrapPlantFx />
        )}
        {classId === "assassin" && detonation && <TrapDetonateFx />}
        {classId === "assassin" && useAbility2 && <BlindingPowderFx />}
      </svg>
    </div>
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

function FireballFx() {
  return (
    <g>
      <g className="ae-fb-orb" style={{ transformOrigin: "32px 60px" }}>
        <ellipse cx="20" cy="60" rx="13" ry="4" fill="#ffaa44" opacity="0.4" />
        <circle cx="32" cy="60" r="11" fill="#ff6010" opacity="0.95" />
        <circle cx="29" cy="57" r="4" fill="white" opacity="0.4" />
      </g>
      <g className="ae-fb-burst" style={{ transformOrigin: "168px 60px" }}>
        <circle cx="168" cy="60" r="28" fill="#ff3300" opacity="0.85" />
        <circle cx="168" cy="60" r="17" fill="#ff7700" />
        <circle cx="168" cy="60" r="9" fill="#ffee44" />
        {([0, 45, 90, 135, 180, 225, 270, 315] as number[]).map((deg) => (
          <line
            key={deg}
            x1="168"
            y1="60"
            x2={168 + Math.cos((deg * Math.PI) / 180) * 44}
            y2={60 + Math.sin((deg * Math.PI) / 180) * 44}
            stroke="#ffcc44"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
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

function BiteFx() {
  return (
    <g className="ae-bite-group">
      <line
        className="ae-claw ae-claw-1"
        x1="100"
        y1="30"
        x2="132"
        y2="70"
        stroke="#88aa22"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="52"
        strokeDashoffset="52"
      />
      <line
        className="ae-claw ae-claw-2"
        x1="114"
        y1="26"
        x2="146"
        y2="66"
        stroke="#aacc33"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="52"
        strokeDashoffset="52"
      />
      <line
        className="ae-claw ae-claw-3"
        x1="128"
        y1="22"
        x2="160"
        y2="62"
        stroke="#88aa22"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="52"
        strokeDashoffset="52"
      />
    </g>
  );
}

function TrapPlantFx() {
  return (
    <g>
      {/* Device thrown from player to enemy */}
      <g className="ae-trap-throw" style={{ transformOrigin: "150px 84px" }}>
        <rect
          x="143"
          y="80"
          width="14"
          height="8"
          rx="2"
          fill="#33aacc"
          opacity="0.9"
        />
        <rect
          x="147"
          y="76"
          width="6"
          height="4"
          rx="1"
          fill="#55ccee"
          opacity="0.85"
        />
      </g>
      {/* Trap plants at enemy position after throw */}
      <g className="ae-trap-plant" style={{ transformOrigin: "150px 88px" }}>
        <rect
          x="138"
          y="84"
          width="24"
          height="8"
          rx="3"
          fill="#33aacc"
          opacity="0.9"
        />
        <rect
          x="146"
          y="80"
          width="8"
          height="4"
          rx="1"
          fill="#55ccee"
          opacity="0.85"
        />
        <line
          x1="150"
          y1="84"
          x2="150"
          y2="70"
          stroke="#33aacc"
          strokeWidth="2"
          strokeLinecap="round"
          className="ae-trap-spark ae-ts-1"
        />
        <line
          x1="150"
          y1="84"
          x2="164"
          y2="74"
          stroke="#33aacc"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="ae-trap-spark ae-ts-2"
        />
        <line
          x1="150"
          y1="84"
          x2="136"
          y2="74"
          stroke="#33aacc"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="ae-trap-spark ae-ts-3"
        />
        <line
          x1="150"
          y1="84"
          x2="168"
          y2="84"
          stroke="#33aacc"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="ae-trap-spark ae-ts-4"
        />
        <line
          x1="150"
          y1="84"
          x2="132"
          y2="84"
          stroke="#33aacc"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="ae-trap-spark ae-ts-5"
        />
        <circle
          cx="150"
          cy="85"
          r="16"
          fill="none"
          stroke="#33aacc"
          strokeWidth="1.5"
          opacity="0.5"
          className="ae-trap-ring"
        />
      </g>
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

function RegenNovaFx() {
  return (
    <g style={{ transformOrigin: "70px 60px" }}>
      {/* Expanding outer ring */}
      <circle
        className="ae-regen-ring-1"
        cx="70"
        cy="60"
        r="28"
        fill="none"
        stroke="#aaee88"
        strokeWidth="2.5"
        opacity="0.85"
        style={{ transformOrigin: "70px 60px" }}
      />
      {/* Mid ring delayed */}
      <circle
        className="ae-regen-ring-2"
        cx="70"
        cy="60"
        r="18"
        fill="none"
        stroke="#ddffa0"
        strokeWidth="2"
        opacity="0.9"
        style={{ transformOrigin: "70px 60px" }}
      />
      {/* Soft glow core */}
      <g className="ae-regen-core" style={{ transformOrigin: "70px 60px" }}>
        <circle cx="70" cy="60" r="12" fill="#99ee66" opacity="0.55" />
        <circle cx="70" cy="60" r="6" fill="#eeffbb" opacity="0.9" />
        <circle cx="70" cy="60" r="3" fill="#ffffff" opacity="0.95" />
      </g>
      {/* Rising sparkles */}
      <circle
        className="ae-regen-spark ae-rs-1"
        cx="70"
        cy="42"
        r="2.2"
        fill="#bbff77"
        opacity="0.9"
        style={{ transformOrigin: "70px 42px" }}
      />
      <circle
        className="ae-regen-spark ae-rs-2"
        cx="54"
        cy="50"
        r="1.8"
        fill="#aaffaa"
        opacity="0.85"
        style={{ transformOrigin: "54px 50px" }}
      />
      <circle
        className="ae-regen-spark ae-rs-3"
        cx="86"
        cy="50"
        r="1.8"
        fill="#ccff88"
        opacity="0.85"
        style={{ transformOrigin: "86px 50px" }}
      />
      <circle
        className="ae-regen-spark ae-rs-4"
        cx="60"
        cy="36"
        r="1.5"
        fill="#eeffcc"
        opacity="0.8"
        style={{ transformOrigin: "60px 36px" }}
      />
      <circle
        className="ae-regen-spark ae-rs-5"
        cx="80"
        cy="36"
        r="1.5"
        fill="#eeffcc"
        opacity="0.8"
        style={{ transformOrigin: "80px 36px" }}
      />
    </g>
  );
}

function BlindingPowderFx() {
  return (
    <g>
      {/* Powder pouch traveling toward the monster */}
      <g className="ae-powder-travel" style={{ transformOrigin: "80px 65px" }}>
        <ellipse cx="80" cy="65" rx="9" ry="7" fill="#d4aa55" opacity="0.92" />
        <ellipse cx="80" cy="61" rx="5" ry="3" fill="#e8cc88" opacity="0.8" />
        {/* Trailing dust puffs */}
        <circle
          cx="62"
          cy="60"
          r="5"
          fill="#c9a040"
          opacity="0.55"
          className="ae-powder-trail ae-pt-1"
        />
        <circle
          cx="50"
          cy="63"
          r="4"
          fill="#b89030"
          opacity="0.4"
          className="ae-powder-trail ae-pt-2"
        />
        <circle
          cx="38"
          cy="61"
          r="3"
          fill="#a07820"
          opacity="0.28"
          className="ae-powder-trail ae-pt-3"
        />
      </g>
      {/* Impact dust cloud on monster side */}
      <g className="ae-powder-burst" style={{ transformOrigin: "152px 65px" }}>
        <circle cx="152" cy="65" r="22" fill="#d4aa55" opacity="0.75" />
        <circle cx="152" cy="65" r="14" fill="#e8cc88" opacity="0.85" />
        <circle cx="152" cy="65" r="7" fill="#fff8e0" opacity="0.9" />
        <circle
          cx="130"
          cy="53"
          r="8"
          fill="#c9a040"
          opacity="0.6"
          className="ae-powder-puff ae-pp-1"
        />
        <circle
          cx="174"
          cy="50"
          r="7"
          fill="#d4b050"
          opacity="0.55"
          className="ae-powder-puff ae-pp-2"
        />
        <circle
          cx="178"
          cy="75"
          r="9"
          fill="#c09030"
          opacity="0.58"
          className="ae-powder-puff ae-pp-3"
        />
        <circle
          cx="132"
          cy="80"
          r="8"
          fill="#ccaa44"
          opacity="0.55"
          className="ae-powder-puff ae-pp-4"
        />
        <circle
          cx="152"
          cy="42"
          r="6"
          fill="#ddc060"
          opacity="0.5"
          className="ae-powder-puff ae-pp-5"
        />
        <circle
          cx="152"
          cy="88"
          r="6"
          fill="#bba030"
          opacity="0.5"
          className="ae-powder-puff ae-pp-6"
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

function TrapDetonateFx() {
  return (
    <g>
      {/* Central explosion on monster side */}
      <g className="ae-trap-det-core" style={{ transformOrigin: "140px 65px" }}>
        <circle cx="140" cy="65" r="20" fill="#ff5500" opacity="0.88" />
        <circle cx="140" cy="65" r="12" fill="#ff9900" opacity="0.9" />
        <circle cx="140" cy="65" r="5" fill="#ffee44" opacity="0.95" />
      </g>
      {/* Explosion rays */}
      <g className="ae-trap-det-rays" style={{ transformOrigin: "140px 65px" }}>
        <line
          x1="140"
          y1="45"
          x2="140"
          y2="22"
          stroke="#ff6600"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="154"
          y1="51"
          x2="170"
          y2="36"
          stroke="#ff6600"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="160"
          y1="65"
          x2="184"
          y2="65"
          stroke="#ff6600"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="154"
          y1="79"
          x2="170"
          y2="94"
          stroke="#ff6600"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="140"
          y1="85"
          x2="140"
          y2="108"
          stroke="#ff6600"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="126"
          y1="79"
          x2="110"
          y2="94"
          stroke="#ff6600"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="120"
          y1="65"
          x2="96"
          y2="65"
          stroke="#ff6600"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="126"
          y1="51"
          x2="110"
          y2="36"
          stroke="#ff6600"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}
