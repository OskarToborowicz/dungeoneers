import type { ReactNode } from "react";
import bodyUrl from "../../../assets/classes/sorceress/body.svg";

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

export function weapon(color: string): ReactNode {
  return (
    <>
      <line x1="56" y1="52" x2="58" y2="2" strokeWidth="3" />
      <circle cx="58" cy="2" r="8" />
      <circle
        cx="58"
        cy="2"
        r="5"
        fill={color}
        fillOpacity="0.45"
        stroke="none"
      />
    </>
  );
}

export function uniqueWeapon(color: string): ReactNode {
  return (
    <>
      <line x1="56" y1="52" x2="58" y2="2" strokeWidth="3" />
      <path d="M58 -10 L66 2 L58 14 L50 2 Z" />
      <line x1="58" y1="-14" x2="58" y2="-10" strokeWidth="2.2" />
      <line x1="44" y1="2" x2="50" y2="2" strokeWidth="2.2" />
      <line x1="66" y1="2" x2="72" y2="2" strokeWidth="2.2" />
      <line x1="49" y1="-8" x2="52" y2="-5" strokeWidth="2" />
      <line x1="67" y1="-8" x2="64" y2="-5" strokeWidth="2" />
      <path
        d="M58 -4 L62 2 L58 8 L54 2 Z"
        fill={color}
        fillOpacity="0.5"
        stroke="none"
      />
    </>
  );
}
