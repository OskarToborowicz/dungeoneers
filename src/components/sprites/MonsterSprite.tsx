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
  // Act 2
  "Imp Farmer": "imp",
  "Imp Guard": "imp",
  "Imp Soldier": "imp",
  "Queen of Imps": "boss_imp",
  "Magma Snail": "magma_snail",
  "Lava Golem": "lava_golem",
  "Fire Elemental": "fire_elemental",
  "Volcanic Boar": "volcanic_boar",
  "Emberfire": "boss_emberfire",
  "Fire Bat": "fire_bat",
  "Cloud of Dense Smoke": "smoke_cloud",
  "Rock Hound": "rock_hound",
  "It": "boss_it",
  "Lesser Devil": "lesser_devil",
  "Obsidian Skeleton": "obsidian_skeleton",
  "Hell Wyrm": "hell_wyrm",
  "Chaos Warlock": "chaos_warlock",
  "Reltih": "boss_reltih",
  "Hell Spawn": "hell_spawn",
  "Ghost": "ghost",
  "Demon": "demon",
  "The Reaper": "boss_reaper",
  "The Third Prophet": "prophet",
  "The Second Prophet": "prophet",
  "The First Prophet": "prophet",
  "Core of Hell": "boss_core",
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
  // Act 2
  imp: "#ff6600",
  boss_imp: "#ff8800",
  magma_snail: "#ff5500",
  lava_golem: "#ff7722",
  fire_elemental: "#ffaa00",
  volcanic_boar: "#cc4400",
  boss_emberfire: "#ff8800",
  fire_bat: "#ff4400",
  smoke_cloud: "#aaaaaa",
  rock_hound: "#998866",
  boss_it: "#667744",
  lesser_devil: "#cc2200",
  obsidian_skeleton: "#8899bb",
  hell_wyrm: "#aa3300",
  chaos_warlock: "#9933cc",
  boss_reltih: "#ff3300",
  hell_spawn: "#dd2200",
  ghost: "#8899cc",
  demon: "#bb2200",
  boss_reaper: "#aaccff",
  prophet: "#cc88ff",
  boss_core: "#ff2200",
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
  imp: "skitter", boss_imp: "pulse",
  magma_snail: "lurch", lava_golem: "stomp",
  fire_elemental: "float", volcanic_boar: "stomp",
  boss_emberfire: "pulse",
  fire_bat: "float", smoke_cloud: "float", rock_hound: "stomp",
  boss_it: "stomp",
  lesser_devil: "skitter", obsidian_skeleton: "sway",
  hell_wyrm: "sway", chaos_warlock: "sway",
  boss_reltih: "stomp",
  hell_spawn: "skitter", ghost: "float", demon: "stomp",
  boss_reaper: "sway",
  prophet: "sway", boss_core: "pulse",
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

  imp: (
    <>
      {/* Small curved horns */}
      <path d="M24,12 C20,4 16,0 20,-2 C22,4 24,8 26,12" fill="none" strokeWidth="2.5" />
      <path d="M40,12 C44,4 48,0 44,-2 C42,4 40,8 38,12" fill="none" strokeWidth="2.5" />
      {/* Round head */}
      <ellipse cx="32" cy="20" rx="11" ry="12" />
      {/* Glowing eyes */}
      <ellipse cx="26" cy="18" rx="3.5" ry="3.5" fill="#ff6600" stroke="none" />
      <ellipse cx="38" cy="18" rx="3.5" ry="3.5" fill="#ff6600" stroke="none" />
      {/* Wide grin */}
      <path d="M24,26 Q32,32 40,26" fill="none" strokeWidth="1.8" />
      {/* Wiry torso */}
      <path d="M22,32 L42,32 L40,62 L24,62 Z" />
      {/* Thin arms with claws */}
      <path d="M22,36 L6,50 L12,54 L26,44 Z" />
      <path d="M6,50 L2,44 M8,50 L4,44 M10,52 L6,46" strokeWidth="1.5" />
      <path d="M42,36 L58,50 L52,54 L38,44 Z" />
      <path d="M58,50 L62,44 M56,50 L60,44 M54,52 L58,46" strokeWidth="1.5" />
      {/* Legs */}
      <rect x="22" y="62" width="12" height="26" rx="3" />
      <rect x="30" y="62" width="12" height="26" rx="3" />
      {/* Barbed tail */}
      <path d="M32,62 C26,72 22,80 26,88" fill="none" strokeWidth="2.5" />
      <polygon points="24,86 20,94 28,90" />
    </>
  ),

  boss_imp: (
    <>
      {/* Large curved horns */}
      <path d="M22,14 C14,4 10,-2 16,-6 C18,4 20,10 24,14" fill="none" strokeWidth="3.5" />
      <path d="M42,14 C50,4 54,-2 48,-6 C46,4 44,10 40,14" fill="none" strokeWidth="3.5" />
      {/* Crown of smaller horns */}
      <polygon points="30,8 28,0 32,6" />
      <polygon points="34,8 36,0 32,6" />
      {/* Large head */}
      <ellipse cx="32" cy="22" rx="14" ry="15" />
      {/* Fierce eyes */}
      <ellipse cx="24" cy="20" rx="4.5" ry="4.5" fill="#ff8800" stroke="none" />
      <ellipse cx="40" cy="20" rx="4.5" ry="4.5" fill="#ff8800" stroke="none" />
      <ellipse cx="24" cy="20" rx="2" ry="2.5" fill="#000" stroke="none" />
      <ellipse cx="40" cy="20" rx="2" ry="2.5" fill="#000" stroke="none" />
      {/* Fanged mouth */}
      <path d="M22,28 Q32,36 42,28" fill="none" strokeWidth="2" />
      <path d="M26,28 L25,34 M30,30 L29,36 M34,30 L35,36 M38,28 L39,34" strokeWidth="2" />
      {/* Bulkier torso */}
      <path d="M14,38 L50,38 L52,74 L12,74 Z" />
      {/* Legs */}
      <rect x="12" y="74" width="18" height="18" rx="3" />
      <rect x="34" y="74" width="18" height="18" rx="3" />
      {/* Large arms */}
      <path d="M14,44 L-2,64 L8,70 L18,52 Z" />
      <path d="M50,44 L66,64 L56,70 L46,52 Z" />
      {/* Claws */}
      <path d="M-2,64 L-6,58 M0,64 L-4,58 M2,66 L-2,60" strokeWidth="2" />
      <path d="M66,64 L70,58 M64,64 L68,58 M62,66 L66,60" strokeWidth="2" />
      {/* Thick tail */}
      <path d="M32,74 C24,84 18,92 22,96" fill="none" strokeWidth="4" />
      <polygon points="20,94 16,96 22,96 Z" />
    </>
  ),

  magma_snail: (
    <>
      {/* Spiral shell */}
      <path d="M32,20 C44,16 54,22 54,32 C54,44 44,52 32,52 C20,52 12,44 12,32 C12,22 20,16 32,20 Z" fill="none" strokeWidth="2" />
      <path d="M32,24 C42,22 48,28 48,36 C48,44 42,48 32,48" fill="none" strokeWidth="1.5" strokeOpacity="0.5" />
      {/* Shell fill */}
      <ellipse cx="32" cy="36" rx="18" ry="18" />
      {/* Lava cracks on shell */}
      <path d="M24,26 L28,34 L22,38" fill="none" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
      <path d="M38,24 L36,32 L42,36" fill="none" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
      {/* Soft body/head */}
      <ellipse cx="46" cy="60" rx="14" ry="10" />
      {/* Eyestalks */}
      <line x1="40" y1="54" x2="36" y2="44" strokeWidth="2" />
      <line x1="48" y1="52" x2="50" y2="42" strokeWidth="2" />
      <circle cx="36" cy="44" r="3.5" />
      <circle cx="50" cy="42" r="3.5" />
      <circle cx="36" cy="44" r="1.5" fill="#ff4400" stroke="none" />
      <circle cx="50" cy="42" r="1.5" fill="#ff4400" stroke="none" />
      {/* Foot */}
      <path d="M22,64 C18,72 20,80 32,82 C44,82 58,74 58,64 Z" />
      {/* Lava drips from shell */}
      <path d="M20,50 L18,58 L22,56" fill="none" strokeWidth="1.5" strokeOpacity="0.7" />
      <path d="M36,54 L34,62 L38,60" fill="none" strokeWidth="1.5" strokeOpacity="0.7" />
    </>
  ),

  lava_golem: (
    <>
      {/* Craggy head */}
      <path d="M18,14 L24,6 L32,10 L40,4 L46,12 L48,24 L44,30 L20,30 L16,24 Z" />
      {/* Lava-crack eyes */}
      <ellipse cx="24" cy="20" rx="4" ry="4" fill="#ff6600" stroke="none" />
      <ellipse cx="40" cy="20" rx="4" ry="4" fill="#ff6600" stroke="none" />
      {/* Massive rocky torso */}
      <path d="M8,32 L56,32 L60,76 L4,76 Z" />
      {/* Rock texture lines */}
      <path d="M10,42 L20,38 L16,48 M40,36 L52,40 L46,50 M12,60 L24,56 L20,66 M44,54 L56,58 L50,68"
        fill="none" strokeWidth="1.5" strokeOpacity="0.35" />
      {/* Lava veins */}
      <path d="M20,38 C22,50 18,62 22,72" fill="none" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6" />
      <path d="M44,40 C42,52 46,64 42,74" fill="none" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6" />
      {/* Legs */}
      <rect x="6" y="76" width="24" height="16" rx="3" />
      <rect x="34" y="76" width="24" height="16" rx="3" />
      {/* Huge arms */}
      <path d="M8,36 L-4,64 L8,70 L18,46 Z" />
      <path d="M56,36 L68,64 L56,70 L46,46 Z" />
      {/* Rock fists */}
      <path d="M-4,64 L-8,58 L-2,58 L4,70 L-4,74 Z" />
      <path d="M68,64 L72,58 L66,58 L60,70 L68,74 Z" />
    </>
  ),

  fire_elemental: (
    <>
      {/* Flame body — tall and twisting */}
      <path d="M32,88 C22,78 14,64 16,50 C14,60 10,66 12,76 C6,62 8,44 16,34 C10,40 6,30 12,22 C10,28 16,22 18,30 C18,20 22,10 28,16 C26,8 30,2 32,8 C34,2 38,8 36,16 C42,10 46,20 46,30 C48,22 54,28 52,22 C58,30 54,40 48,34 C56,44 58,62 52,76 C54,66 50,60 48,50 C50,64 42,78 32,88 Z" />
      {/* Bright core */}
      <ellipse cx="32" cy="48" rx="10" ry="14" fill="currentColor" fillOpacity="0.5" stroke="none" />
      {/* Eyes (fire orbs) */}
      <circle cx="26" cy="40" r="4" fill="#ffee00" stroke="none" />
      <circle cx="38" cy="40" r="4" fill="#ffee00" stroke="none" />
      <circle cx="26" cy="40" r="2" fill="#fff" stroke="none" />
      <circle cx="38" cy="40" r="2" fill="#fff" stroke="none" />
      {/* Flame arms */}
      <path d="M18,44 C8,36 4,24 10,18 C8,28 14,34 18,44 Z" />
      <path d="M46,44 C56,36 60,24 54,18 C56,28 50,34 46,44 Z" />
    </>
  ),

  volcanic_boar: (
    <>
      {/* Tusks */}
      <path d="M20,36 L10,48 L16,44" strokeWidth="4" strokeLinecap="round" />
      <path d="M44,36 L54,48 L48,44" strokeWidth="4" strokeLinecap="round" />
      {/* Large head/snout */}
      <ellipse cx="32" cy="24" rx="16" ry="14" />
      <ellipse cx="32" cy="32" rx="10" ry="7" />
      {/* Nostrils */}
      <circle cx="28" cy="33" r="2.5" fill="#000" stroke="none" />
      <circle cx="36" cy="33" r="2.5" fill="#000" stroke="none" />
      {/* Eyes */}
      <ellipse cx="22" cy="20" rx="4" ry="4" fill="#ff4400" stroke="none" />
      <ellipse cx="42" cy="20" rx="4" ry="4" fill="#ff4400" stroke="none" />
      {/* Heavy body */}
      <path d="M6,42 L58,42 L56,74 L8,74 Z" />
      {/* Lava patches on hide */}
      <path d="M16,50 L22,46 L20,54" fill="none" strokeWidth="1.5" strokeOpacity="0.5" />
      <path d="M40,48 L48,52 L44,58" fill="none" strokeWidth="1.5" strokeOpacity="0.5" />
      {/* Legs — thick */}
      <rect x="8" y="74" width="16" height="18" rx="3" />
      <rect x="26" y="74" width="14" height="18" rx="3" />
      <rect x="42" y="74" width="14" height="18" rx="3" />
      {/* Spiny ridge */}
      <path d="M14,42 L12,30 M22,40 L20,26 M32,38 L32,24 M42,40 L44,26 M50,42 L52,30" strokeWidth="2.5" />
    </>
  ),

  boss_emberfire: (
    <>
      {/* Giant flame crown */}
      <path d="M20,16 C16,6 18,-4 22,0 C20,-6 26,-10 28,0 C28,-8 34,-10 34,0 C36,-8 42,-4 40,4 C44,-2 48,6 44,14"
        fill="none" strokeWidth="3" strokeOpacity="0.8" />
      {/* Blazing head */}
      <ellipse cx="32" cy="24" rx="16" ry="16" />
      {/* Inferno eyes */}
      <circle cx="23" cy="22" r="6" fill="#ffcc00" stroke="none" />
      <circle cx="41" cy="22" r="6" fill="#ffcc00" stroke="none" />
      <circle cx="23" cy="22" r="3" fill="#ff4400" stroke="none" />
      <circle cx="41" cy="22" r="3" fill="#ff4400" stroke="none" />
      {/* Molten jaw */}
      <path d="M18,32 Q32,42 46,32" fill="none" strokeWidth="3" />
      {/* Massive burning torso */}
      <path d="M6,42 L58,42 L62,84 L2,84 Z" />
      {/* Lava veins */}
      <path d="M14,50 C16,62 12,74 14,82" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.7" />
      <path d="M32,44 C30,58 32,70 30,82" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.7" />
      <path d="M50,50 C48,62 52,74 50,82" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.7" />
      {/* Legs */}
      <rect x="4" y="84" width="24" height="10" rx="3" />
      <rect x="36" y="84" width="24" height="10" rx="3" />
      {/* Flame arms */}
      <path d="M6,46 C-6,34 -8,18 0,14 C-4,24 2,34 6,46 Z" />
      <path d="M58,46 C70,34 72,18 64,14 C68,24 62,34 58,46 Z" />
      {/* Flaming fists */}
      <circle cx="-2" cy="40" r="10" />
      <path d="M-8,34 C-12,24 -8,16 -4,20 C-6,12 0,8 2,18 C4,10 10,12 6,22 Z"
        fill="currentColor" fillOpacity="0.6" stroke="none" />
      <circle cx="66" cy="40" r="10" />
      <path d="M72,34 C76,24 72,16 68,20 C70,12 64,8 62,18 C60,10 54,12 58,22 Z"
        fill="currentColor" fillOpacity="0.6" stroke="none" />
    </>
  ),

  fire_bat: (
    <>
      {/* Large bat wings */}
      <path d="M32,46 C24,38 10,28 4,14 C10,16 14,24 18,32 C12,18 14,6 22,8 C22,20 24,34 30,44 Z" />
      <path d="M32,46 C40,38 54,28 60,14 C54,16 50,24 46,32 C52,18 50,6 42,8 C42,20 40,34 34,44 Z" />
      {/* Wing claws */}
      <path d="M18,32 L14,26 M22,22 L18,16 M30,14 L28,8" strokeWidth="1.8" />
      <path d="M46,32 L50,26 M42,22 L46,16 M34,14 L36,8" strokeWidth="1.8" />
      {/* Body */}
      <ellipse cx="32" cy="52" rx="11" ry="14" />
      {/* Head */}
      <circle cx="32" cy="32" r="9" />
      {/* Ears */}
      <polygon points="26,28 22,14 30,26" />
      <polygon points="38,28 42,14 34,26" />
      {/* Flame eyes */}
      <circle cx="28" cy="31" r="3" fill="#ff4400" stroke="none" />
      <circle cx="36" cy="31" r="3" fill="#ff4400" stroke="none" />
      {/* Fangs */}
      <path d="M29,38 L28,44 M35,38 L36,44" strokeWidth="2" />
      {/* Talons */}
      <path d="M26,64 L22,76 M32,66 L30,78 M38,64 L42,76" strokeWidth="3" />
    </>
  ),

  smoke_cloud: (
    <>
      {/* Billowing smoke mass */}
      <circle cx="32" cy="44" r="24" />
      <circle cx="16" cy="50" r="16" />
      <circle cx="48" cy="50" r="16" />
      <circle cx="24" cy="34" r="14" />
      <circle cx="42" cy="32" r="14" />
      <circle cx="32" cy="26" r="12" />
      {/* Hollow dark eye sockets in smoke */}
      <circle cx="24" cy="44" r="6" fill="#000" stroke="none" />
      <circle cx="40" cy="44" r="6" fill="#000" stroke="none" />
      <circle cx="24" cy="44" r="3" fill="currentColor" fillOpacity="0.5" stroke="none" />
      <circle cx="40" cy="44" r="3" fill="currentColor" fillOpacity="0.5" stroke="none" />
      {/* Wispy tendrils below */}
      <path d="M18,66 C14,72 16,80 12,86" fill="none" strokeWidth="3" strokeOpacity="0.6" />
      <path d="M28,68 C26,76 28,84 24,90" fill="none" strokeWidth="3" strokeOpacity="0.5" />
      <path d="M38,68 C40,76 38,84 42,90" fill="none" strokeWidth="3" strokeOpacity="0.5" />
      <path d="M48,66 C52,72 50,80 54,86" fill="none" strokeWidth="3" strokeOpacity="0.6" />
    </>
  ),

  rock_hound: (
    <>
      {/* Pointed ears */}
      <polygon points="20,14 14,0 26,12" />
      <polygon points="44,14 50,0 38,12" />
      {/* Rocky head */}
      <ellipse cx="32" cy="22" rx="15" ry="14" />
      {/* Stone-crack texture on head */}
      <path d="M22,16 L26,22 L20,26" fill="none" strokeWidth="1.2" strokeOpacity="0.4" />
      <path d="M40,18 L38,24 L44,26" fill="none" strokeWidth="1.2" strokeOpacity="0.4" />
      {/* Snout */}
      <path d="M40,26 L56,22 L40,32 Z" />
      {/* Glowing eyes */}
      <ellipse cx="24" cy="20" rx="3.5" ry="3.5" fill="#aacc44" stroke="none" />
      <ellipse cx="38" cy="20" rx="3.5" ry="3.5" fill="#aacc44" stroke="none" />
      {/* Rocky body — low and wide */}
      <path d="M8,36 L56,36 L54,70 L10,70 Z" />
      {/* Rock texture */}
      <path d="M14,44 L20,40 L18,50 M36,38 L44,42 L40,52 M12,60 L20,56 L18,66"
        fill="none" strokeWidth="1.2" strokeOpacity="0.35" />
      {/* 4 legs — heavy and short */}
      <rect x="8" y="70" width="16" height="18" rx="3" />
      <rect x="26" y="70" width="14" height="18" rx="3" />
      <rect x="42" y="70" width="14" height="18" rx="3" />
      {/* Back spike ridge */}
      <path d="M16,36 L14,24 M24,34 L22,20 M32,34 L32,18 M40,34 L42,20 M48,36 L50,24" strokeWidth="2.5" />
    </>
  ),

  boss_it: (
    <>
      {/* Massive amorphous body */}
      <path d="M32,90 C12,84 2,68 4,50 C2,58 -2,62 0,70 C-4,54 2,36 12,28 C4,34 0,22 8,16 C6,24 12,20 14,28 C14,16 20,8 26,14 C24,4 30,0 32,6 C34,0 40,4 38,14 C44,8 50,16 50,28 C52,20 58,24 56,16 C64,22 60,34 52,28 C62,36 68,54 64,70 C66,62 62,58 60,50 C62,68 52,84 32,90 Z" />
      {/* Multiple hollow eyes */}
      <ellipse cx="22" cy="36" rx="5" ry="5.5" fill="#000" stroke="none" />
      <ellipse cx="36" cy="30" rx="5" ry="5.5" fill="#000" stroke="none" />
      <ellipse cx="46" cy="40" rx="4" ry="4.5" fill="#000" stroke="none" />
      <ellipse cx="22" cy="36" rx="3" ry="3.5" fill="#66aa22" stroke="none" />
      <ellipse cx="36" cy="30" rx="3" ry="3.5" fill="#66aa22" stroke="none" />
      <ellipse cx="46" cy="40" rx="2.5" ry="3" fill="#66aa22" stroke="none" />
      {/* Maw */}
      <path d="M18,52 Q32,64 46,52" fill="none" strokeWidth="3" />
      <path d="M22,52 L20,58 M28,56 L26,62 M36,56 L37,62 M42,52 L43,58" strokeWidth="2.5" />
      {/* Writhing tentacle arms */}
      <path d="M10,46 C2,34 -4,22 2,14 C0,24 6,30 10,46 Z" />
      <path d="M54,46 C62,34 68,22 62,14 C64,24 58,30 54,46 Z" />
      <path d="M6,64 C-4,60 -8,70 -4,76" fill="none" strokeWidth="4" strokeLinecap="round" />
      <path d="M58,64 C68,60 72,70 68,76" fill="none" strokeWidth="4" strokeLinecap="round" />
    </>
  ),

  lesser_devil: (
    <>
      {/* Curved horns */}
      <path d="M22,12 C16,2 12,-4 18,-6 C18,4 20,8 24,12" fill="none" strokeWidth="3" />
      <path d="M42,12 C48,2 52,-4 46,-6 C46,4 44,8 40,12" fill="none" strokeWidth="3" />
      {/* Head */}
      <ellipse cx="32" cy="20" rx="12" ry="13" />
      {/* Red eyes */}
      <ellipse cx="26" cy="18" rx="3.5" ry="3.5" fill="#ff2200" stroke="none" />
      <ellipse cx="38" cy="18" rx="3.5" ry="3.5" fill="#ff2200" stroke="none" />
      {/* Bat wings */}
      <path d="M18,36 C8,26 -2,18 0,6 C4,8 6,16 10,24 C4,12 8,2 16,6 C16,16 16,28 18,38 Z" />
      <path d="M46,36 C56,26 66,18 64,6 C60,8 58,16 54,24 C60,12 56,2 48,6 C48,16 48,28 46,38 Z" />
      {/* Torso */}
      <path d="M18,32 L46,32 L44,66 L20,66 Z" />
      {/* Tail */}
      <path d="M32,66 C26,78 20,86 24,92" fill="none" strokeWidth="3" />
      <polygon points="22,90 18,96 26,94" />
      {/* Legs */}
      <rect x="18" y="66" width="14" height="24" rx="3" />
      <rect x="32" y="66" width="14" height="24" rx="3" />
      {/* Arms/claws */}
      <path d="M18,38 L4,54 L10,58 L22,46 Z" />
      <path d="M4,54 L0,48 M6,54 L2,48 M8,56 L4,50" strokeWidth="1.5" />
      <path d="M46,38 L60,54 L54,58 L42,46 Z" />
      <path d="M60,54 L64,48 M58,54 L62,48 M56,56 L60,50" strokeWidth="1.5" />
    </>
  ),

  obsidian_skeleton: (
    <>
      {/* Dark helm/skull shards */}
      <path d="M18,10 L20,2 L24,8 L28,0 L32,8 L36,0 L40,8 L44,2 L46,10" fill="none" strokeWidth="2" />
      {/* Skull */}
      <ellipse cx="32" cy="18" rx="13" ry="13" />
      {/* Deep socket eyes */}
      <ellipse cx="25" cy="16" rx="4.5" ry="5" fill="#000" stroke="none" />
      <ellipse cx="39" cy="16" rx="4.5" ry="5" fill="#000" stroke="none" />
      <ellipse cx="25" cy="16" rx="2.5" ry="3" fill="#8899bb" stroke="none" />
      <ellipse cx="39" cy="16" rx="2.5" ry="3" fill="#8899bb" stroke="none" />
      {/* Cracked jaw */}
      <path d="M26,28 L24,34 M30,28 L30,34 M34,28 L34,34 M38,28 L40,34" strokeWidth="2" />
      {/* Obsidian spine/torso */}
      <rect x="26" y="30" width="12" height="34" rx="2" />
      <path d="M22,36 L42,36 M20,44 L44,44 M20,52 L44,52 M22,60 L42,60" strokeWidth="1.5" strokeOpacity="0.4" />
      {/* Crystalline shoulder pauldrons */}
      <path d="M18,32 L8,28 L10,38 L18,40 Z" />
      <path d="M46,32 L56,28 L54,38 L46,40 Z" />
      {/* Bony arms */}
      <rect x="10" y="38" width="8" height="30" rx="3" />
      <rect x="46" y="38" width="8" height="30" rx="3" />
      {/* Obsidian sword */}
      <line x1="14" y1="68" x2="4" y2="20" strokeWidth="5" />
      <line x1="2" y1="42" x2="16" y2="38" strokeWidth="4" />
      {/* Legs */}
      <rect x="24" y="64" width="8" height="28" rx="2" />
      <rect x="32" y="64" width="8" height="28" rx="2" />
    </>
  ),

  hell_wyrm: (
    <>
      {/* Long serpentine neck */}
      <path d="M32,88 C28,78 20,68 18,56 C16,44 22,36 28,28" fill="none" strokeWidth="14" strokeLinecap="round" />
      {/* Body scales hint */}
      <path d="M32,88 C28,78 20,68 18,56 C16,44 22,36 28,28" fill="none" strokeWidth="10" strokeOpacity="0.3" stroke="currentColor" />
      {/* Horned head */}
      <ellipse cx="32" cy="22" rx="14" ry="12" />
      <polygon points="24,14 18,2 28,12" />
      <polygon points="40,14 46,2 36,12" />
      {/* Slitted eyes */}
      <ellipse cx="24" cy="20" rx="4.5" ry="4" fill="#ff4400" stroke="none" />
      <ellipse cx="40" cy="20" rx="4.5" ry="4" fill="#ff4400" stroke="none" />
      <ellipse cx="24" cy="20" rx="1.5" ry="3" fill="#000" stroke="none" />
      <ellipse cx="40" cy="20" rx="1.5" ry="3" fill="#000" stroke="none" />
      {/* Fangs */}
      <path d="M26,28 L24,36 M30,30 L28,38 M34,30 L36,38 M38,28 L40,36" strokeWidth="2.5" />
      {/* Small wings */}
      <path d="M18,40 C8,32 4,18 10,12 C8,24 14,32 18,44 Z" />
      <path d="M46,40 C56,32 60,18 54,12 C56,24 50,32 46,44 Z" />
    </>
  ),

  chaos_warlock: (
    <>
      {/* Chaotic energy crown */}
      <path d="M20,10 C16,0 20,-8 24,-4 C22,-10 30,-14 30,-4 C32,-12 38,-10 36,-2 C40,-8 44,0 40,8"
        fill="none" strokeWidth="2.5" strokeOpacity="0.7" />
      {/* Head with hood */}
      <path d="M16,10 C12,24 14,36 20,36 L44,36 C50,36 52,24 48,10 C44,2 20,2 16,10 Z" />
      {/* Face shadow */}
      <ellipse cx="32" cy="22" rx="10" ry="11" fill="#0a0010" stroke="none" />
      {/* Glowing purple eyes */}
      <ellipse cx="26" cy="20" rx="4" ry="4" fill="#9933cc" stroke="none" />
      <ellipse cx="38" cy="20" rx="4" ry="4" fill="#9933cc" stroke="none" />
      {/* Robed torso */}
      <path d="M14,36 L50,36 L52,80 L12,80 Z" />
      {/* Chaos rune markings */}
      <path d="M22,46 L28,42 L26,50 L32,46 L30,54 L36,50 L34,58 L40,54"
        fill="none" strokeWidth="1.5" strokeOpacity="0.4" />
      {/* Arms */}
      <path d="M14,42 L0,58 L8,64 L20,50 Z" />
      <path d="M50,40 L64,54 L58,62 L44,48 Z" />
      {/* Chaos orbs in hands */}
      <circle cx="2" cy="60" r="8" />
      <path d="M-2,56 L2,52 L6,56 L2,60 Z" fill="currentColor" fillOpacity="0.5" stroke="none" />
      <circle cx="62" cy="56" r="8" />
      <path d="M58,52 L62,48 L66,52 L62,56 Z" fill="currentColor" fillOpacity="0.5" stroke="none" />
    </>
  ),

  boss_reltih: (
    <>
      {/* Massive war crown */}
      <path d="M16,12 L18,0 L24,10 L28,0 L32,10 L36,0 L40,10 L46,0 L48,12 Z" />
      {/* Large head */}
      <ellipse cx="32" cy="24" rx="16" ry="16" />
      {/* Burning eyes */}
      <ellipse cx="22" cy="22" rx="5.5" ry="5.5" fill="#ff2200" stroke="none" />
      <ellipse cx="42" cy="22" rx="5.5" ry="5.5" fill="#ff2200" stroke="none" />
      <ellipse cx="22" cy="22" rx="2.5" ry="2.5" fill="#ffcc00" stroke="none" />
      <ellipse cx="42" cy="22" rx="2.5" ry="2.5" fill="#ffcc00" stroke="none" />
      {/* Hellfire jaw */}
      <path d="M18,32 Q32,44 46,32" fill="none" strokeWidth="3" />
      <path d="M22,32 L20,40 M28,36 L26,44 M36,36 L37,44 M42,32 L44,40" strokeWidth="2.5" />
      {/* Armored torso with hell plates */}
      <path d="M4,42 L60,42 L62,84 L2,84 Z" />
      {/* Armour plates */}
      <path d="M4,52 L60,52 M4,62 L60,62 M4,72 L60,72" strokeWidth="1.5" strokeOpacity="0.25" />
      <line x1="32" y1="44" x2="32" y2="82" strokeWidth="2" strokeOpacity="0.25" />
      {/* Legs */}
      <rect x="4" y="84" width="26" height="12" rx="3" />
      <rect x="34" y="84" width="26" height="12" rx="3" />
      {/* Giant arms */}
      <path d="M4,46 L-10,76 L4,82 L16,56 Z" />
      <path d="M60,46 L74,76 L60,82 L48,56 Z" />
      {/* Hellfire greatsword */}
      <rect x="68" y="10" width="6" height="72" rx="2" />
      <rect x="58" y="36" width="26" height="6" rx="2" />
      <path d="M68,10 L72,10 L74,82 L66,82 Z" fill="currentColor" fillOpacity="0.4" stroke="none" />
    </>
  ),

  hell_spawn: (
    <>
      {/* Small nub horns */}
      <polygon points="26,12 24,2 30,10" />
      <polygon points="38,12 40,2 34,10" />
      {/* Head */}
      <ellipse cx="32" cy="20" rx="11" ry="12" />
      {/* Hellfire eyes */}
      <ellipse cx="26" cy="18" rx="3" ry="3" fill="#ff2200" stroke="none" />
      <ellipse cx="38" cy="18" rx="3" ry="3" fill="#ff2200" stroke="none" />
      {/* Wiry body */}
      <path d="M20,32 L44,32 L42,66 L22,66 Z" />
      {/* Hell marks on skin */}
      <path d="M24,40 L28,44 M36,38 L40,42 M26,54 L24,60 M36,52 L40,58" strokeWidth="1.5" strokeOpacity="0.4" />
      {/* Clawed arms */}
      <path d="M20,36 L4,52 L10,56 L24,44 Z" />
      <path d="M4,52 L0,46 M6,52 L2,46 M8,54 L4,48" strokeWidth="1.5" />
      <path d="M44,36 L60,52 L54,56 L40,44 Z" />
      <path d="M60,52 L64,46 M58,52 L62,46 M56,54 L60,48" strokeWidth="1.5" />
      {/* Legs */}
      <rect x="20" y="66" width="14" height="24" rx="3" />
      <rect x="30" y="66" width="14" height="24" rx="3" />
      {/* Small tail */}
      <path d="M32,66 C28,74 24,80 28,86" fill="none" strokeWidth="2.5" />
      <polygon points="26,84 22,90 30,88" />
    </>
  ),

  ghost: (
    <>
      {/* Ethereal dome head */}
      <path d="M10,24 C10,4 54,4 54,24 L56,40 C48,30 16,30 8,40 Z" />
      {/* Semi-transparent body */}
      <ellipse cx="32" cy="44" rx="20" ry="18" />
      {/* Hollow haunted eyes */}
      <ellipse cx="22" cy="36" rx="6" ry="7" fill="#000" stroke="none" />
      <ellipse cx="42" cy="36" rx="6" ry="7" fill="#000" stroke="none" />
      <ellipse cx="22" cy="36" rx="3.5" ry="4" fill="#8899cc" stroke="none" />
      <ellipse cx="42" cy="36" rx="3.5" ry="4" fill="#8899cc" stroke="none" />
      {/* Wailing mouth */}
      <ellipse cx="32" cy="50" rx="7" ry="9" fill="#000" stroke="none" />
      {/* Wispy trailing form */}
      <path d="M12,56 C8,68 12,82 10,90 M22,60 C20,74 22,86 18,94 M32,62 C30,76 32,88 30,96 M42,60 C44,74 42,86 46,94 M52,56 C56,68 52,82 54,90"
        fill="none" strokeWidth="3.5" strokeOpacity="0.65" />
      {/* Reaching arms */}
      <path d="M12,44 C2,38 -2,26 4,22 C2,32 8,38 12,44" fill="none" strokeWidth="4" strokeLinecap="round" />
      <path d="M52,44 C62,38 66,26 60,22 C62,32 56,38 52,44" fill="none" strokeWidth="4" strokeLinecap="round" />
    </>
  ),

  demon: (
    <>
      {/* Large swept-back horns */}
      <path d="M20,16 C12,6 8,-4 16,-6 C14,6 18,12 22,16" strokeWidth="4" fill="none" />
      <path d="M44,16 C52,6 56,-4 48,-6 C50,6 46,12 42,16" strokeWidth="4" fill="none" />
      {/* Broad demonic head */}
      <ellipse cx="32" cy="22" rx="15" ry="15" />
      {/* Infernal eyes */}
      <ellipse cx="22" cy="20" rx="5" ry="5" fill="#ff2200" stroke="none" />
      <ellipse cx="42" cy="20" rx="5" ry="5" fill="#ff2200" stroke="none" />
      {/* Snarling jaw */}
      <path d="M18,30 Q32,40 46,30" fill="none" strokeWidth="2.5" />
      <path d="M22,30 L20,36 M28,32 L26,38 M36,32 L37,38 M42,30 L44,36" strokeWidth="2" />
      {/* Heavy torso */}
      <path d="M8,38 L56,38 L58,78 L6,78 Z" />
      {/* Bat wings (partially folded) */}
      <path d="M8,42 C0,30 -2,14 6,10 C4,22 8,30 8,44 Z" />
      <path d="M56,42 C64,30 66,14 58,10 C60,22 56,30 56,44 Z" />
      {/* Legs */}
      <rect x="6" y="78" width="22" height="16" rx="3" />
      <rect x="36" y="78" width="22" height="16" rx="3" />
      {/* Massive clawed arms */}
      <path d="M8,44 L-6,66 L6,72 L18,54 Z" />
      <path d="M56,44 L70,66 L58,72 L46,54 Z" />
      {/* Claws */}
      <path d="M-6,66 L-10,60 M-4,66 L-8,60 M-2,68 L-6,62" strokeWidth="2.5" />
      <path d="M70,66 L74,60 M68,66 L72,60 M66,68 L70,62" strokeWidth="2.5" />
    </>
  ),

  boss_reaper: (
    <>
      {/* Tattered hood — tall and imposing */}
      <path d="M14,8 C10,-4 14,-12 20,-8 C18,-2 18,4 20,8 Z" />
      <path d="M50,8 C54,-4 50,-12 44,-8 C46,-2 46,4 44,8 Z" />
      <path d="M14,8 C10,20 12,32 8,40 L20,40 L14,8 Z" />
      <path d="M50,8 C54,20 52,32 56,40 L44,40 L50,8 Z" />
      {/* Hood top */}
      <path d="M14,8 C16,-4 48,-4 50,8 L52,22 C44,12 20,12 12,22 Z" />
      {/* Skull face */}
      <ellipse cx="32" cy="22" rx="13" ry="13" />
      {/* Hollow deep sockets */}
      <ellipse cx="24" cy="20" rx="5" ry="6" fill="#000" stroke="none" />
      <ellipse cx="40" cy="20" rx="5" ry="6" fill="#000" stroke="none" />
      {/* Death glow eyes */}
      <ellipse cx="24" cy="20" rx="3" ry="3.5" fill="#aaccff" stroke="none" />
      <ellipse cx="40" cy="20" rx="3" ry="3.5" fill="#aaccff" stroke="none" />
      {/* Nasal void */}
      <path d="M30,26 L32,23 L34,26 L32,30 Z" fill="#000" stroke="none" />
      {/* Teeth */}
      <path d="M24,32 L24,38 M28,32 L28,38 M32,32 L32,38 M36,32 L36,38 M40,32 L40,38" strokeWidth="2" />
      {/* Long flowing dark robes */}
      <path d="M14,40 L50,40 C54,60 56,80 52,96 L12,96 C8,80 10,60 14,40 Z" />
      {/* Robe tears */}
      <path d="M16,80 L10,96 M28,86 L24,96 M40,86 L44,96 M50,80 L56,96"
        fill="none" strokeWidth="1.5" strokeOpacity="0.4" />
      {/* Skeletal left arm */}
      <path d="M14,44 L0,70 L8,74 L18,52 Z" />
      <rect x="-4" y="68" width="8" height="20" rx="2" />
      {/* Giant scythe — right arm holding it high */}
      <path d="M50,44 L62,30 L58,36 L50,50 Z" />
      {/* Scythe pole — long */}
      <rect x="58" y="0" width="4" height="90" rx="2" />
      {/* Scythe blade — massive curved */}
      <path d="M60,4 C82,10 90,30 78,44 C70,52 56,48 52,40 C58,46 72,48 78,40 C88,28 80,12 60,8 Z" />
      {/* Blade edge glow */}
      <path d="M60,6 C80,12 88,30 76,42" fill="none" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6" />
    </>
  ),

  prophet: (
    <>
      {/* Ornate headpiece */}
      <path d="M22,8 L22,0 L26,6 L32,0 L38,6 L42,0 L42,8 Z" />
      {/* Glowing gem at crown center */}
      <circle cx="32" cy="2" r="4" fill="#cc88ff" stroke="none" fillOpacity="0.9" />
      {/* Head */}
      <ellipse cx="32" cy="18" rx="11" ry="12" />
      {/* Ancient glowing eyes */}
      <ellipse cx="26" cy="16" rx="3.5" ry="3.5" fill="#cc88ff" stroke="none" />
      <ellipse cx="38" cy="16" rx="3.5" ry="3.5" fill="#cc88ff" stroke="none" />
      {/* Long beard */}
      <path d="M22,28 C18,40 18,56 22,68 L42,68 C46,56 46,40 42,28 Z" />
      <path d="M24,68 C22,76 24,84 28,90 M32,68 L32,92 M40,68 C42,76 40,84 36,90"
        fill="none" strokeWidth="2.5" strokeOpacity="0.5" />
      {/* Robes under beard */}
      <path d="M14,30 L50,30 L52,68 L12,68 Z" />
      {/* Arcane runes on robe */}
      <path d="M18,40 L22,36 L20,44 L24,40 M38,38 L42,34 L40,42 L44,38"
        fill="none" strokeWidth="1.2" strokeOpacity="0.4" />
      {/* Arms raised in power */}
      <path d="M14,34 L-2,20 L4,28 L16,40 Z" />
      <path d="M50,34 L66,20 L60,28 L48,40 Z" />
      {/* Power orbs in hands */}
      <circle cx="-2" cy="20" r="8" />
      <circle cx="-2" cy="20" r="5" fill="currentColor" fillOpacity="0.5" stroke="none" />
      <circle cx="66" cy="20" r="8" />
      <circle cx="66" cy="20" r="5" fill="currentColor" fillOpacity="0.5" stroke="none" />
    </>
  ),

  boss_core: (
    <>
      {/* Outer chaotic shell spikes */}
      <polygon points="32,2 36,18 30,18" />
      <polygon points="56,10 46,22 44,16" />
      <polygon points="66,32 50,36 52,30" />
      <polygon points="62,58 48,52 50,46" />
      <polygon points="44,78 38,64 44,62" />
      <polygon points="20,78 26,64 20,62" />
      <polygon points="2,58 16,52 14,46" />
      <polygon points="-2,32 14,36 12,30" />
      <polygon points="8,10 18,22 20,16" />
      {/* Pulsing outer ring */}
      <circle cx="32" cy="44" r="28" fill="none" strokeWidth="2.5" strokeOpacity="0.5" />
      {/* Mid shell — jagged */}
      <path d="M32,18 L44,22 L54,32 L56,44 L52,56 L44,64 L32,68 L20,64 L12,56 L8,44 L12,32 L20,22 Z" />
      {/* Inner core — bright and burning */}
      <circle cx="32" cy="44" r="16" />
      <circle cx="32" cy="44" r="12" fill="currentColor" fillOpacity="0.6" stroke="none" />
      {/* Hellstorm eye at center */}
      <circle cx="32" cy="44" r="7" fill="#000" stroke="none" />
      <circle cx="32" cy="44" r="4" fill="currentColor" stroke="none" />
      {/* Radiating energy lines */}
      <line x1="32" y1="22" x2="32" y2="14" strokeWidth="2" strokeOpacity="0.7" />
      <line x1="48" y1="28" x2="54" y2="22" strokeWidth="2" strokeOpacity="0.7" />
      <line x1="54" y1="44" x2="62" y2="44" strokeWidth="2" strokeOpacity="0.7" />
      <line x1="48" y1="60" x2="54" y2="66" strokeWidth="2" strokeOpacity="0.7" />
      <line x1="32" y1="66" x2="32" y2="74" strokeWidth="2" strokeOpacity="0.7" />
      <line x1="16" y1="60" x2="10" y2="66" strokeWidth="2" strokeOpacity="0.7" />
      <line x1="10" y1="44" x2="2" y2="44" strokeWidth="2" strokeOpacity="0.7" />
      <line x1="16" y1="28" x2="10" y2="22" strokeWidth="2" strokeOpacity="0.7" />
      {/* Chains of corruption */}
      <path d="M4,20 C-2,28 -4,38 4,46" fill="none" strokeWidth="2.5" strokeDasharray="3,2" strokeOpacity="0.6" />
      <path d="M60,20 C66,28 68,38 60,46" fill="none" strokeWidth="2.5" strokeDasharray="3,2" strokeOpacity="0.6" />
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
