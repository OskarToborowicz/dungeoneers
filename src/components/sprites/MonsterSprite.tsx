import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { SpriteState } from "./CharacterSprite";

interface Props {
  name: string;
  size?: number;
  state?: SpriteState;
}

const MONSTER_TYPES: Record<string, string> = {
  "Fallen One": "fallen",
  "Carrion Bird": "bird",
  "Fallen Shaman": "shaman",
  "Corpsefire": "boss_undead",
  "Zombie": "zombie",
  "Wailing Beast": "beast",
  "Devilkin": "fallen",
  "Bishibosh": "boss_shaman",
  "Quill Rat": "ratspike",
  "Cairn Wraith": "wraith",
  "Yeti": "brute",
  "Rakanishu": "boss_fallen",
  "Dark One": "fallen",
  "Vile Hag": "hag",
  "Brute": "brute",
  "Treehead Woodfist": "boss_tree",
  "Fallen Champion": "fallen_elite",
  "Scarab": "scarab",
  "Horror Archer": "skeleton_archer",
  "The Countess": "boss_countess",
  "Dark Stalker": "wraith",
  "Succubus": "succubus",
  "Vile Guardian": "brute",
  "Andariel": "boss_andariel",
};

const MONSTER_COLORS: Record<string, string> = {
  fallen: "#cc3300",
  fallen_elite: "#ff4411",
  bird: "#997755",
  shaman: "#dd6600",
  zombie: "#668844",
  beast: "#996655",
  ratspike: "#aaaa33",
  wraith: "#5566dd",
  brute: "#998877",
  hag: "#669955",
  scarab: "#aacc22",
  skeleton_archer: "#99bbaa",
  boss_undead: "#ff6622",
  boss_shaman: "#ffcc00",
  boss_fallen: "#ff4400",
  boss_tree: "#77aa33",
  boss_countess: "#dd2266",
  succubus: "#cc4488",
  boss_andariel: "#88cc22",
};

type AnimStyle = "float" | "sway" | "stomp" | "skitter" | "pulse" | "lurch";

const TYPE_ANIM: Record<string, AnimStyle> = {
  fallen: "skitter", fallen_elite: "skitter",
  bird: "float",
  shaman: "sway", hag: "sway",
  zombie: "lurch",
  beast: "stomp", brute: "stomp",
  ratspike: "skitter",
  wraith: "float",
  scarab: "skitter",
  skeleton_archer: "sway",
  boss_undead: "stomp", boss_shaman: "pulse",
  boss_fallen: "stomp", boss_tree: "stomp",
  boss_countess: "sway", boss_andariel: "pulse",
  succubus: "float",
};

function getAnimate(state: SpriteState, type: string) {
  const style: AnimStyle = TYPE_ANIM[type] ?? "sway";
  if (state === "idle") {
    if (style === "float")   return { y: [0, -8, 0], x: [0, 2, 0, -2, 0] };
    if (style === "sway")    return { x: [0, 4, 0, -4, 0], y: [0, -2, 0] };
    if (style === "stomp")   return { y: [0, -3, 0, -3, 0] };
    if (style === "skitter") return { x: [0, 3, -2, 3, 0], y: [0, -3, 0] };
    if (style === "pulse")   return { scale: [1, 1.04, 1], y: [0, -4, 0] };
    if (style === "lurch")   return { x: [0, -3, 0], y: [0, -2, 0] };
    return { y: [0, -5, 0] };
  }
  if (state === "attack") {
    if (style === "stomp" || style === "pulse") return { y: [0, -14, 6, 0], x: [0, -4, 0] };
    if (style === "skitter") return { x: [0, -14, 4, 0], y: [0, -6, 0] };
    if (style === "float")   return { y: [0, -14, 4, 0], x: [0, -6, 0] };
    return { y: [0, -12, 4, 0], x: [0, -4, 0] };
  }
  if (state === "hit") return { x: [0, 10, -10, 6, -6, 0] };
  return { y: 26, opacity: 0.25 };
}

function getTransition(state: SpriteState, type: string) {
  const style: AnimStyle = TYPE_ANIM[type] ?? "sway";
  if (state === "idle") {
    const dur = style === "skitter" ? 1.2 : style === "stomp" ? 1.6 : style === "float" ? 2.8 : style === "lurch" ? 3.2 : 2.0;
    return { duration: dur, repeat: Infinity, ease: "easeInOut" as const };
  }
  if (state === "attack") return { duration: 0.4 };
  if (state === "hit")    return { duration: 0.38 };
  return { duration: 0.55, ease: "easeIn" as const };
}

