import { useState } from "react";
import type { CSSProperties } from "react";
import { CharacterSprite, CLASS_COLORS } from "./sprites/CharacterSprite";
import { CharacterTab } from "./CharacterTab";
import { InventoryTab } from "./InventoryTab";
import { DungeonsTab } from "./DungeonsTab";
import { ShopTab } from "./ShopTab";
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
}: Props) {
  const [tab, setTab] = useState<TabId>("character");

  return (
    <div className="screen hub-screen" style={{ "--class-color": CLASS_COLORS[character.classId] } as CSSProperties}>
      <div className="hub-layout">
        <div className="hub-sidebar">
          <div className="hub-sprite">
            <CharacterSprite
                classId={character.classId}
                size={90}
                state="idle"
                isUnique={equipment.weapon?.rarity === "unique"}
              />
          </div>
          <div className="gold-display">{character.gold} gold</div>

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
              consumables={consumables}
              shopStock={shopStock}
              inventory={inventory}
              onBuyConsumable={onBuyConsumable}
              onBuyItem={onBuyItem}
              onRestock={onRestockShop}
              onSell={onSell}
              onSellAll={onSellAll}
            />
          )}
          {tab === "dungeons" && (
            <DungeonsTab clearedDungeons={clearedDungeons} onStart={onStartDungeon} />
          )}
        </div>
      </div>
    </div>
  );
}
