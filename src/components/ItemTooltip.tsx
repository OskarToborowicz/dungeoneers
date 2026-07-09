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

const AFFIX_ORDER: Record<string, number> = {
  defense: 0,
  damage: 1,
  magicDamage: 2,
  strength: 3,
  dexterity: 4,
  vitality: 5,
  energy: 6,
};

export function sortAffixes(affixes: Item["affixes"]) {
  return [...affixes].sort((a, b) => {
    const oa = AFFIX_ORDER[a.stat] ?? 99;
    const ob = AFFIX_ORDER[b.stat] ?? 99;
    return oa - ob;
  });
}

export function UniqueEffectLines({ item }: { item: Item }) {
  if (item.mirrorRing) return <div className="item-line mirror-flavor"><em>Mirrors the other ring</em></div>;
  if (item.demonsTail) return (
    <>
      <div className="item-line mirror-flavor"><em>All your damage ignite the target for 30% of damage dealt for 2 rounds</em></div>
      <div className="item-line mirror-flavor"><em>Set the world ablaze</em></div>
    </>
  );
  return (
    <>
      {item.reapersHood && <div className="item-line mirror-flavor"><em>20% chance to disorient on attack for 2 turns</em></div>}
      {item.harvester && <div className="item-line mirror-flavor"><em>It's time to die.</em></div>}
      {item.venomweaveWrap && <div className="item-line mirror-flavor"><em>+25% Poison Damage</em></div>}
      {item.thornback && <div className="item-line mirror-flavor"><em>Reflects 10% of physical damage taken back to the attacker</em></div>}
      {item.eyeOfTheStorm && <div className="item-line mirror-flavor"><em>+15% Mana Regeneration</em></div>}
      {item.boneweaveGloves && <div className="item-line mirror-flavor"><em>5% chance to reduce an incoming hit to 1 damage</em></div>}
      {item.crownOfTheFallen && <div className="item-line mirror-flavor"><em>While below 30% life, all damage dealt is increased by 25%</em></div>}
      {item.stormstring && <div className="item-line mirror-flavor"><em>100% chance to Electrocute on hit — enemy takes 20% increased damage for 2 turns</em></div>}
      {item.doomcrier && <div className="item-line mirror-flavor"><em>Heartseeker fires at 70% of damage dealt instead of 50%</em></div>}
    </>
  );
}

export function ItemTooltip({ item }: { item: Item }) {
  const color = RARITY_COLORS[item.rarity];
  return (
    <div className="item-tooltip" style={{ borderColor: color }}>
      <div className="item-name" style={{ color }}>{item.name}</div>
      <div className="item-meta">{item.slot} &middot; ilvl {item.itemLevel}</div>
      {item.baseDamage && (
        <div className="item-line">
          Damage: {item.baseDamage[0]}-{item.baseDamage[1]}
          {item.twoHanded ? " (Two-Handed)" : ""}
        </div>
      )}
      {item.baseDefense && <div className="item-line">Defense: {item.baseDefense}</div>}
      {!item.mirrorRing && !item.demonsTail && sortAffixes(item.affixes).map((a, i) => (
        <div className="item-line affix" key={i}>{a.value > 0 ? "+" : ""}{a.value} {STAT_LABEL[a.stat]}</div>
      ))}
      <UniqueEffectLines item={item} />
    </div>
  );
}
