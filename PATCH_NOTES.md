# Patch Notes

---

## Session 2026-07-12

### UI / Layout

- **Shop landscape layout** — Potions and Merchant's Wares are now displayed side-by-side in a single row in landscape mode. Potion cards are compact (description hidden, smaller padding/font). Merchant item grid sits directly under the Merchant's Wares heading + Restock button in a shared column.
- **Shop inventory scroll** — In landscape mode, only the inventory grid scrolls; the "Your Inventory" heading and Sell buttons stay fixed.
- **Potion buy button** now shows `X/5 · Yg` (e.g. `3/5 · 50g`) instead of just "Buy for Yg", so stack count is always visible without a separate label.
- **Mobile combat fit** — On short-screen mobile (e.g. iPhone SE 375×667) all four action buttons now fit without scrolling. The combat log flexes to fill available vertical space and the action buttons are pinned to the bottom using `flex-shrink: 0`.
- **Landscape flee button** — Flee button no longer stretches the full column height; it is a fixed 48px height, vertically centered in its grid area.
- **Landscape monster name** — Monster name and level no longer get truncated with `…`; they wrap to the next line instead.
- **Mobile hub return button** — A `↩` button appears in the top-right corner of the hub sidebar on portrait mobile only (hidden in landscape where the sidebar already shows "Return to Menu"). Tapping it shows an inline "Exit? Yes / No" confirmation before quitting.

---

## Session 2025-07-07

### New Content

- **Andariel replaces Diablo** as the final boss. The last dungeon is now the **Rogue Monastery** with new enemy types: Dark Stalker, Succubus, and Vile Guardian.
- **Scythe** added as a Necromancer-exclusive two-handed weapon (3–8 base damage). **War Staff** is now Sorceress-only.
- **Monster Spells** — each dungeon boss now has a unique spell that fires instead of a normal attack (35–40% chance, 3-round cooldown):
  | Boss | Spell | Kind |
  |---|---|---|
  | Corpsefire | Corpse Explosion | Burst (×1.8) |
  | Bishibosh | Fire Wall | Burn DoT (×1.6) |
  | Rakanishu | Chain Lightning | Burst (×2.0) |
  | Treehead Woodfist | Ground Slam | Burst (×2.2) |
  | The Countess | Blood Drain | Drain + heal (×1.5) |
  | Andariel | Poison Nova | Poison DoT (×2.4) |
- **Burn status effect** — fire-based DoT applied to the player by Bishibosh's Fire Wall. Works identically to Poison (3 ticks) but tracked separately with an orange indicator.
- **Visual spell effects** — each boss spell triggers a 900 ms SVG animation over the arena (pillars of fire, zigzag lightning, expanding nova rings, etc.).
- **Player status auras** — pulsing green (poison) or orange (burn) glow renders around the character sprite when the corresponding DoT is active.

### UI Improvements

- **Damage preview on action buttons** — Attack shows the weapon damage range and crit ceiling; the Ability button shows the estimated damage and damage type (Physical / Magic / Poison).
- **Sequential combat animations** — player attack animation plays fully first (~550 ms), then the monster's animation fires. Action buttons are locked during the sequence to prevent double-inputs.
- **Monster spell animations** — spells have dedicated visual effects separate from the ability animation overlay.
- **Skills section moved below attributes** in the Character tab, with added spacing between the two sections.
- **Item tooltips repositioned** — tooltips now appear to the right of the item icon instead of above, preventing clipping at the top of the paperdoll.
- **Potion stack cap** — each potion type is capped at 5. The shop shows "Full (5/5)" and disables the buy button when the cap is reached.

### Balance

| Change | Before | After |
|---|---|---|
| Thick Hide damage reduction cap | 40% (200 Dex) | 25% (125 Dex) |
| Soul Siphon poison lifesteal | 20% | 10% |
| Barbarian crit multiplier | ×1.75 | ×1.25 |
| Druid Werewolf Bite cooldown | 2 turns | 3 turns |
| Druid Werewolf Bite lifesteal | 50% | 15% |

### Items

- **Normal (white) items** no longer roll any affixes — they show only their base stat (damage or defense).
- **Jewelry (rings, amulets)** is now minimum **Magic** rarity in both drops and shops. White jewelry no longer exists.

### Bug Fixes

- Equipping an axe (or any weapon) into the offhand slot no longer changes its icon to a shield.
- Items no longer appear dimmed (50% opacity) after being drag-dropped into a new slot. The `dragging` CSS class was persisting because `dragEnd` did not fire when the source element unmounted during a drop.
- Fixed the scythe blade shape — the blade now hooks downward at the tip (proper crescent/sickle profile) instead of curving flat like a hockey stick.
