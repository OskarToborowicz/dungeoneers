import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { CharacterSprite, CLASS_COLORS } from "./sprites/CharacterSprite";
import { CoinIcon } from "./CoinIcon";
import { PotionIcon } from "./PotionIcon";
import { CharacterTab } from "./CharacterTab";
import { InventoryTab } from "./InventoryTab";
import { DungeonsTab } from "./DungeonsTab";
import { ShopTab } from "./ShopTab";
import { GamblerTab } from "./GamblerTab";
import { ItemIcon } from "./ItemIcon";
import { CLASSES } from "../game/data/classes";
import { RARITY_COLORS } from "../game/data/items";
import type { DerivedStats } from "../game/character";
import type { BaseStats, Character, ConsumableId, EquipmentSlot, Item } from "../game/types";
import type { GambleOffer } from "../game/data/gambler";

type TabId = "character" | "inventory" | "dungeons" | "shop" | "gambler";

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
  onToggleFavorite: (itemId: string) => void;
  onSortInventory: () => void;
  onSell: (item: Item) => void;
  onSellAll: () => void;
  onSellJunk: () => void;
  onStartDungeon: (dungeonId: string) => void;
  onQuitToMenu: () => void;
  onBuyConsumable: (id: ConsumableId) => void;
  onBuyItem: (item: Item) => void;
  onRestockShop: () => void;
  restockFee: number;
  onGamble: (offer: GambleOffer) => void;
  showPortalMessage?: boolean;
  onDismissPortal?: () => void;
  droppedItem?: Item | null;
  onDismissDroppedItem?: () => void;
  selectedAct: 1 | 2;
  onSelectAct: (act: 1 | 2) => void;
  selectedTab: TabId;
  onSelectTab: (tab: TabId) => void;
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
  onToggleFavorite,
  onSortInventory,
  onSell,
  onSellAll,
  onSellJunk,
  onStartDungeon,
  onQuitToMenu,
  onBuyConsumable,
  onBuyItem,
  onRestockShop,
  restockFee,
  onGamble,
  showPortalMessage,
  onDismissPortal,
  droppedItem,
  onDismissDroppedItem,
  selectedAct,
  onSelectAct,
  selectedTab: tab,
  onSelectTab: setTab,
}: Props) {
  const [confirmQuit, setConfirmQuit] = useState(false);

  const dismissRef = useRef(onDismissDroppedItem);
  dismissRef.current = onDismissDroppedItem;

  useEffect(() => {
    if (!droppedItem || showPortalMessage) return;
    if (droppedItem.rarity === "unique") {
      const sfx = new Audio(import.meta.env.BASE_URL + "divine_drop.mp3");
      sfx.volume = 0.05;
      sfx.play().catch(() => {});
    }
    const t = setTimeout(() => dismissRef.current?.(), 3000);
    return () => clearTimeout(t);
  }, [droppedItem, showPortalMessage]);

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
          {confirmQuit ? (
            <div className="mobile-quit-confirm">
              <span>Exit?</span>
              <button className="mobile-quit-yes" onClick={onQuitToMenu}>Yes</button>
              <button className="mobile-quit-no" onClick={() => setConfirmQuit(false)}>No</button>
            </div>
          ) : (
            <button className="mobile-menu-button" onClick={() => setConfirmQuit(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 511.61" width="13" height="13" fill="currentColor"><path fillRule="nonzero" d="m234.04 148.39-15.5 101.27c45.53-4.54 96.06-15.77 138.72-45.89 47.72-33.69 86.31-91.72 98.25-191.8.87-7.43 7.62-12.75 15.06-11.87 5.73.68 10.21 4.85 11.55 10.13 10.87 32.61 16.46 63.43 17.63 92.35 3.27 79.4-26.39 144.21-70.18 193.61-43.36 48.92-100.66 82.64-153.32 100.33-20.18 6.79-39.8 11.27-57.77 13.36l15.44 85.83c1.31 7.33-3.57 14.37-10.91 15.69-4.07.72-8.04-.46-11-2.9L4.91 337.19c-5.76-4.76-6.57-13.32-1.8-19.08l1.54-1.58 207.06-180.39c5.64-4.92 14.22-4.32 19.14 1.32 2.72 3.12 3.75 7.13 3.19 10.93z"/></svg>
            </button>
          )}
          <div className="hub-sprite-wrap">
            <div className="hub-sprite">
              <CharacterSprite
                classId={character.classId}
                size={90}
                state="idle"
                isUnique={equipment.weapon?.rarity === "very rare" || equipment.weapon?.rarity === "unique"}
              />
            </div>
            <div className="hub-char-info">
              <div className="hub-name-level-row">
                <div className="hub-char-name">{character.name}</div>
                <div className="level-display">
                  Level {character.level}
                  {character.unspentStatPoints > 0 && <span className="stat-point-inline">+</span>}
                </div>
              </div>
              <div className="gold-display"><CoinIcon size={15} /> {character.gold}</div>
              <div className="potions-display">
                <span><PotionIcon type="health" size={18} /> {consumables.healthPotion}</span>
                {CLASSES[character.classId].resourceType === "mana" && (
                  <span><PotionIcon type="mana" size={18} /> {consumables.manaPotion}</span>
                )}
              </div>
            </div>
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
            <button className={tab === "gambler" ? "active" : ""} onClick={() => setTab("gambler")}>
              Gambler
            </button>
          </nav>

          <button className="reset-button" onClick={onQuitToMenu}>
            Return to Menu
          </button>
        </div>

        <div className="hub-content">
          {tab === "character" && <CharacterTab character={character} derived={derived} onAllocate={onAllocate} />}
          {tab === "inventory" && (
            <InventoryTab equipment={equipment} inventory={inventory} classId={character.classId} onMoveItem={onMoveItem} onToggleFavorite={onToggleFavorite} onSort={onSortInventory} />
          )}
          {tab === "shop" && (
            <ShopTab
              character={character}
              equipment={equipment}
              consumables={consumables}
              shopStock={shopStock}
              inventory={inventory}
              clearedDungeons={clearedDungeons}
              onBuyConsumable={onBuyConsumable}
              onBuyItem={onBuyItem}
              onRestock={onRestockShop}
              restockFee={restockFee}
              onToggleFavorite={onToggleFavorite}
              onSell={onSell}
              onSellAll={onSellAll}
              onSellJunk={onSellJunk}
            />
          )}
          {tab === "dungeons" && (
            <DungeonsTab clearedDungeons={clearedDungeons} onStart={onStartDungeon} selectedAct={selectedAct} onSelectAct={onSelectAct} />
          )}
          {tab === "gambler" && (
            <GamblerTab character={character} equipment={equipment} inventory={inventory} onGamble={onGamble} onToggleFavorite={onToggleFavorite} />
          )}
        </div>
      </div>
    </div>
  );
}
