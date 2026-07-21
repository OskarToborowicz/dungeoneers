import { motion, useAnimationControls } from "motion/react";
import { useEffect, useId } from "react";
import type { ReactNode } from "react";
import type { SpriteState } from "./CharacterSprite";
import { MONSTER_ASSETS, MONSTER_IMG } from "./monsterAssets";

interface Props {
  name: string;
  size?: number;
  state?: SpriteState;
  statusEffects?: Array<"poison" | "burn" | "bleed">;
}

const MONSTER_TYPES: Record<string, string> = {
  "Fallen One": "fallen",
  "Carrion Bird": "bird",
  "Fallen Shaman": "shaman",
  Corpsefire: "boss_undead",
  Zombie: "zombie",
  "Wailing Beast": "beast",
  Devilkin: "fallen",
  Bishibosh: "boss_shaman",
  "Quill Rat": "ratspike",
  "Cairn Wraith": "wraith",
  Yeti: "brute",
  Rakanishu: "boss_fallen",
  "Dark One": "fallen",
  "Vile Hag": "hag",
  Brute: "brute",
  "Treehead Woodfist": "boss_tree",
  "Fallen Champion": "fallen_elite",
  Scarab: "scarab",
  "Horror Archer": "skeleton_archer",
  "The Countess": "boss_countess",
  "Dark Stalker": "wraith",
  Succubus: "succubus",
  "Vile Guardian": "brute",
  Andariel: "boss_andariel",
  // Act 1 — new
  "Hungry Rat": "rat",
  "Giant Leech": "leech",
  "Drowned Corpse": "zombie",
  "The Rat King": "boss_rat",
  "Wounded Elk": "elk",
  "Wild Boar": "boar",
  Bear: "bear",
  "Forest Hag": "hag",
  Bat: "bat",
  Wolf: "beast",
  "Dire Wolf": "dire_wolf",
  "Alpha Wolf": "boss_wolf",
  "Flock of Ravens": "bird",
  Scarecrow: "scarecrow",
  "Dense Fog": "smoke_cloud",
  "Living Shadow": "boss_shadow",
  "Animated Corpse": "zombie",
  Skeleton: "skeleton",
  "Undead Hound": "undead_hound",
  Ghost: "ghost",
  "Mass of Bones": "boss_bones",
  "Crypt Lurker": "crypt_lurker",
  "Bone Golem": "bone_golem",
  Niktag: "boss_niktag",
  "Goblin Worker": "goblin_worker",
  "Goblin Fighter": "goblin",
  "Goblin Priest": "goblin_priest",
  "Goblin King": "boss_goblin",
  Scoundrel: "scoundrel",
  Bandit: "bandit",
  "Contract Killer": "contract_killer",
  "Exiled City Guard": "boss_guard",
  "Veteran Bandit": "bandit",
  "Chieftain's Right Hand": "brute",
  "Ursh, Bandit's Companion": "ursh",
  "Bandit Chieftain": "boss_chieftain",
  // Act 2 — ice
  "Snow Wolf": "snow_wolf",
  "Frost Harpy": "frost_harpy",
  "Glacial Bear": "glacial_bear",
  "Ice Golem": "ice_golem",
  "Frostbitten Corpse": "zombie",
  "Icy Bat": "bat",
  "Frozen Revenant": "frozen_revenant",
  "Crystal Colossus": "crystal_colossus",
  "Icehorn Mammoth": "icehorn_mammoth",
  "Frost Lynx": "frost_lynx",
  "Young Ice Troll": "ice_troll",
  "The Pale Stag": "pale_stag",
  "Spirit Owl": "spirit_owl",
  "Lunar Ghost": "lunar_ghost",
  "Crystal Elemental": "crystal_elemental",
  "Moon Reflection": "moon_reflection",
  "Frost Wraith": "frost_wraith",
  "Ice Wyvern": "ice_wyvern",
  "Ice Troll": "ice_troll",
  "White Chimera": "white_chimera",
  "Crystal Spider": "crystal_spider",
  "Frost Ogre": "frost_ogre",
  "Glacier Worm": "glacier_worm",
  "Frozen Taur": "frozen_taur",
  "Frost Dwarf": "frost_dwarf",
  "Animated Frost Knight": "frost_knight",
  "Frostforge Dwarven Warrior": "dwarven_warrior",
  "Core of the Frozen Forge": "frozen_forge_core",
  "Glacial Eagle": "glacial_eagle",
  "Elder Harpy": "elder_harpy",
  "Ice Shard Golem": "bone_golem",
  "Ghost of the Mountain": "ghost_of_mountain",
  "Frozen Bones": "frozen_bones",
  "Young Azure Dragon": "azure_dragon",
  "Avalanche Elemental": "avalanche_elemental",
  Sikktharkk: "sikktharkk",
  // ── Act 3 ──────────────────────────────────────────────────────────────────
  "Jungle Stalker": "jungle_stalker",
  "Thorn Hunter": "thorn_hunter",
  "Venom Viper": "venom_viper",
  "Ancient Treant": "ancient_treant",
  "Bog Zombie": "zombie",
  "Swamp Serpent": "swamp_serpent",
  "Poison Toad": "poison_toad",
  "Mother of the Swamp": "mother_of_swamp",
  "Jungle Harpy": "jungle_harpy",
  "School of Gigantic Piranhas": "piranha_school",
  "Thorn Dryad": "thorn_dryad",
  "The Great Emerald Crocolisk": "emerald_crocolisk",
  "Cursed Tribesman": "cursed_tribesman",
  "Haunted Mask": "haunted_mask",
  "Voodoo Shaman": "voodoo_shaman",
  "The Soul Collector": "soul_collector",
  "Blood Vine": "blood_vine",
  "Carnivorous Plant": "carnivorous_plant",
  "Giant Tarantula": "giant_tarantula",
  "The Devourer Bloom": "devourer_bloom",
  "Stone Jaguar": "stone_jaguar",
  "Temple Guardian": "temple_guardian",
  "Venom Priest": "venom_priest",
  "Golden Idol": "golden_idol",
  "Ancient Gorilla": "ancient_gorilla",
  "Emerald Basilisk": "emerald_basilisk",
  "Jungle Guardian": "jungle_guardian",
  "The Green Warden": "green_warden",
  "Elite Voodoo Warrior": "elite_voodoo_warrior",
  "Soul Devourer": "soul_devourer",
  "Cursed Colossus": "cursed_colossus",
  "Ancient Loa": "ancient_loa",
  "Spirit of the Crocolisk": "spirit_crocolisk",
  "Spirit of the Gorilla": "spirit_gorilla",
  "Spirit of the Eagle": "spirit_eagle",
  "Zam'Koro, The Loa of Endless Night": "zamkoro",
  // ── Act 4 ──────────────────────────────────────────────────────────────────
  "Veil Wraith": "veil_wraith",
  "Hollow Specter": "specter",
  "Lost Soul": "lost_soul",
  "The Gatekeeper": "boss_gatekeeper",
  "Tomb Knight": "tomb_knight",
  "Bone Herald": "bone_herald",
  "Cursed Royal Guard": "tomb_knight",
  "Prince Valdris the Damned": "boss_valdris",
  "Ash Wraith": "veil_wraith",
  "Shadow Stalker": "shadow_stalker",
  "Bone Treant": "bone_treant",
  "The Pale Huntress": "boss_pale_huntress",
  "Drowned Revenant": "drowned_revenant",
  "Soul Ferryman": "soul_ferryman",
  "Wailing Banshee": "wailing_banshee",
  "The Abyssal Hydra": "boss_abyssal_hydra",
  "Undead Siege Knight": "tomb_knight",
  "Ashen Golem": "bone_golem",
  "Phantom Crossbowman": "phantom_crossbowman",
  "General Morrath": "boss_morrath",
  "Shadow Acolyte": "bone_herald",
  "Void Cultist": "void_cultist",
  "Nightmare Gargoyle": "nightmare_gargoyle",
  "High Inquisitor Varek": "boss_varek",
  "Fear Manifestation": "fear_manifestation",
  "Nightmare Hound": "dire_wolf",
  "Dread Specter": "specter",
  "The Dreaming Horror": "boss_dreaming_horror",
  "Void Sentinel": "void_sentinel",
  "Shadow Executioner": "shadow_executioner",
  "Eternal Wraith": "veil_wraith",
  "Seraphel the Undying": "boss_seraphel",
  "Shade of Valdris": "shade_valdris",
  "The Void Heralds": "void_herald",
  "Shade of the Gatekeeper": "shade_gatekeeper",
  "Reltih, the Void Devourer": "relith",
};

const MONSTER_COLORS: Record<string, string> = {
  fallen: "#cc3300",
  fallen_elite: "#ff4411",
  bird: "#997755",
  shaman: "#dd6600",
  zombie: "#668844",
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
  // Act 1 — new
  rat: "#997755",
  leech: "#4ec257",
  boss_rat: "#856725",
  elk: "#886644",
  boar: "#665544",
  bear: "#664422",
  bat: "#925952",
  beast: "#8c6b4a",
  dire_wolf: "#788694",
  boss_wolf: "#c8c0b0",
  scarecrow: "#997733",
  boss_shadow: "#3344aa",
  skeleton: "#aabbaa",
  undead_hound: "#99aaaa",
  boss_bones: "#bbccbb",
  crypt_lurker: "#667744",
  bone_golem: "#99aaaa",
  boss_niktag: "#8844cc",
  goblin: "#448833",
  goblin_worker: "#448833",
  goblin_priest: "#448833",
  boss_goblin: "#449922",
  scoundrel: "#8877aa",
  bandit: "#997755",
  contract_killer: "#556677",
  boss_guard: "#8899bb",
  ursh: "#6b1a0a",
  boss_chieftain: "#667788",
  ghost: "#8899cc",
  lunar_ghost: "#b0c4e8",
  smoke_cloud: "#aaaaaa",
  // Act 2 — ice
  snow_wolf: "#c0d8f0",
  frost_harpy: "#8ab8e8",
  glacial_bear: "#a0c4d8",
  ice_golem: "#7fb8d4",
  frozen_revenant: "#6090b8",
  crystal_colossus: "#90d8f8",
  icehorn_mammoth: "#b0c4d0",
  frost_lynx: "#a8c8e0",
  ice_troll: "#788a98",
  pale_stag: "#e8f4ff",
  spirit_owl: "#c8d8f0",
  crystal_elemental: "#60d0f8",
  moon_reflection: "#d0d8f8",
  frost_wraith: "#5070a8",
  ice_wyvern: "#4890c8",
  white_chimera: "#d8e8f8",
  crystal_spider: "#88c8e8",
  frost_ogre: "#889898",
  glacier_worm: "#607888",
  frozen_taur: "#7090b0",
  frost_dwarf: "#9090a8",
  frost_knight: "#8090c0",
  dwarven_warrior: "#a09878",
  frozen_forge_core: "#60a8d8",
  glacial_eagle: "#b8d0e8",
  elder_harpy: "#7098c0",
  ghost_of_mountain: "#d0e0f8",
  frozen_bones: "#c8d8e0",
  azure_dragon: "#3880d0",
  avalanche_elemental: "#b0c4d8",
  sikktharkk: "#1850b8",
  // ── Act 3 ──
  jungle_stalker: "#3a6a28",
  thorn_hunter: "#7a5a2a",
  venom_viper: "#6aaa28",
  ancient_treant: "#4a7820",
  swamp_serpent: "#4a7230",
  poison_toad: "#80a838",
  mother_of_swamp: "#5a8038",
  jungle_harpy: "#4a8a40",
  piranha_school: "#c05030",
  thorn_dryad: "#4a7a3a",
  emerald_crocolisk: "#2a7a3a",
  cursed_tribesman: "#7a6040",
  haunted_mask: "#b080b8",
  voodoo_shaman: "#704880",
  soul_collector: "#5030a0",
  blood_vine: "#b83030",
  carnivorous_plant: "#588028",
  giant_tarantula: "#4a3020",
  devourer_bloom: "#b04878",
  stone_jaguar: "#706850",
  temple_guardian: "#808060",
  venom_priest: "#507040",
  golden_idol: "#c89810",
  ancient_gorilla: "#4a3820",
  emerald_basilisk: "#2a8040",
  jungle_guardian: "#4a6030",
  green_warden: "#3a7020",
  elite_voodoo_warrior: "#583070",
  soul_devourer: "#402090",
  cursed_colossus: "#706090",
  ancient_loa: "#201880",
  spirit_crocolisk: "#50b870",
  spirit_gorilla: "#70b890",
  spirit_eagle: "#90b8d0",
  zamkoro: "#100840",
  // ── Act 4 ──
  veil_wraith: "#4a3880",
  specter: "#6050a8",
  lost_soul: "#8878c0",
  boss_gatekeeper: "#201860",
  tomb_knight: "#5a5060",
  bone_herald: "#8870a8",
  boss_valdris: "#3a1050",
  shadow_stalker: "#302840",
  bone_treant: "#605848",
  boss_pale_huntress: "#d0c8e8",
  drowned_revenant: "#304860",
  soul_ferryman: "#203448",
  wailing_banshee: "#7060a0",
  boss_abyssal_hydra: "#102040",
  phantom_crossbowman: "#504868",
  boss_morrath: "#382830",
  void_cultist: "#2a1840",
  nightmare_gargoyle: "#484058",
  boss_varek: "#1a0830",
  fear_manifestation: "#603060",
  boss_dreaming_horror: "#5a1a70",
  void_sentinel: "#1c1430",
  shadow_executioner: "#281820",
  boss_seraphel: "#0c0820",
  shade_valdris: "#4830a0",
  void_herald: "#1c1050",
  shade_gatekeeper: "#302880",
  relith: "#160820",
};

type AnimStyle = "float" | "sway" | "stomp" | "skitter" | "pulse" | "lurch";

const TYPE_ANIM: Record<string, AnimStyle> = {
  // Act 1 — new
  rat: "skitter",
  leech: "lurch",
  boss_rat: "stomp",
  elk: "stomp",
  boar: "stomp",
  bear: "stomp",
  bat: "float",
  dire_wolf: "stomp",
  boss_wolf: "stomp",
  scarecrow: "sway",
  boss_shadow: "float",
  skeleton: "sway",
  undead_hound: "skitter",
  boss_bones: "lurch",
  crypt_lurker: "skitter",
  bone_golem: "stomp",
  boss_niktag: "sway",
  goblin: "skitter",
  goblin_priest: "sway",
  boss_goblin: "stomp",
  scoundrel: "skitter",
  bandit: "sway",
  contract_killer: "skitter",
  boss_guard: "stomp",
  ursh: "stomp",
  boss_chieftain: "stomp",
  fallen: "skitter",
  fallen_elite: "skitter",
  bird: "float",
  shaman: "sway",
  hag: "sway",
  zombie: "lurch",
  beast: "stomp",
  brute: "stomp",
  ratspike: "skitter",
  wraith: "float",
  scarab: "skitter",
  skeleton_archer: "sway",
  boss_undead: "stomp",
  boss_shaman: "pulse",
  boss_fallen: "stomp",
  boss_tree: "stomp",
  boss_countess: "sway",
  boss_andariel: "pulse",
  succubus: "float",
  ghost: "float",
  lunar_ghost: "float",
  smoke_cloud: "float",
  // Act 2 — ice
  snow_wolf: "sway",
  frost_harpy: "float",
  glacial_bear: "stomp",
  ice_golem: "stomp",
  frozen_revenant: "sway",
  crystal_colossus: "stomp",
  icehorn_mammoth: "stomp",
  frost_lynx: "skitter",
  ice_troll: "stomp",
  pale_stag: "sway",
  spirit_owl: "float",
  crystal_elemental: "float",
  moon_reflection: "sway",
  frost_wraith: "float",
  ice_wyvern: "float",
  white_chimera: "stomp",
  crystal_spider: "skitter",
  frost_ogre: "stomp",
  glacier_worm: "lurch",
  frozen_taur: "stomp",
  frost_dwarf: "stomp",
  frost_knight: "sway",
  dwarven_warrior: "stomp",
  frozen_forge_core: "pulse",
  glacial_eagle: "float",
  elder_harpy: "float",
  ghost_of_mountain: "float",
  frozen_bones: "sway",
  azure_dragon: "float",
  avalanche_elemental: "stomp",
  sikktharkk: "float",
  // ── Act 3 ──
  jungle_stalker: "skitter",
  thorn_hunter: "sway",
  venom_viper: "sway",
  ancient_treant: "stomp",
  swamp_serpent: "sway",
  poison_toad: "skitter",
  mother_of_swamp: "lurch",
  jungle_harpy: "float",
  piranha_school: "skitter",
  thorn_dryad: "sway",
  emerald_crocolisk: "stomp",
  cursed_tribesman: "sway",
  haunted_mask: "float",
  voodoo_shaman: "sway",
  soul_collector: "float",
  blood_vine: "sway",
  carnivorous_plant: "pulse",
  giant_tarantula: "skitter",
  devourer_bloom: "pulse",
  stone_jaguar: "skitter",
  temple_guardian: "stomp",
  venom_priest: "sway",
  golden_idol: "stomp",
  ancient_gorilla: "stomp",
  emerald_basilisk: "sway",
  jungle_guardian: "stomp",
  green_warden: "stomp",
  elite_voodoo_warrior: "sway",
  soul_devourer: "float",
  cursed_colossus: "stomp",
  ancient_loa: "float",
  spirit_crocolisk: "float",
  spirit_gorilla: "float",
  spirit_eagle: "float",
  zamkoro: "float",
  // ── Act 4 ──
  veil_wraith: "float",
  specter: "float",
  lost_soul: "float",
  boss_gatekeeper: "stomp",
  tomb_knight: "stomp",
  bone_herald: "sway",
  boss_valdris: "stomp",
  shadow_stalker: "skitter",
  bone_treant: "stomp",
  boss_pale_huntress: "float",
  drowned_revenant: "lurch",
  soul_ferryman: "sway",
  wailing_banshee: "float",
  boss_abyssal_hydra: "pulse",
  phantom_crossbowman: "sway",
  boss_morrath: "stomp",
  void_cultist: "sway",
  nightmare_gargoyle: "float",
  boss_varek: "float",
  fear_manifestation: "float",
  boss_dreaming_horror: "pulse",
  void_sentinel: "stomp",
  shadow_executioner: "sway",
  boss_seraphel: "float",
  shade_valdris: "float",
  void_herald: "float",
  shade_gatekeeper: "float",
  relith: "pulse",
};

function getAnimate(state: SpriteState, type: string) {
  const style: AnimStyle = TYPE_ANIM[type] ?? "sway";
  if (state === "idle") return { x: 0, y: 0, scale: 1 };
  if (state === "attack") {
    if (style === "stomp" || style === "pulse")
      return { y: [0, -14, 6, 0], x: [0, -4, 0] };
    if (style === "skitter") return { x: [0, -14, 4, 0], y: [0, -6, 0] };
    if (style === "float") return { y: [0, -14, 4, 0], x: [0, -6, 0] };
    return { y: [0, -12, 4, 0], x: [0, -4, 0] };
  }
  if (state === "hit") return { x: [0, 10, -10, 6, -6, 0] };
  return { y: 26, opacity: 0.25 };
}

function getTransition(state: SpriteState, _type: string) {
  if (state === "idle") return { duration: 0 };
  if (state === "attack") return { duration: 0.4 };
  if (state === "hit") return { duration: 0.38 };
  return { duration: 0.55, ease: "easeIn" as const };
}

