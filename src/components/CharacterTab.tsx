import { CLASSES } from "../game/data/classes";
import type { DerivedStats } from "../game/character";
import { xpToNextLevel } from "../game/character";
import {
  getEffectiveCritChance,
  getAbilityPreview,
  getAbility2Preview,
} from "../game/combat";
import type { BaseStats, Character } from "../game/types";

export const STAT_ICONS: Record<
  string,
  { bg: string; tip: string; svg: React.ReactNode }
> = {
  strength: {
    bg: "#b84a14",
    tip: "Increases physical damage",
    svg: (
      <>
        <polygon points="6,0.5 7,7 5,7" fill="white" />
        <rect x="2" y="7" width="8" height="1.2" rx="0.4" fill="white" />
        <rect x="5.3" y="8.2" width="1.4" height="2.5" rx="0.5" fill="white" />
        <circle cx="6" cy="11.2" r="0.8" fill="white" />
      </>
    ),
  },
  dexterity: {
    bg: "#1a7230",
    tip: "Slightly increases physical damage and critical strike chance",
    svg: (
      <>
        <path
          d="M6 1 C2 4 2 8 6 11"
          fill="none"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <line x1="6" y1="1" x2="6" y2="11" stroke="white" strokeWidth="0.8" />
        <line
          x1="1"
          y1="6"
          x2="11"
          y2="6"
          stroke="white"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <polygon points="11,6 9.5,5 9.5,7" fill="white" />
        <path
          d="M1 6 L2.5 4.5 M1 6 L2.5 7.5"
          stroke="white"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
        />
      </>
    ),
  },
  vitality: {
    bg: "#9a1515",
    tip: "Increases maximum life and defense",
    svg: (
      <path
        d="M6 10.5 C5 9 1.5 6.5 1.5 4 A2.6 2.6 0 0 1 6 3.5 A2.6 2.6 0 0 1 10.5 4 C10.5 6.5 7 9 6 10.5Z"
        fill="white"
      />
    ),
  },
  energy: {
    bg: "#1a3a9a",
    tip: "Increases maximum mana and magic damage",
    svg: (
      <>
        <path
          d="M6 2 C3.5 2 2 3.5 2 5 C2 6.2 2.8 7 4 7.3 C3 7.8 2 8.8 2 9.8 C2 10.8 3 11.5 4.5 11.5 L6 11.5"
          fill="none"
          stroke="white"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <path
          d="M6 2 C8.5 2 10 3.5 10 5 C10 6.2 9.2 7 8 7.3 C9 7.8 10 8.8 10 9.8 C10 10.8 9 11.5 7.5 11.5 L6 11.5"
          fill="none"
          stroke="white"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <line
          x1="6"
          y1="3"
          x2="6"
          y2="10.5"
          stroke="white"
          strokeWidth="0.7"
          strokeDasharray="1.5 1"
        />
      </>
    ),
  },
};

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
        <div
          className="xp-bar-fill"
          style={{ width: `${(character.xp / xpNeeded) * 100}%` }}
        />
        <span className="xp-bar-label">
          {character.xp} / {xpNeeded} XP
        </span>
      </div>

      <div className="char-stats-layout">
        <div>
          <h3>
            Attributes{" "}
            {character.unspentStatPoints > 0 &&
              `(${character.unspentStatPoints} points to spend)`}
          </h3>
          <div className="allocate-grid">
            {(["strength", "dexterity", "vitality", "energy"] as const).map(
              (stat) => (
                <div className="allocate-row" key={stat}>
                  <span className="stat-name">
                    {stat}
                    {STAT_ICONS[stat] && (
                      <span className="stat-icon">
                        <svg
                          viewBox="0 0 12 12"
                          width="13"
                          height="13"
                          style={{
                            background: STAT_ICONS[stat].bg,
                            borderRadius: 2,
                          }}
                        >
                          {STAT_ICONS[stat].svg}
                        </svg>
                        <div className="game-tooltip">
                          {STAT_ICONS[stat].tip}
                        </div>
                      </span>
                    )}
                  </span>
                  <span className="stat-value-wrap">
                    <span className="stat-value">
                      {Math.round(derived.stats[stat])}
                    </span>
                    <div className="game-tooltip">
                      <div>Allocated: {def.baseStats[stat] + character.allocatedStats[stat]}</div>
                      {Math.round(derived.stats[stat]) - def.baseStats[stat] - character.allocatedStats[stat] !== 0 && (
                        <div>From items: {Math.round(derived.stats[stat]) - def.baseStats[stat] - character.allocatedStats[stat]}</div>
                      )}
                    </div>
                  </span>
                  <button
                    disabled={character.unspentStatPoints <= 0}
                    onClick={() => onAllocate(stat)}
                    className={`allocate-button${character.unspentStatPoints > 0 ? " allocate-button--glow" : ""}`}
                  >
                    +
                  </button>
                </div>
              ),
            )}
          </div>
        </div>
        <div>
          <h3>Stats</h3>
          <div className="derived-grid">
            <div>❤️ Life: {derived.maxLife}</div>
            <div>
              🔵 {def.resourceName}: {derived.maxMana}
            </div>
            <div>
              ⚔️ Damage: {derived.damage[0]}-{derived.damage[1]}
            </div>
            <div>🛡️Defense: {derived.defense}</div>
            <div>🌀Magic Damage: +{derived.magicDamageBonus}</div>
            <div>🎯Crit Chance: {Math.round(critChance * 100)}%</div>
          </div>
        </div>
      </div>
      <div className="ability-box">
        <strong>
          {def.ability.name}
          {def.ability.magic && (
            <span className="spell-tag">
              <svg width="11" height="11" viewBox="0 0 12 12">
                <path
                  d="M6 1 L6.7 4.5 L10 3 L7.5 5.8 L11 6 L7.5 6.2 L10 9 L6.7 7.5 L6 11 L5.3 7.5 L2 9 L4.5 6.2 L1 6 L4.5 5.8 L2 3 L5.3 4.5 Z"
                  fill="#88aaff"
                />
              </svg>
              <div className="game-tooltip">Scales with Magic Damage bonus</div>
            </span>
          )}
        </strong>
        <div className="ability-cost">
          {def.resourceName}: {def.ability.manaCost}
          {def.ability.cooldown > 0
            ? ` · ${def.ability.cooldown}-turn cooldown`
            : ""}
        </div>
        <p>{def.ability.description}</p>
        {abilityPreview.label !== "—" && (
          <div className="ability-est">
            Est. {abilityPreview.label} {abilityPreview.type}
          </div>
        )}
      </div>

      {def.ability2 && (
        <div className="ability-box">
          <strong>
            {def.ability2.name}
            {def.ability2.magic && (
              <span className="spell-tag">
                <svg width="11" height="11" viewBox="0 0 12 12">
                  <path
                    d="M6 1 L6.7 4.5 L10 3 L7.5 5.8 L11 6 L7.5 6.2 L10 9 L6.7 7.5 L6 11 L5.3 7.5 L2 9 L4.5 6.2 L1 6 L4.5 5.8 L2 3 L5.3 4.5 Z"
                    fill="#88aaff"
                  />
                </svg>
                <div className="game-tooltip">
                  Scales with Magic Damage bonus
                </div>
              </span>
            )}
          </strong>
          <div className="ability-cost">
            {def.resourceName}: {def.ability2.manaCost} ·{" "}
            {def.ability2.cooldown}-turn cooldown
          </div>
          <p>{def.ability2.description}</p>
          {ability2Preview.label !== "—" && (
            <div className="ability-est">
              Est. {ability2Preview.label} {ability2Preview.type}
            </div>
          )}
        </div>
      )}

      <div className="ability-box passive-box">
        <strong>{def.passive.name}</strong>
        <p>{def.passive.description}</p>
      </div>

      {def.passive2 &&
        (character.level >= def.passive2.levelRequirement ? (
          <div className="ability-box passive-box">
            <strong>{def.passive2.name}</strong>
            <p>{def.passive2.description}</p>
          </div>
        ) : (
          <div className="ability-box passive-box passive-locked">
            <strong>
              {def.passive2.name}{" "}
              <span className="passive-lock-level">
                (unlocks at level {def.passive2.levelRequirement})
              </span>
            </strong>
            <p>{def.passive2.description}</p>
          </div>
        ))}

      {def.passive3 &&
        (character.level >= def.passive3.levelRequirement ? (
          <div className="ability-box passive-box">
            <strong>{def.passive3.name}</strong>
            <p>{def.passive3.description}</p>
          </div>
        ) : (
          <div className="ability-box passive-box passive-locked">
            <strong>
              {def.passive3.name}{" "}
              <span className="passive-lock-level">
                (unlocks at level {def.passive3.levelRequirement})
              </span>
            </strong>
            <p>{def.passive3.description}</p>
          </div>
        ))}
    </div>
  );
}
