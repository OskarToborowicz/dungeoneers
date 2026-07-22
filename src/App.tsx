import { useEffect, useLayoutEffect, useState } from "react";
import { CharacterCreation } from "./components/CharacterCreation";
import { CharacterSelect } from "./components/CharacterSelect";
import { AuthScreen } from "./components/AuthScreen";
import { Hub } from "./components/Hub";
import { sortInventory } from "./components/InventoryTab";
import { CombatScreen } from "./components/CombatScreen";
import { preloadMonsterAssets } from "./components/sprites/MonsterSprite";
import { GameOverScreen } from "./components/GameOverScreen";

import {
  createCharacter,
  getDerivedStats,
  getStartingResource,
  grantXp,
} from "./game/character";
import { EMPTY_CONSUMABLES, getPotionsForStage } from "./game/data/consumables";
import { DUNGEONS, getXpCapLevel } from "./game/data/dungeons";
import {
  addFourthAffix,
  canAddFourthAffix,
  canRerollAffix,
  buyValue,
  generateRandomItem,
  generateShopStock,
  generateStartingEquipment,
  lockAndRerollAffix,
  rerollLockedAffix,
  sellValue,
} from "./game/data/items";
import { rollGambleItem, type GambleOffer } from "./game/data/gambler";
import { UNIQUE_DROP_TABLE } from "./game/data/drops";
import {
  getAllSaves,
  getSave,
  writeSave,
  createSave,
  deleteSave,
  importSaveCode,
  overwriteSaves,
  setSaveSyncHandler,
} from "./game/storage";
import type { SaveSlot } from "./game/storage";
import { MAX_SAVE_SLOTS } from "./game/storage";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./lib/supabase";
import { getSession, onAuthStateChange, signOut } from "./services/auths";
import {
  fetchCloudSaves,
  upsertCloudSave,
  deleteCloudSave,
} from "./services/cloudSaves";
import type { CombatResult } from "./game/combat";
import type {
  BaseStats,
  Character,
  ClassId,
  ConsumableId,
  DeathSummary,
  EquipmentSlot,
  GameMode,
  Item,
  ItemRarity,
  MonsterDefinition,
  RunStats,
  SaveGame,
} from "./game/types";
import { FullscreenButton } from "./components/FullscreenButton";
import "./App.css";

const XP_REWARD_MULT = 1.25;
const FIRST_CLEAR_MULT = 2;

function restockFee(level: number) {
  return Math.round(10 + (level - 1) * 8);
}

interface DungeonRunState {
  dungeonId: string;
  queue: MonsterDefinition[];
  index: number;
  currentLife: number;
  currentMana: number;
  currentCooldown: number;
  currentCooldown2: number;
  currentPreparation: number;
  currentHolyLightCharges: number;
}

