import { useEffect, useState } from "react";
import { CharacterCreation } from "./components/CharacterCreation";
import { CharacterSelect } from "./components/CharacterSelect";
import { Hub } from "./components/Hub";
import { CombatScreen } from "./components/CombatScreen";
import { GameOverScreen } from "./components/GameOverScreen";
import { createCharacter, getDerivedStats, getStartingResource, grantXp } from "./game/character";
import { EMPTY_CONSUMABLES, getPotionCost } from "./game/data/consumables";
import { DUNGEONS, getXpCapLevel } from "./game/data/dungeons";
import { buyValue, generateRandomItem, generateShopStock, generateStartingEquipment, sellValue } from "./game/data/items";
import { UNIQUE_DROP_TABLE } from "./game/data/drops";
import { getAllSaves, getSave, writeSave, createSave, deleteSave } from "./game/storage";
import type { SaveSlot } from "./game/storage";
import type { CombatResult } from "./game/combat";
import type {
  BaseStats,
  Character,
  ClassId,
  ConsumableId,
  DeathSummary,
  EquipmentSlot,
  Item,
  MonsterDefinition,
  RunStats,
  SaveGame,
} from "./game/types";
import "./App.css";

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
}

function App() {
  const [slots, setSlots] = useState<SaveSlot[]>([]);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [character, setCharacter] = useState<Character | null>(null);
  const [equipment, setEquipment] = useState<Partial<Record<EquipmentSlot, Item>>>({});
  const [inventory, setInventory] = useState<Item[]>([]);
  const [clearedDungeons, setClearedDungeons] = useState<string[]>([]);
  const [consumables, setConsumables] = useState<Record<ConsumableId, number>>(EMPTY_CONSUMABLES);
  const [shopStock, setShopStock] = useState<Item[]>([]);
  const [dungeonRun, setDungeonRun] = useState<DungeonRunState | null>(null);
  const [selectedAct, setSelectedAct] = useState<1 | 2>(1);
  const [hubTab, setHubTab] = useState<"character" | "inventory" | "dungeons" | "shop">("character");
  const [deathSummary, setDeathSummary] = useState<DeathSummary | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showPortalMessage, setShowPortalMessage] = useState(false);
  const [droppedItem, setDroppedItem] = useState<import("./game/types").Item | null>(null);

  useEffect(() => {
    setSlots(getAllSaves());
    setLoaded(true);
  }, []);

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
    const save: SaveGame = { character, equipment, inventory, clearedDungeons, consumables, shopStock, inCombat: false };
    writeSave(activeSlotId, save);
  }, [loaded, activeSlotId, character, equipment, inventory, clearedDungeons, consumables, shopStock, dungeonRun]);

  if (!loaded) return null;

  if (deathSummary) {
    return (
      <GameOverScreen
        summary={deathSummary}
        onContinue={() => setDeathSummary(null)}
      />
    );
  }

  if (!activeSlotId && !creating) {
    return (
      <CharacterSelect
        slots={slots}
        onSelect={handleSelectSlot}
        onDelete={handleDeleteSlot}
        onNew={() => setCreating(true)}
      />
    );
  }

  if (!character) {
    return (
      <CharacterCreation
        onBack={() => setCreating(false)}
        onCreate={(name: string, classId: ClassId) => {
          const newCharacter = createCharacter(name, classId);
          const newShopStock = generateShopStock(1, classId);
          const startingEquipment = generateStartingEquipment(classId);
          const save: SaveGame = {
            character: newCharacter,
            equipment: startingEquipment,
            inventory: [],
            clearedDungeons: [],
            consumables: { healthPotion: 1, manaPotion: 0 },
            shopStock: newShopStock,
          };
          const id = createSave(save);
          setSlots(getAllSaves());
          setActiveSlotId(id);
          setCharacter(newCharacter);
          setEquipment(startingEquipment);
          setInventory([]);
          setClearedDungeons([]);
          setConsumables({ healthPotion: 1, manaPotion: 0 });
          setShopStock(newShopStock);
          setHubTab("character");
          setCreating(false);
        }}
      />
    );
  }

  const derived = getDerivedStats(character, equipment);

  function handleSelectSlot(slotId: string) {
    const save = getSave(slotId);
    if (!save) return;
    if (save.inCombat && save.activeDungeonRun) {
      const run = save.activeDungeonRun;
      const dungeon = DUNGEONS.find((d) => d.id === run.dungeonId);
      if (dungeon) {
        setActiveSlotId(slotId);
        setCharacter(save.character);
        setEquipment(save.equipment);
        setInventory(save.inventory);
        setClearedDungeons(save.clearedDungeons);
        setConsumables(save.consumables ?? EMPTY_CONSUMABLES);
        setShopStock(save.shopStock ?? generateShopStock(save.character.level, save.character.classId));
        setSelectedAct(1);
        setDungeonRun({
          dungeonId: run.dungeonId,
          queue: [...dungeon.waves, dungeon.boss],
          index: run.index,
          currentLife: run.currentLife,
          currentMana: run.currentMana,
          currentCooldown: run.currentCooldown,
          currentCooldown2: run.currentCooldown2,
        });
        return;
      }
    }
    setActiveSlotId(slotId);
    setCharacter(save.character);
    setEquipment(save.equipment);
    setInventory(save.inventory);
    setClearedDungeons(save.clearedDungeons);
    setConsumables(save.consumables ?? EMPTY_CONSUMABLES);
    setShopStock(save.shopStock ?? generateShopStock(save.character.level, save.character.classId));
    setDungeonRun(null);
    setSelectedAct(1);
  }

  function handleDeleteSlot(slotId: string) {
    deleteSave(slotId);
    setSlots(getAllSaves());
  }

  function handleAllocate(stat: keyof BaseStats) {
    setCharacter((prev) => {
      if (!prev || prev.unspentStatPoints <= 0) return prev;
      return {
        ...prev,
        unspentStatPoints: prev.unspentStatPoints - 1,
        allocatedStats: { ...prev.allocatedStats, [stat]: prev.allocatedStats[stat] + 1 },
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
      if (character.classId === "barbarian") return item.slot === "weapon" && !item.twoHanded;
      if (character.classId === "assassin") return item.slot === "weapon" && !item.twoHanded;
      return false;
    }
    return slotCategory(item.slot) === slotCategory(targetSlot);
  }

  function handleMoveItem(itemId: string, from: EquipmentSlot | "inventory", to: EquipmentSlot | "inventory") {
    const sourceItem = from === "inventory" ? inventory.find((i) => i.id === itemId) : equipment[from];
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

  function handleSell(item: Item) {
    setInventory((prev) => prev.filter((i) => i.id !== item.id));
    setCharacter((prev) => (prev ? { ...prev, gold: prev.gold + sellValue(item) } : prev));
  }

  function handleSellAll() {
    const total = inventory.reduce((sum, item) => sum + sellValue(item), 0);
    setInventory([]);
    setCharacter((prev) => (prev ? { ...prev, gold: prev.gold + total } : prev));
  }

  function handleSellJunk() {
    const junk = inventory.filter((i) => i.rarity === "normal" || i.rarity === "magic");
    const total = junk.reduce((sum, item) => sum + sellValue(item), 0);
    setInventory((prev) => prev.filter((i) => i.rarity !== "normal" && i.rarity !== "magic"));
    setCharacter((prev) => (prev ? { ...prev, gold: prev.gold + total } : prev));
  }

  const POTION_STACK_LIMIT = 5;

  function handleBuyConsumable(id: ConsumableId) {
    if (!character) return;
    if (consumables[id] >= POTION_STACK_LIMIT) return;
    const cost = getPotionCost(clearedDungeons);
    if (character.gold < cost) return;
    setCharacter({ ...character, gold: character.gold - cost });
    setConsumables({ ...consumables, [id]: consumables[id] + 1 });
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

  function handleRestockShop() {
    if (!character) return;
    const fee = restockFee(character.level);
    if (character.gold < fee) return;
    setCharacter({ ...character, gold: character.gold - fee });
    setShopStock(generateShopStock(character.level, character.classId));
  }

  function handleStartDungeon(dungeonId: string) {
    if (!character) return;
    const dungeon = DUNGEONS.find((d) => d.id === dungeonId);
    if (!dungeon) return;
    const startingLife = derived.maxLife;
    const startingMana = getStartingResource(character, derived);
    if (activeSlotId) {
      writeSave(activeSlotId, { character, equipment, inventory, clearedDungeons, consumables, shopStock, inCombat: true, activeDungeonRun: { dungeonId, index: 0, currentLife: startingLife, currentMana: startingMana, currentCooldown: 0, currentCooldown2: 0 } });
    }
    setDungeonRun({
      dungeonId,
      queue: [...dungeon.waves, dungeon.boss],
      index: 0,
      currentLife: startingLife,
      currentMana: startingMana,
      currentCooldown: 0,
      currentCooldown2: 0,
    });
  }

  function handleEscape() {
    setCharacter((prev) => prev ? { ...prev, escapeTokens: Math.max(0, prev.escapeTokens - 1) } : prev);
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

  function handleFightFinished(result: CombatResult) {
    if (!dungeonRun || !character) return;
    const monster = dungeonRun.queue[dungeonRun.index];

    const updatedRunStats: RunStats = {
      damageDealt: character.runStats.damageDealt + result.damageDealt,
      goldEarned: character.runStats.goldEarned + result.goldReward,
      kills: character.runStats.kills + (result.victory ? 1 : 0),
    };

    if (!result.victory) {
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
    const isReclear = clearedDungeons.includes(dungeonRun.dungeonId);
    const reducedReclearIds = new Set(["diablo", "imp-field", "lava-river", "ashen-caves", "higher-hell", "lower-hell", "hellcore"]);
    const reclearMult = isReclear && reducedReclearIds.has(dungeonRun.dungeonId) ? 0.25 : 1;
    setCharacter((prev) => {
      if (!prev) return prev;
      const withGold = { ...prev, gold: prev.gold + result.goldReward, runStats: updatedRunStats };
      const cappedXp = prev.level >= xpCap ? 0 : Math.round(result.xpReward * reclearMult);
      const { character: withXp } = grantXp(withGold, cappedXp);
      return withXp;
    });

    const isBoss = dungeonRun.index === dungeonRun.queue.length - 1;
    const rarityOrder: import("./game/types").ItemRarity[] = ["normal", "magic", "rare", "very rare", "unique"];
    if (isBoss) {
      for (const entry of UNIQUE_DROP_TABLE) {
        if (entry.dungeons && !entry.dungeons.includes(dungeonRun.dungeonId)) continue;
        if (entry.minLevel && character.level < entry.minLevel) continue;
        if (entry.classId && entry.classId !== character.classId) continue;
        if (Math.random() >= entry.chance) continue;
        const item = entry.generator();
        setInventory((prev) => [...prev, item]);
        setDroppedItem((prev) => prev === null || rarityOrder.indexOf(item.rarity) >= rarityOrder.indexOf(prev.rarity) ? item : prev);
      }
    }
    const dropChance = isBoss ? 1 : 0.35;
    if (Math.random() < dropChance) {
      const item = generateRandomItem(monster.level, character.classId);
      setInventory((prev) => [...prev, item]);
      setDroppedItem((prev) =>
        prev === null || rarityOrder.indexOf(item.rarity) >= rarityOrder.indexOf(prev.rarity) ? item : prev
      );
    }

    const nextIndex = dungeonRun.index + 1;
    if (nextIndex >= dungeonRun.queue.length) {
      const wasNew = !clearedDungeons.includes(dungeonRun.dungeonId);
      setClearedDungeons((prev) => (prev.includes(dungeonRun.dungeonId) ? prev : [...prev, dungeonRun.dungeonId]));
      if (wasNew && dungeonRun.dungeonId === "diablo") setShowPortalMessage(true);
      const completedDungeon = DUNGEONS.find((d) => d.id === dungeonRun.dungeonId);
      setSelectedAct((completedDungeon?.act ?? 1) as 1 | 2);
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
    };
    if (activeSlotId) {
      writeSave(activeSlotId, { character, equipment, inventory, clearedDungeons, consumables, shopStock, inCombat: true, activeDungeonRun: { dungeonId: nextRunState.dungeonId, index: nextRunState.index, currentLife: nextRunState.currentLife, currentMana: nextRunState.currentMana, currentCooldown: nextRunState.currentCooldown, currentCooldown2: nextRunState.currentCooldown2 } });
    }
    setDungeonRun(nextRunState);
  }

  if (dungeonRun) {
    const monster = dungeonRun.queue[dungeonRun.index];
    return (
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
        consumables={consumables}
        escapeTokens={character.escapeTokens ?? 0}
        xpCapped={character.level >= getXpCapLevel(clearedDungeons, dungeonRun.dungeonId)}
        xpMultiplier={clearedDungeons.includes(dungeonRun.dungeonId) && new Set(["diablo","imp-field","lava-river","ashen-caves","higher-hell","lower-hell","hellcore"]).has(dungeonRun.dungeonId) ? 0.25 : 1}
        clearedDungeons={clearedDungeons}
        onUsePotion={handleUsePotion}
        onFinished={handleFightFinished}
        onEscape={handleEscape}
      />
    );
  }

  return (
    <Hub
      character={character}
      derived={derived}
      equipment={equipment}
      inventory={inventory}
      clearedDungeons={clearedDungeons}
      consumables={consumables}
      shopStock={shopStock}
      onAllocate={handleAllocate}
      onMoveItem={handleMoveItem}
      onSell={handleSell}
      onSellAll={handleSellAll}
      onSellJunk={handleSellJunk}
      onStartDungeon={handleStartDungeon}
      onQuitToMenu={handleQuitToMenu}
      onBuyConsumable={handleBuyConsumable}
      onBuyItem={handleBuyItem}
      onRestockShop={handleRestockShop}
      restockFee={restockFee(character.level)}
      showPortalMessage={showPortalMessage}
      onDismissPortal={() => setShowPortalMessage(false)}
      droppedItem={droppedItem}
      onDismissDroppedItem={() => setDroppedItem(null)}
      selectedAct={selectedAct}
      onSelectAct={setSelectedAct}
      selectedTab={hubTab}
      onSelectTab={setHubTab}
    />
  );
}

export default App;
