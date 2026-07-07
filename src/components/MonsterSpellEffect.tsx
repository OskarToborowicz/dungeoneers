import { useEffect } from "react";

interface Props {
  spellName: string;
  onDone: () => void;
}

export function MonsterSpellEffect({ spellName, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="ability-effect-overlay">
      <svg viewBox="0 0 200 120" className="ability-effect-svg" overflow="visible">
        {spellName === "Fire Wall"        && <FireWallFx />}
        {spellName === "Chain Lightning"  && <ChainLightningFx />}
        {spellName === "Corpse Explosion" && <CorpseExplosionFx />}
        {spellName === "Ground Slam"      && <GroundSlamFx />}
        {spellName === "Blood Drain"      && <BloodDrainFx />}
        {spellName === "Poison Nova"      && <PoisonNovaFx />}
      </svg>
    </div>
  );
}

function FireWallFx() {
  return (
    <g>
      {/* Three fire pillars in the center of the arena */}
      <g className="mse-fire-pillar mse-fp-1" style={{ transformOrigin: "70px 110px" }}>
        <polygon points="70,110 63,72 67,52 70,40 73,52 77,72" fill="#ff4400" opacity="0.92"/>
        <polygon points="70,110 65,80 70,62 75,80" fill="#ff8800" opacity="0.85"/>
        <polygon points="70,110 67,88 70,76 73,88" fill="#ffcc00" opacity="0.8"/>
      </g>
      <g className="mse-fire-pillar mse-fp-2" style={{ transformOrigin: "100px 110px" }}>
        <polygon points="100,110 92,68 97,46 100,34 103,46 108,68" fill="#ff4400" opacity="0.92"/>
        <polygon points="100,110 95,78 100,58 105,78" fill="#ff8800" opacity="0.85"/>
        <polygon points="100,110 97,86 100,74 103,86" fill="#ffcc00" opacity="0.8"/>
      </g>
      <g className="mse-fire-pillar mse-fp-3" style={{ transformOrigin: "130px 110px" }}>
        <polygon points="130,110 123,72 127,52 130,40 133,52 137,72" fill="#ff4400" opacity="0.92"/>
        <polygon points="130,110 125,80 130,62 135,80" fill="#ff8800" opacity="0.85"/>
        <polygon points="130,110 127,88 130,76 133,88" fill="#ffcc00" opacity="0.8"/>
      </g>
      {/* Ground glow */}
      <ellipse cx="100" cy="110" rx="50" ry="6" fill="#ff4400" opacity="0.35" className="mse-fire-glow"/>
    </g>
  );
}

function ChainLightningFx() {
  return (
    <g className="mse-lightning">
      {/* Main bolt zigzagging from monster (right) to player (left) */}
      <polyline
        points="168,55 148,42 130,60 110,38 90,58 70,40 50,55 30,48"
        fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        className="mse-bolt-white"
      />
      <polyline
        points="168,55 148,42 130,60 110,38 90,58 70,40 50,55 30,48"
        fill="none" stroke="#88ccff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
        opacity="0.6" className="mse-bolt-glow"
      />
      {/* Branch bolt */}
      <polyline
        points="110,38 100,28 85,32"
        fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round"
        className="mse-bolt-white"
      />
      {/* Impact flash at player */}
      <circle cx="30" cy="48" r="12" fill="#88ccff" opacity="0.5" className="mse-bolt-impact"/>
    </g>
  );
}

function CorpseExplosionFx() {
  return (
    <g>
      {/* Expanding burst ring */}
      <circle cx="65" cy="60" r="8" fill="none" stroke="#556633" strokeWidth="3"
        className="mse-corpse-ring"/>
      <circle cx="65" cy="60" r="8" fill="none" stroke="#88aa44" strokeWidth="1.5"
        className="mse-corpse-ring-2"/>
      {/* Gunk splatter rays */}
      <g className="mse-corpse-burst" style={{ transformOrigin: "65px 60px" }}>
        <line x1="65" y1="60" x2="65" y2="32" stroke="#556633" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="65" y1="60" x2="89" y2="40" stroke="#556633" strokeWidth="3" strokeLinecap="round"/>
        <line x1="65" y1="60" x2="93" y2="60" stroke="#556633" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="65" y1="60" x2="89" y2="80" stroke="#556633" strokeWidth="3" strokeLinecap="round"/>
        <line x1="65" y1="60" x2="65" y2="88" stroke="#556633" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="65" y1="60" x2="41" y2="80" stroke="#556633" strokeWidth="3" strokeLinecap="round"/>
        <line x1="65" y1="60" x2="37" y2="60" stroke="#556633" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="65" y1="60" x2="41" y2="40" stroke="#556633" strokeWidth="3" strokeLinecap="round"/>
      </g>
      {/* Core flash */}
      <circle cx="65" cy="60" r="10" fill="#aacc55" opacity="0.6" className="mse-corpse-core"/>
    </g>
  );
}