function App() {
  const [slots, setSlots] = useState<SaveSlot[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [character, setCharacter] = useState<Character | null>(null);
  const [equipment, setEquipment] = useState<
    Partial<Record<EquipmentSlot, Item>>
  >({});
  const [inventory, setInventory] = useState<Item[]>([]);
  const [clearedDungeons, setClearedDungeons] = useState<string[]>([]);
  const [consumables, setConsumables] =
    useState<Record<ConsumableId, number>>(EMPTY_CONSUMABLES);
  const [shopStock, setShopStock] = useState<Item[]>([]);
  const [dungeonRun, setDungeonRun] = useState<DungeonRunState | null>(null);
  const [selectedAct, setSelectedAct] = useState<1 | 2 | 3 | 4>(1);
  const [hubTab, setHubTab] = useState<
    "character" | "inventory" | "dungeons" | "merchant" | "gambler" | "journal"
  >("character");
  const [deathSummary, setDeathSummary] = useState<DeathSummary | null>(null);
  const [pendingRestart, setPendingRestart] = useState<string | null>(null);
  const [runItemsFound, setRunItemsFound] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [showPortalMessage, setShowPortalMessage] = useState(false);
  const [showSewersIntro, setShowSewersIntro] = useState(false);
  const [showSewersEscape, setShowSewersEscape] = useState(false);
  const [hasShownSewersIntro, setHasShownSewersIntro] = useState(false);
  const [showGheedonMessage, setShowGheedonMessage] = useState(false);
  const [showFrostforgeMessage, setShowFrostforgeMessage] = useState(false);
  const [showAct3Message, setShowAct3Message] = useState(false);
  const [showAct4Message, setShowAct4Message] = useState(false);
  const [showEndingMessage, setShowEndingMessage] = useState(false);
  const [droppedItem, setDroppedItem] = useState<
    import("./game/types").Item | null
  >(null);
  const [hasUnseenDrops, setHasUnseenDrops] = useState(false);

  useEffect(() => {
    setSlots(getAllSaves());
    setLoaded(true);
  }, []);

  // Two-way merge: pull cloud saves, keep the newer of each hero by lastPlayedAt,
  // write the union locally, then push anything local-newer/local-only back up.
  async function syncWithCloud() {
    try {
      const cloud = await fetchCloudSaves();
      const byId = new Map<string, SaveSlot>();
      for (const s of cloud) byId.set(s.id, s);
      const toPush: SaveSlot[] = [];
      for (const s of getAllSaves()) {
        const existing = byId.get(s.id);
        if (!existing || s.lastPlayedAt > existing.lastPlayedAt) {
          byId.set(s.id, s);
          toPush.push(s);
        }
      }
      overwriteSaves(
        [...byId.values()].sort((a, b) => b.lastPlayedAt - a.lastPlayedAt),
      );
      setSlots(getAllSaves());
      for (const s of toPush) {
        try {
          await upsertCloudSave(s);
        } catch (e) {
          console.warn("Cloud upsert failed for", s.id, e);
        }
      }
    } catch (e) {
      console.warn("Cloud sync failed:", e);
    }
  }

  // Track the auth session; sync when a session appears (sign-in / page load).
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) syncWithCloud();
    });
    const { data } = onAuthStateChange(async (event, s) => {
      setSession(s);
      if (event === "SIGNED_IN") await syncWithCloud();
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While signed in, mirror every local write to the cloud (debounced/coalesced
  // per hero so per-turn autosaves don't spam the network).
  useEffect(() => {
    if (!session) {
      setSaveSyncHandler(null);
      return;
    }
    const pending = new Map<string, SaveSlot>();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const flush = () => {
      timer = null;
      const items = [...pending.values()];
      pending.clear();
      for (const slot of items)
        upsertCloudSave(slot).catch((err) =>
          console.warn("Cloud upsert failed for", slot.id, err),
        );
    };
    setSaveSyncHandler((e) => {
      if (e.type === "upsert") {
        pending.set(e.slot.id, e.slot);
        if (!timer) timer = setTimeout(flush, 1500);
      } else {
        pending.delete(e.id);
        deleteCloudSave(e.id).catch((err) =>
          console.warn("Cloud delete failed for", e.id, err),
        );
      }
    });
    return () => {
      if (timer) clearTimeout(timer);
      flush();
      setSaveSyncHandler(null);
    };
  }, [session]);

  async function handleSignOut() {
    await signOut();
    setSession(null);
  }

  useEffect(() => {
    if (!dungeonRun) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dungeonRun]);

  useEffect(() => {
    if (!loaded || !activeSlotId || !character || dungeonRun) return;
    const save: SaveGame = {
      character,
      equipment,
      inventory,
      clearedDungeons,
      consumables,
      shopStock,
      inCombat: false,
    };
    writeSave(activeSlotId, save);
  }, [
    loaded,
    activeSlotId,
    character,
    equipment,
    inventory,
    clearedDungeons,
    consumables,
    shopStock,
    dungeonRun,
  ]);

  // "Clear Again": restart the same dungeon once the boss-reward state has
  // committed. useLayoutEffect (pre-paint) avoids a one-frame flash of the hub.
  useLayoutEffect(() => {
    if (pendingRestart && !dungeonRun) {
      const id = pendingRestart;
      setPendingRestart(null);
      handleStartDungeon(id);
    }
  }, [pendingRestart, dungeonRun]);

  if (!loaded) return null;

  if (deathSummary) {
    return (
      <>
        <GameOverScreen
          summary={deathSummary}
          onContinue={() => setDeathSummary(null)}
        />
        <FullscreenButton />
      </>
    );
  }

  if (!activeSlotId && !creating) {
    if (showAuth) {
      return (
        <>
          <AuthScreen
            onAuthed={() => setShowAuth(false)}
            onBack={() => setShowAuth(false)}
          />
          <FullscreenButton />
        </>
      );
    }
    return (
      <>
        <CharacterSelect
          slots={slots}
          onSelect={handleSelectSlot}
          onDelete={handleDeleteSlot}
          onNew={() => setCreating(true)}
          onImport={handleImportSlot}
          onOpenAuth={() => setShowAuth(true)}
          authAvailable={isSupabaseConfigured}
          userEmail={session?.user?.email ?? null}
          onSignOut={handleSignOut}
        />
        <FullscreenButton />
      </>
    );
  }

  if (!character) {
    return (
      <>
        <CharacterCreation
          onBack={() => setCreating(false)}
          onCreate={(name: string, classId: ClassId, mode: GameMode) => {
            const newCharacter = createCharacter(name, classId, mode);
            const newShopStock = generateShopStock(1, classId, 4, []);
            const startingEquipment = generateStartingEquipment(classId);
            const save: SaveGame = {
              character: newCharacter,
              equipment: startingEquipment,
              inventory: [],
              clearedDungeons: [],
              consumables: { healthPotion: 1 },
              shopStock: newShopStock,
            };
            const id = createSave(save);
            setSlots(getAllSaves());
            setActiveSlotId(id);
            setCharacter(newCharacter);
            setEquipment(startingEquipment);
            setInventory([]);
            setClearedDungeons([]);
            setConsumables({ healthPotion: 1 });
            setShopStock(newShopStock);
            setHubTab("dungeons");
            setShowSewersIntro(true);
            setHasShownSewersIntro(true);
            setSelectedAct(1);
            setCreating(false);
          }}
        />
        <FullscreenButton />
      </>
    );
  }

  const derived = getDerivedStats(character, equipment);

  function handleSelectSlot(slotId: string) {
    const save = getSave(slotId);
    if (!save) return;
    const loadedCharacter: Character = {
      ...save.character,
      runStats: save.character.runStats ?? {
        damageDealt: 0,
        goldEarned: 0,
        kills: 0,
      },
      frozenAlloys: save.character.frozenAlloys ?? 0,
    };
    if (save.inCombat && save.activeDungeonRun) {
      const run = save.activeDungeonRun;
      const dungeon = DUNGEONS.find((d) => d.id === run.dungeonId);
      if (dungeon) {
        setActiveSlotId(slotId);
        setCharacter(loadedCharacter);
        setEquipment(save.equipment);
        setInventory(save.inventory);
        setClearedDungeons(save.clearedDungeons);
        setConsumables(save.consumables ?? EMPTY_CONSUMABLES);
        setShopStock(
          save.shopStock ??
            generateShopStock(
              save.character.level,
              save.character.classId,
              4,
              save.clearedDungeons,
            ),
        );
        setSelectedAct(1);
        setDungeonRun({
          dungeonId: run.dungeonId,
          queue: [...dungeon.waves, dungeon.boss],
          index: run.index,
          currentLife: run.currentLife,
          currentMana: run.currentMana,
          currentCooldown: run.currentCooldown,
          currentCooldown2: run.currentCooldown2,
          currentPreparation: run.currentPreparation ?? 0,
          currentHolyLightCharges: run.currentHolyLightCharges ?? 0,
        });
        return;
      }
    }
    setActiveSlotId(slotId);
    setCharacter(loadedCharacter);
    setEquipment(save.equipment);
    setInventory(save.inventory);
    setClearedDungeons(save.clearedDungeons);
    setConsumables(save.consumables ?? EMPTY_CONSUMABLES);
    setShopStock(
      save.shopStock ??
        generateShopStock(save.character.level, save.character.classId),
    );
    setDungeonRun(null);
    setSelectedAct(1);
    setHasShownSewersIntro(false);
  }

  function handleDeleteSlot(slotId: string) {
    deleteSave(slotId);
    setSlots(getAllSaves());
  }

  // Import a single hero from a transfer code. Returns an error string for the
  // UI, or null on success.
  async function handleImportSlot(code: string): Promise<string | null> {
    if (slots.length >= MAX_SAVE_SLOTS) {
      return `Hero limit reached (${MAX_SAVE_SLOTS}). Delete one first.`;
    }
    const res = await importSaveCode(code);
    if ("error" in res) return `Import failed — ${res.error}`;
    setSlots(getAllSaves());
    return null;
  }

  function handleAllocate(stat: keyof BaseStats) {
    setCharacter((prev) => {
      if (!prev || prev.unspentStatPoints <= 0) return prev;
      return {
        ...prev,
        unspentStatPoints: prev.unspentStatPoints - 1,
        allocatedStats: {
          ...prev.allocatedStats,
          [stat]: prev.allocatedStats[stat] + 1,
        },
      };
    });
  }

  function slotCategory(slot: EquipmentSlot): string {
    return slot === "ring1" || slot === "ring2" ? "ring" : slot;
  }

  function canPlaceInSlot(item: Item, targetSlot: EquipmentSlot): boolean {
    if (!character) return false;
    if (targetSlot === "weapon") return item.slot === "weapon";
    if (targetSlot === "shield") {
      if (equipment.weapon?.twoHanded) return false;
      if (character.classId === "paladin") return item.slot === "shield";
      if (character.classId === "barbarian")
        return item.slot === "weapon" && !item.twoHanded;
      if (character.classId === "assassin")
        return item.slot === "weapon" && !item.twoHanded;
      if (character.classId === "monk")
        return item.slot === "weapon" && !item.twoHanded;
      return false;
    }
    return slotCategory(item.slot) === slotCategory(targetSlot);
  }

  function handleMoveItem(
    itemId: string,
    from: EquipmentSlot | "inventory",
    to: EquipmentSlot | "inventory",
  ) {
    const sourceItem =
      from === "inventory"
        ? inventory.find((i) => i.id === itemId)
        : equipment[from];
    if (!sourceItem || from === to) return;

    if (to === "inventory") {
      if (from === "inventory") return;
      const nextEquipment = { ...equipment };
      delete nextEquipment[from];
      setEquipment(nextEquipment);
      setInventory([...inventory, sourceItem]);
      return;
    }

    if (!canPlaceInSlot(sourceItem, to)) return;

    const targetItem = equipment[to];
    const placedItem = sourceItem;
    const nextEquipment = { ...equipment, [to]: placedItem };
    let nextInventory = inventory.filter((i) => i.id !== itemId);

    if (from !== "inventory") {
      delete nextEquipment[from];
      if (targetItem) {
        if (canPlaceInSlot(targetItem, from)) {
          nextEquipment[from] = targetItem;
        } else {
          nextInventory = [...nextInventory, targetItem];
        }
      }
    } else if (targetItem) {
      nextInventory = [...nextInventory, targetItem];
    }

    if (to === "weapon" && placedItem.twoHanded && nextEquipment.shield) {
      nextInventory = [...nextInventory, nextEquipment.shield];
      delete nextEquipment.shield;
    }

    setEquipment(nextEquipment);
    setInventory(nextInventory);
  }

  function handleToggleFavorite(itemId: string) {
    setInventory((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, favorite: !i.favorite } : i)),
    );
  }

  function handleSell(item: Item) {
    if (item.favorite) return;
    setInventory((prev) => prev.filter((i) => i.id !== item.id));
    setCharacter((prev) =>
      prev ? { ...prev, gold: prev.gold + sellValue(item) } : prev,
    );
  }

  function handleSellAll() {
    const sellable = inventory.filter((i) => !i.favorite);
    const total = sellable.reduce((sum, item) => sum + sellValue(item), 0);
    setInventory((prev) => prev.filter((i) => i.favorite));
    setCharacter((prev) =>
      prev ? { ...prev, gold: prev.gold + total } : prev,
    );
  }

  function handleSellJunk() {
    const junk = inventory.filter(
      (i) => !i.favorite && (i.rarity === "normal" || i.rarity === "magic"),
    );
    const total = junk.reduce((sum, item) => sum + sellValue(item), 0);
    setInventory((prev) =>
      prev.filter(
        (i) => i.favorite || (i.rarity !== "normal" && i.rarity !== "magic"),
      ),
    );
    setCharacter((prev) =>
      prev ? { ...prev, gold: prev.gold + total } : prev,
    );
  }

  function handleUsePotion(id: ConsumableId) {
    setConsumables((prev) => ({ ...prev, [id]: Math.max(0, prev[id] - 1) }));
  }

  function handleBuyItem(item: Item) {
    if (!character) return;
    const price = buyValue(item);
    if (character.gold < price) return;
    setCharacter({ ...character, gold: character.gold - price });
    setInventory([...inventory, item]);
    setShopStock(shopStock.filter((i) => i.id !== item.id));
  }

  function handleSortInventory() {
    setInventory((prev) => sortInventory(prev));
  }

  function handleGamble(offer: GambleOffer) {
    if (!character || character.gold < offer.price) return;
    const item = rollGambleItem(
      offer.slot,
      character.level,
      character.classId,
      clearedDungeons,
    );
    setCharacter((prev) =>
      prev ? { ...prev, gold: prev.gold - offer.price } : prev,
    );
    setInventory((prev) => [item, ...prev]);
    setDroppedItem(item);
  }

  function handleRestockShop() {
    if (!character) return;
    const fee = restockFee(character.level);
    if (character.gold < fee) return;
    setCharacter({ ...character, gold: character.gold - fee });
    setShopStock(
      generateShopStock(character.level, character.classId, 4, clearedDungeons),
    );
  }

  function handleForgeAddAffix(itemId: string) {
    if (!character || (character.frozenAlloys ?? 0) < 1) return;
    const item = inventory.find((i) => i.id === itemId);
    // No slot-eligible stat left to add → don't burn a Frozen Alloy on a no-op.
    if (!item || !canAddFourthAffix(item)) return;
    setInventory((prev) =>
      prev.map((i) => (i.id === itemId ? addFourthAffix(i) : i)),
    );
    setCharacter((prev) =>
      prev ? { ...prev, frozenAlloys: (prev.frozenAlloys ?? 1) - 1 } : prev,
    );
  }

  function handleForgeRerollAffix(itemId: string, affixIndex: number) {
    if (!character || (character.frozenAlloys ?? 0) < 1) return;
    const item = inventory.find((i) => i.id === itemId);
    if (!item) return;
    const isLocked = item.lockedAffixIndex != null;
    const idx = isLocked ? (item.lockedAffixIndex as number) : affixIndex;
    // Guards rolls-left AND an available stat → never spend an alloy for nothing.
    if (!canRerollAffix(item, idx)) return;
    setInventory((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        return isLocked
          ? rerollLockedAffix(i)
          : lockAndRerollAffix(i, affixIndex);
      }),
    );
    setCharacter((prev) =>
      prev ? { ...prev, frozenAlloys: (prev.frozenAlloys ?? 1) - 1 } : prev,
    );
  }

  function handleStartDungeon(dungeonId: string) {
    if (!character) return;
    const dungeon = DUNGEONS.find((d) => d.id === dungeonId);
    if (!dungeon) return;
    preloadMonsterAssets([
      ...dungeon.waves.map((m) => m.name),
      dungeon.boss.name,
    ]);
    setRunItemsFound(0); // fresh per-clear item counter
    const startingLife = derived.maxLife;
    const startingMana = getStartingResource(character, derived);
    // Potions are not purchasable — every stage grants a fresh stock of
    // 1 + belt potion slots, so leftovers never carry between runs.
    const stagePotions = {
      healthPotion: getPotionsForStage(derived.potionSlots),
    };
    setConsumables(stagePotions);
    if (activeSlotId) {
      writeSave(activeSlotId, {
        character,
        equipment,
        inventory,
        clearedDungeons,
        consumables: stagePotions,
        shopStock,
        inCombat: true,
        activeDungeonRun: {
          dungeonId,
          index: 0,
          currentLife: startingLife,
          currentMana: startingMana,
          currentCooldown: 0,
          currentCooldown2: 0,
          currentPreparation: 0,
          currentHolyLightCharges: 0,
        },
      });
    }
    setDungeonRun({
      dungeonId,
      queue: [...dungeon.waves, dungeon.boss],
      index: 0,
      currentLife: startingLife,
      currentMana: startingMana,
      currentCooldown: 0,
      currentCooldown2: 0,
      currentPreparation: 0,
      currentHolyLightCharges: 0,
    });
  }

  function handleEscape() {
    setCharacter((prev) => {
      if (!prev) return prev;
      // Softcore: flee freely (no token) but pay 30% of gold.
      if (prev.mode === "softcore") {
        return { ...prev, gold: prev.gold - Math.floor(prev.gold * 0.3) };
      }
      // Hardcore: costs one escape token.
      return { ...prev, escapeTokens: Math.max(0, prev.escapeTokens - 1) };
    });
    setDungeonRun(null);
  }

  function handleQuitToMenu() {
    setActiveSlotId(null);
    setCharacter(null);
    setEquipment({});
    setInventory([]);
    setClearedDungeons([]);
    setConsumables(EMPTY_CONSUMABLES);
    setShopStock([]);
    setDungeonRun(null);
    setSlots(getAllSaves());
  }

  // Rolled the moment a fight is won (from CombatScreen), before the victory
  // overlay renders, so runItemsFound reflects this fight's drops too.
  function handleRollDrops(monsterLevel: number, isBoss: boolean) {
    if (!character || !dungeonRun) return;
    const rarityOrder: ItemRarity[] = [
      "normal",
      "magic",
      "rare",
      "very rare",
      "unique",
    ];
    let found = 0;
    const bank = (item: Item) => {
      setInventory((prev) => [item, ...prev]);
      setDroppedItem((prev) =>
        prev === null ||
        rarityOrder.indexOf(item.rarity) >= rarityOrder.indexOf(prev.rarity)
          ? item
          : prev,
      );
      if (["rare", "very rare", "unique"].includes(item.rarity))
        setHasUnseenDrops(true);
      found += 1;
    };
    if (isBoss) {
      for (const entry of UNIQUE_DROP_TABLE) {
        if (entry.dungeons && !entry.dungeons.includes(dungeonRun.dungeonId))
          continue;
        if (entry.minLevel && character.level < entry.minLevel) continue;
        if (!entry.dungeons && entry.maxLevel) {
          const bossDef = DUNGEONS.find(
            (d) => d.id === dungeonRun.dungeonId,
          )?.boss;
          if (bossDef && bossDef.level > entry.maxLevel) continue;
        }
        if (entry.classId && entry.classId !== character.classId) continue;
        if (Math.random() >= entry.chance) continue;
        bank(entry.generator());
      }
    }
    if (Math.random() < (isBoss ? 1 : 0.35))
      bank(generateRandomItem(monsterLevel, character.classId));
    if (found > 0) setRunItemsFound((n) => n + found);
  }

  function handleFightFinished(result: CombatResult, clearAgain = false) {
    if (!dungeonRun || !character) return;
    const monster = dungeonRun.queue[dungeonRun.index];
    const isBoss = dungeonRun.index === dungeonRun.queue.length - 1;

    const updatedRunStats: RunStats = {
      damageDealt: character.runStats.damageDealt + result.damageDealt,
      goldEarned: character.runStats.goldEarned + result.goldReward,
      kills: character.runStats.kills + (result.victory ? 1 : 0),
    };

    if (!result.victory) {
      // Softcore: keep the character and gear — but wipe all gold and all
      // current-level XP progress, then drop straight back to the hub, no
      // death-summary screen. Level never drops because character.xp is only
      // the progress within the current level.
      if (character.mode === "softcore") {
        setCharacter({
          ...character,
          gold: 0,
          xp: 0,
          runStats: updatedRunStats,
        });
        setDungeonRun(null); // auto-save persists the penalized character
        return;
      }
      // Hardcore: permadeath — delete the save and wipe all state.
      if (activeSlotId) deleteSave(activeSlotId);
      setDeathSummary({
        characterName: character.name,
        classId: character.classId,
        level: character.level,
        damageDealt: updatedRunStats.damageDealt,
        goldEarned: updatedRunStats.goldEarned,
        kills: updatedRunStats.kills,
      });
      setActiveSlotId(null);
      setCharacter(null);
      setEquipment({});
      setInventory([]);
      setClearedDungeons([]);
      setConsumables(EMPTY_CONSUMABLES);
      setShopStock([]);
      setDungeonRun(null);
      setSlots(getAllSaves());
      return;
    }

    const xpCap = getXpCapLevel(clearedDungeons, dungeonRun.dungeonId);
    const isFirstClear = !clearedDungeons.includes(dungeonRun.dungeonId);
    const xpMult = isFirstClear
      ? XP_REWARD_MULT * FIRST_CLEAR_MULT
      : XP_REWARD_MULT;
    setCharacter((prev) => {
      if (!prev) return prev;
      const withGold = {
        ...prev,
        gold: prev.gold + result.goldReward,
        runStats: updatedRunStats,
      };
      const cappedXp =
        prev.level >= xpCap ? 0 : Math.round(result.xpReward * xpMult);
      const { character: withXp } = grantXp(withGold, cappedXp);
      return withXp;
    });

    // Item drops are rolled at win-time via handleRollDrops (called from
    // CombatScreen), so the "Items found" counter is up to date on the victory
    // screen — including the boss's own loot.

    if (isBoss && clearedDungeons.includes("frostforge")) {
      const bossLevel = monster.level;
      if (bossLevel >= 40) {
        const levelDiff = character.level - bossLevel;
        const alloyChance = levelDiff >= 7 ? 0.005 : 0.04;
        if (Math.random() < alloyChance) {
          setCharacter((prev) =>
            prev
              ? {
                  ...prev,
                  frozenAlloys: Math.min(10, (prev.frozenAlloys ?? 0) + 1),
                }
              : prev,
          );
        }
      }
    }

    const nextIndex = dungeonRun.index + 1;
    if (nextIndex >= dungeonRun.queue.length) {
      const wasNew = !clearedDungeons.includes(dungeonRun.dungeonId);
      setClearedDungeons((prev) =>
        prev.includes(dungeonRun.dungeonId)
          ? prev
          : [...prev, dungeonRun.dungeonId],
      );
      // First-clear alloy reward — granted here, before the Clear Again
      // early-return below, so it fires whether the player picks Continue or
      // Clear Again (otherwise Clear Again marks the dungeon cleared but skips
      // the reward, and wasNew is false forever after).
      if (wasNew && dungeonRun.dungeonId === "frostforge") {
        setCharacter((prev) =>
          prev
            ? {
                ...prev,
                frozenAlloys: Math.min(10, (prev.frozenAlloys ?? 0) + 3),
              }
            : prev,
        );
      }
      // Clear Again: skip the return-to-hub UI and restart the same dungeon.
      // The restart is deferred to a layout effect so it runs after the reward
      // state (gold/XP/drops) has committed — otherwise the fresh run's save
      // would be written with stale, pre-reward values.
      if (clearAgain) {
        setDungeonRun(null);
        setPendingRestart(dungeonRun.dungeonId);
        return;
      }
      if (wasNew && dungeonRun.dungeonId === "sewers")
        setShowSewersEscape(true);
      if (wasNew && dungeonRun.dungeonId === "goblins-path")
        setShowGheedonMessage(true);
      if (wasNew && dungeonRun.dungeonId === "frostforge")
        setShowFrostforgeMessage(true);
      if (wasNew && dungeonRun.dungeonId === "bandits-town-hall")
        setShowPortalMessage(true);
      if (wasNew && dungeonRun.dungeonId === "the-white-maw")
        setShowAct3Message(true);
      if (wasNew && dungeonRun.dungeonId === "sacrificial-altar")
        setShowAct4Message(true);
      if (wasNew && dungeonRun.dungeonId === "throne-of-endless-night")
        setShowEndingMessage(true);
      const completedDungeon = DUNGEONS.find(
        (d) => d.id === dungeonRun.dungeonId,
      );
      setSelectedAct((completedDungeon?.act ?? 1) as 1 | 2 | 3 | 4);
      setHubTab("dungeons");
      setDungeonRun(null);
      return;
    }

    const nextRunState = {
      ...dungeonRun,
      index: nextIndex,
      currentLife: result.endingLife,
      currentMana: getStartingResource(character, derived, result.endingMana),
      currentCooldown: result.endingCooldown,
      currentCooldown2: result.endingCooldown2,
      currentPreparation: result.endingPreparation ?? 0,
      currentHolyLightCharges: result.endingHolyLightCharges ?? 0,
    };
    if (activeSlotId) {
      writeSave(activeSlotId, {
        character,
        equipment,
        inventory,
        clearedDungeons,
        consumables,
        shopStock,
        inCombat: true,
        activeDungeonRun: {
          dungeonId: nextRunState.dungeonId,
          index: nextRunState.index,
          currentLife: nextRunState.currentLife,
          currentMana: nextRunState.currentMana,
          currentCooldown: nextRunState.currentCooldown,
          currentCooldown2: nextRunState.currentCooldown2,
          currentPreparation: nextRunState.currentPreparation,
          currentHolyLightCharges: nextRunState.currentHolyLightCharges,
        },
      });
    }
    setDungeonRun(nextRunState);
  }

  if (dungeonRun) {
    const monster = dungeonRun.queue[dungeonRun.index];
    return (
      <>
        <CombatScreen
          key={`${dungeonRun.dungeonId}-${dungeonRun.index}`}
          character={character}
          derived={derived}
          equipment={equipment}
          monster={monster}
          startingLife={dungeonRun.currentLife}
          startingMana={dungeonRun.currentMana}
          startingCooldown={dungeonRun.currentCooldown}
          startingCooldown2={dungeonRun.currentCooldown2}
          startingPreparation={dungeonRun.currentPreparation}
          startingHolyLightCharges={dungeonRun.currentHolyLightCharges}
          consumables={consumables}
          escapeTokens={character.escapeTokens ?? 0}
          xpCapped={
            character.level >=
            getXpCapLevel(clearedDungeons, dungeonRun.dungeonId)
          }
          xpMultiplier={
            clearedDungeons.includes(dungeonRun.dungeonId)
              ? XP_REWARD_MULT
              : XP_REWARD_MULT * FIRST_CLEAR_MULT
          }
          isBossFight={dungeonRun.index === dungeonRun.queue.length - 1}
          itemsFoundThisRun={runItemsFound}
          onRollDrops={handleRollDrops}
          onUsePotion={handleUsePotion}
          onFinished={handleFightFinished}
          onEscape={handleEscape}
        />
        <FullscreenButton />
      </>
    );
  }

  return (
    <>
      <Hub
        character={character}
        derived={derived}
        equipment={equipment}
        inventory={inventory}
        clearedDungeons={clearedDungeons}
        shopStock={shopStock}
        onAllocate={handleAllocate}
        onMoveItem={handleMoveItem}
        onToggleFavorite={handleToggleFavorite}
        onSortInventory={handleSortInventory}
        onSell={handleSell}
        onSellAll={handleSellAll}
        onSellJunk={handleSellJunk}
        onStartDungeon={handleStartDungeon}
        onQuitToMenu={handleQuitToMenu}
        onBuyItem={handleBuyItem}
        onRestockShop={handleRestockShop}
        restockFee={restockFee(character.level)}
        onGamble={handleGamble}
        showPortalMessage={showPortalMessage}
        onDismissPortal={() => setShowPortalMessage(false)}
        showSewersIntro={showSewersIntro}
        onDismissSewersIntro={() => setShowSewersIntro(false)}
        showSewersEscape={showSewersEscape}
        onDismissSewersEscape={() => setShowSewersEscape(false)}
        showGheedonMessage={showGheedonMessage}
        onDismissGheedonMessage={() => setShowGheedonMessage(false)}
        showFrostforgeMessage={showFrostforgeMessage}
        onDismissFrostforgeMessage={() => setShowFrostforgeMessage(false)}
        showAct3Message={showAct3Message}
        onDismissAct3Message={() => setShowAct3Message(false)}
        showAct4Message={showAct4Message}
        onDismissAct4Message={() => setShowAct4Message(false)}
        showEndingMessage={showEndingMessage}
        onDismissEndingMessage={() => setShowEndingMessage(false)}
        sewersCleared={clearedDungeons.includes("sewers")}
        goblinsPathCleared={clearedDungeons.includes("goblins-path")}
        frostforgeCleared={clearedDungeons.includes("frostforge")}
        onForgeAddAffix={handleForgeAddAffix}
        onForgeRerollAffix={handleForgeRerollAffix}
        droppedItem={droppedItem}
        onDismissDroppedItem={() => setDroppedItem(null)}
        selectedAct={selectedAct}
        onSelectAct={setSelectedAct}
        selectedTab={hubTab}
        onSelectTab={(
          t:
            | "character"
            | "inventory"
            | "dungeons"
            | "merchant"
            | "gambler"
            | "journal",
        ) => {
          if (t === "inventory") setHasUnseenDrops(false);
          if (
            t === "dungeons" &&
            !clearedDungeons.includes("sewers") &&
            !hasShownSewersIntro
          ) {
            setShowSewersIntro(true);
            setHasShownSewersIntro(true);
          }
          setHubTab(t);
        }}
        hasUnseenDrops={hasUnseenDrops}
      />
      <FullscreenButton />
    </>
  );
}

export default App;
