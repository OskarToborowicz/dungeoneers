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
      {item.affixes.map((a, i) => (
        <div className="item-line affix" key={i}>
          +{a.value} {STAT_LABEL[a.stat]}
        </div>
      ))}
    </div>
  );
}