const SPRITES: Record<string, ReactNode> = {
  // ── Act 1 new sprites ──────────────────────────────────────────────────────
  ursh: (
    <>
      {/* body - low aggressive quadruped, hunched forward */}
      <ellipse cx="28" cy="62" rx="27" ry="15" />
      {/* massive shoulder hump */}
      <ellipse cx="46" cy="49" rx="15" ry="13" />
      {/* rump lower */}
      <ellipse cx="10" cy="58" rx="10" ry="9" />
      {/* thick neck */}
      <path
        d="M42 50 C36 55 36 60 42 64"
        fill="none"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* head - low and forward */}
      <circle cx="57" cy="46" r="15" />
      {/* round ears — torn and ragged */}
      <circle cx="46" cy="31" r="7" />
      <circle cx="63" cy="29" r="7" />
      {/* ear notch scars */}
      <path
        d="M42 28 L50 34 M60 26 L67 32"
        strokeWidth="2"
        stroke="#3d0000"
        fill="none"
      />
      {/* snout — wide open maw */}
      <ellipse cx="68" cy="52" rx="8" ry="6" />
      {/* open mouth */}
      <path d="M62 55 Q68 62 74 55" fill="#3d0000" stroke="none" />
      {/* fangs */}
      <path
        d="M63 55 L62 62 M67 56 L67 64 M72 55 L73 62"
        strokeWidth="2.5"
        strokeLinecap="round"
        stroke="#e8e0d0"
        fill="none"
      />
      {/* blood drip from mouth */}
      <path
        d="M67 64 Q67 70 65 74"
        strokeWidth="1.8"
        stroke="#cc0000"
        fill="none"
        strokeLinecap="round"
      />
      {/* glowing red left eye */}
      <ellipse cx="51" cy="41" rx="4.5" ry="4" fill="#cc0000" stroke="none" />
      <ellipse cx="51" cy="41" rx="2" ry="2" fill="#ff4444" stroke="none" />
      {/* scar across eye */}
      <path d="M47 37 L55 45" strokeWidth="1.8" stroke="#220000" fill="none" />
      {/* nose */}
      <ellipse cx="72" cy="49" rx="3" ry="2.5" fill="#220000" stroke="none" />
      {/* 4 thick legs */}
      <rect x="8" y="74" width="13" height="22" rx="4" />
      <rect x="24" y="76" width="12" height="20" rx="4" />
      <rect x="38" y="76" width="12" height="20" rx="4" />
      <rect x="52" y="74" width="13" height="22" rx="4" />
      {/* heavy claws */}
      <path
        d="M8 93 L5 100 M14 94 L12 101 M20 93 L23 100"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M52 93 L49 100 M58 94 L56 101 M64 93 L67 100"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* battle scars on body */}
      <path
        d="M22 55 L28 62 M32 50 L36 58"
        strokeWidth="1.8"
        stroke="#3d0000"
        fill="none"
        strokeOpacity="0.7"
      />
      {/* tail — stubby and raised aggressive */}
      <path
        d="M3 57 C-6 46 -4 56 2 63"
        fill="none"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </>
  ),

  scoundrel: (
    <>
      <path d="M18 6 C14 -2 18 -8 32 -6 C46 -8 50 -2 46 6 L42 16 L22 16 Z" />
      <ellipse cx="32" cy="20" rx="10" ry="10" />
      <ellipse cx="27" cy="18" rx="3" ry="3" fill="#000" stroke="none" />
      <ellipse cx="37" cy="18" rx="3" ry="3" fill="#000" stroke="none" />
      <ellipse cx="27" cy="18" rx="1.5" ry="1.5" fill="#cc8800" stroke="none" />
      <ellipse cx="37" cy="18" rx="1.5" ry="1.5" fill="#cc8800" stroke="none" />
      <path d="M20 28 L44 28 L46 58 L18 58 Z" />
      <path d="M20 28 C12 32 6 44 8 58 L18 58 Z" />
      <path d="M44 28 C52 32 58 44 56 58 L46 58 Z" />
      <path d="M20 34 L6 52 L12 56 L24 42 Z" />
      <path d="M44 34 L58 50 L52 56 L40 42 Z" />
      <rect x="0" y="36" width="4" height="22" rx="1" />
      <rect x="-4" y="50" width="12" height="3" rx="1" />
      <rect x="60" y="34" width="4" height="22" rx="1" />
      <rect x="56" y="48" width="12" height="3" rx="1" />
      <path d="M20 56 L14 72 L24 76 L28 62 Z" />
      <path d="M44 56 L50 72 L40 76 L36 62 Z" />
    </>
  ),

  bandit: (
    <>
      <path d="M20 6 Q32 0 44 6 L44 14 L20 14 Z" />
      <ellipse cx="32" cy="20" rx="10" ry="11" />
      <ellipse cx="27" cy="19" rx="2.5" ry="2.5" fill="#220000" stroke="none" />
      <ellipse cx="37" cy="19" rx="2.5" ry="2.5" fill="#220000" stroke="none" />
      <path d="M36 22 L38 28" strokeWidth="1.5" strokeOpacity="0.4" />
      <path d="M18 30 L46 30 L44 68 L20 68 Z" />
      <path
        d="M18 40 L46 40 M20 52 L44 52"
        strokeWidth="1.2"
        strokeOpacity="0.3"
      />
      <rect x="18" y="56" width="28" height="5" rx="1" />
      <rect x="18" y="68" width="14" height="24" rx="3" />
      <rect x="32" y="68" width="14" height="24" rx="3" />
      <path d="M18 34 L4 54 L10 58 L22 42 Z" />
      <path d="M46 32 L60 50 L54 56 L40 40 Z" />
      <rect x="58" y="12" width="4" height="46" rx="1" />
      <rect x="52" y="34" width="16" height="4" rx="1" />
    </>
  ),

  contract_killer: (
    <>
      <path d="M16 4 C12 -6 18 -12 32 -8 C46 -12 52 -6 48 4 L46 18 L18 18 Z" />
      <ellipse
        cx="32"
        cy="20"
        rx="12"
        ry="10"
        fill="#000"
        stroke="none"
        fillOpacity="0.7"
      />
      <ellipse cx="32" cy="20" rx="11" ry="9" />
      <circle
        cx="27"
        cy="19"
        r="2"
        fill="#ffffff"
        stroke="none"
        fillOpacity="0.7"
      />
      <circle
        cx="37"
        cy="19"
        r="2"
        fill="#ffffff"
        stroke="none"
        fillOpacity="0.7"
      />
      <path d="M18 28 L46 28 L44 70 L20 70 Z" />
      <path d="M18 28 C8 34 4 52 6 68 L18 68 Z" />
      <path d="M46 28 C56 34 60 52 58 68 L46 68 Z" />
      <path
        d="M18 30 L46 56 M46 30 L18 56"
        strokeWidth="1.5"
        strokeOpacity="0.3"
      />
      <path d="M18 34 L2 18 L8 26 L18 42 Z" />
      <path d="M46 34 L62 18 L56 26 L46 42 Z" />
      <rect x="-2" y="2" width="3" height="22" rx="1" />
      <rect x="63" y="2" width="3" height="22" rx="1" />
      <path d="M20 70 L16 80 L22 84 Z" />
      <path d="M44 70 L48 80 L42 84 Z" />
    </>
  ),

  boss_guard: (
    <>
      <path d="M18 12 C18 -2 46 -2 46 12 L46 24 L42 28 L22 28 L18 24 Z" />
      <rect
        x="20"
        y="16"
        width="8"
        height="3"
        rx="1"
        fill="#000"
        stroke="none"
      />
      <rect
        x="36"
        y="16"
        width="8"
        height="3"
        rx="1"
        fill="#000"
        stroke="none"
      />
      <path d="M28 12 Q32 2 36 12" fill="none" strokeWidth="3" />
      <rect x="22" y="26" width="20" height="6" rx="2" />
      <path d="M10 32 L54 32 L54 72 L10 72 Z" />
      <line
        x1="32"
        y1="34"
        x2="32"
        y2="70"
        strokeWidth="2"
        strokeOpacity="0.3"
      />
      <line
        x1="10"
        y1="50"
        x2="54"
        y2="50"
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />
      <path d="M10 32 C2 28 -2 36 4 42 L10 42 Z" />
      <path d="M54 32 C62 28 66 36 60 42 L54 42 Z" />
      <rect x="10" y="72" width="20" height="22" rx="3" />
      <rect x="34" y="72" width="20" height="22" rx="3" />
      <path d="M10 36 L-4 56 L6 62 L18 48 Z" />
      <path d="M-8 38 C-14 44 -14 62 -8 68 L4 68 L4 38 Z" />
      <path d="M54 36 L68 54 L58 60 L46 44 Z" />
      <rect x="66" y="12" width="5" height="50" rx="2" />
      <rect x="60" y="36" width="18" height="5" rx="2" />
    </>
  ),

  // ── Act 2 ice sprites ─────────────────────────────────────────────────────
  snow_wolf: (
    <>
      {/* body - horizontal quadruped */}
      <ellipse cx="28" cy="58" rx="24" ry="14" />
      {/* fluffy shoulder ruff */}
      <ellipse cx="44" cy="50" rx="12" ry="9" />
      {/* rump */}
      <ellipse cx="10" cy="54" rx="9" ry="8" />
      {/* ice spike fur on back */}
      <polygon points="22,46 19,32 26,46" />
      <polygon points="34,45 31,30 38,45" />
      {/* head */}
      <ellipse cx="54" cy="42" rx="14" ry="13" />
      {/* pointed ears */}
      <polygon points="44,31 38,13 52,29" />
      <polygon points="58,31 52,13 66,29" />
      {/* elongated snout */}
      <path d="M65 39 L79 43 L65 50 Z" />
      {/* eye */}
      <circle cx="48" cy="38" r="4" fill="#aaddff" stroke="none" />
      {/* neck */}
      <path
        d="M44 52 C40 56 40 60 44 64"
        fill="none"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* 4 legs */}
      <rect x="8" y="68" width="9" height="24" rx="3" />
      <rect x="20" y="70" width="9" height="22" rx="3" />
      <rect x="37" y="70" width="9" height="22" rx="3" />
      <rect x="50" y="68" width="9" height="24" rx="3" />
      {/* claws */}
      <path d="M8 90 L6 96 M13 91 L11 97 M17 90 L19 96" strokeWidth="2" />
      {/* tail curling up */}
      <path
        d="M4 50 C-7 34 -3 22 5 26 C7 38 4 46 8 52"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </>
  ),

  frost_harpy: (
    <>
      <path d="M32 38 C20 28 4 20 0 8 C8 10 14 20 18 28 C8 14 10 2 18 4 C18 16 22 28 30 36 Z" />
      <path d="M32 38 C44 28 60 20 64 8 C56 10 50 20 46 28 C56 14 54 2 46 4 C46 16 42 28 34 36 Z" />
      <path d="M18 28 L14 20 M14 20 L10 14 M22 20 L18 14" strokeWidth="1.5" />
      <path d="M46 28 L50 20 M50 20 L54 14 M42 20 L46 14" strokeWidth="1.5" />
      <ellipse cx="32" cy="52" rx="10" ry="12" />
      <ellipse cx="32" cy="36" rx="9" ry="10" />
      <polygon points="28,30 24,18 32,28" />
      <polygon points="36,30 40,18 32,28" />
      <circle cx="28" cy="35" r="2.5" fill="#220000" stroke="none" />
      <circle cx="36" cy="35" r="2.5" fill="#220000" stroke="none" />
      <path d="M26 62 L22 72 M32 64 L30 74 M38 62 L42 72" strokeWidth="3.5" />
    </>
  ),

  glacial_bear: (
    <>
      {/* body - horizontal quadruped */}
      <ellipse cx="30" cy="60" rx="26" ry="16" />
      {/* shoulder hump */}
      <ellipse cx="46" cy="50" rx="12" ry="10" />
      {/* rump */}
      <ellipse cx="12" cy="54" rx="10" ry="9" />
      {/* ice spikes along back */}
      <polygon points="14,46 11,30 18,46" />
      <polygon points="28,43 25,26 32,43" />
      <polygon points="42,43 39,26 46,43" />
      {/* head */}
      <circle cx="54" cy="44" r="14" />
      {/* round ears */}
      <circle cx="44" cy="31" r="8" />
      <circle cx="60" cy="30" r="8" />
      {/* snout */}
      <ellipse cx="65" cy="49" rx="7" ry="5" />
      {/* nose */}
      <ellipse cx="69" cy="47" rx="3.5" ry="2.5" fill="#220000" stroke="none" />
      {/* eye */}
      <ellipse cx="49" cy="39" rx="3.5" ry="3.5" fill="#220000" stroke="none" />
      {/* neck */}
      <path
        d="M44 50 C40 54 40 58 44 62"
        fill="none"
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* 4 legs */}
      <rect x="10" y="73" width="11" height="20" rx="4" />
      <rect x="24" y="75" width="11" height="18" rx="4" />
      <rect x="39" y="75" width="11" height="18" rx="4" />
      <rect x="52" y="73" width="11" height="20" rx="4" />
      {/* claws */}
      <path d="M10 91 L8 97 M15 92 L13 98 M20 91 L22 97" strokeWidth="2" />
      <path d="M52 91 L50 97 M57 92 L55 98 M62 91 L64 97" strokeWidth="2" />
      {/* tail */}
      <path
        d="M5 54 C-5 44 -5 54 1 62"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </>
  ),

  ice_golem: (
    <>
      <polygon points="20,6 32,-4 44,6 46,22 18,22" />
      <polygon points="26,4 32,-8 38,4" />
      <rect x="18" y="22" width="28" height="8" rx="1" />
      <rect x="14" y="30" width="36" height="44" rx="2" />
      <polygon points="10,32 -4,54 8,58 18,40" />
      <polygon points="54,32 68,54 56,58 46,40" />
      <polygon points="-4,54 -10,44 2,50" />
      <polygon points="68,54 74,44 62,50" />
      <rect x="14" y="74" width="14" height="18" rx="3" />
      <rect x="36" y="74" width="14" height="18" rx="3" />
      <polygon points="16,32 12,22 20,32" />
      <polygon points="28,30 24,18 32,30" />
      <polygon points="36,30 40,18 44,30" />
      <polygon points="48,32 52,22 56,32" />
      <ellipse cx="24" cy="36" rx="4" ry="4" fill="#aaddff" stroke="none" />
      <ellipse cx="40" cy="36" rx="4" ry="4" fill="#aaddff" stroke="none" />
    </>
  ),

  frozen_revenant: (
    <>
      <path d="M20 8 C18 -2 46 -2 44 8 L44 22 L20 22 Z" />
      <ellipse cx="32" cy="22" rx="12" ry="10" />
      <ellipse cx="26" cy="20" rx="3.5" ry="4" fill="#220000" stroke="none" />
      <ellipse cx="38" cy="20" rx="3.5" ry="4" fill="#220000" stroke="none" />
      <ellipse cx="26" cy="20" rx="2" ry="2.5" fill="#88ccff" stroke="none" />
      <ellipse cx="38" cy="20" rx="2" ry="2.5" fill="#88ccff" stroke="none" />
      <path d="M18 30 C14 26 10 30 12 38 L18 38 Z" />
      <path d="M46 30 C50 26 54 30 52 38 L46 38 Z" />
      <path d="M16 30 L48 30 L46 72 L18 72 Z" />
      <polygon points="18,32 14,22 22,32" />
      <polygon points="28,30 24,18 32,30" />
      <polygon points="36,30 40,18 44,30" />
      <polygon points="46,32 50,22 54,32" />
      <rect x="18" y="72" width="14" height="22" rx="3" />
      <rect x="32" y="72" width="14" height="22" rx="3" />
      <path d="M18 34 L2 54 L12 60 L24 44 Z" />
      <rect x="-2" y="18" width="4" height="46" rx="2" />
      <rect x="-8" y="36" width="16" height="4" rx="2" />
    </>
  ),

  crystal_colossus: (
    <>
      <polygon points="32,-8 44,6 44,22 20,22 20,6" />
      <polygon points="32,-8 38,-16 44,6" />
      <polygon points="32,-8 26,-16 20,6" />
      <rect x="16" y="22" width="32" height="52" rx="2" />
      <polygon points="14,24 -2,48 8,54 18,34" />
      <polygon points="50,24 66,48 56,54 46,34" />
      <polygon points="-2,48 -8,38 4,44" />
      <polygon points="66,48 72,38 60,44" />
      <polygon points="22,24 18,14 26,24" />
      <polygon points="32,22 28,10 36,22" />
      <polygon points="42,24 46,14 38,24" />
      <rect x="16" y="74" width="13" height="18" rx="3" />
      <rect x="35" y="74" width="13" height="18" rx="3" />
      <ellipse cx="26" cy="34" rx="5" ry="6" fill="#aaeeff" stroke="none" />
      <ellipse cx="38" cy="34" rx="5" ry="6" fill="#aaeeff" stroke="none" />
    </>
  ),

  icehorn_mammoth: (
    <>
      <path
        d="M18 8 L8 -8 C4 -16 12 -18 16 -12 C14 -4 18 0 22 6"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M46 8 L56 -8 C60 -16 52 -18 48 -12 C50 -4 46 0 42 6"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <ellipse cx="32" cy="22" rx="16" ry="14" />
      <ellipse cx="32" cy="30" rx="8" ry="6" />
      <circle cx="28" cy="30" r="2" fill="#000" stroke="none" />
      <circle cx="36" cy="30" r="2" fill="#000" stroke="none" />
      <ellipse cx="24" cy="18" rx="4" ry="4" fill="#220000" stroke="none" />
      <ellipse cx="40" cy="18" rx="4" ry="4" fill="#220000" stroke="none" />
      <path d="M6 36 L58 36 L56 80 L8 80 Z" />
      <path
        d="M8 42 C4 36 2 28 8 24 C6 32 8 36 12 40"
        fill="none"
        strokeWidth="3"
      />
      <path
        d="M56 42 C60 36 62 28 56 24 C58 32 56 36 52 40"
        fill="none"
        strokeWidth="3"
      />
      <rect x="8" y="80" width="18" height="14" rx="3" />
      <rect x="22" y="80" width="18" height="14" rx="3" />
      <rect x="38" y="80" width="18" height="14" rx="3" />
    </>
  ),

  frost_lynx: (
    <>
      <polygon points="22,10 16,-2 28,8" />
      <polygon points="42,10 48,-2 36,8" />
      <ellipse cx="32" cy="20" rx="14" ry="13" />
      <path d="M40 24 L56 22 L40 30 Z" />
      <ellipse cx="25" cy="18" rx="4" ry="4" fill="#220000" stroke="none" />
      <ellipse cx="39" cy="18" rx="4" ry="4" fill="#220000" stroke="none" />
      <ellipse cx="25" cy="18" rx="2" ry="2" fill="#88ccff" stroke="none" />
      <ellipse cx="39" cy="18" rx="2" ry="2" fill="#88ccff" stroke="none" />
      <path d="M24 30 L36 30 L34 44 L26 44 Z" />
      <path d="M10 40 L54 40 L52 72 L12 72 Z" />
      <polygon points="12,42 8,30 16,42" />
      <polygon points="22,40 18,26 26,40" />
      <polygon points="38,40 42,26 46,40" />
      <polygon points="52,42 56,30 60,42" />
      <rect x="12" y="72" width="16" height="20" rx="3" />
      <rect x="36" y="72" width="16" height="20" rx="3" />
      <path d="M12 46 L-2 66 L8 72 L20 54 Z" />
      <path d="M52 46 L66 66 L56 72 L44 54 Z" />
      <path d="M10 70 C4 80 6 92 2 96" fill="none" strokeWidth="3" />
    </>
  ),

  ice_troll: (
    <>
      {/* huge lumpy head - disproportionately large, asymmetric */}
      <ellipse cx="32" cy="22" rx="20" ry="21" />
      {/* massive protruding jaw/chin */}
      <path d="M16 36 C14 50 22 58 32 60 C42 58 50 50 48 36 Z" />
      {/* jutting lower tusks */}
      <path
        d="M24 56 L20 68 M32 60 L30 72 M40 56 L44 68"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* small beady eyes deep under brow */}
      <ellipse cx="22" cy="16" rx="5" ry="5.5" fill="#000" stroke="none" />
      <ellipse cx="42" cy="16" rx="5" ry="5.5" fill="#000" stroke="none" />
      <ellipse cx="22" cy="16" rx="2.5" ry="3" fill="#88bbdd" stroke="none" />
      <ellipse cx="42" cy="16" rx="2.5" ry="3" fill="#88bbdd" stroke="none" />
      {/* heavy overhanging brow ridges */}
      <path
        d="M16 10 C20 4 28 6 32 8 C36 6 44 4 48 10"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* big warty bulbous nose */}
      <ellipse cx="32" cy="32" rx="8" ry="7" />
      <circle cx="28" cy="34" r="2.5" />
      <circle cx="36" cy="34" r="2.5" />
      {/* lumpy ears - big and floppy */}
      <ellipse cx="54" cy="18" rx="9" ry="12" />
      <ellipse cx="10" cy="20" rx="8" ry="10" />
      {/* icicle protrusions on head */}
      <polygon points="18,2 16,-12 22,2" />
      <polygon points="32,1 30,-14 36,1" />
      <polygon points="46,2 44,-12 50,2" />
      {/* hunched stocky body */}
      <path d="M10 58 L54 58 C58 74 58 82 56 92 L8 92 C6 82 6 74 10 58 Z" />
      {/* long dragging ape-arms */}
      <path d="M12 60 C2 72 -4 84 -2 96 L8 94 C6 84 10 74 18 64 Z" />
      <path d="M52 60 C62 72 68 84 66 96 L56 94 C58 84 54 74 46 64 Z" />
      {/* knuckle-dragging fists */}
      <ellipse cx="2" cy="96" rx="10" ry="7" />
      <path
        d="M-6 92 L-2 92 M-6 96 L-2 96 M-4 100 L0 100"
        strokeWidth="1.8"
        strokeOpacity="0.4"
      />
      <ellipse cx="62" cy="96" rx="10" ry="7" />
      <path
        d="M58 92 L64 92 M58 96 L64 96 M60 100 L66 100"
        strokeWidth="1.8"
        strokeOpacity="0.4"
      />
      {/* thick squat legs */}
      <rect x="12" y="92" width="17" height="10" rx="3" />
      <rect x="35" y="92" width="17" height="10" rx="3" />
    </>
  ),

  pale_stag: (
    <>
      <path
        d="M22 8 L18 -4 L24 4 M18 -4 L14 -10 M18 -4 L22 -10 M18 -4 L12 -6"
        fill="none"
        strokeWidth="2.5"
      />
      <path
        d="M42 8 L46 -4 L40 4 M46 -4 L50 -10 M46 -4 L42 -10 M46 -4 L52 -6"
        fill="none"
        strokeWidth="2.5"
      />
      <ellipse cx="32" cy="16" rx="10" ry="12" />
      <path d="M38 20 L52 18 L38 26 Z" />
      <circle cx="27" cy="14" r="3.5" fill="#aaddff" stroke="none" />
      <circle cx="37" cy="14" r="3.5" fill="#aaddff" stroke="none" />
      <circle cx="27" cy="14" r="1.5" fill="#000" stroke="none" />
      <circle cx="37" cy="14" r="1.5" fill="#000" stroke="none" />
      <path d="M26 26 L38 26 L36 42 L28 42 Z" />
      <ellipse cx="32" cy="60" rx="22" ry="18" />
      <rect x="12" y="74" width="10" height="20" rx="3" />
      <rect x="24" y="76" width="10" height="18" rx="3" />
      <rect x="34" y="76" width="10" height="18" rx="3" />
      <rect x="46" y="74" width="10" height="20" rx="3" />
      <path d="M18 52 C10 48 6 54 12 58" fill="none" strokeWidth="3" />
      <circle
        cx="32"
        cy="44"
        r="6"
        fill="#ddeeff"
        stroke="none"
        fillOpacity="0.5"
      />
    </>
  ),

  spirit_owl: (
    <>
      <path d="M16 44 C8 30 10 14 20 10 C18 22 20 34 22 42 Z" />
      <path d="M48 44 C56 30 54 14 44 10 C46 22 44 34 42 42 Z" />
      <path
        d="M18 14 L14 8 M18 10 L12 4 M22 8 L18 2"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <path
        d="M46 14 L50 8 M46 10 L52 4 M42 8 L46 2"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <ellipse cx="32" cy="52" rx="14" ry="16" />
      <ellipse cx="32" cy="34" rx="12" ry="12" />
      <ellipse cx="26" cy="30" rx="6" ry="7" fill="#220000" stroke="none" />
      <ellipse cx="38" cy="30" rx="6" ry="7" fill="#220000" stroke="none" />
      <ellipse cx="26" cy="30" rx="4" ry="5" fill="#aaddff" stroke="none" />
      <ellipse cx="38" cy="30" rx="4" ry="5" fill="#aaddff" stroke="none" />
      <path d="M29 38 L32 42 L35 38" strokeWidth="2" />
      <path d="M22 60 L18 72 M32 62 L30 74 M42 60 L46 72" strokeWidth="3.5" />
    </>
  ),

  crystal_elemental: (
    <>
      <polygon points="32,2 40,18 32,24 24,18" />
      <polygon points="32,2 44,10 40,18" fillOpacity="0.7" />
      <polygon points="32,2 20,10 24,18" fillOpacity="0.5" />
      <polygon points="32,24 24,18 18,32 32,38" />
      <polygon points="32,24 40,18 46,32 32,38" fillOpacity="0.8" />
      <polygon points="32,38 18,32 20,50 32,56" fillOpacity="0.6" />
      <polygon points="32,38 46,32 44,50 32,56" fillOpacity="0.9" />
      <polygon points="32,56 20,50 24,68 32,72" />
      <polygon points="32,56 44,50 40,68 32,72" fillOpacity="0.7" />
      <circle
        cx="32"
        cy="30"
        r="6"
        fill="#ccf0ff"
        stroke="none"
        fillOpacity="0.6"
      />
      <path
        d="M14 20 L6 30 M50 20 L58 30 M14 60 L8 70 M50 60 L56 70"
        strokeWidth="2"
        strokeOpacity="0.5"
      />
    </>
  ),

  moon_reflection: (
    <>
      <path d="M20 8 C18 -4 46 -4 44 8 L42 20 L22 20 Z" fillOpacity="0.7" />
      <ellipse cx="32" cy="22" rx="12" ry="12" fillOpacity="0.8" />
      <ellipse
        cx="26"
        cy="20"
        rx="4"
        ry="4.5"
        fill="#ddeeff"
        stroke="none"
        fillOpacity="0.9"
      />
      <ellipse
        cx="38"
        cy="20"
        rx="4"
        ry="4.5"
        fill="#ddeeff"
        stroke="none"
        fillOpacity="0.9"
      />
      <path d="M16 32 L48 32 L46 72 L18 72 Z" fillOpacity="0.6" />
      <path d="M18 32 C10 36 6 48 8 60 L18 60 Z" fillOpacity="0.5" />
      <path d="M46 32 C54 36 58 48 56 60 L46 60 Z" fillOpacity="0.5" />
      <path d="M16 38 L2 60 L10 64 L22 46 Z" fillOpacity="0.7" />
      <path d="M48 36 L60 56 L52 62 L40 44 Z" fillOpacity="0.7" />
      <path
        d="M20 70 C14 80 18 92 14 96 M28 72 C24 84 28 92 24 96 M36 72 C40 84 36 92 40 96 M44 70 C50 80 46 92 50 96"
        fill="none"
        strokeWidth="3"
        strokeOpacity="0.5"
      />
      <circle
        cx="32"
        cy="50"
        r="20"
        fill="none"
        strokeWidth="1"
        strokeOpacity="0.3"
        strokeDasharray="4 4"
      />
    </>
  ),

  frost_wraith: (
    <>
      <path
        d="M18 10 C14 2 18 -6 24 -2 C22 -8 30 -12 32 -4 C34 -12 42 -8 40 -2 C46 -6 50 2 46 10"
        fill="none"
        strokeWidth="2.5"
        strokeOpacity="0.7"
      />
      <ellipse cx="32" cy="20" rx="14" ry="14" fillOpacity="0.85" />
      <ellipse cx="24" cy="18" rx="5" ry="6" fill="#000" stroke="none" />
      <ellipse cx="40" cy="18" rx="5" ry="6" fill="#000" stroke="none" />
      <ellipse cx="24" cy="18" rx="3.5" ry="4" fill="#aaddff" stroke="none" />
      <ellipse cx="40" cy="18" rx="3.5" ry="4" fill="#aaddff" stroke="none" />
      <path d="M16 32 L48 32 L52 72 L12 72 Z" fillOpacity="0.7" />
      <path
        d="M16 36 C6 32 2 44 6 52"
        fill="none"
        strokeWidth="3.5"
        strokeOpacity="0.6"
      />
      <path
        d="M48 36 C58 32 62 44 58 52"
        fill="none"
        strokeWidth="3.5"
        strokeOpacity="0.6"
      />
      <path d="M16 42 L0 62 L8 66 L20 50 Z" fillOpacity="0.6" />
      <path d="M48 42 L64 62 L56 66 L44 50 Z" fillOpacity="0.6" />
      <path
        d="M18 70 C12 82 14 94 10 96 M28 74 C24 88 26 94 22 96 M36 74 C40 88 38 94 42 96 M46 70 C52 82 50 94 54 96"
        fill="none"
        strokeWidth="4"
        strokeOpacity="0.5"
      />
    </>
  ),

  ice_wyvern: (
    <>
      <path d="M32 52 C22 42 8 34 2 18 C8 20 14 32 18 40 C10 26 12 14 20 16 C20 28 24 42 30 50 Z" />
      <path d="M32 52 C42 42 56 34 62 18 C56 20 50 32 46 40 C54 26 52 14 44 16 C44 28 40 42 34 50 Z" />
      <path d="M18 40 L14 32 M14 32 L10 24 M22 32 L18 24" strokeWidth="2" />
      <path d="M46 40 L50 32 M50 32 L54 24 M42 32 L46 24" strokeWidth="2" />
      <ellipse cx="32" cy="62" rx="12" ry="14" />
      <ellipse cx="32" cy="44" rx="10" ry="10" />
      <polygon points="28,38 24,24 32,36" />
      <polygon points="36,38 40,24 32,36" />
      <circle cx="28" cy="42" r="3" fill="#aaddff" stroke="none" />
      <circle cx="36" cy="42" r="3" fill="#aaddff" stroke="none" />
      <path d="M26 72 L20 82 M32 74 L30 84 M38 72 L44 82" strokeWidth="4" />
      <path d="M8 66 C-2 62 -6 74 0 80" fill="none" strokeWidth="3" />
    </>
  ),

  white_chimera: (
    <>
      <ellipse cx="18" cy="18" rx="12" ry="12" />
      <polygon points="14,8 10,-4 20,6" />
      <polygon points="22,8 26,-4 16,6" />
      <ellipse cx="16" cy="17" rx="4" ry="4" fill="#220000" stroke="none" />
      <ellipse cx="20" cy="17" rx="4" ry="4" fill="#220000" stroke="none" />
      <path d="M26 22 L36 20 L26 26 Z" />
      <ellipse cx="46" cy="14" rx="10" ry="10" />
      <polygon points="42,6 38,-4 46,4" />
      <polygon points="50,6 54,-4 46,4" />
      <ellipse cx="46" cy="13" rx="3.5" ry="3.5" fill="#220000" stroke="none" />
      <ellipse cx="32" cy="50" rx="22" ry="22" />
      <path d="M10 42 C2 36 -2 46 4 52" fill="none" strokeWidth="3" />
      <path d="M54 42 C62 36 66 46 60 52" fill="none" strokeWidth="3" />
      <path d="M8 52 C-6 64 -6 82 8 88 L8 74 Z" />
      <path d="M64 66 C66 74 64 84 58 88 C66 86 72 76 68 66 Z" />
      <rect x="10" y="72" width="14" height="20" rx="3" />
      <rect x="26" y="74" width="12" height="18" rx="3" />
      <rect x="38" y="74" width="12" height="18" rx="3" />
      <rect x="50" y="72" width="14" height="20" rx="3" />
    </>
  ),

  crystal_spider: (
    <>
      <ellipse cx="32" cy="40" rx="20" ry="16" />
      <ellipse cx="32" cy="32" rx="12" ry="10" />
      <circle cx="26" cy="30" r="3" fill="#aaddff" stroke="none" />
      <circle cx="32" cy="28" r="3" fill="#aaddff" stroke="none" />
      <circle cx="38" cy="30" r="3" fill="#aaddff" stroke="none" />
      <path
        d="M14 36 L-2 22 M12 42 L-4 36 M12 48 L-2 58 M14 54 L0 68"
        strokeWidth="3"
      />
      <path
        d="M50 36 L66 22 M52 42 L68 36 M52 48 L66 58 M50 54 L64 68"
        strokeWidth="3"
      />
      <polygon points="14,36 8,26 16,34" fill="none" strokeWidth="1.5" />
      <polygon points="50,36 56,26 48,34" fill="none" strokeWidth="1.5" />
      <path d="M26 50 L24 62 M32 52 L32 64 M38 50 L40 62" strokeWidth="3.5" />
    </>
  ),

  frost_ogre: (
    <>
      {/* small stupid-looking round head - small relative to body */}
      <circle cx="32" cy="16" r="14" />
      {/* big floppy ears */}
      <ellipse cx="16" cy="16" rx="8" ry="11" />
      <ellipse cx="48" cy="16" rx="8" ry="11" />
      {/* tiny close-set eyes */}
      <ellipse cx="26" cy="12" rx="3.5" ry="4" fill="#220000" stroke="none" />
      <ellipse cx="38" cy="12" rx="3.5" ry="4" fill="#220000" stroke="none" />
      <ellipse cx="26" cy="12" rx="1.5" ry="2" fill="#88aacc" stroke="none" />
      <ellipse cx="38" cy="12" rx="1.5" ry="2" fill="#88aacc" stroke="none" />
      {/* wide dim-witted grin */}
      <path
        d="M20 22 Q32 32 44 22"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* protruding upper tusks */}
      <path d="M24 24 L20 36" strokeWidth="5" strokeLinecap="round" />
      <path d="M40 24 L44 36" strokeWidth="5" strokeLinecap="round" />
      {/* squat thick neck */}
      <rect x="24" y="28" width="16" height="10" rx="2" />
      {/* massive barrel chest and gut */}
      <path d="M2 34 C-2 54 0 74 8 84 L56 84 C64 74 66 54 62 34 Z" />
      {/* gut crease */}
      <path
        d="M10 58 C8 68 10 76 16 80 M54 58 C56 68 54 76 48 80"
        fill="none"
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />
      {/* ice shard shoulder armour */}
      <polygon points="6,36 2,22 12,36" />
      <polygon points="18,34 14,18 22,34" />
      <polygon points="46,34 50,18 54,34" />
      <polygon points="58,36 62,22 52,36" />
      {/* thick gorilla-arms */}
      <path d="M4 38 C-8 50 -12 68 -10 82 L2 80 C0 68 4 52 12 42 Z" />
      <path d="M60 38 C72 50 76 68 74 82 L62 80 C64 68 60 52 52 42 Z" />
      {/* big meaty fists */}
      <ellipse cx="-6" cy="82" rx="12" ry="9" />
      <path
        d="M-14 78 L-2 78 M-14 82 L-2 82 M-12 86 L0 86"
        strokeWidth="1.8"
        strokeOpacity="0.4"
      />
      <ellipse cx="70" cy="82" rx="12" ry="9" />
      <path
        d="M62 78 L74 78 M62 82 L74 82 M64 86 L76 86"
        strokeWidth="1.8"
        strokeOpacity="0.4"
      />
      {/* stumpy fat legs */}
      <rect x="8" y="84" width="22" height="14" rx="4" />
      <rect x="34" y="84" width="22" height="14" rx="4" />
    </>
  ),

  glacier_worm: (
    <>
      <ellipse cx="32" cy="12" rx="14" ry="12" />
      <circle cx="26" cy="10" r="4" fill="#000" stroke="none" />
      <circle cx="38" cy="10" r="4" fill="#000" stroke="none" />
      <circle cx="26" cy="10" r="2" fill="#88ccff" stroke="none" />
      <circle cx="38" cy="10" r="2" fill="#88ccff" stroke="none" />
      <path d="M18 22 L14 16 M32 24 L32 18 M46 22 L50 16" strokeWidth="2.5" />
      <ellipse cx="32" cy="36" rx="18" ry="12" />
      <ellipse cx="32" cy="54" rx="16" ry="10" />
      <ellipse cx="32" cy="70" rx="14" ry="9" />
      <ellipse cx="32" cy="84" rx="10" ry="8" />
      <path
        d="M14 28 Q32 24 50 28 M16 44 Q32 40 48 44 M18 60 Q32 56 46 60 M20 74 Q32 70 44 74"
        fill="none"
        strokeWidth="1.2"
        strokeOpacity="0.4"
      />
      <polygon points="14,36 8,26 18,34" />
      <polygon points="50,36 56,26 46,34" />
    </>
  ),

  frozen_taur: (
    <>
      <polygon points="20,10 14,-4 26,8" />
      <polygon points="44,10 50,-4 38,8" />
      <ellipse cx="32" cy="22" rx="16" ry="15" />
      <ellipse cx="24" cy="20" rx="4.5" ry="5" fill="#220000" stroke="none" />
      <ellipse cx="40" cy="20" rx="4.5" ry="5" fill="#220000" stroke="none" />
      <ellipse cx="24" cy="20" rx="2.5" ry="3" fill="#88ccff" stroke="none" />
      <ellipse cx="40" cy="20" rx="2.5" ry="3" fill="#88ccff" stroke="none" />
      <path d="M30 34 L28 44 M36 34 L38 44" strokeWidth="3" />
      <path d="M6 42 L58 42 L60 86 L4 86 Z" />
      <polygon points="8,44 4,32 14,44" />
      <polygon points="20,42 16,28 24,42" />
      <polygon points="40,42 44,28 48,42" />
      <polygon points="56,44 60,32 64,44" />
      <path d="M6 48 L-8 70 L6 76 L18 60 Z" />
      <path d="M58 46 L72 26 L66 36 L56 54 Z" />
      <rect x="4" y="86" width="24" height="10" rx="3" />
      <rect x="36" y="86" width="24" height="10" rx="3" />
      <rect x="70" y="-4" width="6" height="76" rx="3" />
      <path d="M70 -4 C60 -12 54 2 58 14 C60 6 66 2 72 2 Z" />
      <polygon points="70,4 64,20 76,20" />
    </>
  ),

  frost_dwarf: (
    <>
      <ellipse cx="20" cy="16" rx="6" ry="5" />
      <ellipse cx="44" cy="16" rx="6" ry="5" />
      <ellipse cx="32" cy="22" rx="13" ry="12" />
      <ellipse cx="26" cy="20" rx="3" ry="3.5" fill="#220000" stroke="none" />
      <ellipse cx="38" cy="20" rx="3" ry="3.5" fill="#220000" stroke="none" />
      <path d="M20 26 Q32 38 44 26 Q40 46 32 44 Q24 46 20 26 Z" />
      <path d="M22 28 C18 32 14 50 16 58 L22 58 Z" />
      <path d="M42 28 C46 32 50 50 48 58 L42 58 Z" />
      <path d="M18 32 L48 32 L46 68 L18 68 Z" />
      <rect x="18" y="68" width="14" height="24" rx="3" />
      <rect x="32" y="68" width="14" height="24" rx="3" />
      <path d="M18 36 L2 56 L8 62 L22 46 Z" />
      <path d="M-4" y="18" width="4" height="44" rx="2" />
      <rect x="-4" y="18" width="4" height="44" rx="2" />
      <path d="M-4 18 C-12 14 -14 6 -8 4 C-6 10 -2 14 2 18 Z" />
      <rect x="-10" y="38" width="14" height="4" rx="2" />
    </>
  ),

  frost_knight: (
    <>
      <path d="M18 8 C18 -4 46 -4 46 8 L46 22 L18 22 Z" />
      <rect
        x="20"
        y="16"
        width="8"
        height="3"
        rx="1"
        fill="#000"
        stroke="none"
      />
      <rect
        x="36"
        y="16"
        width="8"
        height="3"
        rx="1"
        fill="#000"
        stroke="none"
      />
      <path d="M28 8 Q32 -2 36 8" fill="none" strokeWidth="3" />
      <rect x="22" y="20" width="20" height="6" rx="2" />
      <path d="M10 28 L54 28 L54 70 L10 70 Z" />
      <line
        x1="32"
        y1="30"
        x2="32"
        y2="68"
        strokeWidth="1.5"
        strokeOpacity="0.3"
      />
      <line
        x1="10"
        y1="48"
        x2="54"
        y2="48"
        strokeWidth="1.2"
        strokeOpacity="0.25"
      />
      <polygon points="10,30 4,20 16,28" />
      <polygon points="54,30 60,20 48,28" />
      <rect x="10" y="70" width="20" height="22" rx="3" />
      <rect x="34" y="70" width="20" height="22" rx="3" />
      <path d="M10 32 L-4 54 L6 60 L18 44 Z" />
      <path d="M-8" y="14" width="5" height="52" rx="2" />
      <rect x="-8" y="14" width="5" height="52" rx="2" />
      <rect x="-14" y="36" width="18" height="5" rx="2" />
      <path d="M54 32 L68 52 L58 58 L46 42 Z" />
      <polygon points="10,30 4,18 16,28" />
    </>
  ),

  dwarven_warrior: (
    <>
      <ellipse cx="20" cy="14" rx="7" ry="6" />
      <ellipse cx="44" cy="14" rx="7" ry="6" />
      <ellipse cx="32" cy="22" rx="14" ry="13" />
      <ellipse cx="26" cy="20" rx="3.5" ry="4" fill="#220000" stroke="none" />
      <ellipse cx="38" cy="20" rx="3.5" ry="4" fill="#220000" stroke="none" />
      <path d="M20 28 Q32 42 44 28 Q40 48 32 46 Q24 48 20 28 Z" />
      <path d="M10 34 L54 34 L52 74 L12 74 Z" />
      <rect x="12" y="74" width="18" height="20" rx="3" />
      <rect x="34" y="74" width="18" height="20" rx="3" />
      <path d="M12 38 L-2 58 L8 64 L20 48 Z" />
      <path d="M52 36 L66 54 L56 60 L44 44 Z" />
      <rect x="64" y="-2" width="5" height="56" rx="2" />
      <path d="M64 -2 C52 -10 46 4 50 16 C52 8 58 4 66 4 Z" />
      <path d="M68 -2 C80 -10 86 4 82 16 C80 8 74 4 66 4 Z" />
      <rect x="60" y="28" width="18" height="5" rx="2" />
    </>
  ),

  frozen_forge_core: (
    <>
      <circle cx="32" cy="46" r="22" />
      <circle
        cx="32"
        cy="46"
        r="16"
        fill="#aaddff"
        stroke="none"
        fillOpacity="0.4"
      />
      <circle
        cx="32"
        cy="46"
        r="10"
        fill="#ddeeff"
        stroke="none"
        fillOpacity="0.6"
      />
      <circle cx="32" cy="46" r="4" fill="#ffffff" stroke="none" />
      <polygon points="32,6 36,14 32,18 28,14" />
      <polygon points="32,86 36,78 32,74 28,78" />
      <polygon points="4,46 12,50 16,46 12,42" />
      <polygon points="60,46 52,50 48,46 52,42" />
      <polygon points="10,16 16,22 14,28 8,22" />
      <polygon points="54,16 48,22 50,28 56,22" />
      <polygon points="10,76 16,70 14,64 8,70" />
      <polygon points="54,76 48,70 50,64 56,70" />
      <circle
        cx="32"
        cy="46"
        r="26"
        fill="none"
        strokeWidth="1.5"
        strokeOpacity="0.4"
        strokeDasharray="6 4"
      />
    </>
  ),

  glacial_eagle: (
    <>
      <path d="M32 50 C22 38 6 30 0 14 C8 16 16 28 20 38 C12 22 14 8 22 10 C22 24 26 38 30 48 Z" />
      <path d="M32 50 C42 38 58 30 64 14 C56 16 48 28 44 38 C52 22 50 8 42 10 C42 24 38 38 34 48 Z" />
      <path d="M20 38 L16 28 M22 28 L18 18 M26 20 L22 10" strokeWidth="2" />
      <path d="M44 38 L48 28 M42 28 L46 18 M38 20 L42 10" strokeWidth="2" />
      <ellipse cx="32" cy="60" rx="10" ry="12" />
      <ellipse cx="32" cy="42" rx="9" ry="9" />
      <polygon points="28,36 24,22 32,34" />
      <polygon points="36,36 40,22 32,34" />
      <circle cx="27" cy="40" r="3" fill="#aaddff" stroke="none" />
      <circle cx="37" cy="40" r="3" fill="#aaddff" stroke="none" />
      <path d="M26 70 L22 80 M32 72 L30 82 M38 70 L42 80" strokeWidth="4" />
    </>
  ),

  elder_harpy: (
    <>
      <path d="M32 42 C20 30 4 18 -2 2 C6 4 12 16 16 26 C8 12 10 -2 18 0 C18 14 22 28 30 40 Z" />
      <path d="M32 42 C44 30 60 18 66 2 C58 4 52 16 48 26 C56 12 54 -2 46 0 C46 14 42 28 34 40 Z" />
      <path d="M16 26 L10 16 M12 16 L6 8 M18 16 L14 8" strokeWidth="2" />
      <path d="M48 26 L54 16 M52 16 L58 8 M46 16 L50 8" strokeWidth="2" />
      <ellipse cx="32" cy="56" rx="12" ry="14" />
      <ellipse cx="32" cy="38" rx="11" ry="12" />
      <polygon points="28,32 22,16 32,28" />
      <polygon points="36,32 42,16 32,28" />
      <circle cx="26" cy="36" r="3.5" fill="#220000" stroke="none" />
      <circle cx="38" cy="36" r="3.5" fill="#220000" stroke="none" />
      <circle cx="26" cy="36" r="2" fill="#88aacc" stroke="none" />
      <circle cx="38" cy="36" r="2" fill="#88aacc" stroke="none" />
      <path d="M24 66 L20 76 M32 68 L30 78 M40 66 L44 76" strokeWidth="4" />
      <path d="M10 58 C4 52 -2 62 4 68" fill="none" strokeWidth="3" />
    </>
  ),

  ghost_of_mountain: (
    <>
      <ellipse cx="20" cy="14" rx="6" ry="5" />
      <ellipse cx="44" cy="14" rx="6" ry="5" />
      <ellipse cx="32" cy="20" rx="13" ry="12" fillOpacity="0.9" />
      <ellipse cx="26" cy="18" rx="3.5" ry="4" fill="#000" stroke="none" />
      <ellipse cx="38" cy="18" rx="3.5" ry="4" fill="#000" stroke="none" />
      <ellipse cx="26" cy="18" rx="2" ry="2.5" fill="#cceeff" stroke="none" />
      <ellipse cx="38" cy="18" rx="2" ry="2.5" fill="#cceeff" stroke="none" />
      <path
        d="M22 28 Q32 42 42 28 Q38 48 32 46 Q26 48 22 28 Z"
        fillOpacity="0.7"
      />
      <path d="M16 30 C8 26 4 36 8 44 L14 44 Z" fillOpacity="0.6" />
      <path d="M48 30 C56 26 60 36 56 44 L50 44 Z" fillOpacity="0.6" />
      <path d="M14 32 L50 32 L52 72 L12 72 Z" fillOpacity="0.75" />
      <path d="M14 38 L-2 60 L8 66 L20 48 Z" fillOpacity="0.7" />
      <path d="M50 36 L62 56 L54 62 L42 46 Z" fillOpacity="0.7" />
      <path
        d="M16 70 C10 84 12 94 8 96 M26 74 C22 88 24 94 20 96 M38 74 C42 88 40 94 44 96 M48 70 C54 84 52 94 56 96"
        fill="none"
        strokeWidth="4"
        strokeOpacity="0.5"
      />
      <circle
        cx="32"
        cy="50"
        r="24"
        fill="none"
        strokeWidth="1"
        strokeOpacity="0.2"
        strokeDasharray="3 5"
      />
    </>
  ),

  frozen_bones: (
    <>
      <ellipse cx="32" cy="14" rx="14" ry="14" />
      <ellipse cx="24" cy="12" rx="5" ry="5.5" fill="#000" stroke="none" />
      <ellipse cx="40" cy="12" rx="5" ry="5.5" fill="#000" stroke="none" />
      <ellipse cx="24" cy="12" rx="3" ry="3.5" fill="#88ccff" stroke="none" />
      <ellipse cx="40" cy="12" rx="3" ry="3.5" fill="#88ccff" stroke="none" />
      <path
        d="M22 26 L20 34 M28 26 L28 34 M36 26 L36 34 M42 26 L44 34"
        strokeWidth="2.5"
      />
      <rect x="16" y="30" width="32" height="44" rx="2" />
      <path
        d="M18 38 L46 38 M16 48 L48 48 M16 58 L48 58 M18 66 L46 66"
        strokeWidth="2"
        strokeOpacity="0.4"
      />
      <polygon points="14,34 8,22 18,32" />
      <polygon points="50,34 56,22 46,32" />
      <path d="M6 36 L-8 56 L4 62 L16 46 Z" />
      <path d="M58 34 L72 52 L62 58 L50 44 Z" />
      <rect x="16" y="74" width="13" height="20" rx="3" />
      <rect x="35" y="74" width="13" height="20" rx="3" />
      <path d="M8 58 L-4 52 M4 64 L-6 62 M8 70 L0 74" strokeWidth="2.5" />
      <rect x="72" y="-4" width="5" height="68" rx="2" />
      <path d="M72 -4 C62 -12 56 2 60 16 C62 8 68 4 74 4 Z" />
      <polygon points="72,6 66,24 78,24" />
    </>
  ),

  azure_dragon: (
    <>
      <path d="M20 44 C16 34 10 22 4 10 C10 12 14 24 18 34 C10 20 12 8 18 10 C18 22 20 36 22 44 Z" />
      <path d="M44 44 C48 34 54 22 60 10 C54 12 50 24 46 34 C54 20 52 8 46 10 C46 22 44 36 42 44 Z" />
      <path d="M18 34 L14 24 M22 24 L18 16" strokeWidth="2.5" />
      <path d="M46 34 L50 24 M42 24 L46 16" strokeWidth="2.5" />
      <ellipse cx="32" cy="56" rx="14" ry="16" />
      <ellipse cx="32" cy="38" rx="14" ry="14" />
      <polygon points="26,30 22,16 30,28" />
      <polygon points="38,30 42,16 34,28" />
      <circle cx="26" cy="36" r="4" fill="#88bbff" stroke="none" />
      <circle cx="38" cy="36" r="4" fill="#88bbff" stroke="none" />
      <circle cx="26" cy="36" r="2" fill="#000" stroke="none" />
      <circle cx="38" cy="36" r="2" fill="#000" stroke="none" />
      <path d="M24 68 L20 78 M32 70 L30 80 M40 68 L44 78" strokeWidth="4" />
      <path d="M6 60 C-4 56 -8 68 -2 74" fill="none" strokeWidth="3.5" />
    </>
  ),

  avalanche_elemental: (
    <>
      <polygon points="32,4 46,20 50,36 42,50 32,56 22,50 14,36 18,20" />
      <polygon points="32,4 38,10 46,20" fillOpacity="0.6" />
      <polygon points="32,4 26,10 18,20" fillOpacity="0.4" />
      <polygon points="14,36 6,44 18,50" fillOpacity="0.5" />
      <polygon points="50,36 58,44 46,50" fillOpacity="0.7" />
      <polygon points="32,56 22,64 34,68" fillOpacity="0.6" />
      <polygon points="32,56 42,64 30,68" fillOpacity="0.5" />
      <ellipse cx="26" cy="26" rx="5" ry="6" fill="#000" stroke="none" />
      <ellipse cx="38" cy="26" rx="5" ry="6" fill="#000" stroke="none" />
      <ellipse cx="26" cy="26" rx="3" ry="4" fill="#aaddff" stroke="none" />
      <ellipse cx="38" cy="26" rx="3" ry="4" fill="#aaddff" stroke="none" />
      <path
        d="M18 58 L10 68 M26 62 L22 72 M38 62 L42 72 M46 58 L54 68"
        strokeWidth="4"
      />
      <polygon points="6,20 -2,30 8,26" />
      <polygon points="58,20 66,30 56,26" />
      <polygon points="8,48 -2,56 6,60" />
      <polygon points="56,48 66,56 58,60" />
    </>
  ),

  sikktharkk: (
    <>
      <path d="M16 38 C8 24 2 8 -2 -4 C4 -2 8 12 12 24 C4 8 6 -8 14 -6 C14 8 14 24 16 36 Z" />
      <path d="M48 38 C56 24 62 8 66 -4 C60 -2 56 12 52 24 C60 8 58 -8 50 -6 C50 8 50 24 52 36 Z" />
      <path
        d="M12 24 L8 12 M8 12 L4 2 M14 14 L10 4 M18 8 L14 -2"
        strokeWidth="2.5"
      />
      <path
        d="M52 24 L56 12 M56 12 L60 2 M50 14 L54 4 M46 8 L50 -2"
        strokeWidth="2.5"
      />
      <ellipse cx="32" cy="50" rx="18" ry="20" />
      <ellipse cx="32" cy="28" rx="18" ry="18" />
      <polygon points="24,18 18,2 30,16" />
      <polygon points="40,18 46,2 34,16" />
      <polygon points="28,12 26,-2 32,10" />
      <polygon points="36,12 38,-2 32,10" />
      <circle cx="24" cy="26" r="6" fill="#88bbff" stroke="none" />
      <circle cx="40" cy="26" r="6" fill="#88bbff" stroke="none" />
      <circle cx="24" cy="26" r="3" fill="#000" stroke="none" />
      <circle cx="40" cy="26" r="3" fill="#000" stroke="none" />
      <path d="M36 38 L33 50 M40 40 L38 52" strokeWidth="2.5" />
      <path d="M28 46 Q32 56 36 46" fill="none" strokeWidth="3" />
      <path
        d="M14 58 L28 66 M50 58 L36 66"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
      <path d="M14 62 L-4 82 L6 88 L20 74 Z" />
      <path d="M50 62 L68 82 L58 88 L44 74 Z" />
      <path d="M-4 82 L-10 72 M-2 82 L-8 72 M0 84 L-6 74" strokeWidth="2.5" />
      <path d="M68 82 L74 72 M66 82 L72 72 M64 84 L70 74" strokeWidth="2.5" />
      <path
        d="M16 68 L8 80 M24 72 L18 84 M40 72 L46 84 M48 68 L56 80"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M-2 62 C-14 58 -18 72 -10 78" fill="none" strokeWidth="4.5" />
      <path
        d="M6 58 C-4 54 -8 64 -4 70"
        fill="none"
        strokeWidth="3.5"
        strokeOpacity="0.6"
      />
      <path
        d="M64 58 C72 54 76 64 72 70"
        fill="none"
        strokeWidth="3.5"
        strokeOpacity="0.6"
      />
      <circle
        cx="32"
        cy="28"
        r="28"
        fill="none"
        strokeWidth="1.5"
        strokeOpacity="0.15"
        strokeDasharray="8 4"
      />
    </>
  ),

  // ── Act 3 sprites ─────────────────────────────────────────────────────────
  jungle_stalker: (
    <>
      <ellipse cx="22" cy="14" rx="8" ry="7" />
      <ellipse cx="42" cy="14" rx="8" ry="7" />
      <polygon points="18,8 14,-2 22,6" />
      <polygon points="46,8 50,-2 38,6" />
      <ellipse cx="32" cy="22" rx="16" ry="14" />
      <path d="M40 26 L58 24 L40 32 Z" />
      <ellipse cx="24" cy="20" rx="4" ry="4.5" fill="#220000" stroke="none" />
      <ellipse cx="40" cy="20" rx="4" ry="4.5" fill="#220000" stroke="none" />
      <ellipse cx="24" cy="20" rx="2" ry="2.5" fill="#88ff44" stroke="none" />
      <ellipse cx="40" cy="20" rx="2" ry="2.5" fill="#88ff44" stroke="none" />
      <path d="M8 38 L56 38 L54 76 L10 76 Z" />
      <polygon points="10,40 6,28 16,40" />
      <polygon points="20,38 16,26 24,38" />
      <polygon points="40,38 44,26 48,38" />
      <polygon points="54,40 58,28 62,40" />
      <rect x="10" y="76" width="18" height="16" rx="3" />
      <rect x="36" y="76" width="18" height="16" rx="3" />
      <path d="M8 42 L-4 64 L6 70 L18 52 Z" />
      <path d="M56 42 L68 64 L58 70 L46 52 Z" />
      <path d="M10 72 C4 84 6 94 2 98" fill="none" strokeWidth="3" />
    </>
  ),

  thorn_hunter: (
    <>
      <ellipse cx="32" cy="14" rx="12" ry="13" />
      <ellipse cx="26" cy="12" rx="3.5" ry="4" fill="#220000" stroke="none" />
      <ellipse cx="38" cy="12" rx="3.5" ry="4" fill="#220000" stroke="none" />
      <path d="M26 20 Q32 30 38 20 Q36 38 32 36 Q28 38 26 20 Z" />
      <path d="M18 24 C10 28 8 40 10 50 L16 50 Z" />
      <path d="M46 24 C54 28 56 40 54 50 L48 50 Z" />
      <path d="M14 26 L50 26 L48 66 L16 66 Z" />
      <rect x="16" y="66" width="14" height="26" rx="3" />
      <rect x="34" y="66" width="14" height="26" rx="3" />
      <path d="M14 30 L-2 54 L8 60 L20 42 Z" />
      <rect x="62" y="-8" width="5" height="80" rx="2" />
      <polygon points="62,-8 56,-18 68,-8 62,-18" />
      <polygon points="62,0 56,8 62,4" />
      <polygon points="62,16 68,24 62,20" />
    </>
  ),

  venom_viper: (
    <>
      <ellipse cx="32" cy="12" rx="14" ry="12" />
      <path d="M44 16 L62 12 L44 20 Z" />
      <ellipse cx="26" cy="10" rx="4" ry="4.5" fill="#220000" stroke="none" />
      <ellipse cx="38" cy="10" rx="4" ry="4.5" fill="#220000" stroke="none" />
      <ellipse cx="26" cy="10" rx="2" ry="2.5" fill="#88ff00" stroke="none" />
      <ellipse cx="38" cy="10" rx="2" ry="2.5" fill="#88ff00" stroke="none" />
      <path d="M30 22 L26 28 M34 22 L38 28" strokeWidth="2.5" />
      <ellipse cx="32" cy="38" rx="20" ry="14" />
      <ellipse cx="32" cy="56" rx="18" ry="12" />
      <ellipse cx="32" cy="72" rx="14" ry="10" />
      <path
        d="M12 30 Q32 26 52 30 M14 46 Q32 42 50 46 M16 60 Q32 56 48 60"
        fill="none"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
      <polygon points="12,36 4,26 18,34" />
      <polygon points="52,36 60,26 46,34" />
      <path
        d="M20 82 C16 90 18 96 14 98 M32 84 C30 92 32 96 28 98 M44 82 C48 90 46 96 50 98"
        fill="none"
        strokeWidth="3.5"
      />
    </>
  ),

  ancient_treant: (
    <>
      <path
        d="M24 22 L18 8 L14 -2 L20 4 L16 -6 L24 2 L22 -8 L28 6 L26 -4 L32 4 Z"
        strokeWidth="2"
      />
      <path
        d="M40 22 L46 8 L50 -2 L44 4 L48 -6 L40 2 L42 -8 L36 6 L38 -4 L32 4 Z"
        strokeWidth="2"
      />
      <ellipse cx="32" cy="28" rx="18" ry="16" />
      <ellipse cx="24" cy="24" rx="4.5" ry="5" fill="#220000" stroke="none" />
      <ellipse cx="40" cy="24" rx="4.5" ry="5" fill="#220000" stroke="none" />
      <path
        d="M26 36 L22 48 M30 38 L28 50 M34 38 L36 50 M38 36 L42 48"
        strokeWidth="2.5"
      />
      <path d="M6 48 L58 48 L60 90 L4 90 Z" />
      <path d="M6 52 L-6 72 L6 78 L16 60 Z" />
      <path d="M58 50 L70 70 L60 76 L50 62 Z" />
      <rect x="4" y="90" width="24" height="8" rx="3" />
      <rect x="36" y="90" width="24" height="8" rx="3" />
      <path d="M16 56 C8 52 4 62 8 70" fill="none" strokeWidth="3" />
      <path d="M48 60 C56 56 60 66 56 74" fill="none" strokeWidth="3" />
      <polygon points="8,52 2,42 14,50" />
      <polygon points="56,52 62,42 50,50" />
    </>
  ),

  swamp_serpent: (
    <>
      <ellipse cx="32" cy="10" rx="16" ry="13" />
      <path d="M46 14 L66 10 L46 20 Z" />
      <ellipse cx="24" cy="8" rx="5" ry="5.5" fill="#220000" stroke="none" />
      <ellipse cx="40" cy="8" rx="5" ry="5.5" fill="#220000" stroke="none" />
      <ellipse cx="24" cy="8" rx="3" ry="3.5" fill="#88cc00" stroke="none" />
      <ellipse cx="40" cy="8" rx="3" ry="3.5" fill="#88cc00" stroke="none" />
      <path d="M28 22 L24 30 M36 22 L40 30" strokeWidth="3" />
      <ellipse cx="32" cy="42" rx="22" ry="16" />
      <ellipse cx="32" cy="62" rx="20" ry="14" />
      <ellipse cx="32" cy="80" rx="16" ry="11" />
      <path
        d="M10 34 Q32 30 54 34 M12 50 Q32 46 52 50 M14 66 Q32 62 50 66"
        fill="none"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
      <polygon points="10,40 2,30 18,38" />
      <polygon points="54,40 62,30 46,38" />
      <path
        d="M18 90 C12 98 14 104 10 106 M32 92 C30 100 32 104 28 106 M46 90 C52 98 50 104 54 106"
        fill="none"
        strokeWidth="4.5"
      />
    </>
  ),

  poison_toad: (
    <>
      <ellipse cx="22" cy="18" rx="9" ry="8" />
      <ellipse cx="42" cy="18" rx="9" ry="8" />
      <ellipse cx="32" cy="28" rx="20" ry="18" />
      <circle
        cx="22"
        cy="18"
        r="5"
        fill="#80b030"
        stroke="none"
        fillOpacity="0.6"
      />
      <circle
        cx="42"
        cy="18"
        r="5"
        fill="#80b030"
        stroke="none"
        fillOpacity="0.6"
      />
      <ellipse cx="24" cy="26" rx="5" ry="5.5" fill="#220000" stroke="none" />
      <ellipse cx="40" cy="26" rx="5" ry="5.5" fill="#220000" stroke="none" />
      <ellipse cx="24" cy="26" rx="3" ry="3.5" fill="#88ff00" stroke="none" />
      <ellipse cx="40" cy="26" rx="3" ry="3.5" fill="#88ff00" stroke="none" />
      <path d="M22 38 Q32 50 42 38 Q40 60 32 58 Q24 60 22 38 Z" />
      <path d="M6 38 L-6 24 L8 32 Z" />
      <path d="M6 46 L-8 38 L6 52 Z" />
      <path d="M58 38 L70 24 L56 32 Z" />
      <path d="M58 46 L72 38 L58 52 Z" />
      <path
        d="M12 54 L6 66 M16 62 L10 72 M48 54 L54 66 M52 62 L58 72"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </>
  ),

  mother_of_swamp: (
    <>
      <ellipse cx="22" cy="16" rx="7" ry="6" />
      <ellipse cx="42" cy="16" rx="7" ry="6" />
      <ellipse cx="32" cy="24" rx="14" ry="14" />
      <ellipse cx="26" cy="22" rx="4" ry="4.5" fill="#220000" stroke="none" />
      <ellipse cx="38" cy="22" rx="4" ry="4.5" fill="#220000" stroke="none" />
      <path d="M22 30 Q32 44 42 30 Q38 50 32 48 Q26 50 22 30 Z" />
      <path d="M14 32 C6 36 4 50 8 58 L14 58 Z" />
      <path d="M50 32 C58 36 60 50 56 58 L50 58 Z" />
      <path d="M12 34 L52 34 L50 74 L14 74 Z" />
      <circle
        cx="20"
        cy="44"
        r="5"
        fill="#88cc44"
        stroke="none"
        fillOpacity="0.7"
      />
      <circle
        cx="36"
        cy="38"
        r="4"
        fill="#66aa22"
        stroke="none"
        fillOpacity="0.7"
      />
      <circle
        cx="46"
        cy="50"
        r="6"
        fill="#99dd55"
        stroke="none"
        fillOpacity="0.7"
      />
      <circle
        cx="24"
        cy="60"
        r="4"
        fill="#77bb33"
        stroke="none"
        fillOpacity="0.7"
      />
      <path d="M14 36 L-2 58 L8 64 L20 48 Z" />
      <path d="M52 34 L66 54 L56 60 L44 44 Z" />
      <rect x="14" y="74" width="14" height="20" rx="3" />
      <rect x="36" y="74" width="14" height="20" rx="3" />
      <rect x="-4" y="12" width="5" height="62" rx="2" />
      <path d="M-4 12 C-14 8 -16 -2 -10 0 C-8 6 -4 10 -2 14 Z" />
    </>
  ),

  jungle_harpy: (
    <>
      <path d="M32 44 C20 32 4 22 -2 6 C6 8 12 20 16 30 C8 16 10 2 18 4 C18 18 22 32 30 42 Z" />
      <path d="M32 44 C44 32 60 22 66 6 C58 8 52 20 48 30 C56 16 54 2 46 4 C46 18 42 32 34 42 Z" />
      <path d="M16 30 L12 20 M12 20 L8 12 M18 20 L14 12" strokeWidth="2" />
      <path d="M48 30 L52 20 M52 20 L56 12 M46 20 L50 12" strokeWidth="2" />
      <ellipse cx="32" cy="56" rx="12" ry="14" />
      <ellipse cx="32" cy="38" rx="11" ry="12" />
      <polygon points="28,32 22,18 32,30" />
      <polygon points="36,32 42,18 32,30" />
      <circle cx="26" cy="36" r="3.5" fill="#220000" stroke="none" />
      <circle cx="38" cy="36" r="3.5" fill="#220000" stroke="none" />
      <circle cx="26" cy="36" r="2" fill="#88ff44" stroke="none" />
      <circle cx="38" cy="36" r="2" fill="#88ff44" stroke="none" />
      <path d="M24 66 L20 76 M32 68 L30 78 M40 66 L44 76" strokeWidth="4" />
    </>
  ),

  piranha_school: (
    <>
      <ellipse cx="20" cy="24" rx="14" ry="8" />
      <path d="M34 24 L44 18 L34 28 Z" />
      <path d="M6 24 L-4 20 L6 28 Z" />
      <circle cx="16" cy="22" r="3" fill="#cc4422" stroke="none" />
      <path d="M14 28 L10 36 L20 28 Z" />
      <ellipse cx="44" cy="44" rx="14" ry="8" />
      <path d="M58 44 L68 40 L58 48 Z" />
      <path d="M30 44 L20 40 L30 48 Z" />
      <circle cx="40" cy="42" r="3" fill="#cc4422" stroke="none" />
      <path d="M38 48 L34 56 L44 48 Z" />
      <ellipse cx="20" cy="64" rx="12" ry="7" />
      <path d="M32 64 L40 60 L32 68 Z" />
      <path d="M8 64 L0 61 L8 67 Z" />
      <circle cx="16" cy="62" r="2.5" fill="#cc4422" stroke="none" />
      <ellipse cx="46" cy="74" rx="10" ry="6" />
      <path d="M56 74 L64 71 L56 77 Z" />
      <circle cx="42" cy="72" r="2" fill="#cc4422" stroke="none" />
    </>
  ),

  thorn_dryad: (
    <>
      <path
        d="M22 12 L18 0 L16 -8 L22 -2 L18 -10 L24 -4 L20 -12 L26 -2 L24 -10 L30 -2 Z"
        strokeWidth="2"
      />
      <path
        d="M42 12 L46 0 L48 -8 L42 -2 L46 -10 L40 -4 L44 -12 L38 -2 L40 -10 L34 -2 Z"
        strokeWidth="2"
      />
      <ellipse cx="32" cy="22" rx="13" ry="14" />
      <ellipse cx="26" cy="20" rx="3.5" ry="4" fill="#220000" stroke="none" />
      <ellipse cx="38" cy="20" rx="3.5" ry="4" fill="#220000" stroke="none" />
      <path d="M16 30 L48 30 L46 72 L18 72 Z" />
      <path d="M18 34 C10 38 8 52 12 60 L18 60 Z" />
      <path d="M46 34 C54 38 56 52 52 60 L46 60 Z" />
      <path d="M16 36 L0 58 L10 64 L22 48 Z" />
      <path d="M48 36 L64 58 L54 64 L42 48 Z" />
      <rect x="18" y="72" width="14" height="22" rx="3" />
      <rect x="32" y="72" width="14" height="22" rx="3" />
      <path d="M18 40 L10 32 L14 28 Z" />
      <path d="M46 44 L54 36 L58 32 Z" />
    </>
  ),

  emerald_crocolisk: (
    <>
      <path d="M44 18 L66 10 L66 16 L58 18 L66 20 L66 26 L44 24 Z" />
      <ellipse cx="30" cy="22" rx="18" ry="16" />
      <ellipse cx="22" cy="20" rx="5" ry="5.5" fill="#220000" stroke="none" />
      <ellipse cx="38" cy="20" rx="5" ry="5.5" fill="#220000" stroke="none" />
      <ellipse cx="22" cy="20" rx="2.5" ry="3" fill="#88ff44" stroke="none" />
      <ellipse cx="38" cy="20" rx="2.5" ry="3" fill="#88ff44" stroke="none" />
      <path d="M8 38 L56 38 L58 78 L6 78 Z" />
      <path d="M14 40 L12 30 L18 40" />
      <path d="M22 38 L20 26 L26 38" />
      <path d="M38 38 L36 26 L42 38" />
      <path d="M46 40 L44 30 L50 40" />
      <rect x="6" y="78" width="18" height="14" rx="3" />
      <rect x="20" y="78" width="18" height="14" rx="3" />
      <rect x="36" y="78" width="18" height="14" rx="3" />
      <path d="M8 46 C-4 42 -8 56 -2 62" fill="none" strokeWidth="3.5" />
      <path d="M56 52 C62 62 58 78 50 80 C60 78 68 64 62 52 Z" />
    </>
  ),

  cursed_tribesman: (
    <>
      <ellipse cx="32" cy="14" rx="12" ry="13" />
      <ellipse cx="26" cy="12" rx="3.5" ry="4" fill="#220000" stroke="none" />
      <ellipse cx="38" cy="12" rx="3.5" ry="4" fill="#220000" stroke="none" />
      <path
        d="M24 4 L20 -4 L24 0 M28 2 L26 -6 L30 -2 M36 2 L38 -6 L34 -2 M40 4 L44 -4 L40 0"
        strokeWidth="2"
      />
      <path
        d="M22 24 L20 32 M28 24 L28 32 M36 24 L36 32 M42 24 L44 32"
        strokeWidth="2.5"
      />
      <path d="M14 28 L50 28 L48 68 L16 68 Z" />
      <path d="M14 34 C4 32 0 44 4 52 L10 52 Z" />
      <path d="M50 32 C60 30 64 42 60 50 L54 50 Z" />
      <path d="M12 34 L-4 56 L6 62 L18 46 Z" />
      <path d="M52 32 L66 52 L56 58 L44 42 Z" />
      <rect x="16" y="68" width="14" height="24" rx="3" />
      <rect x="34" y="68" width="14" height="24" rx="3" />
      <rect x="62" y="4" width="5" height="58" rx="2" />
      <ellipse cx="64.5" cy="2" rx="6" ry="6" />
      <rect x="58" y="24" width="16" height="4" rx="2" />
    </>
  ),

  haunted_mask: (
    <>
      <ellipse cx="32" cy="28" rx="18" ry="20" />
      <ellipse cx="23" cy="24" rx="6" ry="8" fill="#000" stroke="none" />
      <ellipse cx="41" cy="24" rx="6" ry="8" fill="#000" stroke="none" />
      <ellipse cx="23" cy="24" rx="4" ry="6" fill="#b080ff" stroke="none" />
      <ellipse cx="41" cy="24" rx="4" ry="6" fill="#b080ff" stroke="none" />
      <path d="M22 38 Q32 50 42 38" fill="none" strokeWidth="3" />
      <path
        d="M24 44 L22 54 M32 46 L32 56 M40 44 L42 54"
        strokeWidth="2.5"
        strokeOpacity="0.6"
      />
      <path
        d="M20 14 L16 6 M24 10 L22 2 M28 8 L28 0 M36 8 L36 0 M40 10 L42 2 M44 14 L48 6"
        strokeWidth="2"
        strokeOpacity="0.5"
      />
      <path
        d="M14 56 C8 68 12 82 8 86 M22 60 C18 74 22 82 18 86 M42 60 C46 74 42 82 46 86 M50 56 C56 68 52 82 56 86"
        fill="none"
        strokeWidth="4"
        strokeOpacity="0.5"
      />
    </>
  ),

  voodoo_shaman: (
    <>
      <ellipse cx="32" cy="14" rx="12" ry="13" />
      <ellipse cx="26" cy="12" rx="3.5" ry="4" fill="#220000" stroke="none" />
      <ellipse cx="38" cy="12" rx="3.5" ry="4" fill="#220000" stroke="none" />
      <ellipse cx="26" cy="12" rx="2" ry="2.5" fill="#cc88ff" stroke="none" />
      <ellipse cx="38" cy="12" rx="2" ry="2.5" fill="#cc88ff" stroke="none" />
      <path
        d="M28 4 L24 -4 L28 0 L26 -8 L30 -4 M34 -4 L38 -8 L36 -2 L40 -6 L36 4"
        strokeWidth="1.5"
      />
      <path d="M14 26 L50 26 L48 68 L16 68 Z" />
      <path d="M14 30 C4 28 0 40 4 48 L10 48 Z" />
      <path d="M50 28 C60 26 64 38 60 46 L54 46 Z" />
      <rect x="16" y="68" width="14" height="24" rx="3" />
      <rect x="34" y="68" width="14" height="24" rx="3" />
      <path d="M14 32 L-2 54 L8 60 L20 44 Z" />
      <rect x="-4" y="8" width="5" height="66" rx="2" />
      <circle cx="-6" cy="4" r="6" fill="none" strokeWidth="2" />
      <circle cx="-6" cy="4" r="3" strokeOpacity="0.5" />
      <path d="M-10" y="2" width="8" height="2" rx="1" />
      <rect x="-10" y="2" width="8" height="2" rx="1" />
      <path d="M-9 32 C-16 28 -18 38 -14 44 L-8 40 Z" />
    </>
  ),

  soul_collector: (
    <>
      <ellipse cx="32" cy="16" rx="14" ry="15" />
      <ellipse cx="24" cy="14" rx="5" ry="6" fill="#220000" stroke="none" />
      <ellipse cx="40" cy="14" rx="5" ry="6" fill="#220000" stroke="none" />
      <ellipse cx="24" cy="14" rx="3" ry="4" fill="#cc88ff" stroke="none" />
      <ellipse cx="40" cy="14" rx="3" ry="4" fill="#cc88ff" stroke="none" />
      <path
        d="M26 4 L22 -4 L26 0 L22 -8 L28 -4 M34 -6 L38 -10 L36 -4 L42 -8 L38 0"
        strokeWidth="2"
      />
      <rect
        x="28"
        y="8"
        width="8"
        height="2"
        rx="1"
        fill="#cc88ff"
        stroke="none"
      />
      <path d="M16 30 L48 30 L46 72 L18 72 Z" />
      <path d="M18 34 C8 32 4 46 8 54 L14 54 Z" />
      <path d="M46 32 C56 30 60 44 56 52 L50 52 Z" />
      <path d="M16 36 L0 60 L10 66 L22 50 Z" />
      <path d="M48 34 L64 56 L54 62 L42 46 Z" />
      <rect x="18" y="72" width="14" height="20" rx="3" />
      <rect x="32" y="72" width="14" height="20" rx="3" />
      <rect x="-4" y="2" width="5" height="74" rx="2" />
      <circle cx="-6" cy="-2" r="8" fill="none" strokeWidth="2" />
      <circle cx="-12" cy="-6" r="4" fill="none" strokeWidth="1.5" />
      <circle cx="0" cy="-6" r="4" fill="none" strokeWidth="1.5" />
      <circle cx="-6" cy="-10" r="4" fill="none" strokeWidth="1.5" />
      <path
        d="M22 50 L20 60 M28 52 L26 62 M36 52 L38 62 M42 50 L44 60"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
    </>
  ),

  blood_vine: (
    <>
      <path d="M32 8 C22 14 14 28 18 42 C22 56 28 66 32 72 C36 66 42 56 46 42 C50 28 42 14 32 8 Z" />
      <path d="M32 8 L28 -4 M32 8 L36 -4" strokeWidth="3" />
      <path d="M18 26 C10 22 4 28 8 36" fill="none" strokeWidth="3" />
      <path d="M46 26 C54 22 60 28 56 36" fill="none" strokeWidth="3" />
      <path d="M16 44 C6 42 2 52 8 58" fill="none" strokeWidth="3" />
      <path d="M48 44 C58 42 62 52 56 58" fill="none" strokeWidth="3" />
      <ellipse cx="26" cy="32" rx="4" ry="5" fill="#880000" stroke="none" />
      <ellipse cx="38" cy="32" rx="4" ry="5" fill="#880000" stroke="none" />
      <ellipse cx="26" cy="32" rx="2" ry="3" fill="#ff2200" stroke="none" />
      <ellipse cx="38" cy="32" rx="2" ry="3" fill="#ff2200" stroke="none" />
      <path
        d="M26 72 C22 82 24 90 20 94 M32 74 C30 84 32 90 28 94 M38 72 C42 82 40 90 44 94"
        fill="none"
        strokeWidth="4"
      />
    </>
  ),

  carnivorous_plant: (
    <>
      <path d="M32 32 C24 22 18 10 22 2 C26 10 28 20 30 28 C22 14 24 2 30 4 C30 14 30 24 30 32 Z" />
      <path d="M32 32 C40 22 46 10 42 2 C38 10 36 20 34 28 C42 14 40 2 34 4 C34 14 34 24 34 32 Z" />
      <path d="M16 28 L14 18 L10 14 L14 24 L8 20 L12 28 L6 26 L14 32 Z" />
      <path d="M48 28 L50 18 L54 14 L50 24 L56 20 L52 28 L58 26 L50 32 Z" />
      <ellipse cx="32" cy="42" rx="18" ry="16" />
      <path d="M14 38 L48 38 L50 56 Q32 70 14 56 Z" />
      <ellipse cx="24" cy="36" rx="5" ry="6" fill="#220000" stroke="none" />
      <ellipse cx="40" cy="36" rx="5" ry="6" fill="#220000" stroke="none" />
      <path
        d="M20 56 L16 68 M24 60 L20 72 M32 62 L30 74 M40 60 L44 72 M44 56 L48 68"
        strokeWidth="3.5"
      />
      <path d="M32 56 C18 70 8 80 4 90" fill="none" strokeWidth="4" />
      <path d="M32 56 C46 70 56 80 60 90" fill="none" strokeWidth="4" />
    </>
  ),

  giant_tarantula: (
    <>
      <ellipse cx="32" cy="42" rx="22" ry="18" />
      <ellipse cx="32" cy="30" rx="14" ry="12" />
      <circle cx="24" cy="26" r="4" fill="#220000" stroke="none" />
      <circle cx="30" cy="24" r="3.5" fill="#220000" stroke="none" />
      <circle cx="34" cy="24" r="3.5" fill="#220000" stroke="none" />
      <circle cx="40" cy="26" r="4" fill="#220000" stroke="none" />
      <circle cx="24" cy="26" r="2" fill="#ff4400" stroke="none" />
      <circle cx="40" cy="26" r="2" fill="#ff4400" stroke="none" />
      <path
        d="M10 34 L-6 18 M8 40 L-8 32 M8 46 L-6 54 M10 52 L-4 68"
        strokeWidth="3.5"
      />
      <path
        d="M54 34 L70 18 M56 40 L72 32 M56 46 L70 54 M54 52 L68 68"
        strokeWidth="3.5"
      />
      <path d="M28 54 L26 66 M32 56 L32 68 M36 54 L38 66" strokeWidth="4" />
      <path d="M10 34 L4 24 L10 30" fill="none" strokeWidth="1.5" />
      <path d="M54 34 L60 24 L54 30" fill="none" strokeWidth="1.5" />
      <path d="M28 34 L26 24 M36 34 L38 24" strokeWidth="2" />
    </>
  ),

  devourer_bloom: (
    <>
      <path d="M32 40 C18 30 10 14 16 4 C20 14 24 26 28 36 C16 20 20 4 26 8 C26 20 28 32 30 40 Z" />
      <path d="M32 40 C46 30 54 14 48 4 C44 14 40 26 36 36 C48 20 44 4 38 8 C38 20 36 32 34 40 Z" />
      <path d="M8 44 L4 30 L0 22 L6 30 L2 20 L8 28 L4 16 L12 28 Z" />
      <path d="M56 44 L60 30 L64 22 L58 30 L62 20 L56 28 L60 16 L52 28 Z" />
      <ellipse cx="32" cy="54" rx="22" ry="18" />
      <path d="M10 50 L54 50 L58 68 Q32 86 6 68 Z" />
      <ellipse cx="22" cy="46" rx="6" ry="7" fill="#220000" stroke="none" />
      <ellipse cx="42" cy="46" rx="6" ry="7" fill="#220000" stroke="none" />
      <ellipse cx="22" cy="46" rx="4" ry="5" fill="#ff6688" stroke="none" />
      <ellipse cx="42" cy="46" rx="4" ry="5" fill="#ff6688" stroke="none" />
      <path
        d="M18 70 C10 78 12 92 8 96 M26 74 C22 86 24 94 20 96 M38 74 C42 86 40 94 44 96 M46 70 C54 78 52 92 56 96"
        fill="none"
        strokeWidth="5"
      />
      <circle
        cx="32"
        cy="56"
        r="28"
        fill="none"
        strokeWidth="1.5"
        strokeOpacity="0.2"
        strokeDasharray="6 4"
      />
    </>
  ),

  stone_jaguar: (
    <>
      <polygon points="20,10 14,-2 26,8" />
      <polygon points="44,10 50,-2 38,8" />
      <ellipse cx="32" cy="20" rx="16" ry="14" />
      <path d="M40 26 L60 22 L40 32 Z" />
      <ellipse cx="24" cy="18" rx="4.5" ry="5" fill="#220000" stroke="none" />
      <ellipse cx="40" cy="18" rx="4.5" ry="5" fill="#220000" stroke="none" />
      <ellipse cx="24" cy="18" rx="2.5" ry="3" fill="#ffee88" stroke="none" />
      <ellipse cx="40" cy="18" rx="2.5" ry="3" fill="#ffee88" stroke="none" />
      <path d="M8 36 L56 36 L54 76 L10 76 Z" />
      <path d="M12 38 L16 28 L22 38" />
      <path d="M24 36 L28 24 L32 36" />
      <path d="M32 36 L36 24 L40 36" />
      <path d="M42 38 L46 28 L52 38" />
      <polygon points="10,38 6,26 16,36" />
      <polygon points="54,38 58,26 48,36" />
      <rect x="10" y="76" width="18" height="16" rx="3" />
      <rect x="36" y="76" width="18" height="16" rx="3" />
      <path d="M8 42 L-4 62 L6 68 L18 52 Z" />
      <path d="M56 42 L68 62 L58 68 L46 52 Z" />
      <path d="M10 72 C4 84 6 94 2 98" fill="none" strokeWidth="3" />
    </>
  ),

  temple_guardian: (
    <>
      <path d="M18 8 C18 -4 46 -4 46 8 L46 22 L18 22 Z" />
      <rect x="20" y="16" width="24" height="4" rx="1" />
      <path d="M28 8 Q32 -2 36 8" fill="none" strokeWidth="3" />
      <rect x="22" y="20" width="20" height="6" rx="2" />
      <path d="M10 28 L54 28 L56 72 L8 72 Z" />
      <line
        x1="32"
        y1="30"
        x2="32"
        y2="70"
        strokeWidth="2"
        strokeOpacity="0.3"
      />
      <line
        x1="10"
        y1="48"
        x2="54"
        y2="48"
        strokeWidth="1.5"
        strokeOpacity="0.2"
      />
      <path d="M20 36 L16 26 L22 28 Z" />
      <path d="M44 36 L48 26 L42 28 Z" />
      <polygon points="10,30 4,18 16,26" />
      <polygon points="54,30 60,18 48,26" />
      <rect x="8" y="72" width="20" height="22" rx="3" />
      <rect x="36" y="72" width="20" height="22" rx="3" />
      <path d="M10 34 L-6 56 L4 62 L18 46 Z" />
      <path d="M54 32 L68 54 L58 60 L44 42 Z" />
      <rect x="68" y="-4" width="6" height="62" rx="3" />
      <polygon points="68,-4 62,-14 74,-14 80,-4" />
    </>
  ),

  venom_priest: (
    <>
      <ellipse cx="32" cy="14" rx="12" ry="13" />
      <ellipse cx="26" cy="12" rx="3.5" ry="4" fill="#220000" stroke="none" />
      <ellipse cx="38" cy="12" rx="3.5" ry="4" fill="#220000" stroke="none" />
      <ellipse cx="26" cy="12" rx="2" ry="2.5" fill="#88ff00" stroke="none" />
      <ellipse cx="38" cy="12" rx="2" ry="2.5" fill="#88ff00" stroke="none" />
      <path
        d="M26 26 L24 36 M30 28 L28 38 M34 28 L36 38 M38 26 L40 36"
        strokeWidth="2"
        strokeOpacity="0.5"
      />
      <path d="M14 26 L50 26 L48 68 L16 68 Z" />
      <path d="M14 30 C4 28 0 40 4 48 L10 48 Z" />
      <path d="M50 28 C60 26 64 38 60 46 L54 46 Z" />
      <path d="M12 32 L-4 54 L6 60 L18 44 Z" />
      <path d="M52 30 L66 50 L56 56 L44 42 Z" />
      <rect x="16" y="68" width="14" height="24" rx="3" />
      <rect x="34" y="68" width="14" height="24" rx="3" />
      <rect x="-4" y="6" width="5" height="68" rx="2" />
      <ellipse cx="-6" cy="2" rx="8" ry="8" fill="none" strokeWidth="2" />
      <path d="M-14 -2 C-12 -10 0 -10 2 -2" fill="none" strokeWidth="2.5" />
    </>
  ),

  golden_idol: (
    <>
      <path d="M22 8 C22 -4 42 -4 42 8 L44 24 L20 24 Z" />
      <polygon points="32,0 26,-10 38,-10" />
      <ellipse cx="32" cy="26" rx="14" ry="12" />
      <ellipse cx="25" cy="24" rx="4" ry="4.5" fill="#885500" stroke="none" />
      <ellipse cx="39" cy="24" rx="4" ry="4.5" fill="#885500" stroke="none" />
      <ellipse cx="25" cy="24" rx="2.5" ry="3" fill="#ffee00" stroke="none" />
      <ellipse cx="39" cy="24" rx="2.5" ry="3" fill="#ffee00" stroke="none" />
      <rect x="18" y="36" width="28" height="42" rx="2" />
      <polygon points="16,38 10,28 22,36" />
      <polygon points="48,38 54,28 42,36" />
      <path d="M14 40 L-2 62 L8 68 L20 52 Z" />
      <path d="M50 40 L66 62 L56 68 L44 52 Z" />
      <rect x="18" y="78" width="12" height="16" rx="3" />
      <rect x="34" y="78" width="12" height="16" rx="3" />
      <path d="M24 46 L20 36 L28 46" />
      <path d="M36 46 L40 36 L44 46" />
      <circle
        cx="32"
        cy="56"
        r="8"
        fill="#ffee00"
        stroke="none"
        fillOpacity="0.4"
      />
      <circle
        cx="32"
        cy="56"
        r="4"
        fill="#ffee00"
        stroke="none"
        fillOpacity="0.7"
      />
    </>
  ),

  ancient_gorilla: (
    <>
      <ellipse cx="20" cy="16" rx="10" ry="9" />
      <ellipse cx="44" cy="16" rx="10" ry="9" />
      <ellipse cx="32" cy="26" rx="18" ry="18" />
      <ellipse cx="32" cy="36" rx="12" ry="9" />
      <ellipse cx="23" cy="24" rx="5" ry="6" fill="#220000" stroke="none" />
      <ellipse cx="41" cy="24" rx="5" ry="6" fill="#220000" stroke="none" />
      <path
        d="M24 38 L20 48 M28 40 L26 50 M36 40 L38 50 M40 38 L44 48"
        strokeWidth="3"
      />
      <path d="M6 44 L58 44 L60 86 L4 86 Z" />
      <rect x="4" y="86" width="24" height="10" rx="3" />
      <rect x="36" y="86" width="24" height="10" rx="3" />
      <path d="M6 50 C-8 46 -12 62 -6 70 L4 66 Z" />
      <path d="M58 50 C72 46 76 62 70 70 L60 66 Z" />
      <path d="M-8 70 L-12 56 L-4 64 Z" />
      <path d="M72 70 L76 56 L68 64 Z" />
      <path d="M4 54 L-10 74 L4 80 L16 66 Z" />
      <path d="M60 52 L74 72 L60 78 L48 64 Z" />
      <polygon points="8,46 4,34 14,46" />
      <polygon points="20,44 16,30 24,44" />
      <polygon points="40,44 44,30 48,44" />
      <polygon points="56,46 60,34 64,46" />
    </>
  ),

  emerald_basilisk: (
    <>
      <ellipse cx="32" cy="14" rx="16" ry="13" />
      <path
        d="M24 8 L20 -2 M32 6 L32 -4 M40 8 L44 -2"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse cx="24" cy="12" rx="5" ry="6" fill="#220000" stroke="none" />
      <ellipse cx="40" cy="12" rx="5" ry="6" fill="#220000" stroke="none" />
      <ellipse cx="24" cy="12" rx="3" ry="4" fill="#44ff88" stroke="none" />
      <ellipse cx="40" cy="12" rx="3" ry="4" fill="#44ff88" stroke="none" />
      <path d="M18 26 L14 18 M32 28 L32 20 M46 26 L50 18" strokeWidth="2.5" />
      <path d="M8 36 L56 36 L54 72 L10 72 Z" />
      <ellipse cx="32" cy="52" rx="22" ry="12" />
      <ellipse cx="32" cy="70" rx="18" ry="10" />
      <path
        d="M10 40 Q32 36 54 40 M10 56 Q32 52 54 56"
        fill="none"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
      <polygon points="8,36 2,26 14,34" />
      <polygon points="56,36 62,26 50,34" />
      <path
        d="M14 80 C8 90 10 98 6 102 M26 82 C22 92 24 100 20 102 M38 82 C42 92 40 100 44 102 M50 80 C56 90 54 98 58 102"
        fill="none"
        strokeWidth="4.5"
      />
    </>
  ),

  jungle_guardian: (
    <>
      <path
        d="M22 12 L18 0 L16 -8 L22 -2 L18 -10 L24 -4 L20 -12 L28 -2 Z"
        strokeWidth="2"
      />
      <path
        d="M42 12 L46 0 L48 -8 L42 -2 L46 -10 L40 -4 L44 -12 L36 -2 Z"
        strokeWidth="2"
      />
      <ellipse cx="32" cy="24" rx="16" ry="16" />
      <ellipse cx="24" cy="22" rx="5" ry="5.5" fill="#220000" stroke="none" />
      <ellipse cx="40" cy="22" rx="5" ry="5.5" fill="#220000" stroke="none" />
      <path d="M8 40 L56 40 L58 84 L6 84 Z" />
      <polygon points="10,42 6,30 16,40" />
      <polygon points="22,40 18,26 26,40" />
      <polygon points="38,40 42,26 46,40" />
      <polygon points="54,42 58,30 62,40" />
      <path d="M8 46 L-6 68 L6 74 L18 58 Z" />
      <path d="M56 44 L70 66 L58 72 L46 56 Z" />
      <rect x="6" y="84" width="22" height="10" rx="3" />
      <rect x="36" y="84" width="22" height="10" rx="3" />
      <path d="M18 50 C10 46 6 58 12 64" fill="none" strokeWidth="3" />
      <path d="M46 54 C54 50 58 62 52 68" fill="none" strokeWidth="3" />
    </>
  ),

  green_warden: (
    <>
      <path
        d="M20 10 L16 -2 L12 -10 L18 -4 L14 -12 L20 -6 L16 -14 L22 -4 L20 -12 L26 -2 L24 -10 L30 0 Z"
        strokeWidth="2"
      />
      <path
        d="M44 10 L48 -2 L52 -10 L46 -4 L50 -12 L44 -6 L48 -14 L42 -4 L44 -12 L38 -2 L40 -10 L34 0 Z"
        strokeWidth="2"
      />
      <ellipse cx="32" cy="26" rx="20" ry="18" />
      <ellipse cx="24" cy="24" rx="5.5" ry="6" fill="#220000" stroke="none" />
      <ellipse cx="40" cy="24" rx="5.5" ry="6" fill="#220000" stroke="none" />
      <ellipse cx="24" cy="24" rx="3" ry="3.5" fill="#44ff44" stroke="none" />
      <ellipse cx="40" cy="24" rx="3" ry="3.5" fill="#44ff44" stroke="none" />
      <path d="M6 44 L58 44 L62 90 L2 90 Z" />
      <path d="M6 50 C-8 46 -12 62 -4 70 L6 66 Z" />
      <path d="M58 48 C72 44 76 60 68 68 L58 64 Z" />
      <path d="M4 54 L-12 76 L4 82 L18 66 Z" />
      <path d="M60 52 L76 74 L60 80 L46 64 Z" />
      <rect x="2" y="90" width="28" height="10" rx="3" />
      <rect x="34" y="90" width="28" height="10" rx="3" />
      <polygon points="8,46 2,34 16,44" />
      <polygon points="22,44 18,30 28,44" />
      <polygon points="36,44 40,30 46,44" />
      <polygon points="56,46 60,34 70,44" />
      <path d="M16 58 C8 54 4 66 10 72" fill="none" strokeWidth="4" />
      <path d="M48 62 C56 58 60 70 54 76" fill="none" strokeWidth="4" />
    </>
  ),

  elite_voodoo_warrior: (
    <>
      <ellipse cx="32" cy="14" rx="12" ry="13" />
      <path
        d="M28 6 L24 -4 L28 0 L26 -8 L30 -4 M34 -6 L38 -10 L36 -4 L40 -8 L36 2"
        strokeWidth="2"
      />
      <ellipse cx="26" cy="12" rx="3.5" ry="4" fill="#220000" stroke="none" />
      <ellipse cx="38" cy="12" rx="3.5" ry="4" fill="#220000" stroke="none" />
      <ellipse cx="26" cy="12" rx="2" ry="2.5" fill="#dd88ff" stroke="none" />
      <ellipse cx="38" cy="12" rx="2" ry="2.5" fill="#dd88ff" stroke="none" />
      <path d="M14 26 L50 26 L48 68 L16 68 Z" />
      <polygon points="14,28 8,18 20,26" />
      <polygon points="50,28 56,18 44,26" />
      <path d="M12 30 L-4 52 L6 58 L18 42 Z" />
      <path d="M52 28 L66 50 L56 56 L44 40 Z" />
      <rect x="16" y="68" width="14" height="24" rx="3" />
      <rect x="34" y="68" width="14" height="24" rx="3" />
      <rect x="64" y="-2" width="5" height="70" rx="2" />
      <polygon points="64,-2 58,-12 70,-12 76,-2" />
      <circle cx="62" cy="-14" r="5" fill="none" strokeWidth="2" />
      <path d="M60 30 L54 22 L58 20 L60 28 Z" />
      <path d="M62 46 L56 38 L60 36 L62 44 Z" />
      <path d="M-6" y="12" width="6" height="44" rx="3" />
      <rect x="-6" y="12" width="6" height="44" rx="3" />
      <path d="M-6 12 C-16 6 -18 -4 -12 -2 C-10 4 -6 10 -4 14 Z" />
      <rect x="-12" y="30" width="18" height="4" rx="2" />
    </>
  ),

  soul_devourer: (
    <>
      <path d="M20 10 C18 0 46 0 44 10 L44 24 L20 24 Z" fillOpacity="0.85" />
      <ellipse cx="32" cy="26" rx="13" ry="12" fillOpacity="0.9" />
      <ellipse cx="25" cy="24" rx="4.5" ry="5.5" fill="#220000" stroke="none" />
      <ellipse cx="39" cy="24" rx="4.5" ry="5.5" fill="#220000" stroke="none" />
      <ellipse cx="25" cy="24" rx="2.5" ry="3.5" fill="#aa66ff" stroke="none" />
      <ellipse cx="39" cy="24" rx="2.5" ry="3.5" fill="#aa66ff" stroke="none" />
      <path d="M16 36 L48 36 L52 76 L12 76 Z" fillOpacity="0.75" />
      <path d="M16 40 C6 36 2 48 6 56 L12 56 Z" fillOpacity="0.6" />
      <path d="M48 38 C58 34 62 46 58 54 L52 54 Z" fillOpacity="0.6" />
      <path d="M14 42 L-2 64 L8 70 L20 54 Z" fillOpacity="0.7" />
      <path d="M50 40 L64 62 L54 68 L42 52 Z" fillOpacity="0.7" />
      <path
        d="M16 74 C10 88 12 98 8 100 M26 78 C22 92 24 100 20 100 M38 78 C42 92 40 100 44 100 M48 74 C54 88 52 98 56 100"
        fill="none"
        strokeWidth="5"
        strokeOpacity="0.55"
      />
      <path
        d="M24 50 L20 60 M28 52 L26 62 M36 52 L38 62 M40 50 L44 60"
        fill="none"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
    </>
  ),

  cursed_colossus: (
    <>
      <polygon points="32,-6 46,8 46,24 18,24 18,8" />
      <polygon points="32,-6 40,-14 46,8" />
      <polygon points="32,-6 24,-14 18,8" />
      <rect x="14" y="24" width="36" height="54" rx="2" />
      <polygon points="12,26 -4,50 8,56 18,36" />
      <polygon points="52,26 68,50 56,56 46,36" />
      <polygon points="-4,50 -10,40 4,46" />
      <polygon points="68,50 74,40 60,46" />
      <polygon points="20,26 16,16 24,26" />
      <polygon points="30,24 26,12 34,24" />
      <polygon points="40,26 44,16 36,26" />
      <rect x="14" y="78" width="14" height="18" rx="3" />
      <rect x="36" y="78" width="14" height="18" rx="3" />
      <ellipse
        cx="25"
        cy="38"
        rx="5"
        ry="6"
        fill="#aa66ff"
        stroke="none"
        fillOpacity="0.5"
      />
      <ellipse
        cx="39"
        cy="38"
        rx="5"
        ry="6"
        fill="#aa66ff"
        stroke="none"
        fillOpacity="0.5"
      />
      <path
        d="M20 50 L14 44 M22 58 L16 52 M42 50 L48 44 M42 58 L48 52"
        strokeWidth="2"
        strokeOpacity="0.4"
      />
    </>
  ),

  ancient_loa: (
    <>
      <path
        d="M22 14 L18 2 L14 -6 L20 0 L16 -8 L22 -2 L18 -10 L24 -2 L22 -10 L28 2 L26 -6 L32 4 Z"
        strokeWidth="1.5"
        fillOpacity="0.9"
      />
      <path
        d="M42 14 L46 2 L50 -6 L44 0 L48 -8 L42 -2 L46 -10 L40 -2 L42 -10 L36 2 L38 -6 L32 4 Z"
        strokeWidth="1.5"
        fillOpacity="0.9"
      />
      <ellipse cx="32" cy="24" rx="14" ry="16" fillOpacity="0.95" />
      <ellipse cx="24" cy="22" rx="5" ry="6" fill="#000" stroke="none" />
      <ellipse cx="40" cy="22" rx="5" ry="6" fill="#000" stroke="none" />
      <ellipse cx="24" cy="22" rx="3" ry="4" fill="#cc88ff" stroke="none" />
      <ellipse cx="40" cy="22" rx="3" ry="4" fill="#cc88ff" stroke="none" />
      <path d="M16 38 L48 38 L46 78 L18 78 Z" fillOpacity="0.8" />
      <path d="M16 42 C4 40 0 54 6 62 L12 62 Z" fillOpacity="0.7" />
      <path d="M48 40 C60 38 64 52 58 60 L52 60 Z" fillOpacity="0.7" />
      <path d="M14 44 L-4 68 L8 74 L20 58 Z" fillOpacity="0.8" />
      <path d="M50 42 L68 66 L56 72 L44 56 Z" fillOpacity="0.8" />
      <rect x="18" y="78" width="14" height="18" rx="3" fillOpacity="0.8" />
      <rect x="32" y="78" width="14" height="18" rx="3" fillOpacity="0.8" />
      <rect x="-6" y="4" width="6" height="80" rx="3" />
      <path d="M-8 4 C-18 -2 -22 -12 -14 -10 C-10 -4 -6 2 -4 6 Z" />
      <circle cx="-8" cy="-12" r="5" fill="none" strokeWidth="2" />
      <circle cx="-14" cy="-18" r="3" fill="none" strokeWidth="1.5" />
      <circle cx="-2" cy="-18" r="3" fill="none" strokeWidth="1.5" />
      <circle cx="-8" cy="-22" r="3" fill="none" strokeWidth="1.5" />
      <rect x="-12" y="36" width="20" height="4" rx="2" />
    </>
  ),

  spirit_crocolisk: (
    <>
      <path
        d="M44 18 L66 10 L66 16 L58 18 L66 20 L66 26 L44 24 Z"
        fillOpacity="0.7"
      />
      <ellipse cx="30" cy="22" rx="18" ry="16" fillOpacity="0.75" />
      <ellipse cx="22" cy="20" rx="5" ry="5.5" fill="#000" stroke="none" />
      <ellipse cx="38" cy="20" rx="5" ry="5.5" fill="#000" stroke="none" />
      <ellipse cx="22" cy="20" rx="2.5" ry="3" fill="#88ffaa" stroke="none" />
      <ellipse cx="38" cy="20" rx="2.5" ry="3" fill="#88ffaa" stroke="none" />
      <path d="M8 38 L56 38 L58 78 L6 78 Z" fillOpacity="0.6" />
      <rect x="6" y="78" width="18" height="14" rx="3" fillOpacity="0.6" />
      <rect x="20" y="78" width="18" height="14" rx="3" fillOpacity="0.6" />
      <rect x="36" y="78" width="18" height="14" rx="3" fillOpacity="0.6" />
      <path
        d="M56 52 C62 62 58 78 50 80 C60 78 68 64 62 52 Z"
        fillOpacity="0.7"
      />
      <circle
        cx="32"
        cy="50"
        r="26"
        fill="none"
        strokeWidth="1.5"
        strokeOpacity="0.25"
        strokeDasharray="5 4"
      />
    </>
  ),

  spirit_gorilla: (
    <>
      <ellipse cx="20" cy="16" rx="10" ry="9" fillOpacity="0.7" />
      <ellipse cx="44" cy="16" rx="10" ry="9" fillOpacity="0.7" />
      <ellipse cx="32" cy="26" rx="18" ry="18" fillOpacity="0.75" />
      <ellipse cx="23" cy="24" rx="5" ry="6" fill="#000" stroke="none" />
      <ellipse cx="41" cy="24" rx="5" ry="6" fill="#000" stroke="none" />
      <ellipse cx="23" cy="24" rx="3" ry="3.5" fill="#88ffcc" stroke="none" />
      <ellipse cx="41" cy="24" rx="3" ry="3.5" fill="#88ffcc" stroke="none" />
      <path d="M6 44 L58 44 L60 86 L4 86 Z" fillOpacity="0.65" />
      <rect x="4" y="86" width="24" height="10" rx="3" fillOpacity="0.6" />
      <rect x="36" y="86" width="24" height="10" rx="3" fillOpacity="0.6" />
      <path d="M6 50 C-8 46 -12 62 -6 70 L4 66 Z" fillOpacity="0.7" />
      <path d="M58 50 C72 46 76 62 70 70 L60 66 Z" fillOpacity="0.7" />
      <path d="M4 54 L-12 76 L4 82 L18 66 Z" fillOpacity="0.7" />
      <path d="M60 52 L76 74 L60 80 L46 64 Z" fillOpacity="0.7" />
      <circle
        cx="32"
        cy="60"
        r="28"
        fill="none"
        strokeWidth="1.5"
        strokeOpacity="0.2"
        strokeDasharray="6 5"
      />
    </>
  ),

  spirit_eagle: (
    <>
      <path
        d="M32 50 C22 38 6 28 0 12 C8 14 14 26 18 36 C10 22 12 8 20 10 C20 24 24 38 30 48 Z"
        fillOpacity="0.7"
      />
      <path
        d="M32 50 C42 38 58 28 64 12 C56 14 50 26 46 36 C54 22 52 8 44 10 C44 24 40 38 34 48 Z"
        fillOpacity="0.7"
      />
      <ellipse cx="32" cy="60" rx="10" ry="12" fillOpacity="0.75" />
      <ellipse cx="32" cy="42" rx="9" ry="9" fillOpacity="0.8" />
      <circle cx="27" cy="40" r="3" fill="#000" stroke="none" />
      <circle cx="37" cy="40" r="3" fill="#000" stroke="none" />
      <circle cx="27" cy="40" r="1.5" fill="#aaddff" stroke="none" />
      <circle cx="37" cy="40" r="1.5" fill="#aaddff" stroke="none" />
      <path
        d="M26 70 L22 80 M32 72 L30 82 M38 70 L42 80"
        strokeWidth="4"
        strokeOpacity="0.65"
      />
      <circle
        cx="32"
        cy="50"
        r="24"
        fill="none"
        strokeWidth="1.5"
        strokeOpacity="0.22"
        strokeDasharray="5 4"
      />
    </>
  ),

  zamkoro: (
    <>
      <path
        d="M22 16 L18 4 L14 -6 L20 0 L14 -12 L22 -6 L18 -14 L26 -4 L22 -12 L28 0 L24 -8 L32 6 Z"
        strokeWidth="1.5"
      />
      <path
        d="M42 16 L46 4 L50 -6 L44 0 L50 -12 L42 -6 L46 -14 L38 -4 L42 -12 L36 0 L40 -8 L32 6 Z"
        strokeWidth="1.5"
      />
      <ellipse cx="32" cy="28" rx="16" ry="18" />
      <ellipse cx="24" cy="26" rx="6" ry="7" fill="#000" stroke="none" />
      <ellipse cx="40" cy="26" rx="6" ry="7" fill="#000" stroke="none" />
      <ellipse cx="24" cy="26" rx="3.5" ry="4.5" fill="#44ff88" stroke="none" />
      <ellipse cx="40" cy="26" rx="3.5" ry="4.5" fill="#44ff88" stroke="none" />
      <path d="M16 44 L48 44 L46 80 L18 80 Z" />
      <path d="M18 48 C6 46 2 60 8 68 L14 68 Z" />
      <path d="M46 46 C58 44 62 58 56 66 L50 66 Z" />
      <path d="M14 50 L-6 76 L8 82 L22 64 Z" />
      <path d="M50 48 L70 74 L56 80 L42 62 Z" />
      <rect x="18" y="80" width="14" height="16" rx="3" />
      <rect x="32" y="80" width="14" height="16" rx="3" />
      <path d="M-6" y="10" width="6" height="80" rx="3" />
      <rect x="-6" y="10" width="6" height="80" rx="3" />
      <path d="M-8 10 C-20 4 -24 -8 -16 -6 C-12 0 -6 8 -4 12 Z" />
      <circle cx="-10" cy="-8" r="7" fill="none" strokeWidth="2.5" />
      <circle cx="-18" cy="-16" r="4" fill="none" strokeWidth="2" />
      <circle cx="-2" cy="-16" r="4" fill="none" strokeWidth="2" />
      <circle cx="-10" cy="-22" r="4" fill="none" strokeWidth="2" />
      <rect x="-14" y="34" width="22" height="5" rx="2" />
      <circle
        cx="14"
        cy="56"
        r="5"
        fill="#44ff88"
        stroke="none"
        fillOpacity="0.3"
      />
      <circle
        cx="50"
        cy="58"
        r="5"
        fill="#44ff88"
        stroke="none"
        fillOpacity="0.3"
      />
      <circle
        cx="32"
        cy="62"
        r="5"
        fill="#44ff88"
        stroke="none"
        fillOpacity="0.4"
      />
      <circle
        cx="32"
        cy="32"
        r="32"
        fill="none"
        strokeWidth="1.5"
        strokeOpacity="0.12"
        strokeDasharray="8 6"
      />
    </>
  ),

  // ── Act 4 sprites ──────────────────────────────────────────────────────────

  veil_wraith: (
    <>
      <path d="M20 78 C14 66 12 52 16 38 C18 28 20 18 22 10 Q26 2 32 0 Q38 2 42 10 C44 18 46 28 48 38 C52 52 50 66 44 78 Q38 88 32 90 Q26 88 20 78 Z" />
      <ellipse
        cx="24"
        cy="24"
        rx="6"
        ry="7"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="40"
        cy="24"
        rx="6"
        ry="7"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse cx="24" cy="24" rx="3" ry="4" fill="#aa88ff" stroke="none" />
      <ellipse cx="40" cy="24" rx="3" ry="4" fill="#aa88ff" stroke="none" />
      <path
        d="M16 48 C8 44 2 34 0 22"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M48 46 C56 42 62 32 64 20"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M20 78 C16 84 10 90 6 86"
        fill="none"
        strokeWidth="3"
        strokeOpacity="0.5"
      />
      <path
        d="M32 90 C30 94 30 98 32 96"
        fill="none"
        strokeWidth="3"
        strokeOpacity="0.5"
      />
      <path
        d="M44 78 C48 84 54 90 58 86"
        fill="none"
        strokeWidth="3"
        strokeOpacity="0.5"
      />
    </>
  ),

  specter: (
    <>
      <ellipse cx="32" cy="28" rx="14" ry="16" />
      <ellipse
        cx="24"
        cy="26"
        rx="5"
        ry="6"
        fill="#000"
        fillOpacity="0.8"
        stroke="none"
      />
      <ellipse
        cx="40"
        cy="26"
        rx="5"
        ry="6"
        fill="#000"
        fillOpacity="0.8"
        stroke="none"
      />
      <ellipse cx="24" cy="26" rx="2.5" ry="3.5" fill="#cc99ff" stroke="none" />
      <ellipse cx="40" cy="26" rx="2.5" ry="3.5" fill="#cc99ff" stroke="none" />
      <path d="M20 42 C16 56 16 70 18 82 Q22 90 26 86 Q28 78 32 82 Q36 78 38 86 Q42 90 46 82 C48 70 48 56 44 42 Z" />
      <path
        d="M14 44 C6 40 2 30 4 20"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M50 42 C58 38 62 28 60 18"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </>
  ),

  lost_soul: (
    <>
      <ellipse cx="32" cy="22" rx="18" ry="20" />
      <path d="M16 36 C10 50 8 66 12 80 C16 90 24 94 32 92 C40 94 48 90 52 80 C56 66 54 50 48 36 Z" />
      <ellipse
        cx="22"
        cy="20"
        rx="7"
        ry="8"
        fill="#000"
        fillOpacity="0.85"
        stroke="none"
      />
      <ellipse
        cx="42"
        cy="20"
        rx="7"
        ry="8"
        fill="#000"
        fillOpacity="0.85"
        stroke="none"
      />
      <ellipse
        cx="22"
        cy="20"
        rx="4"
        ry="5"
        fill="#ffffff"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="42"
        cy="20"
        rx="4"
        ry="5"
        fill="#ffffff"
        fillOpacity="0.9"
        stroke="none"
      />
      <path
        d="M24 36 C20 40 22 44 28 42 M40 36 C44 40 42 44 36 42"
        fill="none"
        strokeWidth="2"
      />
      <path
        d="M14 38 C4 34 -2 24 2 16"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M50 36 C60 32 66 22 62 14"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </>
  ),

  boss_gatekeeper: (
    <>
      <ellipse cx="32" cy="20" rx="14" ry="16" />
      <ellipse
        cx="22"
        cy="18"
        rx="5"
        ry="6"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="42"
        cy="18"
        rx="5"
        ry="6"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse cx="22" cy="18" rx="2.5" ry="3" fill="#8866ff" stroke="none" />
      <ellipse cx="42" cy="18" rx="2.5" ry="3" fill="#8866ff" stroke="none" />
      <path d="M18 36 L46 36 L50 88 L14 88 Z" />
      <path d="M14 44 L-2 52 L-4 82 L14 72 Z" />
      <path d="M50 44 L66 52 L68 82 L50 72 Z" />
      <rect x="14" y="88" width="16" height="18" rx="3" />
      <rect x="34" y="88" width="16" height="18" rx="3" />
      <rect x="-8" y="52" width="8" height="60" rx="3" />
      <rect x="64" y="52" width="8" height="60" rx="3" />
      <path d="M18 36 L14 28 L22 32 L18 22 L26 28 L24 18 L32 26 L40 18 L38 28 L46 22 L42 32 L50 28 L46 36 Z" />
      <circle
        cx="32"
        cy="60"
        r="10"
        fill="none"
        strokeWidth="2"
        strokeOpacity="0.3"
        strokeDasharray="4 4"
      />
      <circle
        cx="32"
        cy="60"
        r="6"
        fill="#6644cc"
        stroke="none"
        fillOpacity="0.4"
      />
    </>
  ),

  tomb_knight: (
    <>
      <ellipse cx="32" cy="18" rx="12" ry="14" />
      <path d="M24 6 L28 -6 L32 2 L36 -6 L40 6" fill="none" strokeWidth="3" />
      <ellipse
        cx="24"
        cy="16"
        rx="4"
        ry="5"
        fill="#000"
        fillOpacity="0.8"
        stroke="none"
      />
      <ellipse
        cx="40"
        cy="16"
        rx="4"
        ry="5"
        fill="#000"
        fillOpacity="0.8"
        stroke="none"
      />
      <ellipse cx="24" cy="16" rx="2" ry="3" fill="#dd4444" stroke="none" />
      <ellipse cx="40" cy="16" rx="2" ry="3" fill="#dd4444" stroke="none" />
      <path d="M18 32 L46 32 L44 80 L20 80 Z" />
      <path d="M18 38 L4 46 L8 72 L20 64 Z" />
      <path d="M46 38 L60 46 L56 72 L44 64 Z" />
      <rect x="20" y="80" width="12" height="20" rx="3" />
      <rect x="36" y="80" width="12" height="20" rx="3" />
      <rect x="4" y="46" width="6" height="32" rx="2" />
      <rect x="54" y="46" width="6" height="32" rx="2" />
      <rect x="18" y="52" width="28" height="8" rx="2" />
      <path d="M56 54 L74 40 L76 32 L72 44 L66 44 Z" />
    </>
  ),

  bone_herald: (
    <>
      <ellipse cx="32" cy="20" rx="11" ry="13" />
      <path d="M24 8 L26 -2 L32 6 L38 -2 L40 8" fill="none" strokeWidth="2.5" />
      <ellipse
        cx="25"
        cy="18"
        rx="4"
        ry="5"
        fill="#000"
        fillOpacity="0.7"
        stroke="none"
      />
      <ellipse
        cx="39"
        cy="18"
        rx="4"
        ry="5"
        fill="#000"
        fillOpacity="0.7"
        stroke="none"
      />
      <ellipse cx="25" cy="18" rx="2" ry="2.5" fill="#bb88ff" stroke="none" />
      <ellipse cx="39" cy="18" rx="2" ry="2.5" fill="#bb88ff" stroke="none" />
      <path d="M20 34 L44 34 C46 50 46 70 44 86 L20 86 C18 70 18 50 20 34 Z" />
      <path d="M18 40 L6 36 C2 50 4 68 10 74 L18 64 Z" />
      <path d="M46 40 L58 36 C62 50 60 68 54 74 L46 64 Z" />
      <path d="M10 28 L-8 18 L-10 26 L6 34 Z" />
      <circle cx="-12" cy="14" r="8" fill="none" strokeWidth="2" />
      <circle
        cx="-12"
        cy="14"
        r="4"
        fill="none"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <rect x="20" y="86" width="12" height="18" rx="3" />
      <rect x="32" y="86" width="12" height="18" rx="3" />
    </>
  ),

  boss_valdris: (
    <>
      <path d="M20 2 L22 -8 L28 -2 L32 -12 L36 -2 L42 -8 L44 2 Z" />
      <ellipse cx="32" cy="16" rx="14" ry="16" />
      <ellipse
        cx="22"
        cy="14"
        rx="5"
        ry="6"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="42"
        cy="14"
        rx="5"
        ry="6"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse cx="22" cy="14" rx="2.5" ry="3.5" fill="#cc44ff" stroke="none" />
      <ellipse cx="42" cy="14" rx="2.5" ry="3.5" fill="#cc44ff" stroke="none" />
      <path d="M16 32 L48 32 L52 88 L12 88 Z" />
      <path d="M12 42 L-6 50 L-10 84 L12 74 Z" />
      <path d="M52 42 L70 50 L74 84 L52 74 Z" />
      <rect x="12" y="88" width="18" height="18" rx="3" />
      <rect x="34" y="88" width="18" height="18" rx="3" />
      <path d="M-4" y="50" width="8" height="42" rx="3" />
      <rect x="-4" y="50" width="8" height="42" rx="3" />
      <rect x="60" y="50" width="8" height="42" rx="3" />
      <rect x="14" y="52" width="36" height="10" rx="2" />
      <path d="M64 48 L80 28 L78 20 L72 36 L66 36 Z" />
      <circle
        cx="40"
        cy="70"
        r="6"
        fill="#aa22cc"
        stroke="none"
        fillOpacity="0.5"
      />
      <circle
        cx="20"
        cy="68"
        r="6"
        fill="#aa22cc"
        stroke="none"
        fillOpacity="0.5"
      />
    </>
  ),

  shadow_stalker: (
    <>
      <ellipse cx="44" cy="40" rx="12" ry="13" />
      <ellipse
        cx="38"
        cy="36"
        rx="4"
        ry="5"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="50"
        cy="36"
        rx="4"
        ry="5"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse cx="38" cy="36" rx="2" ry="3" fill="#ff4466" stroke="none" />
      <ellipse cx="50" cy="36" rx="2" ry="3" fill="#ff4466" stroke="none" />
      <path d="M56 42 L66 40 L56 50 Z" />
      <ellipse cx="32" cy="58" rx="20" ry="16" />
      <ellipse cx="12" cy="50" rx="9" ry="8" />
      <path
        d="M36 36 L32 28 L28 24"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <rect x="8" y="70" width="10" height="24" rx="3" />
      <rect x="22" y="72" width="10" height="22" rx="3" />
      <rect x="38" y="72" width="10" height="22" rx="3" />
      <rect x="50" y="70" width="10" height="24" rx="3" />
      <path
        d="M6 68 C-4 54 -4 42 2 44 C4 54 4 62 8 68"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </>
  ),

  bone_treant: (
    <>
      <path d="M26 72 L22 54 L14 42 L20 48 L18 34 L26 44 L24 28 L30 42 L28 22 L32 38 L36 22 L34 42 L40 28 L38 44 L46 34 L44 48 L50 42 L42 54 L38 72 Z" />
      <ellipse cx="32" cy="18" rx="12" ry="14" />
      <ellipse
        cx="24"
        cy="16"
        rx="4"
        ry="5"
        fill="#000"
        fillOpacity="0.8"
        stroke="none"
      />
      <ellipse
        cx="40"
        cy="16"
        rx="4"
        ry="5"
        fill="#000"
        fillOpacity="0.8"
        stroke="none"
      />
      <ellipse cx="24" cy="16" rx="2" ry="3" fill="#88cc44" stroke="none" />
      <ellipse cx="40" cy="16" rx="2" ry="3" fill="#88cc44" stroke="none" />
      <rect x="24" y="72" width="16" height="28" rx="4" />
      <rect x="14" y="76" width="12" height="24" rx="4" />
      <rect x="38" y="76" width="12" height="24" rx="4" />
    </>
  ),

  boss_pale_huntress: (
    <>
      <ellipse cx="32" cy="18" rx="12" ry="14" />
      <ellipse
        cx="24"
        cy="16"
        rx="4.5"
        ry="5"
        fill="#000"
        fillOpacity="0.7"
        stroke="none"
      />
      <ellipse
        cx="40"
        cy="16"
        rx="4.5"
        ry="5"
        fill="#000"
        fillOpacity="0.7"
        stroke="none"
      />
      <ellipse cx="24" cy="16" rx="2.5" ry="3" fill="#eeddff" stroke="none" />
      <ellipse cx="40" cy="16" rx="2.5" ry="3" fill="#eeddff" stroke="none" />
      <path d="M18 32 L46 32 L44 80 L20 80 Z" />
      <path d="M18 38 L4 44 L6 72 L18 66 Z" />
      <path d="M46 38 L60 44 L58 72 L46 66 Z" />
      <rect x="20" y="80" width="12" height="20" rx="3" />
      <rect x="32" y="80" width="12" height="20" rx="3" />
      <path d="M60 42 L76 16 L74 8 L68 26 L62 26 Z" />
      <path d="M72 12 C76 6 80 4 80 10 C76 12 74 12 72 12 Z" />
      <path
        d="M6 44 C-4 36 -10 20 -6 10 L-2 18 L2 14 C4 24 2 36 6 44"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M-6 10 L-14 2 M-6 10 L-4 0" strokeWidth="2" />
    </>
  ),

  drowned_revenant: (
    <>
      <ellipse cx="32" cy="20" rx="13" ry="15" />
      <ellipse
        cx="24"
        cy="18"
        rx="4.5"
        ry="5"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="40"
        cy="18"
        rx="4.5"
        ry="5"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse cx="24" cy="18" rx="2.5" ry="3" fill="#44aacc" stroke="none" />
      <ellipse cx="40" cy="18" rx="2.5" ry="3" fill="#44aacc" stroke="none" />
      <path d="M18 35 L46 35 L48 82 L16 82 Z" />
      <path d="M18 42 L4 52 L6 76 L18 68 Z" />
      <path d="M46 42 L60 52 L58 76 L46 68 Z" />
      <rect x="16" y="82" width="14" height="18" rx="3" />
      <rect x="34" y="82" width="14" height="18" rx="3" />
      <path
        d="M18 50 C12 48 10 56 14 60"
        fill="none"
        strokeWidth="2"
        strokeOpacity="0.5"
      />
      <path
        d="M46 52 C52 50 54 58 50 62"
        fill="none"
        strokeWidth="2"
        strokeOpacity="0.5"
      />
      <path
        d="M22 38 C18 34 16 28 20 26"
        fill="none"
        strokeWidth="2"
        strokeOpacity="0.4"
      />
      <path
        d="M42 38 C46 34 48 28 44 26"
        fill="none"
        strokeWidth="2"
        strokeOpacity="0.4"
      />
    </>
  ),

  soul_ferryman: (
    <>
      <ellipse cx="32" cy="20" rx="12" ry="14" />
      <ellipse
        cx="24"
        cy="18"
        rx="4"
        ry="5"
        fill="#000"
        fillOpacity="0.8"
        stroke="none"
      />
      <ellipse
        cx="40"
        cy="18"
        rx="4"
        ry="5"
        fill="#000"
        fillOpacity="0.8"
        stroke="none"
      />
      <ellipse cx="24" cy="18" rx="2" ry="3" fill="#88aadd" stroke="none" />
      <ellipse cx="40" cy="18" rx="2" ry="3" fill="#88aadd" stroke="none" />
      <path d="M20 34 L44 34 C44 50 44 68 42 84 L22 84 C20 68 20 50 20 34 Z" />
      <path d="M18 40 L6 38 C2 52 4 70 10 76 L18 64 Z" />
      <path d="M46 40 L58 38 C62 52 60 70 54 76 L46 64 Z" />
      <rect x="22" y="84" width="20" height="16" rx="3" />
      <path d="M60 36 L80 10 L82 2 L76 14 L70 14 Z" />
      <path d="M76 6 L82 0 L80 8 Z" />
      <path
        d="M4 36 L-6 28"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M-6 28 L-14 24 L-18 30 L-10 32 Z" />
    </>
  ),

  wailing_banshee: (
    <>
      <path d="M20 80 C14 68 10 52 14 36 C16 24 22 12 32 6 C42 12 48 24 50 36 C54 52 50 68 44 80 Q38 92 32 94 Q26 92 20 80 Z" />
      <ellipse
        cx="22"
        cy="28"
        rx="7"
        ry="8"
        fill="#000"
        fillOpacity="0.85"
        stroke="none"
      />
      <ellipse
        cx="42"
        cy="28"
        rx="7"
        ry="8"
        fill="#000"
        fillOpacity="0.85"
        stroke="none"
      />
      <ellipse
        cx="22"
        cy="28"
        rx="4"
        ry="5"
        fill="#ffffff"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="42"
        cy="28"
        rx="4"
        ry="5"
        fill="#ffffff"
        fillOpacity="0.9"
        stroke="none"
      />
      <path
        d="M24 48 C22 52 22 56 24 58 C26 60 30 60 32 60 C34 60 38 60 40 58 C42 56 42 52 40 48 C38 44 34 42 32 42 C30 42 26 44 24 48 Z"
        fill="#000"
        fillOpacity="0.3"
        stroke="none"
      />
      <path
        d="M12 46 C2 38 -4 24 -2 12"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M52 44 C62 36 68 22 66 10"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M18 80 C12 86 6 90 2 86"
        fill="none"
        strokeWidth="3"
        strokeOpacity="0.5"
      />
      <path
        d="M32 94 C30 98 30 102 32 100"
        fill="none"
        strokeWidth="3"
        strokeOpacity="0.5"
      />
      <path
        d="M46 80 C52 86 58 90 62 86"
        fill="none"
        strokeWidth="3"
        strokeOpacity="0.5"
      />
    </>
  ),

  boss_abyssal_hydra: (
    <>
      <ellipse cx="32" cy="68" rx="26" ry="18" />
      <path d="M18 62 C12 46 8 28 14 14 L20 22 L18 8 L26 18 L24 6 L32 18 Z" />
      <path d="M32 58 C26 44 24 28 28 12 L32 22 L34 10 L38 22 L40 10 L44 22 L46 10 L48 22 L46 12 Z" />
      <path d="M46 62 C52 46 56 28 50 14 L44 22 L46 8 L38 18 L40 6 L32 18 Z" />
      <ellipse cx="14" cy="10" rx="10" ry="9" />
      <ellipse cx="32" cy="8" rx="10" ry="9" />
      <ellipse cx="50" cy="10" rx="10" ry="9" />
      <ellipse
        cx="8"
        cy="8"
        rx="3.5"
        ry="4"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="20"
        cy="8"
        rx="3.5"
        ry="4"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="26"
        cy="6"
        rx="3.5"
        ry="4"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="38"
        cy="6"
        rx="3.5"
        ry="4"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="44"
        cy="8"
        rx="3.5"
        ry="4"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="56"
        cy="8"
        rx="3.5"
        ry="4"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse cx="8" cy="8" rx="1.5" ry="2" fill="#00ccff" stroke="none" />
      <ellipse cx="20" cy="8" rx="1.5" ry="2" fill="#00ccff" stroke="none" />
      <ellipse cx="26" cy="6" rx="1.5" ry="2" fill="#00ccff" stroke="none" />
      <ellipse cx="38" cy="6" rx="1.5" ry="2" fill="#00ccff" stroke="none" />
      <ellipse cx="44" cy="8" rx="1.5" ry="2" fill="#00ccff" stroke="none" />
      <ellipse cx="56" cy="8" rx="1.5" ry="2" fill="#00ccff" stroke="none" />
      <rect x="12" y="82" width="14" height="18" rx="4" />
      <rect x="38" y="82" width="14" height="18" rx="4" />
    </>
  ),

  phantom_crossbowman: (
    <>
      <ellipse cx="32" cy="18" rx="11" ry="13" />
      <ellipse
        cx="25"
        cy="16"
        rx="4"
        ry="4.5"
        fill="#000"
        fillOpacity="0.7"
        stroke="none"
      />
      <ellipse
        cx="39"
        cy="16"
        rx="4"
        ry="4.5"
        fill="#000"
        fillOpacity="0.7"
        stroke="none"
      />
      <ellipse cx="25" cy="16" rx="2" ry="2.5" fill="#aabbdd" stroke="none" />
      <ellipse cx="39" cy="16" rx="2" ry="2.5" fill="#aabbdd" stroke="none" />
      <path d="M20 30 L44 30 L42 80 L22 80 Z" />
      <path d="M20 36 L8 34 L6 64 L20 58 Z" />
      <path d="M44 36 L56 34 L58 64 L44 58 Z" />
      <rect x="22" y="80" width="20" height="18" rx="3" />
      <path d="M54 36 L74 36 L74 40 L54 40 Z" />
      <path d="M54 34 L54 42" strokeWidth="3" />
      <path d="M74 36 L80 38 L74 40" strokeWidth="2.5" />
      <path d="M60 38 L74 38" strokeWidth="1.5" strokeDasharray="2 2" />
    </>
  ),

  boss_morrath: (
    <>
      <ellipse cx="32" cy="18" rx="14" ry="16" />
      <ellipse
        cx="22"
        cy="16"
        rx="5"
        ry="6"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="42"
        cy="16"
        rx="5"
        ry="6"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse cx="22" cy="16" rx="2.5" ry="3.5" fill="#ff6633" stroke="none" />
      <ellipse cx="42" cy="16" rx="2.5" ry="3.5" fill="#ff6633" stroke="none" />
      <path d="M16 34 L48 34 L52 90 L12 90 Z" />
      <path d="M12 44 L-8 54 L-12 86 L12 76 Z" />
      <path d="M52 44 L72 54 L76 86 L52 76 Z" />
      <rect x="12" y="90" width="18" height="18" rx="3" />
      <rect x="34" y="90" width="18" height="18" rx="3" />
      <rect x="-10" y="54" width="8" height="40" rx="2" />
      <rect x="66" y="54" width="8" height="40" rx="2" />
      <rect x="14" y="54" width="36" height="10" rx="3" />
      <path d="M-4" y="50" width="6" height="52" rx="3" />
      <path d="M-10 52 L-26 32 L-24 24 L-18 40 L-12 40 Z" />
      <path d="M72 54 L88 34 L86 26 L80 42 L74 42 Z" />
    </>
  ),

  void_cultist: (
    <>
      <path
        d="M28 8 C28 2 36 2 36 8 L40 14 L40 8 L44 14 L42 6 L48 12 Z"
        fill="none"
        strokeWidth="2"
      />
      <ellipse cx="32" cy="22" rx="12" ry="14" />
      <ellipse
        cx="24"
        cy="20"
        rx="5"
        ry="6"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="40"
        cy="20"
        rx="5"
        ry="6"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse cx="24" cy="20" rx="2.5" ry="3" fill="#9933ff" stroke="none" />
      <ellipse cx="40" cy="20" rx="2.5" ry="3" fill="#9933ff" stroke="none" />
      <path d="M18 36 L46 36 C48 54 48 72 46 88 L18 88 C16 72 16 54 18 36 Z" />
      <path d="M18 42 L4 38 C0 54 2 72 8 78 L18 66 Z" />
      <path d="M46 42 L60 38 C64 54 62 72 56 78 L46 66 Z" />
      <rect x="18" y="88" width="28" height="16" rx="3" />
      <circle
        cx="32"
        cy="62"
        r="8"
        fill="none"
        strokeWidth="2"
        strokeDasharray="4 3"
      />
      <path
        d="M32 54 L34 58 L38 58 L35 61 L36 65 L32 62 L28 65 L29 61 L26 58 L30 58 Z"
        fill="#6600ff"
        stroke="none"
        fillOpacity="0.6"
      />
    </>
  ),

  nightmare_gargoyle: (
    <>
      <path d="M20 56 C6 44 2 24 10 10 L16 18 L18 8 L24 18 L26 6 L32 16 L38 6 L40 18 L46 8 L48 18 L54 10 C62 24 58 44 44 56 Z" />
      <ellipse cx="32" cy="30" rx="14" ry="16" />
      <ellipse
        cx="23"
        cy="28"
        rx="5"
        ry="6"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="41"
        cy="28"
        rx="5"
        ry="6"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse cx="23" cy="28" rx="2.5" ry="3.5" fill="#ff3366" stroke="none" />
      <ellipse cx="41" cy="28" rx="2.5" ry="3.5" fill="#ff3366" stroke="none" />
      <path d="M20 56 L14 76 L20 76 Z M44 56 L50 76 L44 76 Z" />
      <path
        d="M16 76 L14 92 M22 78 L20 94 M42 78 L44 94 M48 76 L50 92"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M28 44 L26 52 M36 44 L38 52"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </>
  ),

  boss_varek: (
    <>
      <path
        d="M22 14 L26 4 L32 12 L38 4 L42 14 Z"
        fill="none"
        strokeWidth="2.5"
      />
      <ellipse cx="32" cy="26" rx="14" ry="16" />
      <ellipse
        cx="22"
        cy="24"
        rx="6"
        ry="7"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="42"
        cy="24"
        rx="6"
        ry="7"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse cx="22" cy="24" rx="3.5" ry="4.5" fill="#cc00ff" stroke="none" />
      <ellipse cx="42" cy="24" rx="3.5" ry="4.5" fill="#cc00ff" stroke="none" />
      <path d="M16 42 L48 42 C50 58 50 76 48 92 L16 92 C14 76 14 58 16 42 Z" />
      <path d="M16 50 L2 44 C-2 58 0 78 8 84 L16 70 Z" />
      <path d="M48 50 L62 44 C66 58 64 78 56 84 L48 70 Z" />
      <rect x="16" y="92" width="32" height="14" rx="3" />
      <path d="M-2 44 L-16 28 L-14 18 L-8 36 L-2 36 Z" />
      <path d="M64 44 L78 28 L76 18 L70 36 L64 36 Z" />
      <circle
        cx="32"
        cy="68"
        r="12"
        fill="none"
        strokeWidth="2"
        strokeDasharray="5 4"
        strokeOpacity="0.6"
      />
      <circle
        cx="32"
        cy="68"
        r="6"
        fill="#6600aa"
        stroke="none"
        fillOpacity="0.5"
      />
      <circle
        cx="32"
        cy="68"
        r="2"
        fill="#ff00ff"
        stroke="none"
        fillOpacity="0.8"
      />
    </>
  ),

  fear_manifestation: (
    <>
      <path d="M8 56 C4 40 6 22 14 10 C18 4 26 0 32 0 C38 0 46 4 50 10 C58 22 60 40 56 56 C52 72 44 84 32 88 C20 84 12 72 8 56 Z" />
      <ellipse
        cx="20"
        cy="36"
        rx="8"
        ry="10"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="44"
        cy="36"
        rx="8"
        ry="10"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse cx="20" cy="36" rx="5" ry="6" fill="#ff0066" stroke="none" />
      <ellipse cx="44" cy="36" rx="5" ry="6" fill="#ff0066" stroke="none" />
      <path
        d="M16 60 C14 66 14 72 18 74 C22 66 22 58 18 56 Z"
        fill="none"
        strokeWidth="3"
      />
      <path
        d="M24 64 C22 70 22 76 26 78 C30 70 30 62 26 60 Z"
        fill="none"
        strokeWidth="3"
      />
      <path
        d="M40 64 C38 70 38 76 42 78 C46 70 46 62 42 60 Z"
        fill="none"
        strokeWidth="3"
      />
      <path
        d="M48 60 C46 66 46 72 50 74 C54 66 54 58 50 56 Z"
        fill="none"
        strokeWidth="3"
      />
      <path
        d="M6 54 C-8 42 -14 24 -10 10"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M58 52 C72 40 78 22 74 8"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </>
  ),

  boss_dreaming_horror: (
    <>
      {/* cracked skull */}
      <ellipse cx="32" cy="18" rx="16" ry="18" />
      {/* crack lines on skull */}
      <path
        d="M28 4 L30 14 L26 20"
        fill="none"
        strokeWidth="1.5"
        stroke="#000"
        strokeOpacity="0.5"
      />
      <path
        d="M36 5 L34 16"
        fill="none"
        strokeWidth="1.2"
        stroke="#000"
        strokeOpacity="0.4"
      />
      {/* hollow void eyes — deep black pits with glowing pink core */}
      <ellipse cx="23" cy="16" rx="6" ry="7" fill="#000" stroke="none" />
      <ellipse cx="41" cy="16" rx="6" ry="7" fill="#000" stroke="none" />
      <ellipse cx="23" cy="16" rx="3" ry="3.5" fill="#cc0066" stroke="none" />
      <ellipse cx="41" cy="16" rx="3" ry="3.5" fill="#cc0066" stroke="none" />
      {/* stitched / stretched jawline */}
      <path
        d="M18 28 Q32 36 46 28"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M22 29 L22 34 M27 31 L27 37 M32 32 L32 38 M37 31 L37 37 M42 29 L42 34"
        strokeWidth="1.2"
      />
      {/* gaunt tall torso */}
      <path d="M20 36 L44 36 L40 80 L24 80 Z" />
      {/* ribcage suggestion */}
      <path
        d="M24 46 L40 46 M24 54 L40 54 M24 62 L40 62"
        fill="none"
        strokeWidth="1.2"
        strokeOpacity="0.35"
      />
      {/* long left arm reaching forward / clawing */}
      <path
        d="M20 38 C10 44 -4 48 -10 38"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M-10 38 L-18 30 M-10 38 L-16 40 M-10 38 L-14 46"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* long right arm reaching forward */}
      <path
        d="M44 38 C54 44 68 48 74 38"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M74 38 L82 30 M74 38 L80 40 M74 38 L78 46"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* tattered robe hem dissolving into tatters */}
      <path d="M24 80 L18 96 L24 90 L28 100 L32 88 L36 100 L40 90 L46 96 L40 80" />
      {/* shadow wisps rising from the ground */}
      <path
        d="M14 88 C10 78 8 68 12 60"
        fill="none"
        strokeWidth="3"
        strokeOpacity="0.3"
        strokeLinecap="round"
      />
      <path
        d="M50 88 C54 78 56 68 52 60"
        fill="none"
        strokeWidth="3"
        strokeOpacity="0.3"
        strokeLinecap="round"
      />
    </>
  ),

  void_sentinel: (
    <>
      <ellipse cx="32" cy="16" rx="13" ry="15" />
      <path
        d="M22 2 L26 -10 L32 0 L38 -10 L42 2"
        fill="none"
        strokeWidth="3.5"
      />
      <ellipse
        cx="23"
        cy="14"
        rx="5"
        ry="6"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="41"
        cy="14"
        rx="5"
        ry="6"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse cx="23" cy="14" rx="2.5" ry="3.5" fill="#5500ff" stroke="none" />
      <ellipse cx="41" cy="14" rx="2.5" ry="3.5" fill="#5500ff" stroke="none" />
      <path d="M16 32 L48 32 L50 88 L14 88 Z" />
      <path d="M14 42 L-4 52 L-6 84 L14 72 Z" />
      <path d="M50 42 L68 52 L70 84 L50 72 Z" />
      <rect x="14" y="88" width="36" height="18" rx="3" />
      <rect x="-4" y="52" width="8" height="40" rx="3" />
      <rect x="60" y="52" width="8" height="40" rx="3" />
      <rect x="16" y="54" width="32" height="10" rx="3" />
      <rect x="12" y="72" width="40" height="8" rx="2" />
      <circle
        cx="32"
        cy="62"
        r="5"
        fill="#3300cc"
        stroke="none"
        fillOpacity="0.6"
      />
    </>
  ),

  shadow_executioner: (
    <>
      <ellipse cx="32" cy="18" rx="13" ry="15" />
      <ellipse
        cx="23"
        cy="16"
        rx="4.5"
        ry="5.5"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="41"
        cy="16"
        rx="4.5"
        ry="5.5"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse cx="23" cy="16" rx="2" ry="3" fill="#aa0000" stroke="none" />
      <ellipse cx="41" cy="16" rx="2" ry="3" fill="#aa0000" stroke="none" />
      <path d="M18 34 L46 34 L50 86 L14 86 Z" />
      <path d="M14 44 L-2 56 L-2 82 L14 70 Z" />
      <path d="M50 44 L66 56 L66 82 L50 70 Z" />
      <rect x="14" y="86" width="36" height="18" rx="3" />
      <path d="M62 44 L80 4 L82 -6 L74 14 L66 14 Z" />
      <path d="M76 0 L84 -10 L82 2 Z" />
      <rect x="-4" y="56" width="8" height="34" rx="2" />
      <rect x="60" y="56" width="8" height="34" rx="2" />
    </>
  ),

  boss_seraphel: (
    <>
      <ellipse cx="32" cy="22" rx="14" ry="16" />
      <ellipse
        cx="22"
        cy="20"
        rx="6"
        ry="7"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="42"
        cy="20"
        rx="6"
        ry="7"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="22"
        cy="20"
        rx="3.5"
        ry="4.5"
        fill="#ffffff"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="42"
        cy="20"
        rx="3.5"
        ry="4.5"
        fill="#ffffff"
        fillOpacity="0.9"
        stroke="none"
      />
      <path d="M16 38 L48 38 C50 56 50 74 48 92 L16 92 C14 74 14 56 16 38 Z" />
      <path d="M16 46 L0 38 C-4 54 -2 76 6 82 L16 68 Z" />
      <path d="M48 46 L64 38 C68 54 66 76 58 82 L48 68 Z" />
      <rect x="16" y="92" width="32" height="16" rx="3" />
      <path d="M-2 38 L-18 10 L-16 0 L-10 20 L-4 20 Z" />
      <path d="M66 38 L82 10 L80 0 L74 20 L68 20 Z" />
      <path d="M0 40 L-16 32 C-20 40 -18 52 -12 54 L0 46 Z" />
      <path d="M64 40 L80 32 C84 40 82 52 76 54 L64 46 Z" />
      <circle
        cx="32"
        cy="66"
        r="14"
        fill="none"
        strokeWidth="2"
        strokeOpacity="0.3"
        strokeDasharray="5 4"
      />
      <circle
        cx="32"
        cy="66"
        r="8"
        fill="#220044"
        stroke="none"
        fillOpacity="0.6"
      />
      <circle
        cx="32"
        cy="66"
        r="3"
        fill="#ffffff"
        stroke="none"
        fillOpacity="0.8"
      />
    </>
  ),

  shade_valdris: (
    <>
      <path
        d="M22 -8 L24 -18 L30 -10 L32 -20 L34 -10 L40 -18 L42 -8 Z"
        fillOpacity="0.5"
      />
      <path
        d="M20 82 C14 68 12 52 16 36 C18 24 24 12 32 8 C40 12 46 24 48 36 C52 52 50 68 44 82 Q38 94 32 96 Q26 94 20 82 Z"
        fillOpacity="0.7"
      />
      <ellipse
        cx="24"
        cy="28"
        rx="6"
        ry="7"
        fill="#000"
        fillOpacity="0.8"
        stroke="none"
      />
      <ellipse
        cx="40"
        cy="28"
        rx="6"
        ry="7"
        fill="#000"
        fillOpacity="0.8"
        stroke="none"
      />
      <ellipse
        cx="24"
        cy="28"
        rx="3"
        ry="4"
        fill="#cc88ff"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="40"
        cy="28"
        rx="3"
        ry="4"
        fill="#cc88ff"
        fillOpacity="0.9"
        stroke="none"
      />
      <path
        d="M14 50 C6 44 2 32 4 20"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
      <path
        d="M50 48 C58 42 62 30 60 18"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
      <path
        d="M18 82 C14 88 8 92 4 88"
        fill="none"
        strokeWidth="3"
        strokeOpacity="0.4"
      />
      <path
        d="M32 96 C30 100 30 104 32 102"
        fill="none"
        strokeWidth="3"
        strokeOpacity="0.4"
      />
      <path
        d="M46 82 C50 88 56 92 60 88"
        fill="none"
        strokeWidth="3"
        strokeOpacity="0.4"
      />
    </>
  ),

  void_herald: (
    <>
      <ellipse cx="32" cy="22" rx="14" ry="16" fillOpacity="0.8" />
      <ellipse
        cx="22"
        cy="20"
        rx="6"
        ry="7"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="42"
        cy="20"
        rx="6"
        ry="7"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse cx="22" cy="20" rx="3.5" ry="4.5" fill="#6600ff" stroke="none" />
      <ellipse cx="42" cy="20" rx="3.5" ry="4.5" fill="#6600ff" stroke="none" />
      <path
        d="M18 38 L46 38 C48 56 48 74 46 90 L18 90 C16 74 16 56 18 38 Z"
        fillOpacity="0.8"
      />
      <path d="M18 46 L4 40 C0 56 2 74 10 80 L18 66 Z" fillOpacity="0.8" />
      <path d="M46 46 L60 40 C64 56 62 74 54 80 L46 66 Z" fillOpacity="0.8" />
      <rect x="18" y="90" width="28" height="16" rx="3" fillOpacity="0.8" />
      <circle
        cx="32"
        cy="64"
        r="10"
        fill="none"
        strokeWidth="2"
        strokeDasharray="4 3"
        strokeOpacity="0.7"
      />
      <circle
        cx="32"
        cy="64"
        r="5"
        fill="#3300aa"
        stroke="none"
        fillOpacity="0.6"
      />
      <path d="M2 42 L-12 24 L-10 14 L-4 34 L2 34 Z" fillOpacity="0.8" />
      <path d="M62 42 L76 24 L74 14 L68 34 L62 34 Z" fillOpacity="0.8" />
    </>
  ),

  shade_gatekeeper: (
    <>
      <ellipse cx="32" cy="18" rx="14" ry="16" fillOpacity="0.7" />
      <ellipse
        cx="22"
        cy="16"
        rx="5"
        ry="6"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="42"
        cy="16"
        rx="5"
        ry="6"
        fill="#000"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="22"
        cy="16"
        rx="2.5"
        ry="3"
        fill="#8866ff"
        fillOpacity="0.9"
        stroke="none"
      />
      <ellipse
        cx="42"
        cy="16"
        rx="2.5"
        ry="3"
        fill="#8866ff"
        fillOpacity="0.9"
        stroke="none"
      />
      <path d="M18 34 L46 34 L50 88 L14 88 Z" fillOpacity="0.7" />
      <path d="M14 44 L-2 52 L-4 82 L14 72 Z" fillOpacity="0.7" />
      <path d="M50 44 L66 52 L68 82 L50 72 Z" fillOpacity="0.7" />
      <rect x="14" y="88" width="16" height="18" rx="3" fillOpacity="0.7" />
      <rect x="34" y="88" width="16" height="18" rx="3" fillOpacity="0.7" />
      <path
        d="M18 34 L14 26 L22 30 L18 20 L26 26 L24 16 L32 24 L40 16 L38 26 L46 20 L42 30 L50 26 L46 34 Z"
        fillOpacity="0.6"
      />
      <path d="M-4" y="52" width="8" height="40" rx="3" fillOpacity="0.7" />
      <rect x="-4" y="52" width="8" height="40" rx="3" fillOpacity="0.7" />
      <rect x="60" y="52" width="8" height="40" rx="3" fillOpacity="0.7" />
      <circle
        cx="32"
        cy="62"
        r="10"
        fill="none"
        strokeWidth="2"
        strokeOpacity="0.4"
        strokeDasharray="4 4"
      />
    </>
  ),

  relith: (
    <>
      {/* staff shaft — left side, extends far above */}
      <path
        d="M13 74 C12 40 12 0 13 -48"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* staff crossguard */}
      <path
        d="M6 -30 L20 -30"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* staff top gem + flame */}
      <path
        d="M10 -46 C6 -58 4 -70 8 -80 C11 -70 13 -58 13 -46 Z"
        fill="#aa44ff"
        stroke="none"
      />
      <path
        d="M16 -46 C18 -56 20 -66 16 -74 C13 -64 12 -52 13 -46 Z"
        fill="#cc66ff"
        stroke="none"
      />
      <circle cx="13" cy="-46" r="6" fill="#9922ee" stroke="none" />
      <circle cx="13" cy="-46" r="3" fill="#cc66ff" stroke="none" />
      {/* left curved horn (sweeps up-left) */}
      <path d="M24 12 C20 2 10 -12 2 -28 C0 -38 6 -36 10 -24 C14 -12 20 0 26 10 Z" />
      {/* right curved horn (sweeps up-right) */}
      <path d="M40 12 C44 2 54 -12 62 -28 C64 -38 58 -36 54 -24 C50 -12 44 0 38 10 Z" />
      {/* skull head */}
      <path d="M18 10 C18 0 24 -4 32 -4 C40 -4 46 0 46 10 L45 30 Q32 38 19 30 Z" />
      {/* brow ridge */}
      <path
        d="M18 14 L46 14"
        fill="none"
        strokeWidth="3"
        strokeLinecap="butt"
      />
      {/* eye sockets */}
      <ellipse cx="24" cy="20" rx="6" ry="7" fill="#000" stroke="none" />
      <ellipse cx="40" cy="20" rx="6" ry="7" fill="#000" stroke="none" />
      {/* glowing purple eyes */}
      <ellipse cx="24" cy="20" rx="3.5" ry="4.5" fill="#bb44ff" stroke="none" />
      <ellipse cx="40" cy="20" rx="3.5" ry="4.5" fill="#bb44ff" stroke="none" />
      {/* skull nose cavity */}
      <path
        d="M30 26 L32 22 L34 26 L32 29 Z"
        fill="#000"
        fillOpacity="0.7"
        stroke="none"
      />
      {/* skull teeth */}
      <path
        d="M23 32 L25 38 L28 33 L32 40 L36 33 L39 38 L41 32"
        fill="none"
        strokeWidth="1.6"
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
      {/* left tattered wing/cloak */}
      <path d="M18 36 C8 40 -4 50 -10 64 C-14 76 -6 82 2 78 C-4 90 -8 106 -4 114 C6 116 12 102 14 88 C12 100 16 116 24 116 C30 112 28 96 24 80 L26 70 C22 78 18 84 20 74 C22 64 26 50 28 40 Z" />
      {/* left wing jagged tips */}
      <path
        d="M-10 64 L-20 60 L-12 72 L-22 76 L-10 80 M-4 96 L-14 94 L-6 106 L-16 110 L-6 114"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* right tattered wing/cloak */}
      <path d="M46 36 C56 40 68 50 74 64 C78 76 70 82 62 78 C68 90 72 106 68 114 C58 116 52 102 50 88 C52 100 48 116 40 116 C34 112 36 96 40 80 L38 70 C42 78 46 84 44 74 C42 64 38 50 36 40 Z" />
      {/* right wing jagged tips */}
      <path
        d="M74 64 L84 60 L76 72 L86 76 L74 80 M68 96 L78 94 L70 106 L80 110 L70 114"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* armored torso */}
      <path d="M24 36 L40 36 L44 72 L36 92 L28 92 L20 72 Z" />
      {/* void gem orbs on armor */}
      <circle cx="32" cy="46" r="5" fill="#aa44ff" stroke="none" />
      <circle cx="32" cy="46" r="2.5" fill="#dd88ff" stroke="none" />
      <circle cx="22" cy="52" r="3.5" fill="#9933dd" stroke="none" />
      <circle cx="42" cy="52" r="3.5" fill="#9933dd" stroke="none" />
      <circle cx="32" cy="60" r="3.5" fill="#8822cc" stroke="none" />
      <circle cx="30" cy="72" r="2.5" fill="#7711bb" stroke="none" />
      {/* left hand gripping staff */}
      <ellipse cx="13" cy="70" rx="5" ry="4" />
      {/* clawed feet */}
      <path
        d="M22 92 L18 102 L24 98 L26 106 L30 98 M42 92 L46 102 L40 98 L38 106 L34 98"
        strokeWidth="1.6"
        strokeLinejoin="miter"
        strokeLinecap="round"
      />
    </>
  ),

  // ── existing sprites ────────────────────────────────────────────────────────
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
      <line
        x1="24"
        y1="22"
        x2="20"
        y2="30"
        strokeWidth="2"
        stroke="currentColor"
        strokeOpacity="0.6"
      />
      <line
        x1="40"
        y1="22"
        x2="44"
        y2="30"
        strokeWidth="2"
        stroke="currentColor"
        strokeOpacity="0.6"
      />
      {/* Eyes */}
      <ellipse cx="27" cy="22" rx="3.5" ry="3.5" fill="#ff3300" stroke="none" />
      <ellipse cx="37" cy="22" rx="3.5" ry="3.5" fill="#ff3300" stroke="none" />
      {/* Armored torso */}
      <path d="M16 38 L48 38 L50 68 L14 68 Z" />
      {/* Armor lines */}
      <line
        x1="32"
        y1="40"
        x2="32"
        y2="66"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
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
      <path
        d="M54 2 C50 -4 52 -10 54 -6 C56 -10 58 -4 54 2 Z"
        fill="currentColor"
        fillOpacity="0.6"
        stroke="none"
      />
      <circle cx="54" cy="2" r="5" />
    </>
  ),

  ratspike: (
    <>
      {/* Spiky back quills */}
      <path
        d="M16 44 L12 28 M22 40 L18 22 M28 38 L26 20 M36 38 L38 20 M42 40 L46 22 M48 44 L52 28"
        strokeWidth="2.5"
      />
      {/* Oval body */}
      <ellipse cx="32" cy="56" rx="20" ry="18" />
      {/* Head (to the right) */}
      <ellipse cx="46" cy="44" rx="10" ry="9" />
      {/* Pointed snout */}
      <path d="M54 42 L64 44 L54 48 Z" />
      {/* Eye */}
      <circle cx="50" cy="42" r="2.5" fill="#ff2200" stroke="none" />
      {/* Legs */}
      <path
        d="M18 66 L12 78 M26 70 L22 82 M38 70 L42 82 M46 66 L52 78"
        strokeWidth="4"
      />
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
      <ellipse
        cx="24"
        cy="30"
        rx="3"
        ry="3.5"
        fill="currentColor"
        fillOpacity="0.8"
        stroke="none"
      />
      <ellipse
        cx="40"
        cy="30"
        rx="3"
        ry="3.5"
        fill="currentColor"
        fillOpacity="0.8"
        stroke="none"
      />
      {/* Wispy arms */}
      <path d="M14 36 C4 32 0 44 6 50" fill="none" strokeWidth="4" />
      <path d="M50 36 C60 32 64 44 58 50" fill="none" strokeWidth="4" />
      {/* Wispy tail flowing down */}
      <path
        d="M14 48 C8 62 12 78 18 84 M32 52 C28 68 30 82 32 90 M50 48 C56 62 52 78 46 84"
        fill="none"
        strokeWidth="3"
        strokeOpacity="0.7"
      />
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

  scarab: (
    <>
      {/* Hard shell */}
      <ellipse cx="32" cy="54" rx="24" ry="26" />
      {/* Shell ridge lines */}
      <line
        x1="32"
        y1="30"
        x2="32"
        y2="78"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
      <path
        d="M16 36 Q32 28 48 36 M12 48 Q32 40 52 48 M12 62 Q32 54 52 62"
        fill="none"
        strokeWidth="1.2"
        strokeOpacity="0.35"
      />
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
      <path
        d="M26 24 L26 28 M30 24 L30 28 M34 24 L34 28 M38 24 L38 28"
        strokeWidth="2"
      />
      {/* Spine */}
      <rect x="28" y="26" width="8" height="32" rx="2" />
      <path
        d="M26 30 L38 30 M24 36 L40 36 M24 42 L40 42 M26 48 L38 48"
        strokeWidth="1.2"
        strokeOpacity="0.4"
      />
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
      <path
        d="M8 38 C4 26 8 14 14 18 C10 8 16 2 20 10 C18 2 26 -2 28 8 C30 0 38 -2 36 8 C40 0 46 6 42 16 C48 8 52 18 46 26"
        fill="none"
        strokeWidth="2"
        strokeOpacity="0.55"
      />
      {/* Giant head */}
      <ellipse cx="32" cy="22" rx="16" ry="17" />
      {/* Flaming eyes */}
      <ellipse cx="23" cy="20" rx="5" ry="5.5" fill="#ff6600" stroke="none" />
      <ellipse cx="41" cy="20" rx="5" ry="5.5" fill="#ff6600" stroke="none" />
      {/* Hanging jaw */}
      <path d="M18 32 Q32 40 46 32" fill="none" strokeWidth="2.5" />
      <path
        d="M22 32 L21 38 M28 34 L27 40 M36 34 L35 40 M42 32 L41 38"
        strokeWidth="2"
      />
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
      <path
        d="M-2 74 C-6 66 -4 58 0 62 C-2 56 4 52 4 62 C6 54 10 56 8 64 Z"
        fill="currentColor"
        fillOpacity="0.55"
        stroke="none"
      />
      <circle cx="62" cy="74" r="8" />
      <path
        d="M66 74 C70 66 68 58 64 62 C66 56 60 52 60 62 C58 54 54 56 56 64 Z"
        fill="currentColor"
        fillOpacity="0.55"
        stroke="none"
      />
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
      <path
        d="M22 44 L22 66 M32 40 L32 64 M42 44 L42 66"
        strokeWidth="1.5"
        strokeOpacity="0.35"
      />
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
      <path
        d="M60 4 L68 8 L62 12 L70 16"
        fill="none"
        strokeWidth="2.5"
        stroke="#ffff88"
        strokeOpacity="0.9"
      />
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
      <line
        x1="32"
        y1="44"
        x2="32"
        y2="74"
        strokeWidth="2"
        strokeOpacity="0.3"
      />
      <line
        x1="14"
        y1="56"
        x2="50"
        y2="56"
        strokeWidth="2"
        strokeOpacity="0.3"
      />
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
      <line
        x1="62"
        y1="72"
        x2="52"
        y2="16"
        strokeWidth="2"
        stroke="currentColor"
        strokeOpacity="0.5"
      />
    </>
  ),

  boss_tree: (
    <>
      {/* Branch crown */}
      <path
        d="M20 8 L14 -2 L22 6 M32 4 L28 -6 L34 4 M44 8 L50 -2 L42 6"
        fill="none"
        strokeWidth="3"
      />
      <path
        d="M14 -2 L10 -8 M14 -2 L18 -8 M28 -6 L24 -12 M28 -6 L32 -12 M50 -2 L46 -8 M50 -2 L54 -8"
        fill="none"
        strokeWidth="2"
      />
      {/* Gnarled head */}
      <ellipse cx="32" cy="18" rx="16" ry="17" />
      {/* Knot eyes */}
      <ellipse cx="23" cy="16" rx="5.5" ry="6" fill="#000" stroke="none" />
      <ellipse cx="41" cy="16" rx="5.5" ry="6" fill="#000" stroke="none" />
      <ellipse cx="23" cy="16" rx="3" ry="3.5" fill="#88aa22" stroke="none" />
      <ellipse cx="41" cy="16" rx="3" ry="3.5" fill="#88aa22" stroke="none" />
      {/* Bark-textured trunk */}
      <path d="M8 36 L56 36 L58 78 L6 78 Z" />
      <path
        d="M16 40 C18 50 14 62 16 72 M32 38 C30 50 32 62 30 74 M48 40 C46 50 50 62 48 72"
        fill="none"
        strokeWidth="1.5"
        strokeOpacity="0.3"
      />
      {/* Root legs */}
      <path
        d="M14 78 C10 86 6 94 12 96 M26 80 C24 90 22 96 28 96 M38 80 C40 90 42 96 36 96 M50 78 C54 86 58 94 52 96"
        strokeWidth="5"
      />
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
      <path
        d="M20 36 L44 36 M18 44 L46 44 M18 52 L46 52 M20 60 L44 60"
        fill="none"
        strokeWidth="1"
        strokeOpacity="0.3"
      />
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
      <path
        d="M24 10 C18 4 14 -2 20 -4 C18 2 22 6 26 10"
        fill="none"
        strokeWidth="2.5"
      />
      <path
        d="M40 10 C46 4 50 -2 44 -4 C46 2 42 6 38 10"
        fill="none"
        strokeWidth="2.5"
      />
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
      <path
        d="M32 62 C28 72 22 78 26 86 C30 80 34 74 32 62"
        fill="none"
        strokeWidth="2.5"
      />
      <polygon points="24,84 22,92 30,88" />
    </>
  ),

  imp: (
    <>
      {/* Small curved horns */}
      <path
        d="M24,12 C20,4 16,0 20,-2 C22,4 24,8 26,12"
        fill="none"
        strokeWidth="2.5"
      />
      <path
        d="M40,12 C44,4 48,0 44,-2 C42,4 40,8 38,12"
        fill="none"
        strokeWidth="2.5"
      />
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
      <path
        d="M22,14 C14,4 10,-2 16,-6 C18,4 20,10 24,14"
        fill="none"
        strokeWidth="3.5"
      />
      <path
        d="M42,14 C50,4 54,-2 48,-6 C46,4 44,10 40,14"
        fill="none"
        strokeWidth="3.5"
      />
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
      <path
        d="M26,28 L25,34 M30,30 L29,36 M34,30 L35,36 M38,28 L39,34"
        strokeWidth="2"
      />
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
      <path
        d="M32,20 C44,16 54,22 54,32 C54,44 44,52 32,52 C20,52 12,44 12,32 C12,22 20,16 32,20 Z"
        fill="none"
        strokeWidth="2"
      />
      <path
        d="M32,24 C42,22 48,28 48,36 C48,44 42,48 32,48"
        fill="none"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      {/* Shell fill */}
      <ellipse cx="32" cy="36" rx="18" ry="18" />
      {/* Lava cracks on shell */}
      <path
        d="M24,26 L28,34 L22,38"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeOpacity="0.6"
      />
      <path
        d="M38,24 L36,32 L42,36"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeOpacity="0.6"
      />
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
      <path
        d="M20,50 L18,58 L22,56"
        fill="none"
        strokeWidth="1.5"
        strokeOpacity="0.7"
      />
      <path
        d="M36,54 L34,62 L38,60"
        fill="none"
        strokeWidth="1.5"
        strokeOpacity="0.7"
      />
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
      <path
        d="M10,42 L20,38 L16,48 M40,36 L52,40 L46,50 M12,60 L24,56 L20,66 M44,54 L56,58 L50,68"
        fill="none"
        strokeWidth="1.5"
        strokeOpacity="0.35"
      />
      {/* Lava veins */}
      <path
        d="M20,38 C22,50 18,62 22,72"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <path
        d="M44,40 C42,52 46,64 42,74"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
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
      <ellipse
        cx="32"
        cy="48"
        rx="10"
        ry="14"
        fill="currentColor"
        fillOpacity="0.5"
        stroke="none"
      />
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
      <path
        d="M16,50 L22,46 L20,54"
        fill="none"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <path
        d="M40,48 L48,52 L44,58"
        fill="none"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      {/* Legs — thick */}
      <rect x="8" y="74" width="16" height="18" rx="3" />
      <rect x="26" y="74" width="14" height="18" rx="3" />
      <rect x="42" y="74" width="14" height="18" rx="3" />
      {/* Spiny ridge */}
      <path
        d="M14,42 L12,30 M22,40 L20,26 M32,38 L32,24 M42,40 L44,26 M50,42 L52,30"
        strokeWidth="2.5"
      />
    </>
  ),

  boss_emberfire: (
    <>
      {/* Giant flame crown */}
      <path
        d="M20,16 C16,6 18,-4 22,0 C20,-6 26,-10 28,0 C28,-8 34,-10 34,0 C36,-8 42,-4 40,4 C44,-2 48,6 44,14"
        fill="none"
        strokeWidth="3"
        strokeOpacity="0.8"
      />
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
      <path
        d="M14,50 C16,62 12,74 14,82"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.7"
      />
      <path
        d="M32,44 C30,58 32,70 30,82"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.7"
      />
      <path
        d="M50,50 C48,62 52,74 50,82"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.7"
      />
      {/* Legs */}
      <rect x="4" y="84" width="24" height="10" rx="3" />
      <rect x="36" y="84" width="24" height="10" rx="3" />
      {/* Flame arms */}
      <path d="M6,46 C-6,34 -8,18 0,14 C-4,24 2,34 6,46 Z" />
      <path d="M58,46 C70,34 72,18 64,14 C68,24 62,34 58,46 Z" />
      {/* Flaming fists */}
      <circle cx="-2" cy="40" r="10" />
      <path
        d="M-8,34 C-12,24 -8,16 -4,20 C-6,12 0,8 2,18 C4,10 10,12 6,22 Z"
        fill="currentColor"
        fillOpacity="0.6"
        stroke="none"
      />
      <circle cx="66" cy="40" r="10" />
      <path
        d="M72,34 C76,24 72,16 68,20 C70,12 64,8 62,18 C60,10 54,12 58,22 Z"
        fill="currentColor"
        fillOpacity="0.6"
        stroke="none"
      />
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

  rock_hound: (
    <>
      {/* Pointed ears */}
      <polygon points="20,14 14,0 26,12" />
      <polygon points="44,14 50,0 38,12" />
      {/* Rocky head */}
      <ellipse cx="32" cy="22" rx="15" ry="14" />
      {/* Stone-crack texture on head */}
      <path
        d="M22,16 L26,22 L20,26"
        fill="none"
        strokeWidth="1.2"
        strokeOpacity="0.4"
      />
      <path
        d="M40,18 L38,24 L44,26"
        fill="none"
        strokeWidth="1.2"
        strokeOpacity="0.4"
      />
      {/* Snout */}
      <path d="M40,26 L56,22 L40,32 Z" />
      {/* Glowing eyes */}
      <ellipse cx="24" cy="20" rx="3.5" ry="3.5" fill="#aacc44" stroke="none" />
      <ellipse cx="38" cy="20" rx="3.5" ry="3.5" fill="#aacc44" stroke="none" />
      {/* Rocky body — low and wide */}
      <path d="M8,36 L56,36 L54,70 L10,70 Z" />
      {/* Rock texture */}
      <path
        d="M14,44 L20,40 L18,50 M36,38 L44,42 L40,52 M12,60 L20,56 L18,66"
        fill="none"
        strokeWidth="1.2"
        strokeOpacity="0.35"
      />
      {/* 4 legs — heavy and short */}
      <rect x="8" y="70" width="16" height="18" rx="3" />
      <rect x="26" y="70" width="14" height="18" rx="3" />
      <rect x="42" y="70" width="14" height="18" rx="3" />
      {/* Back spike ridge */}
      <path
        d="M16,36 L14,24 M24,34 L22,20 M32,34 L32,18 M40,34 L42,20 M48,36 L50,24"
        strokeWidth="2.5"
      />
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
      <path
        d="M22,52 L20,58 M28,56 L26,62 M36,56 L37,62 M42,52 L43,58"
        strokeWidth="2.5"
      />
      {/* Writhing tentacle arms */}
      <path d="M10,46 C2,34 -4,22 2,14 C0,24 6,30 10,46 Z" />
      <path d="M54,46 C62,34 68,22 62,14 C64,24 58,30 54,46 Z" />
      <path
        d="M6,64 C-4,60 -8,70 -4,76"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M58,64 C68,60 72,70 68,76"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </>
  ),

  lesser_devil: (
    <>
      {/* Curved horns */}
      <path
        d="M22,12 C16,2 12,-4 18,-6 C18,4 20,8 24,12"
        fill="none"
        strokeWidth="3"
      />
      <path
        d="M42,12 C48,2 52,-4 46,-6 C46,4 44,8 40,12"
        fill="none"
        strokeWidth="3"
      />
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
      <path
        d="M18,10 L20,2 L24,8 L28,0 L32,8 L36,0 L40,8 L44,2 L46,10"
        fill="none"
        strokeWidth="2"
      />
      {/* Skull */}
      <ellipse cx="32" cy="18" rx="13" ry="13" />
      {/* Deep socket eyes */}
      <ellipse cx="25" cy="16" rx="4.5" ry="5" fill="#000" stroke="none" />
      <ellipse cx="39" cy="16" rx="4.5" ry="5" fill="#000" stroke="none" />
      <ellipse cx="25" cy="16" rx="2.5" ry="3" fill="#8899bb" stroke="none" />
      <ellipse cx="39" cy="16" rx="2.5" ry="3" fill="#8899bb" stroke="none" />
      {/* Cracked jaw */}
      <path
        d="M26,28 L24,34 M30,28 L30,34 M34,28 L34,34 M38,28 L40,34"
        strokeWidth="2"
      />
      {/* Obsidian spine/torso */}
      <rect x="26" y="30" width="12" height="34" rx="2" />
      <path
        d="M22,36 L42,36 M20,44 L44,44 M20,52 L44,52 M22,60 L42,60"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
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
      <path
        d="M32,88 C28,78 20,68 18,56 C16,44 22,36 28,28"
        fill="none"
        strokeWidth="14"
        strokeLinecap="round"
      />
      {/* Body scales hint */}
      <path
        d="M32,88 C28,78 20,68 18,56 C16,44 22,36 28,28"
        fill="none"
        strokeWidth="10"
        strokeOpacity="0.3"
        stroke="currentColor"
      />
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
      <path
        d="M26,28 L24,36 M30,30 L28,38 M34,30 L36,38 M38,28 L40,36"
        strokeWidth="2.5"
      />
      {/* Small wings */}
      <path d="M18,40 C8,32 4,18 10,12 C8,24 14,32 18,44 Z" />
      <path d="M46,40 C56,32 60,18 54,12 C56,24 50,32 46,44 Z" />
    </>
  ),

  chaos_warlock: (
    <>
      {/* Chaotic energy crown */}
      <path
        d="M20,10 C16,0 20,-8 24,-4 C22,-10 30,-14 30,-4 C32,-12 38,-10 36,-2 C40,-8 44,0 40,8"
        fill="none"
        strokeWidth="2.5"
        strokeOpacity="0.7"
      />
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
      <path
        d="M22,46 L28,42 L26,50 L32,46 L30,54 L36,50 L34,58 L40,54"
        fill="none"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
      {/* Arms */}
      <path d="M14,42 L0,58 L8,64 L20,50 Z" />
      <path d="M50,40 L64,54 L58,62 L44,48 Z" />
      {/* Chaos orbs in hands */}
      <circle cx="2" cy="60" r="8" />
      <path
        d="M-2,56 L2,52 L6,56 L2,60 Z"
        fill="currentColor"
        fillOpacity="0.5"
        stroke="none"
      />
      <circle cx="62" cy="56" r="8" />
      <path
        d="M58,52 L62,48 L66,52 L62,56 Z"
        fill="currentColor"
        fillOpacity="0.5"
        stroke="none"
      />
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
      <path
        d="M22,32 L20,40 M28,36 L26,44 M36,36 L37,44 M42,32 L44,40"
        strokeWidth="2.5"
      />
      {/* Armored torso with hell plates */}
      <path d="M4,42 L60,42 L62,84 L2,84 Z" />
      {/* Armour plates */}
      <path
        d="M4,52 L60,52 M4,62 L60,62 M4,72 L60,72"
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />
      <line
        x1="32"
        y1="44"
        x2="32"
        y2="82"
        strokeWidth="2"
        strokeOpacity="0.25"
      />
      {/* Legs */}
      <rect x="4" y="84" width="26" height="12" rx="3" />
      <rect x="34" y="84" width="26" height="12" rx="3" />
      {/* Giant arms */}
      <path d="M4,46 L-10,76 L4,82 L16,56 Z" />
      <path d="M60,46 L74,76 L60,82 L48,56 Z" />
      {/* Hellfire greatsword */}
      <rect x="68" y="10" width="6" height="72" rx="2" />
      <rect x="58" y="36" width="26" height="6" rx="2" />
      <path
        d="M68,10 L72,10 L74,82 L66,82 Z"
        fill="currentColor"
        fillOpacity="0.4"
        stroke="none"
      />
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
      <path
        d="M24,40 L28,44 M36,38 L40,42 M26,54 L24,60 M36,52 L40,58"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
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

  lunar_ghost: (
    <>
      {/* Ethereal dome head */}
      <path d="M10,24 C10,4 54,4 54,24 L56,40 C48,30 16,30 8,40 Z" />
      {/* Semi-transparent body */}
      <ellipse cx="32" cy="44" rx="20" ry="18" />
      {/* Hollow haunted eyes */}
      <ellipse cx="22" cy="36" rx="6" ry="7" fill="#000" stroke="none" />
      <ellipse cx="42" cy="36" rx="6" ry="7" fill="#000" stroke="none" />
      <ellipse cx="22" cy="36" rx="3.5" ry="4" fill="#b0c4e8" stroke="none" />
      <ellipse cx="42" cy="36" rx="3.5" ry="4" fill="#b0c4e8" stroke="none" />
      {/* Wailing mouth */}
      <ellipse cx="32" cy="50" rx="7" ry="9" fill="#000" stroke="none" />
      {/* Wispy trailing form */}
      <path
        d="M12,56 C8,68 12,82 10,90 M22,60 C20,74 22,86 18,94 M32,62 C30,76 32,88 30,96 M42,60 C44,74 42,86 46,94 M52,56 C56,68 52,82 54,90"
        fill="none"
        strokeWidth="3.5"
        strokeOpacity="0.65"
      />
      {/* Reaching arms */}
      <path
        d="M12,44 C2,38 -2,26 4,22 C2,32 8,38 12,44"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M52,44 C62,38 66,26 60,22 C62,32 56,38 52,44"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </>
  ),

  demon: (
    <>
      {/* Large swept-back horns */}
      <path
        d="M20,16 C12,6 8,-4 16,-6 C14,6 18,12 22,16"
        strokeWidth="4"
        fill="none"
      />
      <path
        d="M44,16 C52,6 56,-4 48,-6 C50,6 46,12 42,16"
        strokeWidth="4"
        fill="none"
      />
      {/* Broad demonic head */}
      <ellipse cx="32" cy="22" rx="15" ry="15" />
      {/* Infernal eyes */}
      <ellipse cx="22" cy="20" rx="5" ry="5" fill="#ff2200" stroke="none" />
      <ellipse cx="42" cy="20" rx="5" ry="5" fill="#ff2200" stroke="none" />
      {/* Snarling jaw */}
      <path d="M18,30 Q32,40 46,30" fill="none" strokeWidth="2.5" />
      <path
        d="M22,30 L20,36 M28,32 L26,38 M36,32 L37,38 M42,30 L44,36"
        strokeWidth="2"
      />
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
      <path
        d="M24,32 L24,38 M28,32 L28,38 M32,32 L32,38 M36,32 L36,38 M40,32 L40,38"
        strokeWidth="2"
      />
      {/* Long flowing dark robes */}
      <path d="M14,40 L50,40 C54,60 56,80 52,96 L12,96 C8,80 10,60 14,40 Z" />
      {/* Robe tears */}
      <path
        d="M16,80 L10,96 M28,86 L24,96 M40,86 L44,96 M50,80 L56,96"
        fill="none"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
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
      <path
        d="M60,6 C80,12 88,30 76,42"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
    </>
  ),

  prophet: (
    <>
      {/* Ornate headpiece */}
      <path d="M22,8 L22,0 L26,6 L32,0 L38,6 L42,0 L42,8 Z" />
      {/* Glowing gem at crown center */}
      <circle
        cx="32"
        cy="2"
        r="4"
        fill="#cc88ff"
        stroke="none"
        fillOpacity="0.9"
      />
      {/* Head */}
      <ellipse cx="32" cy="18" rx="11" ry="12" />
      {/* Ancient glowing eyes */}
      <ellipse cx="26" cy="16" rx="3.5" ry="3.5" fill="#cc88ff" stroke="none" />
      <ellipse cx="38" cy="16" rx="3.5" ry="3.5" fill="#cc88ff" stroke="none" />
      {/* Long beard */}
      <path d="M22,28 C18,40 18,56 22,68 L42,68 C46,56 46,40 42,28 Z" />
      <path
        d="M24,68 C22,76 24,84 28,90 M32,68 L32,92 M40,68 C42,76 40,84 36,90"
        fill="none"
        strokeWidth="2.5"
        strokeOpacity="0.5"
      />
      {/* Robes under beard */}
      <path d="M14,30 L50,30 L52,68 L12,68 Z" />
      {/* Arcane runes on robe */}
      <path
        d="M18,40 L22,36 L20,44 L24,40 M38,38 L42,34 L40,42 L44,38"
        fill="none"
        strokeWidth="1.2"
        strokeOpacity="0.4"
      />
      {/* Arms raised in power */}
      <path d="M14,34 L-2,20 L4,28 L16,40 Z" />
      <path d="M50,34 L66,20 L60,28 L48,40 Z" />
      {/* Power orbs in hands */}
      <circle cx="-2" cy="20" r="8" />
      <circle
        cx="-2"
        cy="20"
        r="5"
        fill="currentColor"
        fillOpacity="0.5"
        stroke="none"
      />
      <circle cx="66" cy="20" r="8" />
      <circle
        cx="66"
        cy="20"
        r="5"
        fill="currentColor"
        fillOpacity="0.5"
        stroke="none"
      />
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
      <circle
        cx="32"
        cy="44"
        r="28"
        fill="none"
        strokeWidth="2.5"
        strokeOpacity="0.5"
      />
      {/* Mid shell — jagged */}
      <path d="M32,18 L44,22 L54,32 L56,44 L52,56 L44,64 L32,68 L20,64 L12,56 L8,44 L12,32 L20,22 Z" />
      {/* Inner core — bright and burning */}
      <circle cx="32" cy="44" r="16" />
      <circle
        cx="32"
        cy="44"
        r="12"
        fill="currentColor"
        fillOpacity="0.6"
        stroke="none"
      />
      {/* Hellstorm eye at center */}
      <circle cx="32" cy="44" r="7" fill="#000" stroke="none" />
      <circle cx="32" cy="44" r="4" fill="currentColor" stroke="none" />
      {/* Radiating energy lines */}
      <line
        x1="32"
        y1="22"
        x2="32"
        y2="14"
        strokeWidth="2"
        strokeOpacity="0.7"
      />
      <line
        x1="48"
        y1="28"
        x2="54"
        y2="22"
        strokeWidth="2"
        strokeOpacity="0.7"
      />
      <line
        x1="54"
        y1="44"
        x2="62"
        y2="44"
        strokeWidth="2"
        strokeOpacity="0.7"
      />
      <line
        x1="48"
        y1="60"
        x2="54"
        y2="66"
        strokeWidth="2"
        strokeOpacity="0.7"
      />
      <line
        x1="32"
        y1="66"
        x2="32"
        y2="74"
        strokeWidth="2"
        strokeOpacity="0.7"
      />
      <line
        x1="16"
        y1="60"
        x2="10"
        y2="66"
        strokeWidth="2"
        strokeOpacity="0.7"
      />
      <line
        x1="10"
        y1="44"
        x2="2"
        y2="44"
        strokeWidth="2"
        strokeOpacity="0.7"
      />
      <line
        x1="16"
        y1="28"
        x2="10"
        y2="22"
        strokeWidth="2"
        strokeOpacity="0.7"
      />
      {/* Chains of corruption */}
      <path
        d="M4,20 C-2,28 -4,38 4,46"
        fill="none"
        strokeWidth="2.5"
        strokeDasharray="3,2"
        strokeOpacity="0.6"
      />
      <path
        d="M60,20 C66,28 68,38 60,46"
        fill="none"
        strokeWidth="2.5"
        strokeDasharray="3,2"
        strokeOpacity="0.6"
      />
    </>
  ),

  boss_andariel: (
    <>
      {/* Red hair spikes bursting upward */}
      <path
        d="M24 10 L20 -2 L26 8"
        fill="none"
        strokeWidth="3"
        stroke="#cc2200"
        strokeOpacity="0.9"
      />
      <path
        d="M30 7 L26 -6 L32 5"
        fill="none"
        strokeWidth="3"
        stroke="#cc2200"
        strokeOpacity="0.9"
      />
      <path
        d="M38 7 L42 -6 L36 5"
        fill="none"
        strokeWidth="3"
        stroke="#cc2200"
        strokeOpacity="0.9"
      />
      <path
        d="M44 10 L48 -2 L42 8"
        fill="none"
        strokeWidth="3"
        stroke="#cc2200"
        strokeOpacity="0.9"
      />
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
      <path
        d="M18 76 Q32 70 46 76"
        fill="none"
        strokeWidth="1.2"
        strokeOpacity="0.35"
      />
      <path
        d="M18 80 Q32 86 46 80"
        fill="none"
        strokeWidth="1.2"
        strokeOpacity="0.35"
      />
      {/* Spider legs — 3 per side from abdomen */}
      <path d="M17 68 L2 54" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M16 76 L-2 72" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M18 84 L4 94" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M47 68 L62 54" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M48 76 L66 72" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M46 84 L60 94" strokeWidth="3.5" strokeLinecap="round" />
      {/* Waist connector */}
      <path
        d="M22 60 C20 66 20 70 18 72 M42 60 C44 66 44 70 46 72"
        fill="none"
        strokeWidth="3"
      />
    </>
  ),
};

export function MonsterSprite({
  name,
  size = 64,
  state = "idle",
  statusEffects = [],
}: Props) {
  // Replay the pose on state change without remounting the filtered <g> (which
  // repainted the glow filter on every hit/attack — costly on phones).
  const controls = useAnimationControls();

  const type = MONSTER_TYPES[name] ?? "fallen";
  const color = MONSTER_COLORS[type] ?? "#888888";
  const height = Math.round(size * 1.5);
  // Silhouette file if one exists for this type, otherwise the inline paths.
  const assetUrl = MONSTER_ASSETS[type];
  const uid = useId();
  const glowId = `${uid}-mglow`;

  useEffect(() => {
    controls.start(getAnimate(state, type), getTransition(state, type));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, type]);

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 64 96"
      overflow="visible"
      style={{ display: "block", transform: "scaleX(-1)" }}
    >
      {/* SVG filter, not CSS filter: drop-shadow — iOS Safari renders the CSS
          form unreliably on a <g> wrapping an <image>. Built explicitly so the
          crisp original (SourceGraphic) is always the top layer: chaining
          feDropShadow instead fed each pass the previous *blurred* result, so
          thin parts (legs, tail) blurred away into gaps. Here the glow is only
          ever behind the untouched source. */}
      <defs>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="b1" />
          <feFlood floodColor={color} floodOpacity="1" result="c1" />
          <feComposite in="c1" in2="b1" operator="in" result="g1" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b2" />
          <feFlood floodColor={color} floodOpacity="1" result="c2" />
          <feComposite in="c2" in2="b2" operator="in" result="g2" />
          <feMerge>
            <feMergeNode in="g1" />
            <feMergeNode in="g2" />
            <feMergeNode in="g2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <motion.g
        animate={controls}
        fill="#120e0a"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
        filter={`url(#${glowId})`}
      >
        {assetUrl ? (
          <image href={assetUrl} {...MONSTER_IMG} />
        ) : (
          (SPRITES[type] ?? SPRITES["fallen"])
        )}
      </motion.g>
      {statusEffects.includes("burn") && (
        <ellipse
          cx="32"
          cy="50"
          rx="28"
          ry="48"
          fill="none"
          stroke="#ff6600"
          strokeWidth="2.5"
          className="status-aura-burn"
          strokeOpacity="0.7"
        />
      )}
      {statusEffects.includes("poison") && (
        <>
          <circle cx="20" cy="55" r="2.5" className="poisoned" />
          <circle cx="34" cy="48" r="2" className="poisoned delay1" />
          <circle cx="44" cy="58" r="3" className="poisoned delay2" />
        </>
      )}
      {statusEffects.includes("bleed") && (
        <g className="bleed bleeding">
          <ellipse
            className="blood-drop drop-1"
            cx="30"
            cy="60"
            rx="1.5"
            ry="2"
          />
          <ellipse
            className="blood-drop drop-2"
            cx="34"
            cy="62"
            rx="1.4"
            ry="1.8"
          />
          <ellipse
            className="blood-drop drop-3"
            cx="28"
            cy="64"
            rx="1.2"
            ry="1.6"
          />
        </g>
      )}
    </svg>
  );
}

// Silhouette asset URL for a monster name, or undefined if it uses inline paths.
export function getMonsterAssetUrl(name: string): string | undefined {
  const type = MONSTER_TYPES[name];
  return type ? MONSTER_ASSETS[type] : undefined;
}

// Warm the browser cache for a set of monster silhouettes so the first render in
// combat doesn't flash. De-duped by URL (many names share one type/file).
export function preloadMonsterAssets(names: string[]): void {
  if (typeof Image === "undefined") return;
  const seen = new Set<string>();
  for (const name of names) {
    const url = getMonsterAssetUrl(name);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    new Image().src = url;
  }
}

// Warm the cache for every monster silhouette (~1.7 MB across ~23 files). Meant
// to run during idle time on an early screen (character select/creation) so the
// whole bestiary is cached before the first fight. Non-blocking.
export function preloadAllMonsterAssets(): void {
  if (typeof Image === "undefined") return;
  for (const url of new Set(Object.values(MONSTER_ASSETS))) {
    new Image().src = url;
  }
}
