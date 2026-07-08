import { RARITY_COLORS } from "../game/data/items";
import type { Item } from "../game/types";

const STAT_LABEL: Record<string, string> = {
  strength: "Strength",
  dexterity: "Dexterity",
  vitality: "Vitality",
  energy: "Energy",
  damage: "Damage",
  defense: "Defense",
  life: "Life",
  mana: "Mana",
  magicDamage: "Magic Damage",
  goldFind: "% Gold Find",
  lifeLeech: "% Life Leech",
  manaRegen: "Mana Regen / Turn",
  magicDmgReduction: "% Magic Damage Reduced",
  physDmgReduction: "% Physical Damage Reduced",
  critChance: "% Crit Chance",
};

export function ItemTooltip({ item }: { item: Item }) {
  const color = RARITY_COLORS[item.rarity];
  return (
    <div className="item-tooltip" style={{ borderColor: color }}>
      <div className="item-name" style={{ color }}>
        {item.name}
      </div>
      <div className="item-meta">
        {item.slot} &middot; ilvl {item.itemLevel}
      </div>
      {item.baseDamage && (
        <div className="item-line">
          Damage: {item.baseDamage[0]}-{item.baseDamage[1]}
          {item.twoHanded ? " (Two-Handed)" : ""}
        </div>
      )}
      {item.baseDefense && <div className="item-line">Defense: {item.baseDefense}</div>}
      {item.mirrorRing
        ? <div className="item-line mirror-flavor"><em>Mirrors the other ring</em></div>
        : item.demonsTail
        ? (
          <>
            <div className="item-line mirror-flavor"><em>All your damage ignite the target for 30% of damage dealt for 2 rounds</em></div>
            <div className="item-line mirror-flavor"><em>Set the world ablaze</em></div>
          </>
        )
        : (
          <>
            {item.affixes.map((a, i) => (
              <div className="item-line affix" key={i}>
                {a.value > 0 ? "+" : ""}{a.value} {STAT_LABEL[a.stat]}
              </div>
            ))}
            {item.reapersHood && (
              <div className="item-line mirror-flavor"><em>20% chance to disorient on attack for 2 turns</em></div>
            )}
            {item.harvester && (
              <div className="item-line mirror-flavor"><em>It's time to die.</em></div>
            )}
          </>
        )}
    </div>
  );
}
