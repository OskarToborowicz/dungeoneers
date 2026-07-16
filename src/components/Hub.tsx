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
import { isSoundMuted } from "../game/sound";
import type {
  BaseStats,
  Character,
  ConsumableId,
  EquipmentSlot,
  Item,
} from "../game/types";
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
  onMoveItem: (
    itemId: string,
    from: EquipmentSlot | "inventory",
    to: EquipmentSlot | "inventory",
  ) => void;
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
  showSewersIntro?: boolean;
  onDismissSewersIntro?: () => void;
  showSewersEscape?: boolean;
  onDismissSewersEscape?: () => void;
  showGheedonMessage?: boolean;
  onDismissGheedonMessage?: () => void;
  showAct3Message?: boolean;
  onDismissAct3Message?: () => void;
  showAct4Message?: boolean;
  onDismissAct4Message?: () => void;
  showEndingMessage?: boolean;
  onDismissEndingMessage?: () => void;
  sewersCleared?: boolean;
  goblinsPathCleared?: boolean;
  droppedItem?: Item | null;
  onDismissDroppedItem?: () => void;
  selectedAct: 1 | 2 | 3 | 4;
  onSelectAct: (act: 1 | 2 | 3 | 4) => void;
  selectedTab: TabId;
  onSelectTab: (tab: TabId) => void;
  hasUnseenDrops?: boolean;
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
  showSewersIntro,
  onDismissSewersIntro,
  showSewersEscape,
  onDismissSewersEscape,
  showGheedonMessage,
  onDismissGheedonMessage,
  showAct3Message,
  onDismissAct3Message,
  showAct4Message,
  onDismissAct4Message,
  showEndingMessage,
  onDismissEndingMessage,
  sewersCleared = false,
  goblinsPathCleared = false,
  droppedItem,
  onDismissDroppedItem,
  selectedAct,
  onSelectAct,
  selectedTab: tab,
  onSelectTab: setTab,
  hasUnseenDrops = false,
}: Props) {
  const [confirmQuit, setConfirmQuit] = useState(false);
  const hasUnseenItems = hasUnseenDrops;

  const dismissRef = useRef(onDismissDroppedItem);
  dismissRef.current = onDismissDroppedItem;

  useEffect(() => {
    if (!droppedItem || showPortalMessage || showSewersEscape || showGheedonMessage || showAct4Message || showEndingMessage) return;
    if (droppedItem.rarity === "unique" && !isSoundMuted()) {
      const sfx = new Audio(import.meta.env.BASE_URL + "divine_drop.mp3");
      sfx.volume = 0.05;
      sfx.play().catch(() => {});
    }
    const t = setTimeout(() => dismissRef.current?.(), 3000);
    return () => clearTimeout(t);
  }, [droppedItem, showPortalMessage]);

  return (
    <div
      className="screen hub-screen"
      style={
        { "--class-color": CLASS_COLORS[character.classId] } as CSSProperties
      }
    >
      {droppedItem && !showPortalMessage && !showSewersEscape && !showGheedonMessage && !showAct4Message && !showEndingMessage && (
        <div
          className={`drop-banner${droppedItem.rarity === "unique" ? " drop-banner--unique" : ""}`}
          onClick={onDismissDroppedItem}
        >
          <span className="drop-banner-label">Item found</span>
          <span
            className="drop-banner-icon"
            style={{ color: RARITY_COLORS[droppedItem.rarity] }}
          >
            <ItemIcon item={droppedItem} />
          </span>
          <span
            className="drop-banner-name"
            style={{ color: RARITY_COLORS[droppedItem.rarity] }}
          >
            {droppedItem.name}
          </span>
          <button
            className="drop-banner-dismiss"
            onClick={onDismissDroppedItem}
          >
            ×
          </button>
        </div>
      )}
      {showSewersIntro && (
        <div className="portal-overlay">
          <div className="portal-modal">
            <div className="portal-icon">⛓️</div>
            <h2>Thrown Into the Sewers</h2>
            <p>
              By order of King Victor the Second, you have been cast into the
              royal sewers for treason. No trial. No mercy. Survive, or rot
              in the dark.
            </p>
            <button className="primary-button" onClick={onDismissSewersIntro}>
              Fight Your Way Out
            </button>
          </div>
        </div>
      )}
      {showSewersEscape && (
        <div className="portal-overlay">
          <div className="portal-modal">
            <div className="portal-icon">🌅</div>
            <h2>You Escaped the Sewers</h2>
            <p>
              Against all odds, you clawed your way out. As your eyes adjust
              to the light, a kind voice greets you — a travelling merchant,
              Aldric, who happened to be passing through. He takes one look at
              you and smiles.
            </p>
            <p style={{ fontStyle: "italic", opacity: 0.85 }}>
              "You look like someone who could use a good blade — or at least
              a warm meal. I go where the road takes me. Perhaps it takes me
              with you."
            </p>
            <p>
              He will accompany you and sell you supplies throughout your
              journey. The world now lies ahead.
            </p>
            <button className="primary-button" onClick={onDismissSewersEscape}>
              Embark on Your Journey
            </button>
          </div>
        </div>
      )}
      {showGheedonMessage && (
        <div className="portal-overlay">
          <div className="portal-modal">
            <div className="portal-icon">🎲</div>
            <h2>A Man in a Cage</h2>
            <p>
              Among the goblin warren's clutter you spot a wooden cage by the
              road — and inside it, a wiry man with quick eyes and ink-stained
              fingers, surrounded by a small pile of trinkets the goblins
              hadn't bothered to take.
            </p>
            <p style={{ fontStyle: "italic", opacity: 0.85 }}>
              "Ah — a capable one! Gheedon is the name. Collector,
              connoisseur, occasional gambler. I was merely... inspecting some
              of the goblins' finer acquisitions when they took exception to
              my presence."
            </p>
            <p>
              He dusts himself off and grins. His curiosity for magic, rare,
              and unique items is insatiable — he keeps an eye on everything
              that passes through the world and offers it to you. But don't
              expect a straightforward deal. Gheedon likes to keep things
              interesting.
            </p>
            <p style={{ fontStyle: "italic", opacity: 0.85 }}>
              "I'll do it my way. Take it or leave it."
            </p>
            <button className="primary-button" onClick={onDismissGheedonMessage}>
              Let's See What You've Got
            </button>
          </div>
        </div>
      )}
      {showAct3Message && (
        <div className="portal-overlay">
          <div className="portal-modal">
            <div className="portal-icon">🌿</div>
            <h2>The Mountain Falls</h2>
            <p>
              Sikktharkk's dying screech shook the peaks. An avalanche
              tore the mountainside open and swept you down the far slope.
              You survived — battered, half-frozen — and at the bottom you
              saw it: a vast, deep jungle where the frozen wastelands end.
              Act 3 awaits.
            </p>
            <button className="primary-button" onClick={onDismissAct3Message}>
              Descend Into the Jungle
            </button>
          </div>
        </div>
      )}
      {showEndingMessage && (
        <div className="portal-overlay">
          <div className="portal-modal">
            <div className="portal-icon">🌌</div>
            <h2>The Void Collapses</h2>
            <p>
              The realm tears itself apart. Stone dissolves into void. The sky collapses inward as Relith's final scream fades into nothing.
            </p>
            <p>
              Then — silence.
            </p>
            <p>
              A rift of pale light tears open above the rubble. You feel it pulling, dragging you through — and in an instant, you're somewhere else.
            </p>
            <p>
              Cold stone beneath your hands. The scent of rain and iron. You push yourself upright, and the fog clears.
            </p>
            <p style={{ fontStyle: "italic", opacity: 0.85 }}>
              Before you, across a valley blanketed in mist, stands a great castle — its towers lit with golden light, its banners unmistakable. The castle you were thrown out of. The castle that damned you to die beneath the sewers.
            </p>
            <p style={{ fontStyle: "italic", opacity: 0.85 }}>
              It is calling you home.
            </p>
            <button className="primary-button" onClick={onDismissEndingMessage}>
              Continue
            </button>
          </div>
        </div>
      )}
      {showAct4Message && (
        <div className="portal-overlay">
          <div className="portal-modal">
            <div className="portal-icon">🌑</div>
            <h2>The Veil Has Torn</h2>
            <p>
              Zam'Koro's final cry fades. The emerald flames die. The cursed masks shatter, releasing souls imprisoned for centuries.
            </p>
            <p>
              Then the shadows move.
            </p>
            <p>
              Darkness spills like liquid across the ground, swallowing the light. A jagged tear opens in the air itself — revealing ruined towers, twisted forests, and wandering spirits beyond. An icy wind carries whispers in a language long forgotten.
            </p>
            <p style={{ fontStyle: "italic", opacity: 0.85 }}>
              "The Loa's curse has fallen... but its prison has broken with it. The veil between the living and the dead has been torn open. Beyond this rift lies the Shadowlands, where lost souls wander and forgotten kings still reign. The darkness is no longer waiting — it is coming."
            </p>
            <button className="primary-button" onClick={onDismissAct4Message}>
              Act 4 Unlocked: Realm of the Endless Night
            </button>
          </div>
        </div>
      )}
      {showPortalMessage && (
        <div className="portal-overlay">
          <div className="portal-modal">
            <div className="portal-icon">⛰️</div>
            <h2>The Gate Opens</h2>
            <p>
              The Bandit Chieftain is dead. On the far side of town, the
              heavy iron gate groans open — beyond it, a winding road
              climbs into the mountains. Act 2 awaits.
            </p>
            <button className="primary-button" onClick={onDismissPortal}>
              Enter the Mountains
            </button>
          </div>
        </div>
      )}
      <div className="hub-layout">
        <div className="hub-sidebar">
          {confirmQuit ? (
            <div className="mobile-quit-confirm">
              <span>Exit?</span>
              <button className="mobile-quit-yes" onClick={onQuitToMenu}>
                Yes
              </button>
              <button
                className="mobile-quit-no"
                onClick={() => setConfirmQuit(false)}
              >
                No
              </button>
            </div>
          ) : (
            <button
              className="mobile-menu-button"
              onClick={() => setConfirmQuit(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 500 511.61"
                width="13"
                height="13"
                fill="currentColor"
              >
                <path
                  fillRule="nonzero"
                  d="m234.04 148.39-15.5 101.27c45.53-4.54 96.06-15.77 138.72-45.89 47.72-33.69 86.31-91.72 98.25-191.8.87-7.43 7.62-12.75 15.06-11.87 5.73.68 10.21 4.85 11.55 10.13 10.87 32.61 16.46 63.43 17.63 92.35 3.27 79.4-26.39 144.21-70.18 193.61-43.36 48.92-100.66 82.64-153.32 100.33-20.18 6.79-39.8 11.27-57.77 13.36l15.44 85.83c1.31 7.33-3.57 14.37-10.91 15.69-4.07.72-8.04-.46-11-2.9L4.91 337.19c-5.76-4.76-6.57-13.32-1.8-19.08l1.54-1.58 207.06-180.39c5.64-4.92 14.22-4.32 19.14 1.32 2.72 3.12 3.75 7.13 3.19 10.93z"
                />
              </svg>
            </button>
          )}
          <div className="hub-sprite-wrap">
            <div className="hub-sprite">
              <CharacterSprite
                classId={character.classId}
                size={90}
                state="idle"
                isUnique={
                  equipment.weapon?.rarity === "very rare" ||
                  equipment.weapon?.rarity === "unique"
                }
              />
            </div>
            <div className="hub-char-info">
              <div className="hub-name-level-row">
                <div className="hub-char-name">{character.name}</div>
                <div className="level-display">
                  Level {character.level}
                  {character.unspentStatPoints > 0 && (
                    <span className="stat-point-inline" onClick={() => setTab("character")} style={{ cursor: "pointer" }}>+</span>
                  )}
                </div>
              </div>
              <div className="gold-display">
                <CoinIcon size={15} /> {character.gold}
              </div>
              <div className="potions-display">
                <span>
                  <PotionIcon type="health" size={18} />{" "}
                  {consumables.healthPotion}
                </span>
                {CLASSES[character.classId].resourceType === "mana" && (
                  <span>
                    <PotionIcon type="mana" size={18} />{" "}
                    {consumables.manaPotion}
                  </span>
                )}
              </div>
            </div>
          </div>

          <nav className="tab-bar">
            <button
              className={tab === "dungeons" ? "active" : ""}
              onClick={() => setTab("dungeons")}
            >
              Dungeons ⚔
            </button>
            <button
              className={tab === "character" ? "active" : ""}
              onClick={() => setTab("character")}
            >
              Character{" "}
              {/* full knight great-helm: dome, brow ridge, visor bars, cheek plates, neck guard */}
              <svg width="15" height="16" viewBox="0 0 20 22" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                {/* dome */}
                <path d="M4 11 C4 4 16 4 16 11"/>
                {/* brow ridge */}
                <line x1="3.5" y1="11" x2="16.5" y2="11"/>
                {/* face plate left cheek */}
                <path d="M4 11 L3 15 Q3 18 5 18 L9 18"/>
                {/* face plate right cheek */}
                <path d="M16 11 L17 15 Q17 18 15 18 L11 18"/>
                {/* chin bottom */}
                <path d="M9 18 Q10 19 11 18"/>
                {/* visor slits */}
                <line x1="5.5" y1="13" x2="8.5" y2="13"/>
                <line x1="5" y1="15" x2="8.5" y2="15"/>
                <line x1="11.5" y1="13" x2="14.5" y2="13"/>
                <line x1="11.5" y1="15" x2="15" y2="15"/>
                {/* center nose guard */}
                <line x1="10" y1="11" x2="10" y2="18"/>
                {/* crest / plume base */}
                <path d="M7 4 Q10 1 13 4"/>
              </svg>
            </button>
            <button
              className={tab === "inventory" ? "active" : ""}
              onClick={() => setTab("inventory")}
            >
              Inventory{" "}
              {hasUnseenItems ? (
                <svg width="15" height="16" viewBox="0 0 20 22" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="tab-icon-shine">
                  {/* handle loop */}
                  <path d="M8 3 Q10 1 12 3"/>
                  {/* top strap */}
                  <path d="M6 4 Q10 2.5 14 4 L15 7 L5 7 Z"/>
                  {/* main body */}
                  <rect x="3" y="7" width="14" height="13" rx="2.5"/>
                  {/* closed flap covering body */}
                  <path d="M3 7 Q3 13 10 13 Q17 13 17 7"/>
                  {/* buckle strap across flap */}
                  <line x1="6" y1="10.5" x2="14" y2="10.5"/>
                  <rect x="8.5" y="9.5" width="3" height="2" rx="0.5"/>
                  <line x1="10" y1="9.5" x2="10" y2="11.5"/>
                </svg>
              ) : (
                <svg width="15" height="16" viewBox="0 0 20 22" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                  {/* handle loop */}
                  <path d="M8 3 Q10 1 12 3"/>
                  {/* shoulder strap attachment top */}
                  <path d="M6 4 Q10 2.5 14 4 L15 7 L5 7 Z"/>
                  {/* main body */}
                  <rect x="3" y="7" width="14" height="13" rx="2.5"/>
                  {/* curved top flap */}
                  <path d="M3 10.5 Q10 14 17 10.5"/>
                  {/* center front pocket */}
                  <rect x="6" y="13" width="8" height="5" rx="1.5"/>
                  {/* buckle on pocket */}
                  <rect x="8.5" y="14.5" width="3" height="2" rx="0.5"/>
                  <line x1="10" y1="14.5" x2="10" y2="16.5"/>
                  {/* side stitching lines */}
                  <line x1="5" y1="11.5" x2="5" y2="19"/>
                  <line x1="15" y1="11.5" x2="15" y2="19"/>
                </svg>
              )}
            </button>
            <button
              className={`${tab === "shop" ? "active" : ""}${!sewersCleared ? " tab-locked" : ""}`}
              disabled={!sewersCleared}
              onClick={() => setTab("shop")}
            >
              Shop{" "}
              {/* three loose coins */}
              <svg width="15" height="16" viewBox="0 0 20 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                {/* coin 1 - bottom left, flat face */}
                <circle cx="6" cy="15" r="4.5"/>
                <circle cx="6" cy="15" r="2.2"/>
                {/* coin 2 - top center, flat face */}
                <circle cx="11" cy="6" r="4.5"/>
                <circle cx="11" cy="6" r="2.2"/>
                {/* coin 3 - right side, slightly tilted (ellipse) */}
                <ellipse cx="16" cy="14" rx="3" ry="4.5" transform="rotate(20 16 14)"/>
                <ellipse cx="16" cy="14" rx="1.4" ry="2.2" transform="rotate(20 16 14)"/>
              </svg>
            </button>
            <button
              className={`${tab === "gambler" ? "active" : ""}${!goblinsPathCleared ? " tab-locked" : ""}`}
              disabled={!goblinsPathCleared}
              onClick={() => setTab("gambler")}
            >
              Gamble{" "}
              {/* isometric dice showing 3 faces: top (1 pip), front (3 pips), right (2 pips) */}
              <svg width="15" height="16" viewBox="0 0 20 22" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                {/* top face */}
                <path d="M10 2 L18 6 L10 10 L2 6 Z"/>
                {/* left/front face */}
                <path d="M2 6 L2 16 L10 20 L10 10 Z"/>
                {/* right face */}
                <path d="M10 10 L10 20 L18 16 L18 6 Z"/>
                {/* top face pip — center */}
                <circle cx="10" cy="6" r="1" fill="currentColor" stroke="none"/>
                {/* front face pips — diagonal 3 */}
                <circle cx="5" cy="12" r="0.9" fill="currentColor" stroke="none"/>
                <circle cx="7" cy="15" r="0.9" fill="currentColor" stroke="none"/>
                <circle cx="9" cy="18" r="0.9" fill="currentColor" stroke="none"/>
                {/* right face pips — 2 */}
                <circle cx="13" cy="12" r="0.9" fill="currentColor" stroke="none"/>
                <circle cx="16" cy="15.5" r="0.9" fill="currentColor" stroke="none"/>
              </svg>
            </button>
          </nav>

          <button className="reset-button" onClick={onQuitToMenu}>
            Return to Menu
          </button>
        </div>

        <div className="hub-content">
          {tab === "character" && (
            <CharacterTab
              character={character}
              derived={derived}
              onAllocate={onAllocate}
            />
          )}
          {tab === "inventory" && (
            <InventoryTab
              equipment={equipment}
              inventory={inventory}
              classId={character.classId}
              derived={derived}
              onMoveItem={onMoveItem}
              onToggleFavorite={onToggleFavorite}
              onSort={onSortInventory}
            />
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
              onSort={onSortInventory}
              onSell={onSell}
              onSellAll={onSellAll}
              onSellJunk={onSellJunk}
            />
          )}
          {tab === "dungeons" && (
            <DungeonsTab
              clearedDungeons={clearedDungeons}
              onStart={onStartDungeon}
              selectedAct={selectedAct}
              onSelectAct={onSelectAct}
            />
          )}
          {tab === "gambler" && (
            <GamblerTab
              character={character}
              equipment={equipment}
              inventory={inventory}
              onGamble={onGamble}
              onToggleFavorite={onToggleFavorite}
              onSort={onSortInventory}
            />
          )}
        </div>
      </div>
    </div>
  );
}
