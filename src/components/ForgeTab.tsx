import { useState } from "react";
import { ItemTooltip, STAT_LABEL } from "./ItemTooltip";
import { useItemHover } from "./useItemHover";
import type { Character, Item, ItemAffix } from "../game/types";
import { RARITY_COLORS, forgeRerollCap, forgeRerollsLeft } from "../game/data/items";

function formatAffix(affix: ItemAffix): string {
  const label = STAT_LABEL[affix.stat] ?? affix.stat;
  const val = Number.isInteger(affix.value) ? affix.value : affix.value.toFixed(1);
  return `+${val} ${label}`;
}

interface Props {
  character: Character;
  inventory: Item[];
  onAddAffix: (itemId: string) => void;
  onRerollAffix: (itemId: string, affixIndex: number) => void;
}

export function ForgeTab({ character, inventory, onAddAffix, onRerollAffix }: Props) {
  const [forgeItemId, setForgeItemId] = useState<string | null>(null);
  const [selectedAffixIdx, setSelectedAffixIdx] = useState<number | null>(null);
  const { hovered, onMouseEnter, onMouseLeave, tooltipStyle } = useItemHover();

  const rares = inventory.filter((i) => i.rarity === "rare");
  const forgeItem = forgeItemId ? inventory.find((i) => i.id === forgeItemId) : null;

  const alloys = character.frozenAlloys ?? 0;
  const canAct = alloys > 0;

  function handlePlaceItem(item: Item) {
    setForgeItemId(item.id);
    setSelectedAffixIdx(null);
  }

  function handleClear() {
    setForgeItemId(null);
    setSelectedAffixIdx(null);
  }

  function handleConfirmReroll() {
    if (!forgeItem) return;
    const lockedIdx = forgeItem.lockedAffixIndex;
    const idx = lockedIdx ?? selectedAffixIdx;
    if (idx == null) return;
    onRerollAffix(forgeItem.id, idx);
    setSelectedAffixIdx(null);
  }

  const isThreeAffix = forgeItem?.affixes.length === 3;
  const isFourAffix = (forgeItem?.affixes.length ?? 0) >= 4;
  const lockedIdx = forgeItem?.lockedAffixIndex;
  const rerollCap = forgeItem ? forgeRerollCap(forgeItem) : 0;
  const rerollsLeft = forgeItem ? forgeRerollsLeft(forgeItem) : 0;
  const canReroll = canAct && rerollsLeft > 0;

  return (
    <div className="forge-tab">
      <div className="forge-header">
        <h2 className="forge-title">The Forge</h2>
        <div className="forge-alloy-count">
          <span className="alloy-icon">❄</span>
          {alloys}/10 Frozen Alloys
        </div>
      </div>

      <div className="forge-body">
        <div className="forge-slot-area">
          <div className="forge-slot-label">Place a rare item</div>
          {forgeItem ? (
            <div className="forge-item-card">
              <div
                className="forge-item-name"
                style={{ color: RARITY_COLORS[forgeItem.rarity] }}
              >
                {forgeItem.name}
              </div>
              <div className="forge-affixes">
                {forgeItem.affixes.map((affix, i) => {
                  const isLocked = lockedIdx === i;
                  const isOther = lockedIdx != null && lockedIdx !== i;
                  const isSelected = selectedAffixIdx === i && lockedIdx == null;

                  if (isThreeAffix) {
                    return (
                      <div key={i} className="forge-affix-row forge-affix-static">
                        <span className="forge-affix-label">{formatAffix(affix)}</span>
                      </div>
                    );
                  }

                  const clickable = lockedIdx == null;
                  const isDepleted = isLocked && rerollsLeft <= 0;
                  return (
                    <button
                      key={i}
                      className={`forge-affix-row${isLocked ? " forge-affix-locked" : ""}${isOther ? " forge-affix-other" : ""}${isSelected ? " forge-affix-selected" : ""}${isDepleted ? " forge-affix-depleted" : ""}`}
                      disabled={isOther}
                      onClick={() => clickable && setSelectedAffixIdx(i === selectedAffixIdx ? null : i)}
                    >
                      <span className="forge-affix-label">{formatAffix(affix)}</span>
                      {isLocked && <span className="forge-affix-lock-badge">↺</span>}
                      {isSelected && <span className="forge-affix-lock-badge">✓</span>}
                    </button>
                  );
                })}
              </div>
              {isThreeAffix && (
                <button
                  className="forge-action-btn"
                  disabled={!canAct}
                  onClick={() => onAddAffix(forgeItem.id)}
                >
                  {canAct ? "Add 4th Affix (1 ❄)" : "No Frozen Alloys"}
                </button>
              )}
              {isFourAffix && (
                <p className="forge-reroll-count">
                  Rolls left: {rerollsLeft}/{rerollCap}
                </p>
              )}
              {isFourAffix && rerollsLeft <= 0 && (
                <p className="forge-hint">No rolls left for this item</p>
              )}
              {isFourAffix && rerollsLeft > 0 && lockedIdx == null && selectedAffixIdx == null && (
                <p className="forge-hint">Select an affix to roll</p>
              )}
              {isFourAffix && rerollsLeft > 0 && lockedIdx == null && selectedAffixIdx != null && (
                <div className="forge-confirm-row">
                  <span className="forge-confirm-label">
                    Roll {formatAffix(forgeItem.affixes[selectedAffixIdx])}?
                  </span>
                  <div className="forge-confirm-btns">
                    <button
                      className="forge-confirm-yes"
                      disabled={!canReroll}
                      onClick={handleConfirmReroll}
                    >
                      Yes (1 ❄)
                    </button>
                    <button
                      className="forge-confirm-no"
                      onClick={() => setSelectedAffixIdx(null)}
                    >
                      No
                    </button>
                  </div>
                </div>
              )}
              {isFourAffix && rerollsLeft > 0 && lockedIdx != null && (
                <div className="forge-confirm-row">
                  <span className="forge-confirm-label">Roll again?</span>
                  <div className="forge-confirm-btns">
                    <button
                      className="forge-confirm-yes"
                      disabled={!canReroll}
                      onClick={handleConfirmReroll}
                    >
                      Yes (1 ❄)
                    </button>
                  </div>
                </div>
              )}
              <button className="forge-clear-btn" onClick={handleClear}>
                Remove Item
              </button>
            </div>
          ) : (
            <div className="forge-slot-empty">No item placed</div>
          )}
        </div>

        <div className="forge-inventory">
          <div className="forge-inv-label">Rare Items in Inventory</div>
          {rares.length === 0 ? (
            <p className="forge-no-rares">No rare items in inventory.</p>
          ) : (
            <div className="forge-inv-grid">
              {rares.map((item) => {
                const maxed =
                  item.affixes.length >= 4 && forgeRerollsLeft(item) <= 0;
                return (
                  <button
                    key={item.id}
                    className={`forge-inv-cell${forgeItemId === item.id ? " forge-inv-selected" : ""}${maxed ? " forge-inv-maxed" : ""}`}
                    style={{ color: RARITY_COLORS[item.rarity] }}
                    onClick={() => handlePlaceItem(item)}
                    onMouseEnter={(e) => onMouseEnter(item, e)}
                    onMouseLeave={onMouseLeave}
                  >
                    {item.name}
                    <span className={`forge-inv-affixes${item.affixes.length >= 4 ? " forge-inv-affixes--four" : ""}`}>
                      {item.affixes.length} affixes
                    </span>
                    {maxed && (
                      <span className="forge-inv-maxed-badge">depleted</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {hovered && tooltipStyle() && (
        <div style={tooltipStyle()!} className="item-tooltip-portal">
          <ItemTooltip item={hovered.item} />
        </div>
      )}
    </div>
  );
}
