import { useEffect, useState } from "react";
import { CharacterCreation } from "./components/CharacterCreation";
import { CharacterSelect } from "./components/CharacterSelect";
import { Hub } from "./components/Hub";
import { CombatScreen } from "./components/CombatScreen";
import { GameOverScreen } from "./components/GameOverScreen";
import { createCharacter, getDerivedStats, getStartingResource, grantXp } from "./game/character";
import { CONSUMABLES, EMPTY_CONSUMABLES } from "./game/data/consumables";
import { DUNGEONS, getXpCapLevel } from "./game/data/dungeons";
import { buyValue, generateBlooddrinker, generateBoneweaveGloves, generateCrackedLens, generateCrownOfTheFallen, generateDemonsTail, generateDoomcrier, generateEyeOfTheStorm, generateHarvester, generateHeavyStompers, generateIronjaw, generateJusticar, generateMaskOfMidnight, generateMaskOfTwilight, generateMirrorRing, generatePeasantHood, generatePenitentsGrace, generatePentagram, generateRagpickersSash, generateReapersHood, generateSanctifier, generateSharpFangs, generateStoneHusk, generateStormstring, generateThornback, generateVenomweaveWrap, generateWhisper, generateWorldbreaker, generateRandomItem, generateShopStock, generateStartingEquipment, sellValue } from "./game/data/items";
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
            consumables: EMPTY_CONSUMABLES,
            shopStock: newShopStock,
          };
          const id = createSave(save);
          setSlots(getAllSaves());
          setActiveSlotId(id);
          setCharacter(newCharacter);
          setEquipment(startingEquipment);
          setInventory([]);
          setClearedDungeons([]);
          setConsumables(EMPTY_CONSUMABLES);
          setShopStock(newShopStock);
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

  const POTION_STACK_LIMIT = 5;

  function handleBuyConsumable(id: ConsumableId) {
    if (!character) return;
    if (consumables[id] >= POTION_STACK_LIMIT) return;
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
    const isAndariel = isBoss && dungeonRun.dungeonId === "diablo";
    const isReaper = isBoss && dungeonRun.dungeonId === "lower-hell";
    if (isReaper && Math.random() < 0.025) {
      const rarityOrder: import("./game/types").ItemRarity[] = ["normal", "magic", "rare", "very rare", "unique"];
      const hood = generateReapersHood();
      setInventory((prev) => [...prev, hood]);
      setDroppedItem((prev) => rarityOrder.indexOf(hood.rarity) >= rarityOrder.indexOf(prev?.rarity ?? "normal") ? hood : prev);
      if (character.classId === "necromancer" && Math.random() < 0.06) {
        const harvester = generateHarvester();
        setInventory((prev) => [...prev, harvester]);
        setDroppedItem((prev) => rarityOrder.indexOf(harvester.rarity) >= rarityOrder.indexOf(prev?.rarity ?? "normal") ? harvester : prev);
      }
    }
    const peasantHoodBosses = new Set(["blood-moor", "cold-plains"]);
    if (isBoss && peasantHoodBosses.has(dungeonRun.dungeonId) && Math.random() < 0.05) {
      const hood = generatePeasantHood();
      setInventory((prev) => [...prev, hood]);
      setDroppedItem((prev) => {
        const rarityOrder: import("./game/types").ItemRarity[] = ["normal", "magic", "rare", "very rare", "unique"];
        return prev === null || rarityOrder.indexOf(hood.rarity) >= rarityOrder.indexOf(prev.rarity) ? hood : prev;
      });
    }
    if (isBoss && character.level >= 45 && Math.random() < 0.0025) {
      const crown = generateCrownOfTheFallen();
      setInventory((prev) => [...prev, crown]);
      setDroppedItem((prev) => {
        const rarityOrder: import("./game/types").ItemRarity[] = ["normal", "magic", "rare", "very rare", "unique"];
        return prev === null || rarityOrder.indexOf(crown.rarity) >= rarityOrder.indexOf(prev.rarity) ? crown : prev;
      });
    }
    if (isBoss && Math.random() < 0.0025) {
      const sash = generateRagpickersSash();
      setInventory((prev) => [...prev, sash]);
      setDroppedItem((prev) => {
        const rarityOrder: import("./game/types").ItemRarity[] = ["normal", "magic", "rare", "very rare", "unique"];
        return prev === null || rarityOrder.indexOf(sash.rarity) >= rarityOrder.indexOf(prev.rarity) ? sash : prev;
      });
    }
    if (isBoss && character.level >= 5 && Math.random() < 0.0025) {
      const lens = generateCrackedLens();
      setInventory((prev) => [...prev, lens]);
      setDroppedItem((prev) => {
        const rarityOrder: import("./game/types").ItemRarity[] = ["normal", "magic", "rare", "very rare", "unique"];
        return prev === null || rarityOrder.indexOf(lens.rarity) >= rarityOrder.indexOf(prev.rarity) ? lens : prev;
      });
    }
    if (isBoss && character.level >= 12 && Math.random() < 0.0025) {
      const armor = generateThornback();
      setInventory((prev) => [...prev, armor]);
      setDroppedItem((prev) => {
        const rarityOrder: import("./game/types").ItemRarity[] = ["normal", "magic", "rare", "very rare", "unique"];
        return prev === null || rarityOrder.indexOf(armor.rarity) >= rarityOrder.indexOf(prev.rarity) ? armor : prev;
      });
    }
    if (isBoss && character.level >= 18 && Math.random() < 0.0025) {
      const ring = generateEyeOfTheStorm();
      setInventory((prev) => [...prev, ring]);
      setDroppedItem((prev) => {
        const rarityOrder: import("./game/types").ItemRarity[] = ["normal", "magic", "rare", "very rare", "unique"];
        return prev === null || rarityOrder.indexOf(ring.rarity) >= rarityOrder.indexOf(prev.rarity) ? ring : prev;
      });
    }
    if (isBoss && character.level >= 20 && Math.random() < 0.0025) {
      const gloves = generateBoneweaveGloves();
      setInventory((prev) => [...prev, gloves]);
      setDroppedItem((prev) => {
        const rarityOrder: import("./game/types").ItemRarity[] = ["normal", "magic", "rare", "very rare", "unique"];
        return prev === null || rarityOrder.indexOf(gloves.rarity) >= rarityOrder.indexOf(prev.rarity) ? gloves : prev;
      });
    }
    const venomweaveWrapBosses = new Set(["stony-field", "dark-wood", "tristram"]);
    if (isBoss && venomweaveWrapBosses.has(dungeonRun.dungeonId) && character.level >= 15 && Math.random() < 0.0025) {
      const wrap = generateVenomweaveWrap();
      setInventory((prev) => [...prev, wrap]);
      setDroppedItem((prev) => {
        const rarityOrder: import("./game/types").ItemRarity[] = ["normal", "magic", "rare", "very rare", "unique"];
        return prev === null || rarityOrder.indexOf(wrap.rarity) >= rarityOrder.indexOf(prev.rarity) ? wrap : prev;
      });
    }
    const act2DungeonIds = new Set(["imp-field", "lava-river", "ashen-caves", "higher-hell", "lower-hell", "hellcore"]);
    const isAct2 = act2DungeonIds.has(dungeonRun.dungeonId);
    if (isBoss && isAct2 && Math.random() < 0.0025) {
      const tail = generateDemonsTail();
      setInventory((prev) => [...prev, tail]);
      setDroppedItem((prev) => {
        const rarityOrder: import("./game/types").ItemRarity[] = ["normal", "magic", "rare", "very rare", "unique"];
        return prev === null || rarityOrder.indexOf(tail.rarity) >= rarityOrder.indexOf(prev.rarity) ? tail : prev;
      });
    }
    if (isBoss && isAct2 && Math.random() < 0.005) {
      const pentagram = generatePentagram();
      setInventory((prev) => [...prev, pentagram]);
      setDroppedItem((prev) => {
        const rarityOrder: import("./game/types").ItemRarity[] = ["normal", "magic", "rare", "very rare", "unique"];
        return prev === null || rarityOrder.indexOf(pentagram.rarity) >= rarityOrder.indexOf(prev.rarity) ? pentagram : prev;
      });
    }
    const rarityOrder: import("./game/types").ItemRarity[] = ["normal", "magic", "rare", "very rare", "unique"];
    if (isBoss && character.classId === "paladin" && character.level >= 10 && Math.random() < 0.0015) {
      const mace = generatePenitentsGrace();
      setInventory((prev) => [...prev, mace]);
      setDroppedItem((prev) => prev === null || rarityOrder.indexOf(mace.rarity) >= rarityOrder.indexOf(prev.rarity) ? mace : prev);
    }
    if (isBoss && character.classId === "paladin" && character.level >= 28 && Math.random() < 0.0015) {
      const mace = generateJusticar();
      setInventory((prev) => [...prev, mace]);
      setDroppedItem((prev) => prev === null || rarityOrder.indexOf(mace.rarity) >= rarityOrder.indexOf(prev.rarity) ? mace : prev);
    }
    if (isBoss && character.classId === "paladin" && character.level >= 50 && Math.random() < 0.0015) {
      const mace = generateSanctifier();
      setInventory((prev) => [...prev, mace]);
      setDroppedItem((prev) => prev === null || rarityOrder.indexOf(mace.rarity) >= rarityOrder.indexOf(prev.rarity) ? mace : prev);
    }
    if (isBoss && character.classId === "barbarian" && character.level >= 10 && Math.random() < 0.0015) {
      const axe = generateBlooddrinker();
      setInventory((prev) => [...prev, axe]);
      setDroppedItem((prev) => prev === null || rarityOrder.indexOf(axe.rarity) >= rarityOrder.indexOf(prev.rarity) ? axe : prev);
    }
    if (isBoss && character.classId === "barbarian" && character.level >= 28 && Math.random() < 0.0015) {
      const axe = generateIronjaw();
      setInventory((prev) => [...prev, axe]);
      setDroppedItem((prev) => prev === null || rarityOrder.indexOf(axe.rarity) >= rarityOrder.indexOf(prev.rarity) ? axe : prev);
    }
    if (isBoss && character.classId === "barbarian" && character.level >= 50 && Math.random() < 0.0015) {
      const axe = generateWorldbreaker();
      setInventory((prev) => [...prev, axe]);
      setDroppedItem((prev) => prev === null || rarityOrder.indexOf(axe.rarity) >= rarityOrder.indexOf(prev.rarity) ? axe : prev);
    }
    if (isBoss && character.classId === "amazon" && character.level >= 8 && Math.random() < 0.0015) {
      const bow = generateWhisper();
      setInventory((prev) => [...prev, bow]);
      setDroppedItem((prev) => prev === null || rarityOrder.indexOf(bow.rarity) >= rarityOrder.indexOf(prev.rarity) ? bow : prev);
    }
    if (isBoss && character.classId === "amazon" && character.level >= 28 && Math.random() < 0.0015) {
      const bow = generateStormstring();
      setInventory((prev) => [...prev, bow]);
      setDroppedItem((prev) => prev === null || rarityOrder.indexOf(bow.rarity) >= rarityOrder.indexOf(prev.rarity) ? bow : prev);
    }
    if (isBoss && character.classId === "amazon" && character.level >= 50 && Math.random() < 0.0015) {
      const bow = generateDoomcrier();
      setInventory((prev) => [...prev, bow]);
      setDroppedItem((prev) => prev === null || rarityOrder.indexOf(bow.rarity) >= rarityOrder.indexOf(prev.rarity) ? bow : prev);
    }
    const dropChance = isBoss ? 1 : 0.35;
    if (isAndariel && Math.random() < 0.01) {
      const mirrorRing = generateMirrorRing();
      setInventory((prev) => [...prev, mirrorRing]);
      setDroppedItem(() => mirrorRing);
    }
    if (isBoss && character.level >= 25 && Math.random() < 0.0025) {
      const mask = generateMaskOfMidnight();
      setInventory((prev) => [...prev, mask]);
      setDroppedItem((prev) => {
        const rarityOrder: import("./game/types").ItemRarity[] = ["normal", "magic", "rare", "very rare", "unique"];
        return prev === null || rarityOrder.indexOf(mask.rarity) >= rarityOrder.indexOf(prev.rarity) ? mask : prev;
      });
    }
    if (isBoss && character.level >= 25 && Math.random() < 0.0025) {
      const mask = generateMaskOfTwilight();
      setInventory((prev) => [...prev, mask]);
      setDroppedItem((prev) => {
        const rarityOrder: import("./game/types").ItemRarity[] = ["normal", "magic", "rare", "very rare", "unique"];
        return prev === null || rarityOrder.indexOf(mask.rarity) >= rarityOrder.indexOf(prev.rarity) ? mask : prev;
      });
    }
    if (isBoss && character.level >= 25 && Math.random() < 0.005) {
      const husk = generateStoneHusk();
      setInventory((prev) => [...prev, husk]);
      setDroppedItem((prev) => {
        const rarityOrder: import("./game/types").ItemRarity[] = ["normal", "magic", "rare", "very rare", "unique"];
        return prev === null || rarityOrder.indexOf(husk.rarity) >= rarityOrder.indexOf(prev.rarity) ? husk : prev;
      });
    }
    if (isBoss && character.level >= 15 && Math.random() < 0.005) {
      const fangs = generateSharpFangs();
      setInventory((prev) => [...prev, fangs]);
      setDroppedItem((prev) => {
        const rarityOrder: import("./game/types").ItemRarity[] = ["normal", "magic", "rare", "very rare", "unique"];
        return prev === null || rarityOrder.indexOf(fangs.rarity) >= rarityOrder.indexOf(prev.rarity) ? fangs : prev;
      });
    }
    if (isBoss && Math.random() < 0.005) {
      const stompers = generateHeavyStompers();
      setInventory((prev) => [...prev, stompers]);
      setDroppedItem((prev) => {
        const rarityOrder: import("./game/types").ItemRarity[] = ["normal", "magic", "rare", "very rare", "unique"];
        return prev === null || rarityOrder.indexOf(stompers.rarity) >= rarityOrder.indexOf(prev.rarity) ? stompers : prev;
      });
    }
    if (Math.random() < dropChance) {
      const item = generateRandomItem(monster.level, character.classId);
      setInventory((prev) => [...prev, item]);
      const rarityOrder: import("./game/types").ItemRarity[] = ["normal", "magic", "rare", "very rare", "unique"];
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
