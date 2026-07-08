import { CLASSES } from "../game/data/classes";
import type { DerivedStats } from "../game/character";
import { xpToNextLevel } from "../game/character";
import { getEffectiveCritChance, getAbilityPreview, getAbility2Preview } from "../game/combat";
import type { BaseStats, Character } from "../game/types";

interface Props {
  character: Character;
  derived: DerivedStats;
  onAllocate: (stat: keyof BaseStats) => void;
}

export function CharacterTab({ character, derived, onAllocate }: Props) {
  const def = CLASSES[character.classId];
  const xpNeeded = xpToNextLevel(character.level);
  const critChance = getEffectiveCritChance(character, derived);
  const abilityPreview = getAbilityPreview(character, derived);
  const ability2Preview = getAbility2Preview(character, derived);

  return (
    <div className="tab-panel">
      <div className="hero-header">
        <h2>
          {character.name} <span className="class-tag">the {def.name}</span>
        </h2>
        <div className="level-line">Level {character.level}</div>
      </div>

      <div className="xp-bar">
        <div className="xp-bar-fill" style={{ width: `${(character.xp / xpNeeded) * 100}%` }} />
        <span className="xp-bar-label">
          {character.xp} / {xpNeeded} XP
        </span>
      </div>

      <div className="derived-grid">
        <div>Life: {derived.maxLife}</div>
        <div>{def.resourceName}: {derived.maxMana}</div>
        <div>Damage: {derived.damage[0]}-{derived.damage[1]}</div>
        <div>Defense: {derived.defense}</div>
        <div>Spell Bonus: +{derived.magicDamageBonus} dmg</div>
        <div>Crit Chance: {Math.round(critChance * 100)}%</div>
      </div>

      <h3>Attributes {character.unspentStatPoints > 0 && `(${character.unspentStatPoints} points to spend)`}</h3>
      <div className="allocate-grid">
        {(["strength", "dexterity", "vitality", "energy"] as const).map((stat) => (
          <div className="allocate-row" key={stat}>
            <span className="stat-name">{stat}</span>
            <span className="stat-value">{Math.round(derived.stats[stat])}</span>
            <button
              disabled={character.unspentStatPoints <= 0}
              onClick={() => onAllocate(stat)}
              className={`allocate-button${character.unspentStatPoints > 0 ? " allocate-button--glow" : ""}`}
            >
              +
            </button>
          </div>
        ))}
      </div>

      <div className="ability-box">
        <strong>{def.ability.name}{def.ability.magic && <span className="spell-tag" title="This ability scales with Magic Damage bonus"><svg width="11" height="11" viewBox="0 0 12 12"><path d="M6 1 L6.7 4.5 L10 3 L7.5 5.8 L11 6 L7.5 6.2 L10 9 L6.7 7.5 L6 11 L5.3 7.5 L2 9 L4.5 6.2 L1 6 L4.5 5.8 L2 3 L5.3 4.5 Z" fill="#88aaff"/></svg></span>}</strong>
        <div className="ability-cost">
          {def.resourceName}: {def.ability.manaCost}
          {def.ability.cooldown > 0 ? ` · ${def.ability.cooldown}-turn cooldown` : ""}
        </div>
        <p>{def.ability.description}</p>
        {abilityPreview.label !== "—" && (
          <div className="ability-est">Est. {abilityPreview.label} {abilityPreview.type}</div>
        )}
      </div>

      {def.ability2 && (
        <div className="ability-box">
          <strong>{def.ability2.name}{def.ability2.magic && <span className="spell-tag" title="This ability scales with Magic Damage bonus"><svg width="11" height="11" viewBox="0 0 12 12"><path d="M6 1 L6.7 4.5 L10 3 L7.5 5.8 L11 6 L7.5 6.2 L10 9 L6.7 7.5 L6 11 L5.3 7.5 L2 9 L4.5 6.2 L1 6 L4.5 5.8 L2 3 L5.3 4.5 Z" fill="#88aaff"/></svg></span>}</strong>
          <div className="ability-cost">
            {def.resourceName}: {def.ability2.manaCost} · {def.ability2.cooldown}-turn cooldown
          </div>
          <p>{def.ability2.description}</p>
          {ability2Preview.label !== "—" && (
            <div className="ability-est">Est. {ability2Preview.label} {ability2Preview.type}</div>
          )}
        </div>
      )}

      <div className="ability-box passive-box">
        <strong>{def.passive.name}</strong>
        <p>{def.passive.description}</p>
      </div>

      {def.passive2 && (
        character.level >= def.passive2.levelRequirement ? (
          <div className="ability-box passive-box">
            <strong>{def.passive2.name}</strong>
            <p>{def.passive2.description}</p>
          </div>
        ) : (
          <div className="ability-box passive-box passive-locked">
            <strong>{def.passive2.name} <span className="passive-lock-level">(unlocks at level {def.passive2.levelRequirement})</span></strong>
            <p>{def.passive2.description}</p>
          </div>
        )
      )}

      {def.passive3 && (
        character.level >= def.passive3.levelRequirement ? (
          <div className="ability-box passive-box">
            <strong>{def.passive3.name}</strong>
            <p>{def.passive3.description}</p>
          </div>
        ) : (
          <div className="ability-box passive-box passive-locked">
            <strong>{def.passive3.name} <span className="passive-lock-level">(unlocks at level {def.passive3.levelRequirement})</span></strong>
            <p>{def.passive3.description}</p>
          </div>
        )
      )}
    </div>
  );
}
