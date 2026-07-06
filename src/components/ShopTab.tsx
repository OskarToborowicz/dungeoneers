import { CLASSES } from "../game/data/classes";
import { CONSUMABLE_LIST } from "../game/data/consumables";
import { buyValue, RARITY_COLORS } from "../game/data/items";
import { ItemIcon } from "./ItemIcon";
import { ItemTooltip } from "./ItemTooltip";
import type { Character, ConsumableId, Item } from "../game/types";

interface Props {
  character: Character;
  consumables: Record<ConsumableId, number>;
  shopStock: Item[];
  onBuyConsumable: (id: ConsumableId) => void;
  onBuyItem: (item: Item) => void;
  onRestock: () => void;
}

const RESTOCK_FEE = 10;

export function ShopTab({ character, consumables, shopStock, onBuyConsumable, onBuyItem, onRestock }: Props) {
  const classDef = CLASSES[character.classId];
  const availableConsumables = CONSUMABLE_LIST.filter(
    (c) => c.id !== "manaPotion" || classDef.resourceType === "mana"
  );

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
        <button className="restock-button" disabled={character.gold < RESTOCK_FEE} onClick={onRestock}>
          Restock ({RESTOCK_FEE}g)
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
                {price}g
              </button>
            </div>
          );
        })}
        {shopStock.length === 0 && <p className="empty-note">Sold out. Restock to see new wares.</p>}
      </div>
    </div>
  );
}
