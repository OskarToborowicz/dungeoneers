import type { ReactNode } from "react";
import bodyUrl from "../../../assets/classes/huntress/body.svg";
import weaponUrl from "../../../assets/classes/huntress/weapon.svg";
import weaponUniqueUrl from "../../../assets/classes/huntress/weapon_unique.svg";

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
  return <image href={weaponUrl} {...IMG} />;
}

export function uniqueWeapon(_color: string): ReactNode {
  return <image href={weaponUniqueUrl} {...IMG} />;
}
