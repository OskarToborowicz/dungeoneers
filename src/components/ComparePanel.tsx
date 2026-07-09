import { RARITY_COLORS } from "../game/data/items";
import { sortAffixes, UniqueEffectLines } from "./ItemTooltip";
import type { EquipmentSlot, Item } from "../game/types";

const STAT_LABEL: Record<string, string> = {
  strength: "Strength", dexterity: "Dexterity", vitality: "Vitality", energy: "Energy",
  damage: "Damage", defense: "Defense", life: "Life", mana: "Mana",
  magicDamage: "Magic Damage", goldFind: "% Gold Find", lifeLeech: "% Life Leech",
  manaRegen: "Mana Regen / Turn", magicDmgReduction: "% Magic Damage Reduced",
  physDmgReduction: "% Physical Damage Reduced",
};

export function getComparisons(slot: EquipmentSlot, equipment: Partial<Record<EquipmentSlot, Item>>, hoveredItem?: { twoHanded?: boolean }): { item: Item; label: string }[] {
  if (slot === "ring1" || slot === "ring2") {
    const result: { item: Item; label: string }[] = [];
    if (equipment.ring1) result.push({ item: equipment.ring1, label: "Ring slot 1" });
    if (equipment.ring2) result.push({ item: equipment.ring2, label: "Ring slot 2" });
    return result;
  }
  if (slot === "weapon" && !hoveredItem?.twoHanded) {
    const result: { item: Item; label: string }[] = [];
    if (equipment.weapon) result.push({ item: equipment.weapon, label: "Main hand" });
    if (equipment.shield) result.push({ item: equipment.shield, label: "Off hand" });
    return result;
  }
  const equipped = equipment[slot];
  return equipped ? [{ item: equipped, label: "Equipped" }] : [];
}

export function CompareGroup({ slot, equipment, hoveredItem }: { slot: EquipmentSlot; equipment: Partial<Record<EquipmentSlot, Item>>; hoveredItem?: { twoHanded?: boolean } }) {
  const comparisons = getComparisons(slot, equipment, hoveredItem);
  if (comparisons.length === 0) return null;
  return (
    <div className="compare-group">
      {comparisons.map(({ item, label }) => (
        <ComparePanel key={item.id} item={item} label={label} />
      ))}
    </div>
  );
}

function ComparePanel({ item, label }: { item: Item; label: string }) {
  const color = RARITY_COLORS[item.rarity];
  return (
    <div className="compare-panel" style={{ borderColor: color }}>
      <div className="compare-label">{label}</div>
      <div className="item-name" style={{ color }}>{item.name}</div>
      <div className="item-meta">{item.slot} &middot; ilvl {item.itemLevel}</div>
      {item.baseDamage && <div className="item-line">Damage: {item.baseDamage[0]}-{item.baseDamage[1]}{item.twoHanded ? " (2H)" : ""}</div>}
      {item.baseDefense && <div className="item-line">Defense: {item.baseDefense}</div>}
      {sortAffixes(item.affixes).map((a, i) => (
        <div className="item-line affix" key={i}>+{a.value} {STAT_LABEL[a.stat]}</div>
      ))}
      <UniqueEffectLines item={item} />
    </div>
  );
}
