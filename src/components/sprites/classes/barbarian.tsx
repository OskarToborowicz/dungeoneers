import type { ReactNode } from "react";
import bodyUrl from "../../../assets/classes/barbarian/body.svg";
import weaponUrl from "../../../assets/classes/barbarian/weapon.svg";
import uniqueWeaponUrl from "../../../assets/classes/barbarian/unique_weapon.svg";
import offhandUrl from "../../../assets/classes/barbarian/offhand.svg";
import uniqueOffhandUrl from "../../../assets/classes/barbarian/unique_offhand.svg";

const IMG = { x: "-8", y: "-4", width: "80", height: "104", preserveAspectRatio: "xMidYMid meet" } as const;

export function body(): ReactNode {
  return <image href={bodyUrl} {...IMG} />;
}

export function weapon(_color: string): ReactNode {
  return <image href={weaponUrl} {...IMG} />;
}

export function uniqueWeapon(_color: string): ReactNode {
  return <image href={uniqueWeaponUrl} {...IMG} />;
}

export function offHand(_color: string): ReactNode {
  return <image href={offhandUrl} {...IMG} />;
}

export function uniqueOffhand(_color: string): ReactNode {
  return <image href={uniqueOffhandUrl} {...IMG} />;
}
