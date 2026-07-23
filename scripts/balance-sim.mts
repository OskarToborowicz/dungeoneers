/**
 * Headless balance simulator.
 *
 * Runs any class through the real combat engine (resolveRound) across the
 * dungeon table, many trials per dungeon, and reports clear-rate and average
 * ending life. Combat RNG uses Math.random, so results are statistical — bump
 * --runs for tighter numbers.
 *
 *   npm run sim                          all classes, rare gear, all acts
 *   npm run sim -- --class=sorceress     one class
 *   npm run sim -- --gear=start          starting weapon only (tests the gear gate)
 *   npm run sim -- --act=1               single act
 *   npm run sim -- --runs=800 --verbose  more trials, per-dungeon rows
 *
 * The AI is a heuristic (emergency potion → situational ability2 → main
 * ability → basic attack), not optimal play — good enough for relative
 * balance reads and regression checks after tuning changes.
 */
import { createCharacter, getDerivedStats, getStartingResource, type DerivedStats } from "../src/game/character";
import { createBattleState, resolveRound, canUseAbility, canUseAbility2, type BattleState, type PlayerActionKind } from "../src/game/combat";
import { DUNGEONS } from "../src/game/data/dungeons";
import { CLASSES } from "../src/game/data/classes";
import { generateStartingEquipment, generateItemForSlot } from "../src/game/data/items";
import { getPotionsForStage } from "../src/game/data/consumables";
import { generateSpireFloor, isWardenFloor } from "../src/game/data/spire";
import type { Character, MonsterDefinition, EquipmentSlot, Item, ClassId } from "../src/game/types";

// ── CLI ──────────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  }),
);
const ALL_CLASSES: ClassId[] = ["barbarian", "necromancer", "sorceress", "amazon", "paladin", "druid", "assassin", "monk"];
const classes: ClassId[] = args.class && args.class !== "all" ? [args.class as ClassId] : ALL_CLASSES;
const gearMode: "start" | "rare" = args.gear === "start" ? "start" : "rare";
const actFilter = args.act && args.act !== "all" ? Number(args.act) : null;
const RUNS = args.runs ? Number(args.runs) : 200;
const verbose = args.verbose === "true";
// Spire mode: climb the Eternal Spire from floor 1 until death; report the
// highest floor reached per class. `--level` sets the hero level (gear ilvl
// tracks it). e.g. `npm run sim -- --spire --level=90 --runs=500`
const spireMode = args.spire === "true" || args.mode === "spire";
const spireLevel = args.level ? Number(args.level) : 90;
const SPIRE_MAX_FLOOR = 300;

// ── per-class build: 60% primary stat, 40% vitality ──────────────────────────
const PRIMARY: Record<ClassId, "strength" | "dexterity" | "energy"> = {
  barbarian: "strength", paladin: "strength", monk: "dexterity", assassin: "dexterity",
  amazon: "dexterity", druid: "dexterity", sorceress: "energy", necromancer: "energy",
};
function buildChar(classId: ClassId, level: number): Character {
  const prim = PRIMARY[classId];
  const ch = createCharacter("Sim", classId);
  const pts = 10 + 5 * (level - 1);
  const a = { ...ch.allocatedStats };
  for (let i = 0; i < pts; i++) {
    if (a[prim] * 0.4 <= a.vitality * 0.6) a[prim]++;
    else a.vitality++;
  }
  return { ...ch, level, unspentStatPoints: 0, allocatedStats: a };
}

// ── AI policy ─────────────────────────────────────────────────────────────────
// ability2 kinds that are defensive/utility (use when hurt) vs offensive (nuke).
const DEFENSIVE_A2 = new Set(["frost_shield", "golem", "serenity", "vanish", "holy_light", "regen", "bark_wall"]);
function pickAction(ch: Character, st: BattleState, maxLife: number, potHp: number, isBoss: boolean): PlayerActionKind {
  const def = CLASSES[ch.classId];
  const lifePct = st.playerLife / maxLife;
  if (lifePct <= 0.35 && potHp > 0 && st.healthPotionCooldown === 0) return "healthPotion";
  if (def.ability2 && canUseAbility2(ch, st)) {
    const kind = def.ability2.kind;
    const defensive = DEFENSIVE_A2.has(kind);
    if (defensive && (isBoss || lifePct <= 0.6)) return "ability2";
    if (!defensive && ch.classId === "barbarian" && st.playerMana >= 60) return "ability2"; // Whirlwind nuke at high fury
  }
  // Assassin: hold Eviscerate until Preparation is maxed for the big hit.
  if (ch.classId === "assassin" && def.ability.kind === "eviscerate") {
    if (st.preparation >= 3 && canUseAbility(ch, st)) return "ability";
    return "attack";
  }
  if (canUseAbility(ch, st)) return "ability";
  return "attack";
}

// ── one fight ─────────────────────────────────────────────────────────────────
function fight(ch: Character, derived: DerivedStats, m: MonsterDefinition, startLife: number, pot: { hp: number }, isBoss: boolean): { win: boolean; endLife: number } {
  const maxLife = derived.maxLife;
  let st = createBattleState(m, Math.min(startLife, maxLife), getStartingResource(ch, derived), 0);
  for (let t = 0; t < 300; t++) {
    const action = pickAction(ch, st, maxLife, pot.hp, isBoss);
    if (action === "healthPotion") pot.hp--;
    const r = resolveRound(ch, derived, m, st, action);
    st = r.state;
    if (r.status === "victory") return { win: true, endLife: st.playerLife };
    if (r.status === "defeat") return { win: false, endLife: 0 };
  }
  return { win: false, endLife: st.playerLife };
}

