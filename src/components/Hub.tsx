import { useState } from "react";
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
  onStartDungeon: (dungeonId: string) => void;
  onResetSave: () => void;
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
  onStartDungeon,
  onResetSave,
  onBuyConsumable,
  onBuyItem,
  onRestockShop,
}: Props) {
  const [tab, setTab] = useState<TabId>("character");

  return (
    <div className="screen hub-screen">
      <div className="hub-layout">
        <div className="hub-sidebar">
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

          <button className="reset-button" onClick={onResetSave}>
            Reset Save
          </button>
        </div>

        <div className="hub-content">
          {tab === "character" && <CharacterTab character={character} derived={derived} onAllocate={onAllocate} />}
          {tab === "inventory" && (
            <InventoryTab equipment={equipment} inventory={inventory} onMoveItem={onMoveItem} onSell={onSell} />
          )}
          {tab === "shop" && (
            <ShopTab
              character={character}
              consumables={consumables}
              shopStock={shopStock}
              onBuyConsumable={onBuyConsumable}
              onBuyItem={onBuyItem}
              onRestock={onRestockShop}
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
