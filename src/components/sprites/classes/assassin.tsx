import type { ReactNode } from "react";
import bodyUrl from "../../../assets/classes/assassin/body.svg";
import weaponUrl from "../../../assets/classes/assassin/weapon.svg";
import uniqueWeaponUrl from "../../../assets/classes/assassin/unique_weapon.svg";
import offhandUrl from "../../../assets/classes/assassin/offhand.svg";
import uniqueOffhandUrl from "../../../assets/classes/assassin/unique_offhand.svg";
const IMG = {
  x: "-8",
  y: "-4",
  width: "80",
  height: "104",
  preserveAspectRatio: "xMidYMid meet",
} as const;

export function body(): ReactNode {
  return <image href={bodyUrl} {...IMG} />;
}

export function weapon(_color: string): ReactNode {
  return (
    <g>
      <image href={weaponUrl} {...IMG} />
    </g>
  );
}

export function uniqueWeapon(_color: string): ReactNode {
  return (
    <g>
      <image href={uniqueWeaponUrl} {...IMG} />
    </g>
  );
}

export function offHand(_color: string): ReactNode {
  return (
    <g>
      <image href={offhandUrl} {...IMG} />
    </g>
  );
}

export function uniqueOffHand(_color: string): ReactNode {
  return (
    <g>
      <image href={uniqueOffhandUrl} {...IMG} />
    </g>
  );
}
