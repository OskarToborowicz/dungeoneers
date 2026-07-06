import type { DungeonDefinition, MonsterDefinition } from "../types";

function monster(
  name: string,
  level: number,
  life: number,
  damage: [number, number],
  defense: number,
  attackRating: number,
  xpReward: number,
  goldReward: [number, number]
): MonsterDefinition {
  return { name, level, life, damage, defense, attackRating, xpReward, goldReward };
}

export const REGULAR_DUNGEON_COUNT = 5;

export function getXpCapLevel(clearedDungeons: string[]): number {
  const maxBossLevel = DUNGEONS
    .filter((d) => clearedDungeons.includes(d.id))
    .reduce((max, d) => Math.max(max, d.boss.level), 0);
  const baseLevel = maxBossLevel === 0 ? DUNGEONS[0].boss.level : maxBossLevel;
  return baseLevel + 5;
}

export const DUNGEONS: DungeonDefinition[] = [
  {
    id: "blood-moor",
    name: "Blood Moor",
    description: "A wind-swept moor infested with fallen and carrion birds.",
    waves: [
      monster("Fallen One", 1, 20, [2, 5], 5, 20, 15, [2, 6]),
      monster("Carrion Bird", 1, 16, [3, 6], 4, 25, 14, [2, 5]),
      monster("Fallen Shaman", 2, 24, [3, 7], 6, 22, 18, [3, 7]),
    ],
    boss: monster("Corpsefire", 3, 60, [5, 10], 10, 30, 60, [15, 30]),
  },
  {
    id: "cold-plains",
    name: "Cold Plains",
    description: "Frozen fields haunted by wailing spirits and rabid dogs.",
    waves: [
      monster("Zombie", 3, 34, [5, 9], 8, 28, 26, [4, 9]),
      monster("Wailing Beast", 4, 40, [6, 11], 10, 32, 30, [5, 11]),
      monster("Devilkin", 4, 36, [6, 10], 9, 34, 28, [5, 10]),
    ],
    boss: monster("Bishibosh", 5, 110, [9, 16], 16, 40, 120, [30, 55]),
  },
  {
    id: "stony-field",
    name: "Stony Field",
    description: "A cairn-stone plain crawling with quill rats and cairn wraiths.",
    waves: [
      monster("Quill Rat", 6, 55, [8, 14], 14, 40, 40, [7, 14]),
      monster("Cairn Wraith", 7, 62, [10, 16], 16, 44, 46, [8, 16]),
      monster("Yeti", 7, 70, [11, 18], 15, 42, 48, [9, 17]),
    ],
    boss: monster("Rakanishu", 8, 180, [14, 24], 22, 52, 210, [55, 90]),
  },
  {
    id: "dark-wood",
    name: "Dark Wood",
    description: "A shadowed forest where dark ones and vile hags lurk.",
    waves: [
      monster("Dark One", 10, 95, [16, 24], 22, 56, 65, [14, 24]),
      monster("Vile Hag", 11, 105, [18, 27], 24, 58, 72, [16, 27]),
      monster("Brute", 11, 120, [20, 30], 20, 54, 78, [17, 28]),
    ],
    boss: monster("Treehead Woodfist", 12, 320, [24, 38], 30, 66, 360, [90, 150]),
  },
  {
    id: "tristram",
    name: "Ruins of Tristram",
    description: "The fallen town's ruins, where the Dark Wanderer's evil lingers.",
    waves: [
      monster("Fallen Champion", 15, 160, [26, 38], 34, 68, 110, [24, 40]),
      monster("Scarab", 16, 175, [28, 40], 36, 70, 120, [26, 44]),
      monster("Horror Archer", 16, 165, [30, 42], 32, 74, 125, [27, 45]),
    ],
    boss: monster("The Countess", 18, 520, [36, 52], 44, 84, 650, [160, 260]),
  },
  {
    id: "diablo",
    name: "Chaos Sanctuary",
    description: "The Prime Evil himself awaits beyond the seals. Death is certain for the unprepared.",
    endgame: true,
    waves: [
      monster("Doom Knight", 22, 420, [48, 68], 52, 100, 350, [80, 130]),
      monster("Venom Lord", 24, 480, [55, 78], 58, 108, 420, [95, 155]),
      monster("Chaos Knight", 26, 540, [62, 88], 64, 116, 500, [110, 180]),
    ],
    boss: monster("Diablo", 30, 3500, [80, 120], 80, 150, 12000, [800, 1500]),
  },
];
