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
  return { name, level, life, damage, defense, attackRating, xpReward, goldReward, spell };
}

export const REGULAR_DUNGEON_COUNT_ACT1 = 5;
export const REGULAR_DUNGEON_COUNT_ACT2 = 5;
/** @deprecated use REGULAR_DUNGEON_COUNT_ACT1 */
export const REGULAR_DUNGEON_COUNT = REGULAR_DUNGEON_COUNT_ACT1;

export function getXpCapLevel(clearedDungeons: string[]): number {
  const maxBossLevel = DUNGEONS
    .filter((d) => clearedDungeons.includes(d.id))
    .reduce((max, d) => Math.max(max, d.boss.level), 0);
  const baseLevel = maxBossLevel === 0 ? DUNGEONS[0].boss.level : maxBossLevel;
  return baseLevel + 5;
}

export const DUNGEONS: DungeonDefinition[] = [
  // ── ACT 1 ──────────────────────────────────────────────────────────────────
  {
    id: "blood-moor",
    name: "Blood Moor",
    act: 1,
    description: "A wind-swept moor infested with fallen and carrion birds.",
    waves: [
      monster("Fallen One", 1, 20, [2, 5], 5, 20, 15, [2, 6]),
      monster("Carrion Bird", 1, 16, [3, 6], 4, 25, 14, [2, 5]),
      monster("Fallen Shaman", 2, 24, [3, 7], 6, 22, 18, [3, 7]),
    ],
    boss: monster("Corpsefire", 3, 60, [5, 10], 10, 30, 60, [15, 30],
      { name: "Corpse Explosion", kind: "burst", power: 1.8, chance: 0.35, cooldown: 3 }),
  },
  {
    id: "cold-plains",
    name: "Cold Plains",
    act: 1,
    description: "Frozen fields haunted by wailing spirits and rabid dogs.",
    waves: [
      monster("Zombie", 3, 34, [5, 9], 8, 28, 26, [4, 9]),
      monster("Wailing Beast", 4, 40, [6, 11], 10, 32, 30, [5, 11]),
      monster("Devilkin", 4, 36, [6, 10], 9, 34, 28, [5, 10]),
    ],
    boss: monster("Bishibosh", 5, 110, [9, 16], 16, 40, 120, [30, 55],
      { name: "Fire Wall", kind: "burn", power: 1.6, chance: 0.35, cooldown: 3 }),
  },
  {
    id: "stony-field",
    name: "Stony Field",
    act: 1,
    description: "A cairn-stone plain crawling with quill rats and cairn wraiths.",
    waves: [
      monster("Quill Rat", 6, 55, [8, 14], 14, 40, 40, [7, 14]),
      monster("Cairn Wraith", 7, 62, [10, 16], 16, 44, 46, [8, 16]),
      monster("Yeti", 7, 70, [11, 18], 15, 42, 48, [9, 17]),
    ],
    boss: monster("Rakanishu", 8, 180, [14, 24], 22, 52, 210, [55, 90],
      { name: "Chain Lightning", kind: "burst", power: 2.0, chance: 0.35, cooldown: 3 }),
  },
  {
    id: "dark-wood",
    name: "Dark Wood",
    act: 1,
    description: "A shadowed forest where dark ones and vile hags lurk.",
    waves: [
      monster("Dark One", 10, 95, [16, 24], 22, 56, 65, [14, 24]),
      monster("Vile Hag", 11, 105, [18, 27], 24, 58, 72, [16, 27]),
      monster("Brute", 11, 120, [20, 30], 20, 54, 78, [17, 28]),
    ],
    boss: monster("Treehead Woodfist", 12, 320, [24, 38], 30, 66, 360, [90, 150],
      { name: "Ground Slam", kind: "burst", power: 2.2, chance: 0.35, cooldown: 3 }),
  },
  {
    id: "tristram",
    name: "Ruins of Tristram",
    act: 1,
    description: "The fallen town's ruins, where the Dark Wanderer's evil lingers.",
    waves: [
      monster("Fallen Champion", 15, 160, [26, 38], 34, 68, 110, [24, 40]),
      monster("Scarab", 16, 175, [28, 40], 36, 70, 120, [26, 44]),
      monster("Horror Archer", 16, 165, [30, 42], 32, 74, 125, [27, 45]),
    ],
    boss: monster("The Countess", 18, 520, [36, 52], 44, 84, 650, [160, 260],
      { name: "Blood Drain", kind: "drain", power: 1.5, chance: 0.35, cooldown: 3 }),
  },
  {
    id: "diablo",
    name: "Rogue Monastery",
    act: 1,
    description: "The Maiden of Anguish has corrupted the monastery to its core. Her poison fills the halls.",
    endgame: true,
    waves: [
      monster("Dark Stalker", 22, 420, [48, 68], 52, 100, 350, [80, 130]),
      monster("Succubus", 24, 480, [55, 78], 58, 108, 420, [95, 155]),
      monster("Vile Guardian", 26, 540, [62, 88], 64, 116, 500, [110, 180]),
    ],
    boss: monster("Andariel", 30, 1800, [80, 120], 80, 150, 12000, [800, 1500],
      { name: "Poison Nova", kind: "dot", power: 0.7, chance: 0.4, cooldown: 3 }),
  },

  // ── ACT 2 ──────────────────────────────────────────────────────────────────
  {
    id: "imp-field",
    name: "Imp Field",
    act: 2,
    description: "A scorched plain swarming with imps of every rank.",
    waves: [
      monster("Imp Farmer", 30, 800, [55, 80], 55, 110, 400, [80, 130]),
      monster("Imp Guard", 31, 900, [60, 88], 60, 115, 450, [90, 145]),
      monster("Imp Soldier", 32, 1000, [65, 95], 65, 120, 500, [100, 160]),
    ],
    boss: monster("Queen of Imps", 33, 2500, [90, 130], 80, 140, 15000, [1000, 1800],
      { name: "Imp Swarm", kind: "burst", power: 2.0, chance: 0.35, cooldown: 3 }),
  },
  {
    id: "lava-river",
    name: "Lava River",
    act: 2,
    description: "Molten channels carved through volcanic rock, home to fire-born beasts.",
    waves: [
      monster("Magma Snail", 34, 1100, [70, 100], 70, 125, 550, [110, 175]),
      monster("Lava Golem", 35, 1300, [78, 110], 80, 130, 620, [125, 195]),
      monster("Fire Elemental", 36, 1200, [82, 115], 75, 135, 660, [130, 205],
        { name: "Fireball", kind: "burn", power: 1.8, chance: 0.30, cooldown: 3 }),
      monster("Volcanic Boar", 37, 1500, [88, 125], 85, 138, 700, [140, 220]),
    ],
    boss: monster("Emberfire", 38, 3500, [110, 155], 95, 155, 20000, [1400, 2200],
      { name: "Lava Burst", kind: "burn", power: 2.2, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "ashen-caves",
    name: "Ashen Caves",
    act: 2,
    description: "Deep tunnels choked with toxic smoke and the stench of sulfur.",
    waves: [
      monster("Fire Bat", 39, 1400, [85, 120], 72, 140, 720, [145, 225]),
      monster("Cloud of Dense Smoke", 40, 1600, [90, 128], 78, 145, 780, [155, 240],
        { name: "Asphyxiate", kind: "dot", power: 1.6, chance: 0.30, cooldown: 3 }),
      monster("Rock Hound", 41, 1800, [98, 138], 90, 148, 840, [165, 255]),
    ],
    boss: monster("It", 43, 4750, [130, 180], 110, 165, 28000, [1800, 2800],
      { name: "Suffocating Cloud", kind: "dot", power: 2.0, chance: 0.35, cooldown: 3 }),
  },
  {
    id: "higher-hell",
    name: "Higher Hell",
    act: 2,
    description: "The upper reaches of the Burning Hells, commanded by a demonic warlord.",
    waves: [
      monster("Lesser Devil", 44, 2000, [105, 145], 95, 155, 900, [180, 275]),
      monster("Obsidian Skeleton", 46, 2200, [115, 158], 105, 160, 980, [195, 300]),
      monster("Hell Wyrm", 47, 2500, [125, 172], 110, 165, 1060, [210, 325]),
      monster("Chaos Warlock", 48, 2300, [120, 165], 100, 168, 1020, [205, 315],
        { name: "Chaos Bolt", kind: "burst", power: 2.1, chance: 0.30, cooldown: 3 }),
    ],
    boss: monster("Reltih", 50, 6500, [155, 215], 130, 185, 38000, [2400, 3600],
      { name: "Hellfire", kind: "burn", power: 2.5, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "lower-hell",
    name: "Lower Hell",
    act: 2,
    description: "The deepest pits, where the damned serve an unstoppable reaper.",
    waves: [
      monster("Hell Spawn", 51, 2800, [135, 185], 115, 175, 1100, [220, 340]),
      monster("Ghost", 52, 2600, [140, 192], 108, 178, 1080, [215, 335],
        { name: "Soul Drain", kind: "drain", power: 1.6, chance: 0.35, cooldown: 3 }),
      monster("Demon", 54, 3200, [150, 205], 125, 182, 1200, [240, 370]),
    ],
    boss: monster("The Reaper", 57, 9000, [180, 255], 150, 205, 55000, [3200, 5000],
      { name: "Death Chill", kind: "dot", power: 2.3, chance: 0.40, cooldown: 3 }),
  },
  {
    id: "hellcore",
    name: "Hellcore",
    act: 2,
    description: "The living heart of Hell itself. Three prophets guard the pulsating Core — the Prime Evil made flesh.",
    endgame: true,
    waves: [
      monster("The Third Prophet", 60, 5000, [180, 240], 155, 210, 4000, [600, 900],
        { name: "Dark Prophecy", kind: "burst", power: 2.2, chance: 0.35, cooldown: 3 }),
      monster("The Second Prophet", 62, 5800, [195, 260], 162, 218, 4600, [700, 1050],
        { name: "Flame Curse", kind: "burn", power: 2.0, chance: 0.35, cooldown: 3 }),
      monster("The First Prophet", 65, 6500, [210, 280], 170, 225, 5400, [800, 1200],
        { name: "Soul Drain", kind: "drain", power: 1.8, chance: 0.35, cooldown: 3 }),
    ],
    boss: monster("Core of Hell", 70, 25000, [240, 340], 190, 255, 120000, [8000, 14000],
      { name: "Hellstorm", kind: "burn", power: 3.0, chance: 0.45, cooldown: 3 }),
  },
];
