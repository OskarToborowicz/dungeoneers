import { useEffect, useState } from "react";
import { CharacterCreation } from "./components/CharacterCreation";
import { Hub } from "./components/Hub";
import { CombatScreen } from "./components/CombatScreen";
import { GameOverScreen } from "./components/GameOverScreen";
import { createCharacter, getDerivedStats, getStartingResource, grantXp } from "./game/character";
import { CONSUMABLES, EMPTY_CONSUMABLES } from "./game/data/consumables";
import { DUNGEONS } from "./game/data/dungeons";
import { buyValue, generateRandomItem, generateShopStock, sellValue } from "./game/data/items";
import { loadSave, writeSave, clearSave } from "./game/storage";
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

const RESTOCK_FEE = 10;

interface DungeonRunState {
  dungeonId: string;
  queue: MonsterDefinition[];
  index: number;
  currentLife: number;
  currentMana: number;
  currentCooldown: number;
}

function App() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [equipment, setEquipment] = useState<Partial<Record<EquipmentSlot, Item>>>({});
  const [inventory, setInventory] = useState<Item[]>([]);
  const [clearedDungeons, setClearedDungeons] = useState<string[]>([]);
  const [consumables, setConsumables] = useState<Record<ConsumableId, number>>(EMPTY_CONSUMABLES);
  const [shopStock, setShopStock] = useState<Item[]>([]);
  const [dungeonRun, setDungeonRun] = useState<DungeonRunState | null>(null);
  const [deathSummary, setDeathSummary] = useState<DeathSummary | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const save = loadSave();
    if (save) {
      setCharacter(save.character);
      setEquipment(save.equipment);
      setInventory(save.inventory);
      setClearedDungeons(save.clearedDungeons);
      setConsumables(save.consumables ?? EMPTY_CONSUMABLES);
      setShopStock(save.shopStock ?? generateShopStock(save.character.level, save.character.classId));
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || !character) return;
    const save: SaveGame = { character, equipment, inventory, clearedDungeons, consumables, shopStock };
    writeSave(save);
  }, [loaded, character, equipment, inventory, clearedDungeons, consumables, shopStock]);

  if (!loaded) return null;

  if (deathSummary) {
    return <GameOverScreen summary={deathSummary} onContinue={() => setDeathSummary(null)} />;
  }

  if (!character) {
    return (
      <CharacterCreation
        onCreate={(name: string, classId: ClassId) => {
          setCharacter(createCharacter(name, classId));
          setEquipment({});
          setInventory([]);
          setClearedDungeons([]);
          setConsumables(EMPTY_CONSUMABLES);
          setShopStock(generateShopStock(1, classId));
        }}
      />
    );
  }

  const derived = getDerivedStats(character, equipment);

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
      if (item.slot === "shield") return true;
      if (item.slot === "weapon" && !item.twoHanded && character.classId === "barbarian") return true;
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
    const placedItem = sourceItem.slot === to ? sourceItem : { ...sourceItem, slot: to };
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

  function handleBuyConsumable(id: ConsumableId) {
    if (!character) return;
    const def = CONSUMABLES[id];
    if (character.gold < def.cost) return;
    setCharacter({ ...character, gold: character.gold - def.cost });
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
    if (character.gold < RESTOCK_FEE) return;
    setCharacter({ ...character, gold: character.gold - RESTOCK_FEE });
    setShopStock(generateShopStock(character.level, character.classId));
  }

  function handleStartDungeon(dungeonId: string) {
    if (!character) return;
    const dungeon = DUNGEONS.find((d) => d.id === dungeonId);
    if (!dungeon) return;
    setDungeonRun({
      dungeonId,
      queue: [...dungeon.waves, dungeon.boss],
      index: 0,
      currentLife: derived.maxLife,
      currentMana: getStartingResource(character, derived),
      currentCooldown: 0,
    });
  }

  function handleResetSave() {
    clearSave();
    setCharacter(null);
    setEquipment({});
    setInventory([]);
    setClearedDungeons([]);
    setConsumables(EMPTY_CONSUMABLES);
    setShopStock([]);
    setDungeonRun(null);
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
      setDeathSummary({
        characterName: character.name,
        classId: character.classId,
        level: character.level,
        damageDealt: updatedRunStats.damageDealt,
        goldEarned: updatedRunStats.goldEarned,
        kills: updatedRunStats.kills,
      });
      clearSave();
      setCharacter(null);
      setEquipment({});
      setInventory([]);
      setClearedDungeons([]);
      setConsumables(EMPTY_CONSUMABLES);
      setShopStock([]);
      setDungeonRun(null);
      return;
    }

    setCharacter((prev) => {
      if (!prev) return prev;
      const withGold = { ...prev, gold: prev.gold + result.goldReward, runStats: updatedRunStats };
      const { character: withXp } = grantXp(withGold, result.xpReward);
      return withXp;
    });

    const isBoss = dungeonRun.index === dungeonRun.queue.length - 1;
    const dropChance = isBoss ? 1 : 0.35;
    if (Math.random() < dropChance) {
      const item = generateRandomItem(monster.level, character.classId);
      setInventory((prev) => [...prev, item]);
    }

    const nextIndex = dungeonRun.index + 1;
    if (nextIndex >= dungeonRun.queue.length) {
      setClearedDungeons((prev) => (prev.includes(dungeonRun.dungeonId) ? prev : [...prev, dungeonRun.dungeonId]));
      setDungeonRun(null);
      return;
    }

    setDungeonRun({
      ...dungeonRun,
      index: nextIndex,
      currentLife: result.endingLife,
      currentMana: getStartingResource(character, derived, result.endingMana),
      currentCooldown: result.endingCooldown,
    });
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
        consumables={consumables}
        onUsePotion={handleUsePotion}
        onFinished={handleFightFinished}
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
      onStartDungeon={handleStartDungeon}
      onResetSave={handleResetSave}
      onBuyConsumable={handleBuyConsumable}
      onBuyItem={handleBuyItem}
      onRestockShop={handleRestockShop}
    />
  );
}

export default App;
