import { useEffect } from "react";
import type React from "react";

export type ProjectileKind = "fireball" | "holy_bolt" | "poison_orb" | "frost_arrow";

const TOTAL_MS: Record<ProjectileKind, number> = {
  fireball:    830,
  holy_bolt:   730,
  poison_orb:  950,
  frost_arrow: 500,
};

interface Props {
  kind: ProjectileKind;
  onDone: () => void;
  distance: number;
}

export function ProjectileEffect({ kind, onDone, distance }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, TOTAL_MS[kind]);
    return () => clearTimeout(t);
  }, [kind, onDone]);

  return (
    <div className="projectile-layer" style={{ "--proj-dist": `${distance}px` } as React.CSSProperties}>
      {kind === "fireball" && (
        <>
          <svg className="proj-orb proj-orb--fireball" viewBox="0 0 24 24" width="22" height="22" overflow="visible"
            style={{ position: "absolute", left: "120px", top: "84px" }}>
            <ellipse cx="-8" cy="12" rx="14" ry="4" fill="#ffaa44" opacity="0.4" />
            <circle cx="12" cy="12" r="10" fill="#ff6010" opacity="0.95" />
            <circle cx="9"  cy="9"  r="4"  fill="white"   opacity="0.4" />
          </svg>
          <svg className="proj-burst proj-burst--fireball" viewBox="0 0 80 80" width="80" height="80" overflow="visible"
            style={{ position: "absolute", left: `calc(120px + ${distance}px)`, top: "84px", transform: "translate(-50%,-50%)" }}>
            <circle cx="40" cy="40" r="36" fill="#ff3300" />
            <circle cx="40" cy="40" r="23" fill="#ff7700" />
            <circle cx="40" cy="40" r="12" fill="#ffee44" />
            {[0,45,90,135,180,225,270,315].map((deg) => (
              <line key={deg} x1="40" y1="40"
                x2={40 + Math.cos(deg * Math.PI / 180) * 45}
                y2={40 + Math.sin(deg * Math.PI / 180) * 45}
                stroke="#ffcc44" strokeWidth="2.5" />
            ))}
          </svg>
        </>
      )}
      {kind === "holy_bolt" && (
        <>
          <svg className="proj-orb proj-orb--holy" viewBox="0 0 24 24" width="18" height="18" overflow="visible"
            style={{ position: "absolute", left: "120px", top: "86px" }}>
            <ellipse cx="-6" cy="12" rx="12" ry="3.5" fill="white" opacity="0.35" />
            <circle cx="12" cy="12" r="9" fill="#ffe066" opacity="0.95" />
            <circle cx="9"  cy="9"  r="3.5" fill="white" opacity="0.5" />
          </svg>
          {/* <svg className="proj-burst proj-burst--holy" viewBox="0 0 80 80" width="80" height="80" overflow="visible"
            style={{ position: "absolute", left: `calc(120px + ${distance}px)`, top: "86px", transform: "translate(-50%,-50%)" }}>
            <circle cx="40" cy="40" r="34" fill="none" stroke="#ffe066" strokeWidth="4" />
            <circle cx="40" cy="40" r="22" fill="#fffbe0" />
            <line x1="40" y1="12" x2="40" y2="68" stroke="white" strokeWidth="4" />
            <line x1="12" y1="40" x2="68" y2="40" stroke="white" strokeWidth="4" />
            <circle cx="40" cy="40" r="10" fill="white" />
          </svg> */}
        </>
      )}
      {kind === "poison_orb" && (
        <>
          {/* <svg className="proj-orb proj-orb--poison" viewBox="0 0 24 24" width="20" height="20" overflow="visible"
            style={{ position: "absolute", left: "120px", top: "85px" }}>
            <ellipse cx="-6" cy="12" rx="12" ry="4" fill="#99ff66" opacity="0.35" />
            <circle cx="12" cy="12" r="10" fill="#55cc33" opacity="0.95" />
            <circle cx="9"  cy="9"  r="4"  fill="#aaffaa" opacity="0.4" />
          </svg> */}
          <svg className="proj-burst proj-burst--poison" viewBox="0 0 100 100" width="100" height="100" overflow="visible"
            style={{ position: "absolute", left: `calc(120px + ${distance}px)`, top: "85px", transform: "translate(-50%,-50%)" }}>
            <ellipse cx="50" cy="50" rx="44" ry="32" fill="#33bb22" opacity="0.5" />
            <ellipse cx="36" cy="42" rx="24" ry="18" fill="#55dd33" opacity="0.55" />
            <ellipse cx="64" cy="44" rx="20" ry="16" fill="#44cc22" opacity="0.55" />
            <ellipse cx="50" cy="58" rx="18" ry="14" fill="#66ee44" opacity="0.5" />
            <circle cx="30" cy="36" r="6" fill="#88ff66" opacity="0.7" />
            <circle cx="68" cy="40" r="5" fill="#88ff66" opacity="0.7" />
            <circle cx="50" cy="28" r="4" fill="#aaff88" opacity="0.8" />
          </svg>
        </>
      )}
      {kind === "frost_arrow" && (
        <>
          {/* <svg className="proj-orb proj-orb--frost" viewBox="0 0 30 14" width="30" height="14" overflow="visible"
            style={{ position: "absolute", left: "120px", top: "88px" }}>
            <polygon points="28,7 10,2 14,7 10,12" fill="#aaddff" opacity="0.9" />
            <line x1="10" y1="7" x2="0" y2="7" stroke="#66ccff" strokeWidth="1.5" opacity="0.6" />
          </svg> */}
          <svg className="proj-burst proj-burst--frost" viewBox="0 0 60 60" width="60" height="60" overflow="visible"
            style={{ position: "absolute", left: `calc(120px + ${distance}px)`, top: "88px", transform: "translate(-50%,-50%)" }}>
            {[0,60,120,180,240,300].map((deg) => (
              <line key={deg} x1="30" y1="30"
                x2={30 + Math.cos(deg * Math.PI / 180) * 26}
                y2={30 + Math.sin(deg * Math.PI / 180) * 26}
                stroke="#aaddff" strokeWidth="2" />
            ))}
            <circle cx="30" cy="30" r="8" fill="#cceeff" opacity="0.9" />
          </svg>
        </>
      )}
    </div>
  );
}
