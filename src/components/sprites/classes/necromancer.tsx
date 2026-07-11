import type { ReactNode } from "react";
import necromancerUrl from "../../../assets/Necromancer.svg";

export function body(): ReactNode {
  return (
    <image
      href={necromancerUrl}
      x="-8"
      y="-4"
      width="80"
      height="104"
      preserveAspectRatio="xMidYMid meet"
    />
  );
}

// Weapon is part of the illustration — no overlay needed for base
export function weapon(_color: string): ReactNode {
  return null;
}

export function uniqueWeapon(_color: string): ReactNode {
  return null;
}
