import { useState } from "react";
import { CLASSES } from "../game/data/classes";
import { CONSUMABLE_LIST } from "../game/data/consumables";
import { buyValue, RARITY_COLORS, sellValue } from "../game/data/items";
import { ItemIcon } from "./ItemIcon";
import { ItemTooltip } from "./ItemTooltip";
import { CoinIcon } from "./CoinIcon";
import type { Character, ConsumableId, Item } from "../game/types";

interface Props {
  character: Character;
  consumables: Record<ConsumableId, number>;
  shopStock: Item[];
  inventory: Item[];
  onBuyConsumable: (id: ConsumableId) => void;
  onBuyItem: (item: Item) => void;
  onRestock: () => void;
  restockFee: number;
  onSell: (item: Item) => void;
  onSellAll: () => void;
}

export function ShopTab({
  character,
  consumables,
  shopStock,
  inventory,
  onBuyConsumable,
  onBuyItem,
  onRestock,
  restockFee,
  onSell,
  onSellAll,
}: Props) {
  const [confirmSellAll, setConfirmSellAll] = useState(false);
  const classDef = CLASSES[character.classId];
  const availableConsumables = CONSUMABLE_LIST.filter(
    (c) => c.id !== "manaPotion" || classDef.resourceType === "mana"
  );
  const totalSellValue = inventory.reduce((sum, item) => sum + sellValue(item), 0);

  return (
    <div className="tab-panel">
      <h3>Potions</h3>
      <div className="shop-potions">
        {availableConsumables.map((def) => (
          <div className="shop-potion-card" key={def.id}>
            <div className="shop-potion-name">{def.name}</div>
            <p className="shop-potion-desc">{def.description}</p>
            <div className="shop-potion-footer">
              <span className="owned-count">Owned: {consumables[def.id]}</span>
              <button
                className="primary-button small"
                disabled={character.gold < def.cost}
                onClick={() => onBuyConsumable(def.id)}
              >
                Buy for {def.cost}g
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="shop-header-row">
        <h3>Merchant's Wares</h3>
        <button className="restock-button" disabled={character.gold < restockFee} onClick={onRestock}>
          Restock ({restockFee}g)
        </button>
      </div>
      <div className="shop-grid">
        {shopStock.map((item) => {
          const price = buyValue(item);
          return (
            <div key={item.id} className="shop-item-cell" style={{ color: RARITY_COLORS[item.rarity] }}>
              <ItemIcon item={item} />
              <ItemTooltip item={item} />
              <button className="buy-button" disabled={character.gold < price} onClick={() => onBuyItem(item)}>
                <CoinIcon size={9} /> {price}
              </button>
            </div>
          );
        })}
        {shopStock.length === 0 && <p className="empty-note">Sold out. Restock to see new wares.</p>}
      </div>

      <div className="inventory-header" style={{ marginTop: 24 }}>
        <h3>Your Inventory ({inventory.length})</h3>
        {inventory.length > 0 && (
          <div className="sell-all-row">
            {confirmSellAll ? (
              <>
                <span className="sell-all-warning">Sell all {inventory.length} items for {totalSellValue}g?</span>
                <button
                  className="sell-all-confirm"
                  onClick={() => { onSellAll(); setConfirmSellAll(false); }}
                >
                  Confirm
                </button>
                <button className="sell-all-cancel" onClick={() => setConfirmSellAll(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="sell-all-button" onClick={() => setConfirmSellAll(true)}>
                Sell All
              </button>
            )}
          </div>
        )}
      </div>
      {inventory.length === 0 ? (
        <p className="empty-note">Your inventory is empty.</p>
      ) : (
        <div className="shop-grid">
          {inventory.map((item) => (
            <div key={item.id} className="shop-item-cell" style={{ color: RARITY_COLORS[item.rarity] }}>
              <ItemIcon item={item} />
              <ItemTooltip item={item} />
              <button className="sell-button" onClick={() => onSell(item)}>
                <CoinIcon size={9} /> {sellValue(item)}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
