# Balance simulator — `npm run sim`

A headless balance tester. It plays a class through the **real combat engine**
(`resolveRound` — the exact code the game runs), across the whole dungeon table,
many trials per dungeon, and reports how often it clears and how much life it has
left. No browser, no clicking — pure numbers you can run after every tuning change.

---

## Quick start

```bash
npm run sim                     # every class, all acts, rare gear, 200 runs each
```

You'll get one block per class. Either:

```
MONK
  ✓ no trouble spots — worst: Throne of Endless Night 20%
```

or a list of the dungeons where it struggles:

```
SORCERESS
  ⚠ trouble spots:
    - The White Maw (4% clear, 20% life, dies to Sikktharkk)
    - Sacrificial Altar (0% clear, 0% life, dies to Zam'Koro...)
```

A dungeon is flagged when **clear rate < 90%** or **average ending life < 20%**.

---

## Flags

Pass flags after `--` so npm forwards them to the script:

| Flag | Default | What it does |
|---|---|---|
| `--class=<id>` | `all` | One class. Ids: `barbarian` `necromancer` `sorceress` `amazon` `paladin` `druid` `assassin` `monk` |
| `--gear=start\|rare` | `rare` | `rare` = a full set of 3-affix rares at item level = boss level. `start` = only the starting white weapon (tests the gear gate). |
| `--act=1..4\|all` | `all` | Limit to one act. |
| `--runs=N` | `200` | Trials per dungeon. More = tighter numbers, slower. |
| `--verbose` | off | Print every dungeon as a row with a clear-rate bar, not just the trouble spots. |

### Examples

```bash
# Deep-dive one class, act by act, with full per-dungeon rows
npm run sim -- --class=barbarian --verbose

# Does the class work with NO gear investment? (isolates class power from gear)
npm run sim -- --class=monk --gear=start

# Just Act 1, high precision
npm run sim -- --act=1 --runs=1000

# Compare two classes quickly
npm run sim -- --class=paladin --verbose
npm run sim -- --class=sorceress --verbose
```

---

## How it works (the assumptions baked in)

- **Character level = the dungeon's boss level.** Every dungeon is tested "on
  level" — a fair baseline, since the XP cap is boss level + 5.
- **Stat build:** 60% into the class's primary stat, 40% into vitality.
  Primary stat per class is in the `PRIMARY` map at the top of the script.
- **Gear (`rare` mode):** freshly rolled rares every run, so results average over
  gear RNG, not one lucky drop. No uniques, no over-item-levelling.
- **Between fights in a dungeon:** life carries over, mana/resource resets to
  full, potions refill to 5 — matching how a real dungeon run works.
- **The AI** each turn: emergency health potion under 35% life → a situational
  `ability2` (defensive ones when hurt/boss, Whirlwind at high fury) → the main
  `ability` when affordable → basic attack. Assassin holds Eviscerate for max
  Preparation.

---

## Reading the results honestly

**Trust *relative* comparisons more than absolute clear-rates.** The AI is a
heuristic, not perfect play, so a low score can mean a weak *policy* rather than
weak *tuning*. The barbarian is the most policy-sensitive (bursty, easy to
underplay). Passive effects — Paladin's Divine Retribution, Monk's Transcendence
— fire no matter how the class is played, so survivability gaps driven by sustain
are real signals.

**`rare`-at-level gear caps out around Act 3.** Every class walls in Act 3–4 with
this gear model. That is expected — deep content assumes uniques, higher item
levels, or grinding past the XP cap. It does **not** mean Act 4 is unbeatable; it
means rare-at-level isn't enough. Use `--gear=start` vs `--gear=rare` to see how
much of a dungeon's difficulty is a gear gate.

**"dies to X"** names the monster that ended the most failed runs — usually the
boss, but a spiky wave monster will show up here too.

---

## Extending it

Everything tunable lives at the top of `balance-sim.mts`:

- **`PRIMARY`** — the primary stat each class dumps into. Change to test a
  different build (e.g. give the paladin `energy` for a caster build).
- **`buildChar`** — the 60/40 primary/vitality split.
- **`pickAction`** — the AI policy. If a class scores poorly and you suspect the
  policy rather than the tuning, improve its branch here and re-run.
- **`DEFENSIVE_A2`** — which `ability2` kinds the AI treats as "use when hurt"
  vs "nuke when the resource is high."

After changing combat/class/item data, just re-run `npm run sim` — it always
pulls the current game code, so it doubles as a regression check: run it before a
balance change, run it after, compare.