// ── gear ──────────────────────────────────────────────────────────────────────
const GEAR_SLOTS: EquipmentSlot[] = ["weapon", "helm", "armor", "gloves", "boots", "belt", "amulet", "ring1", "ring2"];
function loadout(classId: ClassId, ilvl: number): Partial<Record<EquipmentSlot, Item>> {
  if (gearMode === "start") return generateStartingEquipment(classId) as Partial<Record<EquipmentSlot, Item>>;
  const set: Partial<Record<EquipmentSlot, Item>> = {};
  for (const s of GEAR_SLOTS) set[s] = generateItemForSlot(s, ilvl, classId, "rare", 3);
  return set;
}

// ── one dungeon at on-level ───────────────────────────────────────────────────
function playDungeon(classId: ClassId, d: typeof DUNGEONS[number]): { cleared: boolean; diedVs: string | null; bossLifePct: number } {
  const L = d.boss.level;
  const ch = buildChar(classId, L);
  const eq = loadout(classId, L);
  const derived = getDerivedStats(ch, eq);
  let life = derived.maxLife;
  const pot = { hp: getPotionsForStage(derived.potionSlots) };
  const fights = [...d.waves, d.boss];
  for (let i = 0; i < fights.length; i++) {
    const out = fight(ch, derived, fights[i], life, pot, i === fights.length - 1);
    if (!out.win) return { cleared: false, diedVs: fights[i].name, bossLifePct: 0 };
    life = out.endLife;
  }
  return { cleared: true, diedVs: null, bossLifePct: life / derived.maxLife };
}

// ── one spire climb: floor 1 upward until death → highest floor cleared ───────
function playSpire(classId: ClassId, level: number): number {
  const ch = buildChar(classId, level);
  const eq = loadout(classId, level);
  const derived = getDerivedStats(ch, eq);
  let life = derived.maxLife;
  for (let floor = 1; floor <= SPIRE_MAX_FLOOR; floor++) {
    const pot = { hp: getPotionsForStage(derived.potionSlots) }; // refilled per floor
    const m = generateSpireFloor(floor);
    const out = fight(ch, derived, m, life, pot, isWardenFloor(floor));
    if (!out.win) return floor - 1;
    life = out.endLife;
  }
  return SPIRE_MAX_FLOOR;
}

if (spireMode) {
  console.log(
    `\nSpire sim — gear=${gearMode}, level=${spireLevel}, ${RUNS} climbs/class\n`,
  );
  for (const classId of classes) {
    const floors: number[] = [];
    for (let i = 0; i < RUNS; i++) floors.push(playSpire(classId, spireLevel));
    floors.sort((a, b) => a - b);
    const avg = floors.reduce((s, f) => s + f, 0) / floors.length;
    const median = floors[Math.floor(floors.length / 2)];
    const min = floors[0];
    const max = floors[floors.length - 1];
    const capped = max >= SPIRE_MAX_FLOOR ? "+" : "";
    console.log(
      `${classId.toUpperCase().padEnd(12)} avg floor ${avg.toFixed(1).padStart(6)}   median ${String(median).padStart(3)}   range ${min}–${max}${capped}`,
    );
  }
  console.log();
  process.exit(0);
}

// ── run ───────────────────────────────────────────────────────────────────────
const dungeons = DUNGEONS.filter((d) => actFilter === null || d.act === actFilter);
console.log(`\nBalance sim — gear=${gearMode}, ${RUNS} runs/dungeon, char level = boss level\n`);

for (const classId of classes) {
  console.log(`\x1b[1m${classId.toUpperCase()}\x1b[0m`);
  let worstClear = 101, worstName = "";
  const flags: string[] = [];
  let curAct = 0;
  for (const d of dungeons) {
    if (d.act !== curAct) { curAct = d.act; if (verbose) console.log(`  — Act ${curAct} —`); }
    let clears = 0, lifeSum = 0;
    const killers = new Map<string, number>();
    for (let i = 0; i < RUNS; i++) {
      const r = playDungeon(classId, d);
      if (r.cleared) { clears++; lifeSum += r.bossLifePct; }
      else killers.set(r.diedVs!, (killers.get(r.diedVs!) ?? 0) + 1);
    }
    const clearPct = (clears / RUNS) * 100;
    const avgLife = clears > 0 ? (lifeSum / clears) * 100 : 0;
    if (clearPct < worstClear) { worstClear = clearPct; worstName = d.name; }
    const topK = [...killers.entries()].sort((a, b) => b[1] - a[1])[0];
    if (clearPct < 90 || avgLife < 20) flags.push(`${d.name} (${clearPct.toFixed(0)}% clear, ${avgLife.toFixed(0)}% life${topK ? `, dies to ${topK[0]}` : ""})`);
    if (verbose) {
      const bar = "#".repeat(Math.round(clearPct / 3));
      console.log(`    ${d.name.padEnd(22)} L${String(d.boss.level).padStart(2)}  clear ${clearPct.toFixed(0).padStart(3)}%  life ${avgLife.toFixed(0).padStart(3)}%  ${bar}`);
    }
  }
  if (flags.length === 0) console.log(`  ✓ no trouble spots — worst: ${worstName} ${worstClear.toFixed(0)}%`);
  else { console.log(`  ⚠ trouble spots:`); flags.forEach((f) => console.log(`    - ${f}`)); }
  console.log();
}
