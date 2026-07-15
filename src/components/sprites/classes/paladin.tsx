import type { ReactNode } from "react";
import bodyUrl from "../../../assets/classes/paladin/body.svg";
import weaponUrl from "../../../assets/classes/paladin/weapon.svg";
import uniqueWeaponUrl from "../../../assets/classes/paladin/unique_weapon.svg";
import offHandUrl from "../../../assets/classes/paladin/off_hand.svg";

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

export function offHand(): ReactNode {
  return <image href={offHandUrl} {...IMG} />;
}
