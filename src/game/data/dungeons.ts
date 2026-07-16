import type { DungeonDefinition, MonsterDefinition, MonsterSpell } from "../types";

function monster(
  name: string,
  level: number,
  life: number,
  damage: [number, number],
  defense: number,
  attackRating: number,
  xpReward: number,
  goldReward: [number, number],
  spell?: MonsterSpell
): MonsterDefinition {
  return { name, level, life: Math.round(life * 1.25), damage, defense, attackRating: Math.round(attackRating * 1.25), xpReward, goldReward, spell };
}

export const REGULAR_DUNGEON_COUNT_ACT1 = 8;
export const REGULAR_DUNGEON_COUNT_ACT2 = 8;
export const REGULAR_DUNGEON_COUNT_ACT3 = 8;
/** @deprecated use REGULAR_DUNGEON_COUNT_ACT1 */
export const REGULAR_DUNGEON_COUNT = REGULAR_DUNGEON_COUNT_ACT1;

export function getXpCapLevel(clearedDungeons: string[], currentDungeonId?: string): number {
  if (currentDungeonId) {
    const dungeon = DUNGEONS.find((d) => d.id === currentDungeonId);
    if (dungeon) return dungeon.boss.level + 5;
  }
  const maxBossLevel = DUNGEONS
    .filter((d) => clearedDungeons.includes(d.id))
    .reduce((max, d) => Math.max(max, d.boss.level), 0);
  const baseLevel = maxBossLevel === 0 ? DUNGEONS[0].boss.level : maxBossLevel;
  return baseLevel + 5;
}

