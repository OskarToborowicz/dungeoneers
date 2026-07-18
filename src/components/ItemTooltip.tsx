import { RARITY_COLORS } from "../game/data/items";
import type { Item } from "../game/types";

export const STAT_LABEL: Record<string, string> = {
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
  magicDmgReduction: "% Magic Damage Reduced",
  physDmgReduction: "% Physical Damage Reduced",
  critChance: "% Crit Chance",
  critDamageBonus: "% Critical Strike Damage",
  freezeOnHit: "% to Freeze",
  igniteOnHit: "% to Ignite",
  poisonOnHit: "% to Poison",
  shockOnHit: "% to Electrocute",
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
  if (item.mirrorRing)
    return (
      <div className="item-line mirror-flavor">
        <em>Mirrors the other ring</em>
      </div>
    );
  if (item.demonsTail)
    return (
      <>
        <div className="item-line mirror-flavor">
          <em>
            All your damage ignite the target for 25% of damage dealt for 2
            rounds
          </em>
        </div>
        <div className="item-line mirror-flavor">
          <em>Set the world ablaze</em>
        </div>
      </>
    );
  return (
    <>
      {item.reapersHood && (
        <div className="item-line mirror-flavor">
          <em>20% chance to disorient on attack for 2 turns</em>
        </div>
      )}
      {item.venomweaveWrap && (
        <div className="item-line mirror-flavor">
          <em>+10% Poison Damage</em>
        </div>
      )}
      {item.thornback && (
        <div className="item-line mirror-flavor">
          <em>Reflects 10% of physical damage taken back to the attacker</em>
        </div>
      )}
      {item.eyeOfTheStorm && (
        <div className="item-line mirror-flavor">
          <em>+15% Mana Regeneration</em>
        </div>
      )}
      {item.boneweaveGloves && (
        <div className="item-line mirror-flavor">
          <em>5% chance to reduce an incoming hit to 1 damage</em>
        </div>
      )}
      {item.crownOfTheFallen && (
        <div className="item-line mirror-flavor">
          <em>While below 40% life, all damage dealt is increased by 25%</em>
        </div>
      )}
      {item.stormstring && (
        <div className="item-line mirror-flavor">
          <em>
            100% chance to Electrocute on hit — enemy takes 20% increased damage
            for 2 turns
          </em>
        </div>
      )}
      {item.doomcrier && (
        <div className="item-line mirror-flavor">
          <em>Heartseeker fires at 70% of damage dealt instead of 50%</em>
        </div>
      )}
      {item.shadowfang && (
        <div className="item-line mirror-flavor">
          <em>
            20% chance to call forth a phantom strike for 50% of hit damage
          </em>
        </div>
      )}
      {item.spellbladesMask && (
        <div className="item-line mirror-flavor">
          <em>
            Adds 10% of damage dealt as magic to each attack. Scales with magic
            damage bonus.
          </em>
        </div>
      )}
      {item.apprenticesFocus && (
        <div className="item-line mirror-flavor">
          <em>Carved for eager hands, not yet hardened by battle</em>
        </div>
      )}
      {item.arcanist && (
        <div className="item-line mirror-flavor">
          <em>
            While Frost Shield is active, Frost Bolt deals 40% increased
            damage
          </em>
        </div>
      )}
      {item.eternitysEdge && (
        <div className="item-line mirror-flavor">
          <em>30% chance for Frost Bolt to echo at 50% power</em>
        </div>
      )}
      {item.aegisOfTheFortress && (
        <div className="item-line mirror-flavor">
          <em>15% chance to completely block incoming physical damage</em>
        </div>
      )}
      {item.penitentsGuard && (
        <div className="item-line mirror-flavor">
          <em>After taking physical damage, 18% chance to retaliate for weapon damage (magic)</em>
        </div>
      )}
      {item.stoneguard && (
        <div className="item-line mirror-flavor">
          <em>Reflects 20% of physical damage taken back at the attacker</em>
        </div>
      )}
      {item.heavensWrath && (
        <div className="item-line mirror-flavor">
          <em>12% chance to block physical attacks; on block, restore 8% of max life</em>
        </div>
      )}
      {item.graveToll && (
        <div className="item-line mirror-flavor">
          <em>Soul Siphon heals 20% of damage dealt instead of 15%</em>
        </div>
      )}
      {item.bonechill && (
        <div className="item-line mirror-flavor">
          <em>Soul Siphon healing is doubled for the first 3 turns of each combat</em>
        </div>
      )}
      {item.ebonreap && (
        <div className="item-line mirror-flavor">
          <em>Every 3rd basic attack conjures a spectral strike for 80% weapon damage (magic)</em>
        </div>
      )}
      {item.stormfist && (
        <div className="item-line mirror-flavor">
          <em>Spinning Crane Kick strikes 4 times instead of 3</em>
        </div>
      )}
      {item.ironcladHauberk && (
        <div className="item-line mirror-flavor">
          <em>Reduce all incoming damage by a flat 5 before other reductions</em>
        </div>
      )}
      {item.theGavel && (
        <div className="item-line mirror-flavor">
          <em>Once wielded by a mighty carpenter</em>
        </div>
      )}
      {item.voidgaze && (
        <div className="item-line mirror-flavor">
          <em>15% chance to disorient an attacker for 2 turns when hit</em>
        </div>
      )}
      {item.bastionsRemnant && (
        <div className="item-line mirror-flavor">
          <em>+12% physical damage reduction while below 50% life</em>
        </div>
      )}
      {item.bloodfist && (
        <div className="item-line mirror-flavor">
          <em>Critical hits restore 5% of max life</em>
        </div>
      )}
      {item.soulvoidGirdle && (
        <div className="item-line mirror-flavor">
          <em>Your first ability use each combat deals {item.openerBonusPct ?? 20}% increased damage</em>
        </div>
      )}
      {item.forsakenSigil && (
        <div className="item-line mirror-flavor">
          <em>+15% damage against poisoned or burning enemies</em>
        </div>
      )}
    </>
  );
}

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
      {item.baseDefense && (
        <div className="item-line">Defense: {item.baseDefense}</div>
      )}
      {!item.mirrorRing &&
        !item.demonsTail &&
        sortAffixes(item.affixes).map((a, i) => (
          <div className="item-line affix" key={i}>
            {a.value > 0 ? "+" : ""}
            {Number.isInteger(a.value) ? a.value : a.value.toFixed(1)} {STAT_LABEL[a.stat]}
          </div>
        ))}
      <UniqueEffectLines item={item} />
    </div>
  );
}
