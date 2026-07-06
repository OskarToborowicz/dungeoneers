import { CLASSES } from "../game/data/classes";
import type { DerivedStats } from "../game/character";
import { xpToNextLevel } from "../game/character";
import { getEffectiveCritChance } from "../game/combat";
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
        <div>Skill Damage: +{Math.round((derived.magicDamageMultiplier - 1) * 100)}%</div>
        <div>Crit Chance: {Math.round(critChance * 100)}%</div>
      </div>

      <div className="ability-box">
        <strong>{def.ability.name}</strong>
        <p>{def.ability.description}</p>
      </div>

      <div className="ability-box passive-box">
        <strong>{def.passive.name}</strong>
        <p>{def.passive.description}</p>
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
              className="allocate-button"
            >
              +
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
