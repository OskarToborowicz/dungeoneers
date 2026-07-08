import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { CharacterSprite, CLASS_COLORS } from "./sprites/CharacterSprite";
import { CoinIcon } from "./CoinIcon";
import { PotionIcon } from "./PotionIcon";
import { CharacterTab } from "./CharacterTab";
import { InventoryTab } from "./InventoryTab";
import { DungeonsTab } from "./DungeonsTab";
import { ShopTab } from "./ShopTab";
import { ItemIcon } from "./ItemIcon";
import { CLASSES } from "../game/data/classes";
import { RARITY_COLORS } from "../game/data/items";
import type { DerivedStats } from "../game/character";
import type { BaseStats, Character, ConsumableId, EquipmentSlot, Item } from "../game/types";

type TabId = "character" | "inventory" | "dungeons" | "shop";

interface Props {
  character: Character;
  derived: DerivedStats;
  equipment: Partial<Record<EquipmentSlot, Item>>;
  inventory: Item[];
  clearedDungeons: string[];
  consumables: Record<ConsumableId, number>;
  shopStock: Item[];
  onAllocate: (stat: keyof BaseStats) => void;
  onMoveItem: (itemId: string, from: EquipmentSlot | "inventory", to: EquipmentSlot | "inventory") => void;
  onSell: (item: Item) => void;
  onSellAll: () => void;
  onStartDungeon: (dungeonId: string) => void;
  onQuitToMenu: () => void;
  onBuyConsumable: (id: ConsumableId) => void;
  onBuyItem: (item: Item) => void;
  onRestockShop: () => void;
  restockFee: number;
  showPortalMessage?: boolean;
  onDismissPortal?: () => void;
  droppedItem?: Item | null;
  onDismissDroppedItem?: () => void;
  selectedAct: 1 | 2;
  onSelectAct: (act: 1 | 2) => void;
}

export function Hub({
  character,
  derived,
  equipment,
  inventory,
  clearedDungeons,
  consumables,
  shopStock,
  onAllocate,
  onMoveItem,
  onSell,
  onSellAll,
  onStartDungeon,
  onQuitToMenu,
  onBuyConsumable,
  onBuyItem,
  onRestockShop,
  restockFee,
  showPortalMessage,
  onDismissPortal,
  droppedItem,
  onDismissDroppedItem,
  selectedAct,
  onSelectAct,
}: Props) {
  const [tab, setTab] = useState<TabId>("character");

  useEffect(() => {
    if (!droppedItem || showPortalMessage) return;
    if (droppedItem.rarity === "unique") {
      const sfx = new Audio(import.meta.env.BASE_URL + "divine_drop.mp3");
      sfx.volume = 0.3;
      sfx.play().catch(() => {});
    }
    const t = setTimeout(() => onDismissDroppedItem?.(), 3000);
    return () => clearTimeout(t);
  }, [droppedItem, showPortalMessage, onDismissDroppedItem]);

  return (
    <div className="screen hub-screen" style={{ "--class-color": CLASS_COLORS[character.classId] } as CSSProperties}>
      {droppedItem && !showPortalMessage && (
        <div className={`drop-banner${droppedItem.rarity === "unique" ? " drop-banner--unique" : ""}`} onClick={onDismissDroppedItem}>
          <span className="drop-banner-label">Item found</span>
          <span className="drop-banner-icon" style={{ color: RARITY_COLORS[droppedItem.rarity] }}>
            <ItemIcon item={droppedItem} />
          </span>
          <span className="drop-banner-name" style={{ color: RARITY_COLORS[droppedItem.rarity] }}>
            {droppedItem.name}
          </span>
          <button className="drop-banner-dismiss" onClick={onDismissDroppedItem}>×</button>
        </div>
      )}
      {showPortalMessage && (
        <div className="portal-overlay">
          <div className="portal-modal">
            <div className="portal-icon">🔴</div>
            <h2>A Red Portal Has Appeared</h2>
            <p>Andariel has fallen. A crimson gate tears open in the distance — beyond lies Act 2, the realm of fire and damnation.</p>
            <button className="primary-button" onClick={onDismissPortal}>Enter the Portal</button>
          </div>
        </div>
      )}
      <div className="hub-layout">
        <div className="hub-sidebar">
          <div className="hub-sprite">
            <CharacterSprite
                classId={character.classId}
                size={90}
                state="idle"
                isUnique={equipment.weapon?.rarity === "very rare" || equipment.weapon?.rarity === "unique"}
              />
          </div>
          <div className="gold-display"><CoinIcon size={15} /> {character.gold}</div>
          <div className="potions-display">
            <span><PotionIcon type="health" size={18} /> {consumables.healthPotion}</span>
            {CLASSES[character.classId].resourceType === "mana" && (
              <span><PotionIcon type="mana" size={18} /> {consumables.manaPotion}</span>
            )}
          </div>

          <nav className="tab-bar">
            <button className={tab === "character" ? "active" : ""} onClick={() => setTab("character")}>
              Character
            </button>
            <button className={tab === "inventory" ? "active" : ""} onClick={() => setTab("inventory")}>
              Inventory
            </button>
            <button className={tab === "shop" ? "active" : ""} onClick={() => setTab("shop")}>
              Shop
            </button>
            <button className={tab === "dungeons" ? "active" : ""} onClick={() => setTab("dungeons")}>
              Dungeons
            </button>
          </nav>

          <button className="reset-button" onClick={onQuitToMenu}>
            Return to Menu
          </button>
        </div>

        <div className="hub-content">
          {tab === "character" && <CharacterTab character={character} derived={derived} onAllocate={onAllocate} />}
          {tab === "inventory" && (
            <InventoryTab equipment={equipment} inventory={inventory} onMoveItem={onMoveItem} />
          )}
          {tab === "shop" && (
            <ShopTab
              character={character}
              equipment={equipment}
              consumables={consumables}
              shopStock={shopStock}
              inventory={inventory}
              onBuyConsumable={onBuyConsumable}
              onBuyItem={onBuyItem}
              onRestock={onRestockShop}
              restockFee={restockFee}
              onSell={onSell}
              onSellAll={onSellAll}
            />
          )}
          {tab === "dungeons" && (
            <DungeonsTab clearedDungeons={clearedDungeons} onStart={onStartDungeon} selectedAct={selectedAct} onSelectAct={onSelectAct} />
          )}
        </div>
      </div>
    </div>
  );
}