export const DUNGEONS: DungeonDefinition[] = [
  // ── ACT 1 ──────────────────────────────────────────────────────────────────
  {
    id: "sewers",
    name: "Sewers",
    act: 1,
    description: "The stinking underbelly of the royal city. You have nothing but your fists and a will to survive.",
    waves: [
      monster("Hungry Rat",    1, 12,  [2, 3],  2, 10, 10, [1, 3]),
      monster("Giant Leech",   2, 15,  [2, 4],  3, 13, 13, [1, 4]),
      monster("Drowned Corpse",3, 20,  [3, 5],  4, 15, 17, [2, 5]),
    ],
    boss: monster("The Rat King", 4, 47, [4, 8], 6, 19, 50, [8, 18],
      { name: "Rat Swarm", kind: "burst", power: 1.5, chance: 0.30, cooldown: 3 }),
  },
  {
    id: "dark-forest",
    name: "Dark Forest",
    act: 1,
    description: "A gloomy wood where wounded beasts roam and something older lurks in the shadows.",
    waves: [
      monster("Wounded Elk",   2, 17,  [3, 5],  3, 14, 14, [2, 5]),
      monster("Wild Boar",     3, 26,  [3, 7],  5, 17, 20, [3, 7]),
      monster("Bear",          4, 36,  [4, 9],  7, 20, 27, [4, 9]),
    ],
    boss: monster("Forest Hag", 5, 75, [6, 11], 10, 26, 90, [15, 30],
      { name: "Wither Curse", kind: "dot", power: 1.4, chance: 0.30, cooldown: 3 }),
  },
  {
    id: "cave",
    name: "Cave",
    act: 1,
    description: "A deep cave network ruled by a massive albino wolf and his pack.",
    waves: [
      monster("Bat",       4, 24,  [3, 6],  4, 19, 22, [3, 7]),
      monster("Wolf",      5, 32,  [4, 9],  6, 22, 28, [4, 9]),
      monster("Dire Wolf", 6, 44,  [6, 10], 9, 26, 36, [5, 11]),
    ],
    boss: monster("Alpha Wolf", 7, 123, [8, 14], 12, 31, 145, [25, 50],
      { name: "Pack Howl", kind: "burst", power: 1.6, chance: 0.30, cooldown: 3 }),
  },
  {
    id: "foggy-fields",
    name: "Foggy Fields",
    act: 1,
    description: "Endless mist-covered fields where even the shadows have learned to hate.",
    waves: [
      monster("Flock of Ravens", 7, 51,  [7, 11],  9, 28, 42, [6, 13]),
      monster("Scarecrow",       8, 66,  [8, 13], 11, 31, 50, [8, 16]),
      monster("Dense Fog",       9, 58,  [9, 14],  8, 34, 54, [9, 17],
        { name: "Blind", kind: "drain", power: 1.3, chance: 0.30, cooldown: 3 }),
    ],
    boss: monster("Living Shadow", 10, 191, [12, 19], 15, 39, 235, [45, 85],
      { name: "Shadow Grasp", kind: "drain", power: 1.6, chance: 0.35, cooldown: 3 }),
  },
  {
    id: "graveyard",
    name: "Graveyard",
    act: 1,
    description: "An old graveyard where the restless dead crawl from their graves each night.",
    waves: [
      monster("Animated Corpse", 9,  75,  [9, 14], 11, 34, 58, [10, 18]),
      monster("Skeleton",        10, 83,  [10, 16], 13, 37, 65, [11, 20]),
      monster("Undead Hound",    11, 95,  [11, 18], 14, 39, 73, [13, 22]),
    ],
    boss: monster("Mass of Bones", 12, 276, [15, 24], 19, 46, 350, [75, 135],
      { name: "Bone Spike", kind: "burst", power: 1.9, chance: 0.35, cooldown: 3 }),
  },
  {
    id: "crypt",
    name: "Crypt",
    act: 1,
    description: "Ancient burial halls sealed for centuries, now torn open by a mad necromancer.",
    waves: [
      monster("Ghost",        11, 92,  [11, 18], 11, 41, 74, [13, 23],
        { name: "Soul Drain", kind: "drain", power: 1.4, chance: 0.30, cooldown: 3 }),
      monster("Crypt Lurker", 12, 109, [13, 20], 15, 44, 84, [15, 25]),
      monster("Bone Golem",   13, 136, [14, 22], 19, 46, 96, [17, 27]),
    ],
    boss: monster("Niktag", 14, 370, [19, 29], 24, 54, 490, [115, 195],
      { name: "Death Coil", kind: "dot", power: 1.7, chance: 0.35, cooldown: 3 }),
  },
  {
    id: "goblins-path",
    name: "Goblins' Path",
    act: 1,
    description: "A mountain pass overrun by a goblin clan led by their grotesque, gold-hoarding king.",
    waves: [
      monster("Goblin Worker", 13, 126, [14, 20], 17, 45, 96,  [15, 26]),
      monster("Goblin Fighter",14, 149, [15, 24], 20, 48, 110, [18, 29]),
      monster("Goblin Priest", 15, 143, [16, 26], 18, 52, 120, [19, 32],
        { name: "Goblin Curse", kind: "burst", power: 1.7, chance: 0.30, cooldown: 3 }),
    ],
    boss: monster("Goblin King", 16, 472, [22, 34], 29, 61, 650, [155, 265],
      { name: "Crown Smash", kind: "burst", power: 2.0, chance: 0.35, cooldown: 3 }),
  },
  {
    id: "bandit-town",
    name: "Bandit Town",
    act: 1,
    description: "A lawless settlement ruled by cutthroats. Their leader is a disgraced soldier with nothing left to lose.",
    waves: [
      monster("Scoundrel",       15, 166, [17, 26], 22, 54, 126, [21, 35]),
      monster("Bandit",          16, 191, [19, 28], 24, 57, 140, [23, 39]),
      monster("Contract Killer", 17, 217, [20, 31], 26, 61, 156, [25, 43]),
    ],
    boss: monster("Exiled City Guard", 20, 625, [27, 41], 36, 75, 880, [215, 355],
      { name: "Shield Bash", kind: "burst", power: 1.8, chance: 0.35, cooldown: 3 }),
  },

  // ── ACT 1 ENDGAME ──────────────────────────────────────────────────────────
  {
    id: "bandits-town-hall",
    name: "Bandit's Town Hall",
    act: 1,
    endgame: true,
    description: "The heart of the bandit stronghold. The Chieftain and his most loyal men await your arrival.",
    waves: [
      monster("Veteran Bandit",        20, 281, [24, 36], 29, 68, 80, [48, 82]),
      monster("Chieftain's Right Hand", 22, 366, [27, 41], 34, 75, 104, [62, 102]),
    ],
    boss: monster("Bandit Chieftain", 24, 1148, [36, 53], 44, 92, 2340, [480, 880],
      { name: "Axe Slam", kind: "burst", power: 2.3, chance: 0.40, cooldown: 3 }),
  },

  // ── ACT 2 ──────────────────────────────────────────────────────────────────
  {
    id: "frostfang-pass",
    name: "Frostfang Pass",
    act: 2,
    description: "A treacherous mountain pass where blizzards never cease and frost-born predators stalk every shadow.",
    waves: [
      monster("Snow Wolf",    22, 274, [22, 32], 26, 72,  84, [50, 85]),
      monster("Frost Harpy",  23, 303, [24, 36], 27, 77,  93, [55, 92]),
      monster("Glacial Bear", 24, 347, [26, 40], 31, 82,  105, [60, 100]),
    ],
    boss: monster("Ice Golem", 25, 1050, [31, 47], 34, 72, 3600, [350, 550],
      { name: "Glacial Slam", kind: "burst", power: 1.6, chance: 0.35, cooldown: 3 }),
  },
  {
    id: "icy-cave",
    name: "Icy Cave",
    act: 2,
    description: "A frozen cavern network where the dead have been preserved in ice for centuries, now stirring again.",
    waves: [
      monster("Frostbitten Corpse", 24, 318, [25, 37], 27, 77,  96, [56, 94]),
      monster("Icy Bat",            25, 282, [26, 38], 24, 80,  102, [60, 100]),
      monster("Frozen Revenant",    26, 369, [28, 43], 32, 85,  114, [65, 108]),
    ],
    boss: monster("Crystal Colossus", 27, 1312, [36, 53], 40, 79, 4800, [425, 700],
      { name: "Crystal Shatter", kind: "burst", power: 1.68, chance: 0.35, cooldown: 3 }),
  },
  {
    id: "tundra",
    name: "Tundra",
    act: 2,
    description: "A vast frozen plain ruled by ancient beasts and watched over by a ghostly stag of immense power.",
    waves: [
      monster("Icehorn Mammoth", 27, 405, [31, 46], 34, 88, 126, [70, 116]),
      monster("Frost Lynx",      28, 361, [32, 48], 31, 94, 132, [75, 124]),
      monster("Young Ice Troll", 29, 462, [34, 51], 38, 97, 144, [80, 134]),
    ],
    boss: monster("The Pale Stag", 30, 1627, [40, 60], 47, 86, 6300, [525, 850],
      { name: "Antler Gore", kind: "burst", power: 1.76, chance: 0.35, cooldown: 3 }),
  },
  {
    id: "moonglass-lake",
    name: "Moonglass Lake",
    act: 2,
    description: "A perfectly still lake whose surface reflects the moon like a mirror — and something in that reflection watches back.",
    waves: [
      monster("Spirit Owl",        29, 390, [31, 47], 31, 94,  132, [75, 124]),
      monster("Lunar Ghost",       30, 376, [32, 48], 27, 98,  138, [78, 130],
        { name: "Soul Drain", kind: "drain", power: 1.5, chance: 0.30, cooldown: 3 }),
      monster("Crystal Elemental", 31, 462, [35, 53], 37, 102, 150, [84, 140]),
    ],
    boss: monster("Moon Reflection", 33, 1995, [44, 65], 52, 91, 8100, [625, 1000],
      { name: "Shattered Reflection", kind: "drain", power: 1.44, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "whispering-glacier",
    name: "Whispering Glacier",
    act: 2,
    description: "An ancient glacier where the wind carries voices of the dead, and every crack in the ice hides something living.",
    waves: [
      monster("Frost Wraith", 31, 434, [34, 51], 32, 100, 144, [80, 134],
        { name: "Frost Touch", kind: "dot", power: 1.5, chance: 0.30, cooldown: 3 }),
      monster("Ice Wyvern",   32, 491, [37, 55], 38, 105, 156, [87, 144]),
      monster("Ice Troll",    33, 549, [39, 59], 43, 111, 168, [93, 154]),
    ],
    boss: monster("White Chimera", 35, 2415, [51, 75], 60, 101, 10200, [775, 1250],
      { name: "Frost Breath", kind: "dot", power: 1.76, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "crystal-labyrinth",
    name: "The Crystal Labyrinth",
    act: 2,
    description: "A maze of razor-edged crystal walls where a frozen minotaur rules over webs and ice-encrusted traps.",
    waves: [
      monster("Crystal Spider", 33, 513, [37, 56], 39, 109, 159, [88, 146]),
      monster("Frost Ogre",     34, 600, [41, 61], 46, 114, 174, [96, 158]),
      monster("Glacier Worm",   35, 571, [43, 63], 43, 117, 180, [100, 165]),
    ],
    boss: monster("Frozen Taur", 37, 2939, [57, 85], 70, 109, 12600, [950, 1500],
      { name: "Glacial Hammer", kind: "burst", power: 1.92, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "frostforge",
    name: "The Frostforge",
    act: 2,
    description: "A dwarven forge claimed by a frost curse — its fires long extinguished, its workers now undying sentinels of ice.",
    waves: [
      monster("Frost Dwarf",               36, 614, [43, 65], 48, 119, 192, [105, 174]),
      monster("Animated Frost Knight",     37, 687, [47, 70], 53, 124, 207, [113, 188]),
      monster("Frostforge Dwarven Warrior",38, 723, [49, 74], 56, 128, 219, [120, 198]),
    ],
    boss: monster("Core of the Frozen Forge", 40, 3675, [65, 96], 81, 120, 16200, [1200, 1900],
      { name: "Forge Eruption", kind: "burst", power: 2.0, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "summit-peak",
    name: "Summit Peak",
    act: 2,
    description: "The highest reachable summit, where sky predators nest and the ghost of a dwarven king holds court over the clouds.",
    waves: [
      monster("Glacial Eagle",   39, 650, [48, 71], 49, 129, 210, [114, 190]),
      monster("Elder Harpy",     40, 723, [51, 77], 54, 134, 228, [122, 204]),
      monster("Frost Ogre",      41, 817, [54, 82], 60, 139, 246, [130, 218]),
      monster("Ice Shard Golem", 41, 852, [56, 83], 63, 141, 252, [134, 224]),
    ],
    boss: monster("Ghost of the Mountain", 42, 4304, [70, 104], 90, 129, 19800, [1500, 2400],
      { name: "Spectral Chill", kind: "dot", power: 1.84, chance: 0.40, cooldown: 3 }),
  },

  // ── ACT 2 ENDGAME ──────────────────────────────────────────────────────────
  {
    id: "the-white-maw",
    name: "The White Maw",
    act: 2,
    endgame: true,
    description: "The lair of Sikktharkk, the Great Frozen Dragon. Three waves of his most fearsome servants stand between you and the beast.",
    waves: [
      monster("Frozen Bones",        40, 1193, [66, 98],  83, 151, 780, [300, 480]),
      monster("Young Azure Dragon",  42, 1571, [75, 111], 92, 160, 1020, [360, 580],
        { name: "Azure Frost", kind: "dot", power: 2.0, chance: 0.35, cooldown: 3 }),
      monster("Avalanche Elemental", 43, 1734, [79, 117], 96, 165, 1140, [400, 640],
        { name: "Avalanche", kind: "burst", power: 2.0, chance: 0.35, cooldown: 3 }),
    ],
    boss: monster("Sikktharkk", 45, 6056, [88, 130], 109, 146, 42000, [6000, 10000],
      { name: "Frozen Tempest", kind: "dot", power: 2.4, chance: 0.45, cooldown: 3 }),
  },

  // ── ACT 3 ──────────────────────────────────────────────────────────────────
  {
    id: "overgrown-entrance",
    name: "Overgrown Entrance",
    act: 3,
    description: "The jungle's first breath — a wall of vines, heat, and eyes in the dark. Ancient trees blot out the sun as roots crack stone beneath your feet.",
    waves: [
      monster("Jungle Stalker",  43, 504, [55, 84], 58, 156, 1140, [420, 680]),
      monster("Thorn Hunter",    44, 552, [59, 89], 61, 162, 1230, [450, 730]),
      monster("Venom Viper",     45, 480, [56, 86], 56, 166, 1290, [430, 700],
        { name: "Venom Spit", kind: "dot", power: 1.4, chance: 0.35, cooldown: 3 }),
    ],
    boss: monster("Ancient Treant", 46, 3231, [62, 94], 66, 152, 5400, [425, 700],
      { name: "Root Crush", kind: "burst", power: 1.6, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "serpent-marsh",
    name: "Serpent Marsh",
    act: 3,
    description: "A stinking bog where the ground itself is alive. Half-submerged things slither between the reeds, and the water bubbles with poison.",
    waves: [
      monster("Bog Zombie",    45, 528, [58, 88], 60, 160, 1260, [440, 710]),
      monster("Swamp Serpent", 47, 600, [62, 95], 66, 170, 1380, [480, 780],
        { name: "Constrict", kind: "dot", power: 1.4, chance: 0.30, cooldown: 3 }),
      monster("Poison Toad",   49, 672, [67, 102], 70, 179, 1500, [520, 840]),
    ],
    boss: monster("Mother of the Swamp", 50, 4089, [74, 112], 80, 168, 7200, [550, 900],
      { name: "Toxic Spores", kind: "dot", power: 1.7, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "whispering-river",
    name: "Whispering River",
    act: 3,
    description: "A wide green river whose currents whisper names of the dead. Harpies nest in the canopy above while something enormous lurks below the surface.",
    waves: [
      monster("Jungle Harpy",               48, 636, [64, 97], 66, 174, 1440, [500, 810]),
      monster("School of Gigantic Piranhas", 49, 600, [67, 102], 62, 180, 1500, [520, 840]),
      monster("Thorn Dryad",                51, 720, [72, 109], 74, 187, 1620, [560, 910]),
    ],
    boss: monster("The Great Emerald Crocolisk", 52, 4947, [84, 128], 88, 178, 9300, [700, 1100],
      { name: "Death Roll", kind: "burst", power: 1.8, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "village-lost-souls",
    name: "Village of Lost Souls",
    act: 3,
    description: "A forsaken village where every soul was taken. The huts still smoke but no living thing remains — only cursed masks that move on their own, and the Shaman who commands them.",
    waves: [
      monster("Cursed Tribesman", 51, 756, [74, 113], 77, 190, 1650, [570, 920]),
      monster("Haunted Mask",     52, 708, [76, 115], 72, 194, 1710, [590, 950],
        { name: "Soul Drain", kind: "drain", power: 1.5, chance: 0.30, cooldown: 3 }),
      monster("Voodoo Shaman",    54, 816, [79, 120], 82, 202, 1830, [630, 1020],
        { name: "Hex Curse", kind: "dot", power: 1.5, chance: 0.30, cooldown: 3 }),
    ],
    boss: monster("The Soul Collector", 55, 5976, [94, 142], 100, 192, 12000, [900, 1450],
      { name: "Soul Hex", kind: "drain", power: 1.9, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "bloodvine-jungle",
    name: "Bloodvine Jungle",
    act: 3,
    description: "A section of jungle where the plants have developed a taste for blood. Vines snap, flowers snap shut, and spiders the size of horses drop from above.",
    waves: [
      monster("Blood Vine",        54, 852, [82, 124], 84, 204, 1860, [640, 1040]),
      monster("Carnivorous Plant", 56, 912, [86, 131], 89, 214, 2010, [690, 1120]),
      monster("Giant Tarantula",   58, 984, [91, 138], 94, 223, 2160, [740, 1200]),
    ],
    boss: monster("The Devourer Bloom", 59, 7178, [106, 160], 112, 208, 15000, [1100, 1800],
      { name: "Engulf", kind: "burst", power: 2.0, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "temple-forgotten-gods",
    name: "Temple of Forgotten Gods",
    act: 3,
    description: "A crumbling stone temple reclaimed by the jungle. Its god-statues still move. Its priests still preach — and its golden idol still hungers for sacrifice.",
    waves: [
      monster("Stone Jaguar",    54, 876, [84, 127], 86, 206, 1890, [650, 1060]),
      monster("Temple Guardian", 56, 936, [89, 134], 91, 216, 2040, [700, 1140]),
      monster("Venom Priest",    58, 888, [89, 134], 86, 220, 2100, [720, 1170],
        { name: "Poison Ritual", kind: "dot", power: 1.5, chance: 0.30, cooldown: 3 }),
    ],
    boss: monster("Golden Idol", 59, 7178, [108, 162], 115, 210, 15000, [1100, 1800],
      { name: "Idol's Wrath", kind: "burst", power: 2.1, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "heart-of-the-jungle",
    name: "Heart of the Jungle",
    act: 3,
    description: "The jungle's core — a place so old the trees have faces and the stones breathe. The Green Warden has stood here since before men walked the earth, and dark magic has driven it to madness.",
    waves: [
      monster("Ancient Gorilla",  58, 1056, [96, 145], 101, 226, 2280, [780, 1270]),
      monster("Emerald Basilisk", 60, 1128, [102, 154], 106, 235, 2460, [840, 1370],
        { name: "Petrifying Gaze", kind: "drain", power: 1.5, chance: 0.30, cooldown: 3 }),
      monster("Jungle Guardian",  62, 1200, [107, 162], 110, 245, 2640, [900, 1470]),
    ],
    boss: monster("The Green Warden", 63, 8550, [118, 178], 126, 222, 19200, [1450, 2350],
      { name: "Ancient Fury", kind: "burst", power: 2.2, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "black-ziggurat",
    name: "The Black Ziggurat",
    act: 3,
    description: "A towering black pyramid at the jungle's heart, its surface carved with screaming faces. The voodoo spirits within have been building to this ritual for centuries.",
    waves: [
      monster("Elite Voodoo Warrior", 60, 1212, [106, 160], 108, 238, 2550, [870, 1420]),
      monster("Soul Devourer",        62, 1284, [110, 167], 113, 247, 2730, [930, 1520],
        { name: "Soul Rend", kind: "drain", power: 1.6, chance: 0.30, cooldown: 3 }),
      monster("Cursed Colossus",      64, 1416, [118, 178], 122, 257, 2970, [1010, 1650]),
    ],
    boss: monster("Ancient Loa", 65, 10438, [134, 202], 142, 235, 24600, [1900, 3100],
      { name: "Voodoo Curse", kind: "dot", power: 2.2, chance: 0.40, cooldown: 3 }),
  },

  // ── ACT 3 ENDGAME ──────────────────────────────────────────────────────────
  {
    id: "sacrificial-altar",
    name: "Sacrificial Altar",
    act: 3,
    endgame: true,
    description: "The altar beneath the Black Ziggurat pulses with ancient power. The Loa of Endless Night stirs from its prison — and its three spirit guardians stand between you and the reckoning.",
    waves: [
      monster("Spirit of the Crocolisk", 64, 3600, [132, 199], 142, 257, 1560, [660, 1080]),
      monster("Spirit of the Gorilla",   66, 4200, [142, 214], 150, 269, 1740, [740, 1210]),
      monster("Spirit of the Eagle",     66, 3840, [137, 206], 144, 266, 1680, [710, 1160]),
    ],
    boss: monster("Zam'Koro, The Loa of Endless Night", 70, 16302, [148, 222], 165, 258, 60000, [9000, 15000],
      { name: "Endless Night", kind: "dot", power: 2.8, chance: 0.45, cooldown: 3 }),
  },
];
