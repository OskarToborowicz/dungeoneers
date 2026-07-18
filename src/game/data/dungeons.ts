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
  return { name, level, life: Math.round(life * 1.25), damage, defense, attackRating: Math.round(attackRating * 1.25 * 1.2), xpReward, goldReward, spell: spell ? { ...spell, cooldown: spell.cooldown + 1 } : undefined };
}

function waveMonster(
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
  return monster(name, level, Math.round(life * 1.25), damage, defense, attackRating, xpReward, goldReward, spell);
}

export const REGULAR_DUNGEON_COUNT_ACT1 = 8;
export const REGULAR_DUNGEON_COUNT_ACT2 = 8;
export const REGULAR_DUNGEON_COUNT_ACT3 = 8;
export const REGULAR_DUNGEON_COUNT_ACT4 = 8;
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
      waveMonster("Hungry Rat",    1, 12,  [2, 3],  2, 10, 14, [1, 3]),
      waveMonster("Giant Leech",   2, 15,  [2, 4],  3, 13, 18, [1, 4]),
      waveMonster("Drowned Corpse",3, 20,  [3, 5],  4, 15, 24, [2, 5]),
    ],
    boss: monster("The Rat King", 4, 47, [4, 8], 6, 19, 70, [8, 18],
      { name: "Rat Swarm", kind: "burst", power: 1.5, chance: 0.30, cooldown: 3 }),
  },
  {
    id: "dark-forest",
    name: "Dark Forest",
    act: 1,
    description: "A gloomy wood where wounded beasts roam and something older lurks in the shadows.",
    waves: [
      waveMonster("Wounded Elk",   2, 17,  [3, 5],  3, 14, 20, [2, 5]),
      waveMonster("Wild Boar",     3, 26,  [3, 7],  5, 17, 28, [3, 7]),
      waveMonster("Bear",          4, 36,  [4, 9],  7, 20, 38, [4, 9]),
    ],
    boss: monster("Forest Hag", 5, 75, [6, 11], 10, 26, 126, [15, 30],
      { name: "Wither Curse", kind: "dot", power: 1.4, chance: 0.30, cooldown: 3 }),
  },
  {
    id: "cave",
    name: "Cave",
    act: 1,
    description: "A deep cave network ruled by a massive albino wolf and his pack.",
    waves: [
      waveMonster("Bat",       4, 24,  [3, 6],  4, 19, 31, [3, 7]),
      waveMonster("Wolf",      5, 32,  [4, 9],  6, 22, 39, [4, 9]),
      waveMonster("Dire Wolf", 6, 44,  [6, 10], 9, 26, 50, [5, 11]),
    ],
    boss: monster("Alpha Wolf", 7, 123, [8, 14], 12, 31, 203, [25, 50],
      { name: "Pack Howl", kind: "burst", power: 1.6, chance: 0.30, cooldown: 3 }),
  },
  {
    id: "foggy-fields",
    name: "Foggy Fields",
    act: 1,
    description: "Endless mist-covered fields where even the shadows have learned to hate.",
    waves: [
      waveMonster("Flock of Ravens", 7, 51,  [7, 11],  9, 28, 59, [6, 13]),
      waveMonster("Scarecrow",       8, 66,  [8, 13], 11, 31, 70, [8, 16]),
      waveMonster("Dense Fog",       9, 58,  [9, 14],  8, 34, 76, [9, 17],
        { name: "Blind", kind: "drain", power: 1.3, chance: 0.30, cooldown: 3 }),
    ],
    boss: monster("Living Shadow", 10, 191, [12, 19], 15, 39, 329, [45, 85],
      { name: "Shadow Grasp", kind: "drain", power: 1.6, chance: 0.35, cooldown: 3 }),
  },
  {
    id: "graveyard",
    name: "Graveyard",
    act: 1,
    description: "An old graveyard where the restless dead crawl from their graves each night.",
    waves: [
      waveMonster("Animated Corpse", 9,  75,  [9, 14], 11, 34, 81, [10, 18]),
      waveMonster("Skeleton",        10, 83,  [10, 16], 13, 37, 91, [11, 20]),
      waveMonster("Undead Hound",    11, 95,  [11, 18], 14, 39, 102, [13, 22]),
    ],
    boss: monster("Mass of Bones", 12, 276, [15, 24], 19, 46, 490, [75, 135],
      { name: "Bone Spike", kind: "burst", power: 1.9, chance: 0.35, cooldown: 3 }),
  },
  {
    id: "crypt",
    name: "Crypt",
    act: 1,
    description: "Ancient burial halls sealed for centuries, now torn open by a mad necromancer.",
    waves: [
      waveMonster("Ghost",        11, 92,  [11, 18], 11, 41, 104, [13, 23],
        { name: "Soul Drain", kind: "drain", power: 1.4, chance: 0.30, cooldown: 3 }),
      waveMonster("Crypt Lurker", 12, 109, [13, 20], 15, 44, 118, [15, 25]),
      waveMonster("Bone Golem",   13, 136, [14, 22], 19, 46, 134, [17, 27]),
    ],
    boss: monster("Niktag", 14, 370, [19, 29], 24, 54, 686, [115, 195],
      { name: "Death Coil", kind: "dot", power: 1.7, chance: 0.35, cooldown: 3 }),
  },
  {
    id: "goblins-path",
    name: "Goblins' Path",
    act: 1,
    description: "A mountain pass overrun by a goblin clan led by their grotesque, gold-hoarding king.",
    waves: [
      waveMonster("Goblin Worker", 13, 126, [14, 20], 17, 45, 134,  [15, 26]),
      waveMonster("Goblin Fighter",14, 149, [15, 24], 20, 48, 154, [18, 29]),
      waveMonster("Goblin Priest", 15, 143, [16, 26], 18, 52, 168, [19, 32],
        { name: "Goblin Curse", kind: "burst", power: 1.7, chance: 0.30, cooldown: 3 }),
    ],
    boss: monster("Goblin King", 16, 472, [22, 34], 29, 61, 910, [155, 265],
      { name: "Crown Smash", kind: "burst", power: 2.0, chance: 0.35, cooldown: 3 }),
  },
  {
    id: "bandit-town",
    name: "Bandit Town",
    act: 1,
    description: "A lawless settlement ruled by cutthroats. Their leader is a disgraced soldier with nothing left to lose.",
    waves: [
      waveMonster("Scoundrel",       15, 166, [17, 26], 22, 54, 176, [21, 35]),
      waveMonster("Bandit",          16, 191, [19, 28], 24, 57, 196, [23, 39]),
      waveMonster("Contract Killer", 17, 217, [20, 31], 26, 61, 218, [25, 43]),
    ],
    boss: monster("Exiled City Guard", 20, 625, [27, 41], 36, 75, 1232, [215, 355],
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
      waveMonster("Veteran Bandit",        20, 281, [24, 36], 29, 68, 112, [48, 82]),
      waveMonster("Chieftain's Right Hand", 22, 366, [27, 41], 34, 75, 146, [62, 102]),
      waveMonster("Ursh, Bandit's Companion", 23, 480, [32, 50], 38, 80, 182, [70, 120]),
    ],
    boss: monster("Bandit Chieftain", 24, 1148, [36, 53], 44, 92, 2100, [312, 572],
      { name: "Axe Slam", kind: "burst", power: 2.3, chance: 0.40, cooldown: 3 }),
  },

  // ── ACT 2 ──────────────────────────────────────────────────────────────────
  {
    id: "frostfang-pass",
    name: "Frostfang Pass",
    act: 2,
    description: "A treacherous mountain pass where blizzards never cease and frost-born predators stalk every shadow.",
    waves: [
      waveMonster("Snow Wolf",    22, 274, [22, 32], 26, 72,  118, [33, 55]),
      waveMonster("Frost Harpy",  23, 303, [24, 36], 27, 77,  130, [36, 60]),
      waveMonster("Glacial Bear", 24, 347, [26, 40], 31, 82,  147, [39, 65]),
    ],
    boss: monster("Ice Golem", 25, 1050, [31, 47], 34, 72, 1568, [228, 358],
      { name: "Glacial Slam", kind: "burst", power: 1.6, chance: 0.35, cooldown: 3 }),
  },
  {
    id: "icy-cave",
    name: "Icy Cave",
    act: 2,
    description: "A frozen cavern network where the dead have been preserved in ice for centuries, now stirring again.",
    waves: [
      waveMonster("Frostbitten Corpse", 24, 318, [25, 37], 27, 77,  134, [36, 61]),
      waveMonster("Icy Bat",            25, 282, [26, 38], 24, 80,  143, [39, 65]),
      waveMonster("Frozen Revenant",    26, 369, [28, 43], 32, 85,  160, [42, 70]),
    ],
    boss: monster("Crystal Colossus", 27, 1312, [36, 53], 40, 79, 1960, [276, 455],
      { name: "Crystal Shatter", kind: "burst", power: 1.68, chance: 0.35, cooldown: 3 }),
  },
  {
    id: "tundra",
    name: "Tundra",
    act: 2,
    description: "A vast frozen plain ruled by ancient beasts and watched over by a ghostly stag of immense power.",
    waves: [
      waveMonster("Icehorn Mammoth", 27, 405, [31, 46], 34, 88, 176, [46, 75]),
      waveMonster("Frost Lynx",      28, 361, [32, 48], 31, 94, 185, [49, 81]),
      waveMonster("Young Ice Troll", 29, 462, [34, 51], 38, 97, 202, [52, 87]),
    ],
    boss: monster("The Pale Stag", 30, 1627, [40, 60], 47, 86, 2940, [341, 553],
      { name: "Antler Gore", kind: "burst", power: 1.76, chance: 0.35, cooldown: 3 }),
  },
  {
    id: "moonglass-lake",
    name: "Moonglass Lake",
    act: 2,
    description: "A perfectly still lake whose surface reflects the moon like a mirror — and something in that reflection watches back.",
    waves: [
      waveMonster("Spirit Owl",        29, 390, [31, 47], 31, 94,  185, [49, 81]),
      waveMonster("Lunar Ghost",       30, 376, [32, 48], 27, 98,  193, [51, 85],
        { name: "Soul Drain", kind: "drain", power: 1.5, chance: 0.30, cooldown: 3 }),
      waveMonster("Crystal Elemental", 31, 462, [35, 53], 37, 102, 210, [55, 91]),
    ],
    boss: monster("Moon Reflection", 33, 1995, [44, 65], 52, 91, 3430, [406, 650],
      { name: "Shattered Reflection", kind: "drain", power: 1.44, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "whispering-glacier",
    name: "Whispering Glacier",
    act: 2,
    description: "An ancient glacier where the wind carries voices of the dead, and every crack in the ice hides something living.",
    waves: [
      waveMonster("Frost Wraith", 31, 434, [34, 51], 32, 100, 202, [52, 87],
        { name: "Frost Touch", kind: "dot", power: 1.5, chance: 0.30, cooldown: 3 }),
      waveMonster("Ice Wyvern",   32, 491, [37, 55], 38, 105, 218, [57, 94]),
      waveMonster("Ice Troll",    33, 549, [39, 59], 43, 111, 235, [60, 100]),
    ],
    boss: monster("White Chimera", 35, 2415, [51, 75], 60, 101, 4165, [504, 813],
      { name: "Frost Breath", kind: "dot", power: 1.76, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "crystal-labyrinth",
    name: "The Crystal Labyrinth",
    act: 2,
    description: "A maze of razor-edged crystal walls where a frozen minotaur rules over webs and ice-encrusted traps.",
    waves: [
      waveMonster("Crystal Spider", 33, 513, [37, 56], 39, 109, 223, [57, 95]),
      waveMonster("Frost Ogre",     34, 600, [41, 61], 46, 114, 244, [62, 103]),
      waveMonster("Glacier Worm",   35, 571, [43, 63], 43, 117, 252, [65, 107]),
    ],
    boss: monster("Frozen Taur", 37, 2939, [57, 85], 70, 109, 4900, [618, 975],
      { name: "Glacial Hammer", kind: "burst", power: 1.92, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "frostforge",
    name: "The Frostforge",
    act: 2,
    description: "A dwarven forge claimed by a frost curse — its fires long extinguished, its workers now undying sentinels of ice.",
    waves: [
      waveMonster("Frost Dwarf",               36, 614, [43, 65], 48, 119, 269, [68, 113]),
      waveMonster("Animated Frost Knight",     37, 687, [47, 70], 53, 124, 290, [73, 122]),
      waveMonster("Frostforge Dwarven Warrior",38, 723, [49, 74], 56, 128, 307, [78, 129]),
    ],
    boss: monster("Core of the Frozen Forge", 40, 3675, [65, 96], 81, 120, 6125, [780, 1235],
      { name: "Forge Eruption", kind: "burst", power: 2.0, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "summit-peak",
    name: "Summit Peak",
    act: 2,
    description: "The highest reachable summit, where sky predators nest and the ghost of a dwarven king holds court over the clouds.",
    waves: [
      waveMonster("Glacial Eagle",   39, 650, [48, 71], 49, 129, 294, [74, 124]),
      waveMonster("Elder Harpy",     40, 723, [51, 77], 54, 134, 319, [79, 133]),
      waveMonster("Frost Ogre",      41, 817, [54, 82], 60, 139, 344, [85, 142]),
      waveMonster("Ice Shard Golem", 41, 852, [56, 83], 63, 141, 353, [87, 146]),
    ],
    boss: monster("Ghost of the Mountain", 42, 4304, [70, 104], 90, 129, 6860, [975, 1560],
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
      waveMonster("Frozen Bones",        40, 1193, [66, 98],  83, 151, 437, [195, 312]),
      waveMonster("Young Azure Dragon",  42, 1571, [75, 111], 92, 160, 571, [234, 377],
        { name: "Azure Frost", kind: "dot", power: 2.0, chance: 0.35, cooldown: 3 }),
      waveMonster("Avalanche Elemental", 43, 1734, [79, 117], 96, 165, 638, [260, 416],
        { name: "Avalanche", kind: "burst", power: 2.0, chance: 0.35, cooldown: 3 }),
    ],
    boss: monster("Sikktharkk", 45, 6056, [88, 130], 109, 146, 8428, [1950, 2925],
      { name: "Frozen Tempest", kind: "dot", power: 2.4, chance: 0.45, cooldown: 3 }),
  },

  // ── ACT 3 ──────────────────────────────────────────────────────────────────
  {
    id: "overgrown-entrance",
    name: "Overgrown Entrance",
    act: 3,
    description: "The jungle's first breath — a wall of vines, heat, and eyes in the dark. Ancient trees blot out the sun as roots crack stone beneath your feet.",
    waves: [
      waveMonster("Jungle Stalker",  43, 504, [55, 84], 58, 156, 479, [273, 442]),
      waveMonster("Thorn Hunter",    44, 552, [59, 89], 61, 162, 517, [293, 475]),
      waveMonster("Venom Viper",     45, 480, [56, 86], 56, 166, 542, [280, 455],
        { name: "Venom Spit", kind: "dot", power: 1.4, chance: 0.35, cooldown: 3 }),
    ],
    boss: monster("Ancient Treant", 46, 2585, [62, 94], 66, 152, 5040, [1625, 2275],
      { name: "Root Crush", kind: "burst", power: 1.6, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "serpent-marsh",
    name: "Serpent Marsh",
    act: 3,
    description: "A stinking bog where the ground itself is alive. Half-submerged things slither between the reeds, and the water bubbles with poison.",
    waves: [
      waveMonster("Bog Zombie",    45, 528, [58, 88], 60, 160, 529, [286, 462]),
      waveMonster("Swamp Serpent", 47, 600, [62, 95], 66, 170, 580, [312, 507],
        { name: "Constrict", kind: "dot", power: 1.4, chance: 0.30, cooldown: 3 }),
      waveMonster("Poison Toad",   49, 672, [67, 102], 70, 179, 630, [338, 546]),
    ],
    boss: monster("Mother of the Swamp", 50, 3271, [74, 112], 80, 168, 6048, [1820, 2470],
      { name: "Toxic Spores", kind: "dot", power: 1.7, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "whispering-river",
    name: "Whispering River",
    act: 3,
    description: "A wide green river whose currents whisper names of the dead. Harpies nest in the canopy above while something enormous lurks below the surface.",
    waves: [
      waveMonster("Jungle Harpy",               48, 636, [64, 97], 66, 174, 605, [325, 527]),
      waveMonster("School of Gigantic Piranhas", 49, 600, [67, 102], 62, 180, 630, [338, 546]),
      waveMonster("Thorn Dryad",                51, 720, [72, 109], 74, 187, 680, [364, 592]),
    ],
    boss: monster("The Great Emerald Crocolisk", 52, 3958, [84, 128], 88, 178, 7812, [2275, 2925],
      { name: "Death Roll", kind: "burst", power: 1.8, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "village-lost-souls",
    name: "Village of Lost Souls",
    act: 3,
    description: "A forsaken village where every soul was taken. The huts still smoke but no living thing remains — only cursed masks that move on their own, and the Shaman who commands them.",
    waves: [
      waveMonster("Cursed Tribesman", 51, 756, [74, 113], 77, 190, 693, [371, 598]),
      waveMonster("Haunted Mask",     52, 708, [76, 115], 72, 194, 718, [384, 618],
        { name: "Soul Drain", kind: "drain", power: 1.5, chance: 0.30, cooldown: 3 }),
      waveMonster("Voodoo Shaman",    54, 816, [79, 120], 82, 202, 769, [410, 663],
        { name: "Hex Curse", kind: "dot", power: 1.5, chance: 0.30, cooldown: 3 }),
    ],
    boss: monster("The Soul Collector", 55, 4781, [94, 142], 100, 192, 8400, [2600, 3250],
      { name: "Soul Hex", kind: "drain", power: 1.9, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "bloodvine-jungle",
    name: "Bloodvine Jungle",
    act: 3,
    description: "A section of jungle where the plants have developed a taste for blood. Vines snap, flowers snap shut, and spiders the size of horses drop from above.",
    waves: [
      waveMonster("Blood Vine",        54, 852, [82, 124], 84, 204, 781, [416, 676]),
      waveMonster("Carnivorous Plant", 56, 912, [86, 131], 89, 214, 844, [449, 728]),
      waveMonster("Giant Tarantula",   58, 984, [91, 138], 94, 223, 907, [481, 780]),
    ],
    boss: monster("The Devourer Bloom", 59, 5742, [106, 160], 112, 208, 9240, [2730, 3380],
      { name: "Engulf", kind: "burst", power: 2.0, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "temple-forgotten-gods",
    name: "Temple of Forgotten Gods",
    act: 3,
    description: "A crumbling stone temple reclaimed by the jungle. Its god-statues still move. Its priests still preach — and its golden idol still hungers for sacrifice.",
    waves: [
      waveMonster("Stone Jaguar",    54, 876, [84, 127], 86, 206, 794, [423, 689]),
      waveMonster("Temple Guardian", 56, 936, [89, 134], 91, 216, 857, [455, 741]),
      waveMonster("Venom Priest",    58, 888, [89, 134], 86, 220, 882, [468, 761],
        { name: "Poison Ritual", kind: "dot", power: 1.5, chance: 0.30, cooldown: 3 }),
    ],
    boss: monster("Golden Idol", 59, 5742, [108, 162], 115, 210, 10080, [2925, 3575],
      { name: "Idol's Wrath", kind: "burst", power: 2.1, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "heart-of-the-jungle",
    name: "Heart of the Jungle",
    act: 3,
    description: "The jungle's core — a place so old the trees have faces and the stones breathe. The Green Warden has stood here since before men walked the earth, and dark magic has driven it to madness.",
    waves: [
      waveMonster("Ancient Gorilla",  58, 1056, [96, 145], 101, 226, 958, [507, 826]),
      waveMonster("Emerald Basilisk", 60, 1128, [102, 154], 106, 235, 1033, [546, 891],
        { name: "Petrifying Gaze", kind: "drain", power: 1.5, chance: 0.30, cooldown: 3 }),
      waveMonster("Jungle Guardian",  62, 1200, [107, 162], 110, 245, 1109, [585, 956]),
    ],
    boss: monster("The Green Warden", 63, 6840, [118, 178], 126, 222, 11088, [3185, 3770],
      { name: "Ancient Fury", kind: "burst", power: 2.2, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "black-ziggurat",
    name: "The Black Ziggurat",
    act: 3,
    description: "A towering black pyramid at the jungle's heart, its surface carved with screaming faces. The voodoo spirits within have been building to this ritual for centuries.",
    waves: [
      waveMonster("Elite Voodoo Warrior", 60, 1212, [106, 160], 108, 238, 1071, [566, 923]),
      waveMonster("Soul Devourer",        62, 1284, [110, 167], 113, 247, 1147, [605, 988],
        { name: "Soul Rend", kind: "drain", power: 1.6, chance: 0.30, cooldown: 3 }),
      waveMonster("Cursed Colossus",      64, 1416, [118, 178], 122, 257, 1247, [657, 1073]),
    ],
    boss: monster("Ancient Loa", 65, 8350, [134, 202], 142, 235, 12054, [3250, 3900],
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
      waveMonster("Spirit of the Crocolisk", 64, 3600, [132, 199], 142, 257, 1310, [429, 702]),
      waveMonster("Spirit of the Gorilla",   66, 4200, [142, 214], 150, 269, 1462, [481, 787]),
      waveMonster("Spirit of the Eagle",     66, 3840, [137, 206], 144, 266, 1411, [462, 754]),
    ],
    boss: monster("Zam'Koro, The Loa of Endless Night", 70, 13042, [148, 222], 165, 258, 18060, [3900, 4550],
      { name: "Endless Night", kind: "dot", power: 2.8, chance: 0.45, cooldown: 3 }),
  },

  // ── ACT 4 ──────────────────────────────────────────────────────────────────
  {
    id: "shattered-veil",
    name: "The Shattered Veil",
    act: 4,
    description: "The torn boundary between the living world and the Realm of Endless Night. Wraiths and lost souls pour through the cracks, drawn to the warmth of the living.",
    waves: [
      waveMonster("Veil Wraith",    70, 1380, [124, 187], 128, 271, 1373, [722, 1177],
        { name: "Life Drain", kind: "drain", power: 1.5, chance: 0.30, cooldown: 3 }),
      waveMonster("Hollow Specter", 71, 1440, [128, 193], 132, 275, 1424, [748, 1222]),
      waveMonster("Lost Soul",      72, 1500, [132, 199], 135, 279, 1474, [774, 1268],
        { name: "Soul Scream", kind: "burst", power: 1.6, chance: 0.30, cooldown: 3 }),
    ],
    boss: monster("The Gatekeeper", 73, 7360, [144, 217], 153, 265, 18060, [2730, 4550],
      { name: "Soul Chain", kind: "drain", power: 2.0, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "graveyard-of-kings",
    name: "Graveyard of Kings",
    act: 4,
    description: "An ancient burial ground where fallen monarchs refuse to rest. Their armored dead still guard tombs filled with the gold of crumbled empires.",
    waves: [
      waveMonster("Tomb Knight",        72, 1500, [132, 200], 137, 279, 1487, [780, 1274]),
      waveMonster("Bone Herald",        73, 1560, [136, 205], 141, 284, 1537, [806, 1320],
        { name: "Death Knell", kind: "burst", power: 1.6, chance: 0.30, cooldown: 3 }),
      waveMonster("Cursed Royal Guard", 75, 1680, [142, 214], 148, 293, 1638, [858, 1398]),
    ],
    boss: monster("Prince Valdris the Damned", 75, 8800, [155, 233], 163, 278, 19740, [3380, 5525],
      { name: "Royal Decree", kind: "burst", power: 2.1, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "ashen-forest",
    name: "The Ashen Forest",
    act: 4,
    description: "A dead forest where the trees are made of bone and ash, and something ancient hunts between them. The Pale Huntress has ridden these paths since before memory.",
    waves: [
      waveMonster("Ash Wraith",    74, 1620, [138, 208], 143, 288, 1588, [832, 1359]),
      waveMonster("Shadow Stalker",75, 1680, [142, 214], 147, 293, 1638, [858, 1398]),
      waveMonster("Bone Treant",   77, 1800, [150, 226], 155, 303, 1739, [910, 1489]),
    ],
    boss: monster("The Pale Huntress", 77, 10400, [164, 246], 172, 289, 21840, [3900, 6370],
      { name: "Soul Arrow", kind: "burst", power: 2.0, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "river-of-lost-souls",
    name: "River of Lost Souls",
    act: 4,
    description: "A black river carrying the condemned to their final rest. Nothing that enters the water comes back the same — and something enormous hunts beneath the surface.",
    waves: [
      waveMonster("Drowned Revenant", 75, 1680, [142, 215], 148, 294, 1638, [858, 1404]),
      waveMonster("Soul Ferryman",    77, 1800, [150, 226], 155, 303, 1739, [910, 1489]),
      waveMonster("Wailing Banshee",  78, 1740, [148, 222], 152, 308, 1701, [891, 1463],
        { name: "Death Wail", kind: "burst", power: 1.7, chance: 0.30, cooldown: 3 }),
    ],
    boss: monster("The Abyssal Hydra", 78, 12000, [170, 255], 178, 296, 24360, [4420, 7150],
      { name: "Triple Bite", kind: "burst", power: 2.2, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "citadel-of-ash",
    name: "Citadel of Ash",
    act: 4,
    description: "A crumbling fortress where an undead warlord commands his eternal army. General Morrath has fought this war for centuries, long past the point of remembering why.",
    waves: [
      waveMonster("Undead Siege Knight",  77, 1800, [150, 227], 156, 304, 1739, [910, 1495]),
      waveMonster("Ashen Golem",          79, 1920, [158, 238], 163, 313, 1840, [962, 1580]),
      waveMonster("Phantom Crossbowman",  80, 1860, [156, 234], 160, 318, 1789, [936, 1541]),
    ],
    boss: monster("General Morrath", 80, 14000, [178, 267], 185, 305, 26460, [4940, 7930],
      { name: "Siege Strike", kind: "burst", power: 2.2, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "shadow-cathedral",
    name: "The Shadow Cathedral",
    act: 4,
    description: "A black cathedral where void cultists worship the darkness between worlds. High Inquisitor Varek sacrificed his own body to become one with the shadow.",
    waves: [
      waveMonster("Shadow Acolyte",   79, 1920, [158, 238], 163, 314, 1840, [962, 1580]),
      waveMonster("Void Cultist",     81, 2040, [164, 248], 169, 323, 1940, [1014, 1664],
        { name: "Void Ritual", kind: "dot", power: 1.6, chance: 0.30, cooldown: 3 }),
      waveMonster("Nightmare Gargoyle",82, 2100, [168, 252], 173, 328, 1991, [1040, 1703]),
    ],
    boss: monster("High Inquisitor Varek", 82, 16000, [187, 281], 195, 315, 28392, [5525, 8840],
      { name: "Void Consume", kind: "drain", power: 2.3, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "realm-of-nightmares",
    name: "Realm of Nightmares",
    act: 4,
    description: "A surreal plane where the fears of every condemned soul take physical form. The Dreaming Horror feeds on terror, growing stronger with each nightmare it devours.",
    waves: [
      waveMonster("Fear Manifestation", 81, 2040, [164, 248], 170, 324, 1940, [1014, 1664]),
      waveMonster("Nightmare Hound",    82, 2100, [168, 252], 174, 329, 1991, [1040, 1703]),
      waveMonster("Dread Specter",      83, 2040, [166, 250], 171, 332, 1966, [1027, 1684],
        { name: "Paralyzing Fear", kind: "drain", power: 1.7, chance: 0.30, cooldown: 3 }),
    ],
    boss: monster("The Dreaming Horror", 83, 18000, [194, 291], 202, 322, 30660, [5980, 9620],
      { name: "Living Nightmare", kind: "dot", power: 2.4, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "obsidian-spire",
    name: "The Obsidian Spire",
    act: 4,
    description: "A tower of black glass reaching into a starless sky, ruled by Seraphel the Undying — an archmage whose soul is fused with void energy, making him impossible to kill by ordinary means.",
    waves: [
      waveMonster("Void Sentinel",      82, 2100, [168, 253], 174, 329, 1991, [1040, 1703]),
      waveMonster("Shadow Executioner", 84, 2220, [176, 264], 181, 339, 2100, [1092, 1794]),
      waveMonster("Eternal Wraith",     85, 2160, [174, 261], 178, 344, 2066, [1079, 1768],
        { name: "Soul Rend", kind: "drain", power: 1.7, chance: 0.30, cooldown: 3 }),
    ],
    boss: monster("Seraphel the Undying", 85, 20400, [202, 303], 212, 332, 33600, [6760, 10855],
      { name: "Void Nova", kind: "burst", power: 2.5, chance: 0.40, cooldown: 3 }),
  },

  // ── ACT 4 ENDGAME ──────────────────────────────────────────────────────────
  {
    id: "throne-of-endless-night",
    name: "Throne of Endless Night",
    act: 4,
    endgame: true,
    description: "The heart of the Realm of Endless Night. Reltih, the Void Devourer, sits at the center of everything — a primordial demon born from the darkness between worlds, the reason the veil was built in the first place.",
    waves: [
      waveMonster("Shade of Valdris",        84, 6500, [186, 279], 192, 342, 2218, [566, 930]),
      waveMonster("The Void Heralds",        86, 7500, [194, 291], 199, 353, 2470, [631, 1034]),
      waveMonster("Shade of the Gatekeeper", 88, 8500, [202, 303], 207, 362, 2722, [689, 1131]),
    ],
    boss: monster("Reltih, the Void Devourer", 90, 32000, [226, 339], 232, 278, 42000, [9100, 13000],
      { name: "Void Devour", kind: "drain", power: 3.0, chance: 0.45, cooldown: 3 }),
  },
];