const SPRITES: Record<string, ReactNode> = {
  fallen: (
    <>
      {/* Small horns */}
      <polygon points="26,24 22,8 30,20" />
      <polygon points="38,24 42,8 34,20" />
      {/* Round squat head */}
      <ellipse cx="32" cy="26" rx="11" ry="12" />
      {/* Glowing eyes */}
      <ellipse cx="27" cy="25" rx="3.5" ry="3.5" fill="#ff2200" stroke="none" />
      <ellipse cx="37" cy="25" rx="3.5" ry="3.5" fill="#ff2200" stroke="none" />
      {/* Crouching torso */}
      <path d="M18 40 L46 40 L48 68 L16 68 Z" />
      {/* Stubby legs */}
      <rect x="16" y="68" width="13" height="22" rx="3" />
      <rect x="35" y="68" width="13" height="22" rx="3" />
      {/* Arms with claws */}
      <path d="M18 44 L4 60 L12 62 L22 50 Z" />
      <path d="M46 44 L60 60 L52 62 L42 50 Z" />
      {/* Claws */}
      <path d="M4 60 L0 54 M6 60 L2 54 M8 60 L4 55" strokeWidth="1.5" />
      <path d="M60 60 L64 54 M58 60 L62 54 M56 60 L60 55" strokeWidth="1.5" />
    </>
  ),

  fallen_elite: (
    <>
      {/* Larger horns */}
      <polygon points="24,22 18,2 30,18" />
      <polygon points="40,22 46,2 34,18" />
      {/* Head */}
      <ellipse cx="32" cy="24" rx="12" ry="13" />
      {/* War paint slashes */}
      <line x1="24" y1="22" x2="20" y2="30" strokeWidth="2" stroke="currentColor" strokeOpacity="0.6" />
      <line x1="40" y1="22" x2="44" y2="30" strokeWidth="2" stroke="currentColor" strokeOpacity="0.6" />
      {/* Eyes */}
      <ellipse cx="27" cy="22" rx="3.5" ry="3.5" fill="#ff3300" stroke="none" />
      <ellipse cx="37" cy="22" rx="3.5" ry="3.5" fill="#ff3300" stroke="none" />
      {/* Armored torso */}
      <path d="M16 38 L48 38 L50 68 L14 68 Z" />
      {/* Armor lines */}
      <line x1="32" y1="40" x2="32" y2="66" strokeWidth="1.5" strokeOpacity="0.4" />
      {/* Legs */}
      <rect x="14" y="68" width="15" height="24" rx="3" />
      <rect x="35" y="68" width="15" height="24" rx="3" />
      {/* Arms + sword */}
      <path d="M16 42 L2 60 L10 64 L22 48 Z" />
      <path d="M48 42 L60 56 L54 62 L42 48 Z" />
      {/* Sword blade */}
      <path d="M60 56 L64 30 L56 54 Z" />
    </>
  ),

  bird: (
    <>
      {/* Wings spread wide */}
      <path d="M32 48 C20 42 8 30 4 16 C10 18 14 26 18 32 C14 20 16 8 24 10 C24 22 24 34 30 44 Z" />
      <path d="M32 48 C44 42 56 30 60 16 C54 18 50 26 46 32 C50 20 48 8 40 10 C40 22 40 34 34 44 Z" />
      {/* Body */}
      <ellipse cx="32" cy="52" rx="12" ry="16" />
      {/* Head */}
      <circle cx="32" cy="30" r="10" />
      {/* Hooked beak */}
      <path d="M38 28 L52 30 L44 36 Z" />
      {/* Eye */}
      <circle cx="28" cy="28" r="3" fill="#000" stroke="none" />
      <circle cx="27" cy="27" r="1.2" fill="#fff" stroke="none" fillOpacity="0.7" />
      {/* Talons */}
      <path d="M26 66 L22 78 M30 68 L26 80 M36 68 L40 78" strokeWidth="3" />
    </>
  ),

  shaman: (
    <>
      {/* Small horns */}
      <polygon points="26,22 22,6 30,18" />
      <polygon points="38,22 42,6 34,18" />
      {/* Head */}
      <ellipse cx="32" cy="24" rx="10" ry="11" />
      {/* Orange eyes */}
      <ellipse cx="27" cy="23" rx="3" ry="3" fill="#ffaa00" stroke="none" />
      <ellipse cx="37" cy="23" rx="3" ry="3" fill="#ffaa00" stroke="none" />
      {/* Robed torso */}
      <path d="M20 34 L44 34 L46 66 L18 66 Z" />
      {/* Legs */}
      <rect x="18" y="66" width="12" height="24" rx="3" />
      <rect x="34" y="66" width="12" height="24" rx="3" />
      {/* Left arm */}
      <path d="M20 40 L6 56 L12 60 L24 46 Z" />
      {/* Right arm + staff */}
      <path d="M44 38 L54 52 L50 56 L40 44 Z" />
      {/* Staff */}
      <rect x="52" y="2" width="4" height="54" rx="2" />
      {/* Flame on staff */}
      <path d="M54 2 C50 -4 52 -10 54 -6 C56 -10 58 -4 54 2 Z" fill="currentColor" fillOpacity="0.6" stroke="none" />
      <circle cx="54" cy="2" r="5" />
    </>
  ),

  zombie: (
    <>
      {/* Large decaying head */}
      <ellipse cx="32" cy="18" rx="13" ry="14" />
      {/* Hollow eyes */}
      <ellipse cx="25" cy="16" rx="4" ry="4.5" fill="#000" stroke="none" />
      <ellipse cx="39" cy="16" rx="4" ry="4.5" fill="#000" stroke="none" />
      {/* Slack jaw */}
      <path d="M22 26 Q32 32 42 26" fill="none" strokeWidth="2" />
      <path d="M26 26 L25 31 M32 28 L31 33 M38 26 L37 31" strokeWidth="1.8" />
      {/* Hunched torso */}
      <path d="M16 34 L48 34 L46 66 L18 66 Z" />
      {/* Torn rags */}
      <path d="M16 34 L10 46 M48 34 L54 46" strokeWidth="1.2" strokeOpacity="0.5" />
      {/* Legs */}
      <rect x="16" y="66" width="14" height="26" rx="3" />
      <rect x="34" y="66" width="14" height="26" rx="3" />
      {/* Arms outstretched */}
      <path d="M16 38 L0 50 L6 56 L20 46 Z" />
      <path d="M48 38 L64 50 L58 56 L44 46 Z" />
    </>
  ),

  beast: (
    <>
      {/* Pointed ears */}
      <polygon points="22,14 16,0 28,12" />
      <polygon points="42,14 48,0 36,12" />
      {/* Wolf head */}
      <ellipse cx="32" cy="20" rx="14" ry="15" />
      {/* Snout */}
      <path d="M40 24 L56 20 L40 30 Z" />
      {/* Eyes */}
      <ellipse cx="25" cy="18" rx="3.5" ry="3.5" fill="#ffcc00" stroke="none" />
      <ellipse cx="39" cy="18" rx="3.5" ry="3.5" fill="#ffcc00" stroke="none" />
      {/* Fangs */}
      <path d="M38 30 L36 36 M42 30 L40 36" strokeWidth="2" />
      {/* Body */}
      <path d="M14 38 L50 38 L52 74 L12 74 Z" />
      {/* Legs */}
      <rect x="12" y="74" width="16" height="18" rx="3" />
      <rect x="36" y="74" width="16" height="18" rx="3" />
      {/* Clawed arms */}
      <path d="M14 42 L0 60 L8 64 L20 48 Z" />
      <path d="M50 42 L64 60 L56 64 L44 48 Z" />
    </>
  ),

  ratspike: (
    <>
      {/* Spiky back quills */}
      <path d="M16 44 L12 28 M22 40 L18 22 M28 38 L26 20 M36 38 L38 20 M42 40 L46 22 M48 44 L52 28"
        strokeWidth="2.5" />
      {/* Oval body */}
      <ellipse cx="32" cy="56" rx="20" ry="18" />
      {/* Head (to the right) */}
      <ellipse cx="46" cy="44" rx="10" ry="9" />
      {/* Pointed snout */}
      <path d="M54 42 L64 44 L54 48 Z" />
      {/* Eye */}
      <circle cx="50" cy="42" r="2.5" fill="#ff2200" stroke="none" />
      {/* Legs */}
      <path d="M18 66 L12 78 M26 70 L22 82 M38 70 L42 82 M46 66 L52 78" strokeWidth="4" />
      {/* Tail */}
      <path d="M14 58 C4 56 0 64 2 72" fill="none" strokeWidth="2.5" />
    </>
  ),

  wraith: (
    <>
      {/* Dark hood dome */}
      <path d="M12 24 C12 4 52 4 52 24 L54 36 C46 28 18 28 10 36 Z" />
      {/* Upper body */}
      <ellipse cx="32" cy="34" rx="18" ry="16" />
      {/* Hollow glowing eyes */}
      <ellipse cx="24" cy="30" rx="5" ry="6" fill="#000" stroke="none" />
      <ellipse cx="40" cy="30" rx="5" ry="6" fill="#000" stroke="none" />
      <ellipse cx="24" cy="30" rx="3" ry="3.5" fill="currentColor" fillOpacity="0.8" stroke="none" />
      <ellipse cx="40" cy="30" rx="3" ry="3.5" fill="currentColor" fillOpacity="0.8" stroke="none" />
      {/* Wispy arms */}
      <path d="M14 36 C4 32 0 44 6 50" fill="none" strokeWidth="4" />
      <path d="M50 36 C60 32 64 44 58 50" fill="none" strokeWidth="4" />
      {/* Wispy tail flowing down */}
      <path d="M14 48 C8 62 12 78 18 84 M32 52 C28 68 30 82 32 90 M50 48 C56 62 52 78 46 84"
        fill="none" strokeWidth="3" strokeOpacity="0.7" />
    </>
  ),

  brute: (
    <>
      {/* Tiny head */}
      <ellipse cx="32" cy="16" rx="10" ry="11" />
      {/* Heavy brow */}
      <path d="M20 10 L44 10" strokeWidth="4" />
      {/* Massive torso */}
      <path d="M4 28 L60 28 L58 70 L6 70 Z" />
      {/* Legs */}
      <rect x="6" y="70" width="22" height="22" rx="4" />
      <rect x="36" y="70" width="22" height="22" rx="4" />
      {/* Huge arms */}
      <path d="M6 30 L-2 62 L10 66 L16 38 Z" />
      <path d="M58 30 L66 62 L54 66 L48 38 Z" />
      {/* Fists */}
      <circle cx="2" cy="64" r="8" />
      <circle cx="62" cy="64" r="8" />
    </>
  ),

  hag: (
    <>
      {/* Wild hair */}
      <path d="M14 12 C8 2 12 -6 20 4 C17 -4 24 -8 28 2 C26 -6 38 -8 36 2 C40 -8 48 -4 42 6 C50 -4 54 4 46 12"
        fill="none" strokeWidth="3" />
      {/* Head */}
      <ellipse cx="32" cy="20" rx="11" ry="13" />
      {/* Sunken eyes */}
      <circle cx="27" cy="18" r="3" fill="#000" stroke="none" />
      <circle cx="37" cy="18" r="3" fill="#000" stroke="none" />
      {/* Hooked nose */}
      <path d="M32 20 Q38 26 35 30" fill="none" strokeWidth="2" />
      {/* Hunched robe */}
      <path d="M18 34 L46 34 C48 48 48 62 44 70 L20 70 C16 62 16 48 18 34 Z" />
      {/* Tattered hem */}
      <path d="M20 70 L14 90 L50 90 L44 70" />
      {/* Left clawed arm */}
      <path d="M18 40 L4 58 L10 62 L22 46 Z" />
      <path d="M4 58 L0 52 M6 58 L2 52 M8 58 L4 53" strokeWidth="1.5" />
      {/* Right arm + gnarled staff */}
      <path d="M46 38 L56 54 L52 58 L42 44 Z" />
      <path d="M56 54 L58 6" fill="none" strokeWidth="3" />
      <circle cx="58" cy="6" r="6" />
    </>
  ),

  scarab: (
    <>
      {/* Hard shell */}
      <ellipse cx="32" cy="54" rx="24" ry="26" />
      {/* Shell ridge lines */}
      <line x1="32" y1="30" x2="32" y2="78" strokeWidth="1.5" strokeOpacity="0.4" />
      <path d="M16 36 Q32 28 48 36 M12 48 Q32 40 52 48 M12 62 Q32 54 52 62" fill="none" strokeWidth="1.2" strokeOpacity="0.35" />
      {/* Head */}
      <ellipse cx="32" cy="24" rx="10" ry="8" />
      {/* Mandibles */}
      <path d="M24 28 L12 36 L18 40" strokeWidth="3" />
      <path d="M40 28 L52 36 L46 40" strokeWidth="3" />
      {/* Green eyes */}
      <circle cx="26" cy="22" r="3" fill="#00ee44" stroke="none" />
      <circle cx="38" cy="22" r="3" fill="#00ee44" stroke="none" />
      {/* Antennae */}
      <path d="M28 18 L20 4 M36 18 L44 4" strokeWidth="1.5" />
      {/* Legs (3 per side) */}
      <path d="M10 44 L0 36 M8 54 L-2 52 M10 64 L0 70" strokeWidth="2.5" />
      <path d="M54 44 L64 36 M56 54 L66 52 M54 64 L64 70" strokeWidth="2.5" />
    </>
  ),

  skeleton_archer: (
    <>
      {/* Skull */}
      <ellipse cx="32" cy="14" rx="11" ry="12" />
      {/* Eye sockets */}
      <ellipse cx="26" cy="12" rx="4" ry="4.5" fill="#000" stroke="none" />
      <ellipse cx="38" cy="12" rx="4" ry="4.5" fill="#000" stroke="none" />
      {/* Nasal cavity */}
      <path d="M30 18 L32 16 L34 18 L32 22 Z" fill="#000" stroke="none" />
      {/* Teeth */}
      <path d="M26 24 L26 28 M30 24 L30 28 M34 24 L34 28 M38 24 L38 28" strokeWidth="2" />
      {/* Spine */}
      <rect x="28" y="26" width="8" height="32" rx="2" />
      <path d="M26 30 L38 30 M24 36 L40 36 M24 42 L40 42 M26 48 L38 48" strokeWidth="1.2" strokeOpacity="0.4" />
      {/* Bony legs */}
      <rect x="24" y="58" width="7" height="30" rx="2" />
      <rect x="33" y="58" width="7" height="30" rx="2" />
      {/* Left arm to bow */}
      <path d="M28 30 L10 50 L16 54 L30 38 Z" />
      {/* Bow */}
      <path d="M10 30 C2 40 2 60 10 70" fill="none" strokeWidth="3.5" />
      <line x1="10" y1="30" x2="10" y2="70" strokeWidth="1.5" />
      {/* Right arm drawing */}
      <path d="M36 30 L54 48 L50 52 L32 36 Z" />
      {/* Bowstring + arrow */}
      <line x1="10" y1="50" x2="54" y2="50" strokeWidth="1.2" />
      <polygon points="10,50 18,45 18,55" />
    </>
  ),

  boss_undead: (
    <>
      {/* Fire aura */}
      <path d="M8 38 C4 26 8 14 14 18 C10 8 16 2 20 10 C18 2 26 -2 28 8 C30 0 38 -2 36 8 C40 0 46 6 42 16 C48 8 52 18 46 26"
        fill="none" strokeWidth="2" strokeOpacity="0.55" />
      {/* Giant head */}
      <ellipse cx="32" cy="22" rx="16" ry="17" />
      {/* Flaming eyes */}
      <ellipse cx="23" cy="20" rx="5" ry="5.5" fill="#ff6600" stroke="none" />
      <ellipse cx="41" cy="20" rx="5" ry="5.5" fill="#ff6600" stroke="none" />
      {/* Hanging jaw */}
      <path d="M18 32 Q32 40 46 32" fill="none" strokeWidth="2.5" />
      <path d="M22 32 L21 38 M28 34 L27 40 M36 34 L35 40 M42 32 L41 38" strokeWidth="2" />
      {/* Massive torso */}
      <path d="M8 42 L56 42 L60 82 L4 82 Z" />
      {/* Legs */}
      <rect x="6" y="82" width="22" height="14" rx="3" />
      <rect x="36" y="82" width="22" height="14" rx="3" />
      {/* Huge arms */}
      <path d="M8 46 L-2 72 L10 76 L18 54 Z" />
      <path d="M56 46 L66 72 L54 76 L46 54 Z" />
      {/* Flaming fists */}
      <circle cx="2" cy="74" r="8" />
      <path d="M-2 74 C-6 66 -4 58 0 62 C-2 56 4 52 4 62 C6 54 10 56 8 64 Z"
        fill="currentColor" fillOpacity="0.55" stroke="none" />
      <circle cx="62" cy="74" r="8" />
      <path d="M66 74 C70 66 68 58 64 62 C66 56 60 52 60 62 C58 54 54 56 56 64 Z"
        fill="currentColor" fillOpacity="0.55" stroke="none" />
    </>
  ),

  boss_shaman: (
    <>
      {/* Big horns */}
      <polygon points="22,20 14,0 30,16" />
      <polygon points="42,20 50,0 34,16" />
      {/* Large head */}
      <ellipse cx="32" cy="22" rx="14" ry="15" />
      {/* Lightning eyes */}
      <ellipse cx="25" cy="20" rx="4.5" ry="4.5" fill="#ffdd00" stroke="none" />
      <ellipse cx="39" cy="20" rx="4.5" ry="4.5" fill="#ffdd00" stroke="none" />
      {/* Ceremonial torso */}
      <path d="M12 38 L52 38 L54 76 L10 76 Z" />
      {/* Markings */}
      <path d="M22 44 L22 66 M32 40 L32 64 M42 44 L42 66" strokeWidth="1.5" strokeOpacity="0.35" />
      {/* Legs */}
      <rect x="10" y="76" width="18" height="18" rx="3" />
      <rect x="36" y="76" width="18" height="18" rx="3" />
      {/* Arms */}
      <path d="M12 42 L-2 64 L8 68 L20 50 Z" />
      <path d="M52 42 L66 62 L56 68 L44 50 Z" />
      {/* Staff */}
      <rect x="62" y="2" width="4" height="64" rx="2" />
      {/* Lightning orb */}
      <circle cx="64" cy="8" r="10" />
      <path d="M60 4 L68 8 L62 12 L70 16" fill="none" strokeWidth="2.5" stroke="#ffff88" strokeOpacity="0.9" />
    </>
  ),

  boss_fallen: (
    <>
      {/* Massive horns */}
      <polygon points="20,22 10,0 28,18" />
      <polygon points="44,22 54,0 36,18" />
      {/* Large head */}
      <ellipse cx="32" cy="24" rx="16" ry="16" />
      {/* Fierce red eyes */}
      <ellipse cx="22" cy="22" rx="5" ry="5" fill="#ff2200" stroke="none" />
      <ellipse cx="42" cy="22" rx="5" ry="5" fill="#ff2200" stroke="none" />
      {/* Armored torso */}
      <path d="M8 42 L56 42 L58 78 L6 78 Z" />
      {/* Armor plates */}
      <line x1="32" y1="44" x2="32" y2="74" strokeWidth="2" strokeOpacity="0.3" />
      <line x1="14" y1="56" x2="50" y2="56" strokeWidth="2" strokeOpacity="0.3" />
      {/* Legs */}
      <rect x="6" y="78" width="20" height="18" rx="3" />
      <rect x="38" y="78" width="20" height="18" rx="3" />
      {/* Massive arms */}
      <path d="M8 46 L-4 70 L8 76 L18 56 Z" />
      <path d="M56 46 L68 70 L56 76 L46 56 Z" />
      {/* Two-handed sword */}
      <line x1="62" y1="72" x2="52" y2="16" strokeWidth="5" />
      {/* Crossguard */}
      <line x1="44" y1="40" x2="60" y2="32" strokeWidth="5" />
      {/* Sword glow */}
      <line x1="62" y1="72" x2="52" y2="16" strokeWidth="2" stroke="currentColor" strokeOpacity="0.5" />
    </>
  ),

  boss_tree: (
    <>
      {/* Branch crown */}
      <path d="M20 8 L14 -2 L22 6 M32 4 L28 -6 L34 4 M44 8 L50 -2 L42 6"
        fill="none" strokeWidth="3" />
      <path d="M14 -2 L10 -8 M14 -2 L18 -8 M28 -6 L24 -12 M28 -6 L32 -12 M50 -2 L46 -8 M50 -2 L54 -8"
        fill="none" strokeWidth="2" />
      {/* Gnarled head */}
      <ellipse cx="32" cy="18" rx="16" ry="17" />
      {/* Knot eyes */}
      <ellipse cx="23" cy="16" rx="5.5" ry="6" fill="#000" stroke="none" />
      <ellipse cx="41" cy="16" rx="5.5" ry="6" fill="#000" stroke="none" />
      <ellipse cx="23" cy="16" rx="3" ry="3.5" fill="#88aa22" stroke="none" />
      <ellipse cx="41" cy="16" rx="3" ry="3.5" fill="#88aa22" stroke="none" />
      {/* Bark-textured trunk */}
      <path d="M8 36 L56 36 L58 78 L6 78 Z" />
      <path d="M16 40 C18 50 14 62 16 72 M32 38 C30 50 32 62 30 74 M48 40 C46 50 50 62 48 72"
        fill="none" strokeWidth="1.5" strokeOpacity="0.3" />
      {/* Root legs */}
      <path d="M14 78 C10 86 6 94 12 96 M26 80 C24 90 22 96 28 96 M38 80 C40 90 42 96 36 96 M50 78 C54 86 58 94 52 96"
        strokeWidth="5" />
      {/* Branch arms */}
      <path d="M8 42 C0 30 -4 16 6 12 C-2 8 0 0 8 8 L8 42" />
      {/* Giant wooden fist */}
      <path d="M-4 30 L8 24 L12 48 L-4 50 Z" />
      {/* Right arm */}
      <path d="M56 42 C64 30 68 16 58 12 C66 8 64 0 56 8 L56 42" />
    </>
  ),

  boss_countess: (
    <>
      {/* Crown */}
      <path d="M20 8 L20 0 L26 6 L32 -2 L38 6 L44 0 L44 8 Z" />
      {/* Crown gems */}
      <circle cx="26" cy="4" r="2.5" fill="#ff2266" stroke="none" />
      <circle cx="32" cy="1" r="2.5" fill="#ff2266" stroke="none" />
      <circle cx="38" cy="4" r="2.5" fill="#ff2266" stroke="none" />
      {/* Head */}
      <ellipse cx="32" cy="18" rx="10" ry="11" />
      {/* Vampire eyes */}
      <ellipse cx="27" cy="16" rx="3" ry="3" fill="#cc0033" stroke="none" />
      <ellipse cx="37" cy="16" rx="3" ry="3" fill="#cc0033" stroke="none" />
      {/* Fangs */}
      <path d="M29 24 L28 30 M35 24 L36 30" strokeWidth="2" />
      {/* Cape (flowing wide) */}
      <path d="M6 32 C0 52 -2 82 8 94 L20 94 L14 32 Z" />
      <path d="M58 32 C64 52 66 82 56 94 L44 94 L50 32 Z" />
      {/* Elegant torso */}
      <path d="M16 30 L48 30 L50 68 L14 68 Z" />
      {/* Corset lines */}
      <path d="M20 36 L44 36 M18 44 L46 44 M18 52 L46 52 M20 60 L44 60"
        fill="none" strokeWidth="1" strokeOpacity="0.3" />
      {/* Legs */}
      <rect x="15" y="68" width="14" height="26" rx="2" />
      <rect x="35" y="68" width="14" height="26" rx="2" />
      {/* Left arm */}
      <path d="M16 34 L2 56 L10 60 L22 42 Z" />
      {/* Right arm + dagger */}
      <path d="M48 34 L62 54 L56 60 L42 42 Z" />
      <path d="M62 54 L56 22" strokeWidth="3" />
      <path d="M58 50 L64 48 L60 56 Z" />
    </>
  ),

  succubus: (
    <>
      {/* Curved horns */}
      <path d="M24 10 C18 4 14 -2 20 -4 C18 2 22 6 26 10" fill="none" strokeWidth="2.5" />
      <path d="M40 10 C46 4 50 -2 44 -4 C46 2 42 6 38 10" fill="none" strokeWidth="2.5" />
      {/* Head */}
      <ellipse cx="32" cy="18" rx="10" ry="11" />
      {/* Glowing eyes */}
      <ellipse cx="27" cy="16" rx="3" ry="3" fill="#ff44aa" stroke="none" />
      <ellipse cx="37" cy="16" rx="3" ry="3" fill="#ff44aa" stroke="none" />
      {/* Lithe torso */}
      <path d="M22 30 L42 30 L40 62 L24 62 Z" />
      {/* Bat wings */}
      <path d="M22 34 C14 26 2 20 0 28 C4 26 8 30 12 36 C6 28 8 18 16 22 C16 30 18 38 22 44 Z" />
      <path d="M42 34 C50 26 62 20 64 28 C60 26 56 30 52 36 C58 28 56 18 48 22 C48 30 46 38 42 44 Z" />
      {/* Legs */}
      <rect x="22" y="62" width="12" height="28" rx="3" />
      <rect x="30" y="62" width="12" height="28" rx="3" />
      {/* Clawed arms */}
      <path d="M22 36 L6 54 L12 58 L26 44 Z" />
      <path d="M42 36 L58 54 L52 58 L38 44 Z" />
      {/* Tail */}
      <path d="M32 62 C28 72 22 78 26 86 C30 80 34 74 32 62" fill="none" strokeWidth="2.5" />
      <polygon points="24,84 22,92 30,88" />
    </>
  ),

  boss_andariel: (
    <>
      {/* Red hair spikes bursting upward */}
      <path d="M24 10 L20 -2 L26 8" fill="none" strokeWidth="3" stroke="#cc2200" strokeOpacity="0.9" />
      <path d="M30 7 L26 -6 L32 5" fill="none" strokeWidth="3" stroke="#cc2200" strokeOpacity="0.9" />
      <path d="M38 7 L42 -6 L36 5" fill="none" strokeWidth="3" stroke="#cc2200" strokeOpacity="0.9" />
      <path d="M44 10 L48 -2 L42 8" fill="none" strokeWidth="3" stroke="#cc2200" strokeOpacity="0.9" />
      {/* Head */}
      <ellipse cx="32" cy="17" rx="12" ry="13" />
      {/* Poison-green eyes */}
      <ellipse cx="25" cy="15" rx="4" ry="4" fill="#88ff22" stroke="none" />
      <ellipse cx="39" cy="15" rx="4" ry="4" fill="#88ff22" stroke="none" />
      {/* Pupil slit */}
      <ellipse cx="25" cy="15" rx="1.5" ry="2.5" fill="#002200" stroke="none" />
      <ellipse cx="39" cy="15" rx="1.5" ry="2.5" fill="#002200" stroke="none" />
      {/* Humanoid torso */}
      <path d="M16 30 L48 30 L46 60 L18 60 Z" />
      {/* Upper long arms (2 per side, spreading wide) */}
      <path d="M16 34 L-4 16 L2 24 L16 42 Z" />
      <path d="M48 34 L68 16 L62 24 L48 42 Z" />
      {/* Lower clawed arms */}
      <path d="M16 48 L-6 62 L2 68 L18 56 Z" />
      <path d="M48 48 L70 62 L62 68 L46 56 Z" />
      {/* Claws on upper arms */}
      <path d="M-4 16 L-8 10 M-2 16 L-6 10 M0 18 L-4 12" strokeWidth="1.5" />
      <path d="M68 16 L72 10 M66 16 L70 10 M64 18 L68 12" strokeWidth="1.5" />
      {/* Spider abdomen */}
      <ellipse cx="32" cy="76" rx="17" ry="15" />
      {/* Abdomen markings */}
      <path d="M18 76 Q32 70 46 76" fill="none" strokeWidth="1.2" strokeOpacity="0.35" />
      <path d="M18 80 Q32 86 46 80" fill="none" strokeWidth="1.2" strokeOpacity="0.35" />
      {/* Spider legs — 3 per side from abdomen */}
      <path d="M17 68 L2 54" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M16 76 L-2 72" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M18 84 L4 94" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M47 68 L62 54" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M48 76 L66 72" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M46 84 L60 94" strokeWidth="3.5" strokeLinecap="round" />
      {/* Waist connector */}
      <path d="M22 60 C20 66 20 70 18 72 M42 60 C44 66 44 70 46 72" fill="none" strokeWidth="3" />
    </>
  ),
};

export function MonsterSprite({ name, size = 64, state = "idle" }: Props) {
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => { setAnimKey((k) => k + 1); }, [state]);

  const type = MONSTER_TYPES[name] ?? "fallen";
  const color = MONSTER_COLORS[type] ?? "#888888";
  const height = Math.round(size * 1.5);

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 64 96"
      overflow="visible"
      style={{ display: "block", transform: "scaleX(-1)" }}
    >
      <motion.g
        key={animKey}
        animate={getAnimate(state, type)}
        transition={getTransition(state, type)}
        fill="#120e0a"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 2px ${color})` }}
      >
        {SPRITES[type] ?? SPRITES["fallen"]}
      </motion.g>
    </svg>
  );
}
