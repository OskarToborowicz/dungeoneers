import { useState } from "react";
import { CLASSES } from "../game/data/classes";
import {
  CONSUMABLE_LIST,
  getPotionCost,
  getPotionRestoreRate,
} from "../game/data/consumables";
import { buyValue, RARITY_COLORS, sellValue } from "../game/data/items";
import { ItemIcon } from "./ItemIcon";
import { ItemTooltip } from "./ItemTooltip";
import { CompareGroup } from "./ComparePanel";
import { CoinIcon } from "./CoinIcon";
import { useItemHover } from "./useItemHover";
import type {
  Character,
  ConsumableId,
  EquipmentSlot,
  Item,
} from "../game/types";

interface Props {
  character: Character;
  equipment: Partial<Record<EquipmentSlot, Item>>;
  consumables: Record<ConsumableId, number>;
  shopStock: Item[];
  inventory: Item[];
  clearedDungeons: string[];
  onBuyConsumable: (id: ConsumableId) => void;
  onBuyItem: (item: Item) => void;
  onRestock: () => void;
  restockFee: number;
  onToggleFavorite: (itemId: string) => void;
  onSort: () => void;
  onSell: (item: Item) => void;
  onSellAll: () => void;
  onSellJunk: () => void;
}

export function ShopTab({
  character,
  equipment,
  consumables,
  shopStock,
  inventory,
  clearedDungeons,
  onBuyConsumable,
  onBuyItem,
  onRestock,
  restockFee,
  onToggleFavorite,
  onSort,
  onSell,
  onSellAll,
  onSellJunk,
}: Props) {
  const [confirmSellAll, setConfirmSellAll] = useState(false);
  const junkCount = inventory.filter(
    (i) => i.rarity === "normal" || i.rarity === "magic",
  ).length;
  const {
    hovered: shopHovered,
    onMouseEnter,
    onMouseLeave,
    tooltipStyle,
    compareStyle,
    clearHover,
    showTooltip,
    tooltipRef,
    compareRef,
  } = useItemHover();
  const classDef = CLASSES[character.classId];
  const availableConsumables = CONSUMABLE_LIST.filter(
    (c) => c.id !== "manaPotion" || classDef.resourceType === "mana",
  );
  const totalSellValue = inventory.reduce(
    (sum, item) => sum + sellValue(item),
    0,
  );
  const potionCost = getPotionCost(clearedDungeons);
  const potionRestorePct = Math.round(
    getPotionRestoreRate(clearedDungeons) * 100,
  );

  return (
    <div className="tab-panel">
      <div className="shop-top-row">
        <div className="shop-potions-wrap">
          <h3 className="shop-potions-heading">Potions</h3>
          <div className="shop-potions">
            {availableConsumables.map((def) => (
              <div className="shop-potion-card" key={def.id}>
                <div className="shop-potion-name">{def.name}</div>
                <p className="shop-potion-desc">
                  {def.id === "healthPotion"
                    ? `Restores ${potionRestorePct}% of max life instantly. 3-turn cooldown.`
                    : `Restores ${potionRestorePct}% of max mana instantly. 3-turn cooldown.`}
                </p>
                <div className="shop-potion-stat">
                  {potionRestorePct}%{" "}
                  {def.id === "healthPotion" ? "HP" : "Mana"}
                </div>
                <div className="shop-potion-footer">
                  <button
                    className={`potion-buy-button potion-buy-button--${def.id === "healthPotion" ? "health" : "mana"}`}
                    disabled={
                      character.gold < potionCost || consumables[def.id] >= 5
                    }
                    onClick={() => onBuyConsumable(def.id)}
                  >
                    {consumables[def.id] >= 5
                      ? `Full (5/5)`
                      : `${consumables[def.id]}/5 · ${potionCost}g`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="shop-merchant-col">
          <div className="shop-header-row shop-header-row--inline">
            <h3>Merchant's Wares</h3>
            <button
              className="restock-button"
              disabled={character.gold < restockFee}
              onClick={onRestock}
            >
              Restock ({restockFee}g)
            </button>
          </div>
          <div className="shop-grid">
            {shopStock.map((item) => {
              const price = buyValue(item);
              return (
                <div
                  key={item.id}
                  className="shop-item-cell"
                  style={{ color: RARITY_COLORS[item.rarity] }}
                  onMouseEnter={(e) => onMouseEnter(item, e)}
                  onMouseLeave={onMouseLeave}
                  onClick={(e) =>
                    showTooltip(item, e.currentTarget as HTMLElement)
                  }
                >
                  <ItemIcon item={item} />
                  <button
                    className="buy-button"
                    disabled={character.gold < price}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBuyItem(item);
                      clearHover();
                    }}
                  >
                    <CoinIcon size={9} /> {price}
                  </button>
                </div>
              );
            })}
            {shopStock.length === 0 && (
              <p className="empty-note">Sold out. Restock to see new wares.</p>
            )}
          </div>
        </div>
      </div>

      <div className="shop-inventory-section">
        <div className="inventory-header">
          <div className="inventory-label-row">
            <h3>Your Inventory ({inventory.length})</h3>
          </div>
          <div className="actions">
            <button className="sort-btn" onClick={onSort}>
              Sort
            </button>

            <div className="sell-all-row">
              <button
                className="sell-all-button"
                onClick={() => setConfirmSellAll((v) => !v)}
                disabled={confirmSellAll}
              >
                Sell All
              </button>

              {confirmSellAll && (
                <div className="sell-confirm-popup">
                  <span className="sell-all-warning">
                    Sell all {inventory.length} items for {totalSellValue}g?
                  </span>

                  <div className="sell-confirm-actions">
                    <button
                      className="sell-all-confirm"
                      onClick={() => {
                        onSellAll();
                        setConfirmSellAll(false);
                      }}
                    >
                      Confirm
                    </button>

                    <button
                      className="sell-all-cancel"
                      onClick={() => setConfirmSellAll(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              className="sell-junk-button"
              onClick={onSellJunk}
              disabled={junkCount === 0 || confirmSellAll}
            >
              Sell Junk ({junkCount})
            </button>
          </div>
        </div>
        <div className="shop-inventory-scroll">
          {inventory.length === 0 ? (
            <p className="empty-note">Your inventory is empty.</p>
          ) : (
            <div className="shop-grid">
              {inventory.map((item) => (
                <div
                  key={item.id}
                  className="shop-item-cell"
                  style={{ color: RARITY_COLORS[item.rarity] }}
                  onMouseEnter={(e) => onMouseEnter(item, e)}
                  onMouseLeave={onMouseLeave}
                  onClick={(e) =>
                    showTooltip(item, e.currentTarget as HTMLElement)
                  }
                >
                  <ItemIcon item={item} />
                  <button
                    className={`fav-btn${item.favorite ? " fav-btn--active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item.id);
                    }}
                    aria-label={
                      item.favorite ? "Unmark favorite" : "Mark as favorite"
                    }
                  >
                    ★
                  </button>
                  {!item.favorite && (
                    <button
                      className="sell-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSell(item);
                        clearHover();
                      }}
                    >
                      <CoinIcon size={9} /> {sellValue(item)}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {shopHovered && (
        <>
          <div ref={tooltipRef} style={tooltipStyle()!}>
            <ItemTooltip item={shopHovered.item} />
          </div>
          <div ref={compareRef} style={compareStyle()!}>
            <CompareGroup
              slot={shopHovered.item.slot}
              equipment={equipment}
              hoveredItem={shopHovered.item}
            />
          </div>
        </>
      )}
    </div>
  );
}