function GroundSlamFx() {
  return (
    <g>
      {/* Shockwave rings expanding horizontally from impact point */}
      <ellipse cx="100" cy="105" rx="10" ry="4" fill="none" stroke="#aa8844" strokeWidth="3"
        className="mse-slam-wave mse-slam-w1"/>
      <ellipse cx="100" cy="105" rx="10" ry="4" fill="none" stroke="#cc9955" strokeWidth="2"
        className="mse-slam-wave mse-slam-w2"/>
      <ellipse cx="100" cy="105" rx="10" ry="4" fill="none" stroke="#aa8844" strokeWidth="1.5"
        className="mse-slam-wave mse-slam-w3"/>
      {/* Ground cracks */}
      <g className="mse-slam-cracks" style={{ transformOrigin: "100px 105px" }}>
        <line x1="100" y1="105" x2="60"  y2="90"  stroke="#886633" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="100" y1="105" x2="140" y2="90"  stroke="#886633" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="100" y1="105" x2="50"  y2="105" stroke="#886633" strokeWidth="2"   strokeLinecap="round"/>
        <line x1="100" y1="105" x2="150" y2="105" stroke="#886633" strokeWidth="2"   strokeLinecap="round"/>
        <line x1="100" y1="105" x2="70"  y2="116" stroke="#886633" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="100" y1="105" x2="130" y2="116" stroke="#886633" strokeWidth="1.8" strokeLinecap="round"/>
      </g>
      {/* Dust cloud */}
      <ellipse cx="100" cy="100" rx="30" ry="10" fill="#aa8844" opacity="0.3" className="mse-slam-dust"/>
    </g>
  );
}

function BloodDrainFx() {
  return (
    <g className="mse-drain">
      {/* Three curved streams from player (left) to monster (right) */}
      <path d="M35,45 C70,20 120,30 165,50" fill="none" stroke="#cc0022" strokeWidth="3"
        strokeLinecap="round" className="mse-drain-stream mse-ds-1"
        strokeDasharray="140" strokeDashoffset="140"/>
      <path d="M35,60 C70,55 120,55 165,60" fill="none" stroke="#aa0018" strokeWidth="2.5"
        strokeLinecap="round" className="mse-drain-stream mse-ds-2"
        strokeDasharray="130" strokeDashoffset="130"/>
      <path d="M35,75 C70,90 120,80 165,68" fill="none" stroke="#cc0022" strokeWidth="2.5"
        strokeLinecap="round" className="mse-drain-stream mse-ds-3"
        strokeDasharray="140" strokeDashoffset="140"/>
      {/* Healing glow at monster */}
      <circle cx="163" cy="58" r="14" fill="#cc0022" opacity="0.3" className="mse-drain-heal"/>
    </g>
  );
}

function PoisonNovaFx() {
  return (
    <g>
      {/* Expanding rings from monster side */}
      <circle cx="155" cy="60" r="5" fill="none" stroke="#44cc22" strokeWidth="3"
        className="mse-nova mse-nova-1"/>
      <circle cx="155" cy="60" r="5" fill="none" stroke="#88ee44" strokeWidth="1.8"
        className="mse-nova mse-nova-2"/>
      <circle cx="155" cy="60" r="5" fill="none" stroke="#aa55ee" strokeWidth="1.5"
        className="mse-nova mse-nova-3"/>
      {/* Poison droplets riding the wave */}
      <g className="mse-nova-dots" style={{ transformOrigin: "155px 60px" }}>
        <circle cx="155" cy="42" r="3" fill="#44cc22" opacity="0.8"/>
        <circle cx="170" cy="50" r="2.5" fill="#66dd33" opacity="0.75"/>
        <circle cx="170" cy="70" r="3" fill="#44cc22" opacity="0.8"/>
        <circle cx="155" cy="78" r="2.5" fill="#66dd33" opacity="0.75"/>
        <circle cx="140" cy="70" r="3" fill="#44cc22" opacity="0.8"/>
        <circle cx="140" cy="50" r="2.5" fill="#66dd33" opacity="0.75"/>
      </g>
    </g>
  );
}
