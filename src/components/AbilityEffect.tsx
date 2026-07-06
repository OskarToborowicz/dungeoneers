import { useEffect } from "react";
import type { ClassId } from "../game/types";

interface Props {
  classId: ClassId;
  onDone: () => void;
}

export function AbilityEffect({ classId, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="ability-effect-overlay">
      <svg viewBox="0 0 200 120" className="ability-effect-svg" overflow="visible">
        {classId === "barbarian"   && <WhirlwindFx />}
        {classId === "necromancer" && <PoisonFx />}
        {classId === "sorceress"   && <FireballFx />}
        {classId === "amazon"      && <MultishotFx />}
        {classId === "paladin"     && <HolyBoltFx />}
        {classId === "druid"       && <BiteFx />}
      </svg>
    </div>
  );
}

function WhirlwindFx() {
  return (
    <g className="ae-whirlwind" style={{ transformOrigin: "130px 60px" }}>
      <circle cx="130" cy="60" r="7" fill="#e04020" opacity="0.85" />
      {/* 6 curved vortex arms */}
      <path d="M130 60 Q153 41 172 60" fill="none" stroke="#e04020" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M130 60 Q158 70 151 97" fill="none" stroke="#e04020" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M130 60 Q135 89 109 97" fill="none" stroke="#e04020" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M130 60 Q108 79 88 60"  fill="none" stroke="#e04020" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M130 60 Q102 50 109 23" fill="none" stroke="#e04020" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M130 60 Q125 31 151 23" fill="none" stroke="#e04020" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="130" cy="60" r="42" fill="none" stroke="#e04020" strokeWidth="1.5" opacity="0.35" strokeDasharray="6 4"/>
    </g>
  );
}

function PoisonFx() {
  return (
    <g>
      {/* Dagger rotated 90° pointing right toward enemy */}
      <g className="ae-dagger-group" style={{ transformOrigin: "135px 60px" }}>
        <polygon points="168,60 124,56 124,64" fill="#aa55ee" stroke="#cc77ff" strokeWidth="0.8"/>
        <rect x="119" y="52" width="5" height="16" rx="1" fill="#aa55ee"/>
        <rect x="103" y="57" width="16" height="6" rx="2" fill="#7a3aaa"/>
      </g>
      {/* Poison cloud puffs */}
      <g className="ae-cloud-1" style={{ transformOrigin: "148px 52px" }}>
        <circle cx="148" cy="52" r="11" fill="#44cc33" opacity="0.72"/>
        <circle cx="140" cy="47" r="8"  fill="#55dd44" opacity="0.6"/>
        <circle cx="156" cy="46" r="7"  fill="#33aa22" opacity="0.55"/>
      </g>
      <g className="ae-cloud-2" style={{ transformOrigin: "163px 63px" }}>
        <circle cx="163" cy="63" r="9"  fill="#aa55ee" opacity="0.65"/>
        <circle cx="155" cy="59" r="6"  fill="#bb66ff" opacity="0.5"/>
        <circle cx="169" cy="57" r="6"  fill="#8833cc" opacity="0.5"/>
      </g>
      <g className="ae-cloud-3" style={{ transformOrigin: "150px 74px" }}>
        <circle cx="150" cy="74" r="10" fill="#44cc33" opacity="0.68"/>
        <circle cx="142" cy="70" r="7"  fill="#55dd44" opacity="0.55"/>
        <circle cx="158" cy="71" r="6"  fill="#33aa22" opacity="0.5"/>
      </g>
    </g>
  );
}

function FireballFx() {
  return (
    <g>
      {/* Core fireball */}
      <g className="ae-fireball-core" style={{ transformOrigin: "130px 60px" }}>
        <circle cx="130" cy="60" r="18" fill="#ff5500" opacity="0.9"/>
        <circle cx="130" cy="60" r="11" fill="#ff9900" opacity="0.9"/>
        <circle cx="130" cy="60" r="5"  fill="#ffee44" opacity="0.95"/>
      </g>
      {/* Explosion rays */}
      <g className="ae-fireball-rays" style={{ transformOrigin: "130px 60px" }}>
        <line x1="148" y1="60"  x2="172" y2="60"  stroke="#ff6600" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="143" y1="73"  x2="160" y2="90"  stroke="#ff6600" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="130" y1="78"  x2="130" y2="102" stroke="#ff6600" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="117" y1="73"  x2="100" y2="90"  stroke="#ff6600" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="112" y1="60"  x2="88"  y2="60"  stroke="#ff6600" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="117" y1="47"  x2="100" y2="30"  stroke="#ff6600" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="130" y1="42"  x2="130" y2="18"  stroke="#ff6600" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="143" y1="47"  x2="160" y2="30"  stroke="#ff6600" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
    </g>
  );
}

function MultishotFx() {
  return (
    <g>
      {/* Two arrows flying right */}
      <g className="ae-arrow ae-arrow-1">
        <line x1="60" y1="47" x2="96" y2="47" stroke="#44bb55" strokeWidth="2.2" strokeLinecap="round"/>
        <polygon points="96,43 110,47 96,51" fill="#44bb55"/>
      </g>
      <g className="ae-arrow ae-arrow-2">
        <line x1="55" y1="73" x2="91" y2="73" stroke="#44bb55" strokeWidth="2.2" strokeLinecap="round"/>
        <polygon points="91,69 105,73 91,77" fill="#44bb55"/>
      </g>
    </g>
  );
}

function HolyBoltFx() {
  return (
    <g className="ae-holy-bolt" style={{ transformOrigin: "130px 60px" }}>
      <circle cx="130" cy="60" r="40" fill="none" stroke="#ddaa22" strokeWidth="1.5" opacity="0.5"/>
      <line x1="130" y1="20" x2="130" y2="100" stroke="#ddaa22" strokeWidth="4" strokeLinecap="round"/>
      <line x1="90"  y1="60" x2="170" y2="60"  stroke="#ddaa22" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="130" cy="60" r="9" fill="#ffee44" opacity="0.95"/>
      <circle cx="130" cy="60" r="5" fill="#ffffff" opacity="0.8"/>
    </g>
  );
}

function BiteFx() {
  return (
    <g className="ae-bite-group">
      <line className="ae-claw ae-claw-1" x1="100" y1="30" x2="132" y2="70"
        stroke="#88aa22" strokeWidth="4" strokeLinecap="round"
        strokeDasharray="52" strokeDashoffset="52"/>
      <line className="ae-claw ae-claw-2" x1="114" y1="26" x2="146" y2="66"
        stroke="#aacc33" strokeWidth="3.5" strokeLinecap="round"
        strokeDasharray="52" strokeDashoffset="52"/>
      <line className="ae-claw ae-claw-3" x1="128" y1="22" x2="160" y2="62"
        stroke="#88aa22" strokeWidth="3" strokeLinecap="round"
        strokeDasharray="52" strokeDashoffset="52"/>
    </g>
  );
}
