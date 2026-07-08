import { useState, type DragEvent } from "react";
import { ItemIcon } from "./ItemIcon";
import { ItemTooltip } from "./ItemTooltip";
import { RARITY_COLORS } from "../game/data/items";
import type { EquipmentSlot, Item } from "../game/types";

const STAT_LABEL: Record<string, string> = {
  strength: "Strength", dexterity: "Dexterity", vitality: "Vitality", energy: "Energy",
  damage: "Damage", defense: "Defense", life: "Life", mana: "Mana",
  magicDamage: "Magic Damage", goldFind: "% Gold Find", lifeLeech: "% Life Leech",
  manaRegen: "Mana Regen / Turn", magicDmgReduction: "% Magic Damage Reduced",
  physDmgReduction: "% Physical Damage Reduced",
};

function ComparePanel({ item, label }: { item: Item; label: string }) {
  const color = RARITY_COLORS[item.rarity];
  return (
    <div className="compare-panel" style={{ borderColor: color }}>
      <div className="compare-label">{label}</div>
      <div className="item-name" style={{ color }}>{item.name}</div>
      <div className="item-meta">{item.slot} &middot; ilvl {item.itemLevel}</div>
      {item.baseDamage && <div className="item-line">Damage: {item.baseDamage[0]}-{item.baseDamage[1]}{item.twoHanded ? " (2H)" : ""}</div>}
      {item.baseDefense && <div className="item-line">Defense: {item.baseDefense}</div>}
      {item.affixes.map((a, i) => (
        <div className="item-line affix" key={i}>+{a.value} {STAT_LABEL[a.stat]}</div>
      ))}
    </div>
  );
}

function getComparisons(slot: EquipmentSlot, equipment: Partial<Record<EquipmentSlot, Item>>): { item: Item; label: string }[] {
  if (slot === "ring1" || slot === "ring2") {
    const result: { item: Item; label: string }[] = [];
    if (equipment.ring1) result.push({ item: equipment.ring1, label: "Ring slot 1" });
    if (equipment.ring2) result.push({ item: equipment.ring2, label: "Ring slot 2" });
    return result;
  }
  const equipped = equipment[slot];
  return equipped ? [{ item: equipped, label: "Equipped" }] : [];
}

type Location = EquipmentSlot | "inventory";

interface Props {
  equipment: Partial<Record<EquipmentSlot, Item>>;
  inventory: Item[];
  onMoveItem: (itemId: string, from: Location, to: Location) => void;
}

const EQUIP_SLOTS: EquipmentSlot[] = [
  "helm",
  "amulet",
  "weapon",
  "armor",
  "shield",
  "gloves",
  "belt",
  "boots",
  "ring1",
  "ring2",
];

const SLOT_LABELS: Partial<Record<EquipmentSlot, string>> = {
  shield: "off hand",
};

function encode(itemId: string, from: Location) {
  return JSON.stringify({ itemId, from });
}

export function InventoryTab({ equipment, inventory, onMoveItem }: Props) {
  const [dragOver, setDragOver] = useState<Location | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  function handleDrop(e: DragEvent, target: Location) {
    e.preventDefault();
    setDragOver(null);
    setDragging(null);
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    const { itemId, from } = JSON.parse(raw) as { itemId: string; from: Location };
    onMoveItem(itemId, from, target);
  }

  function dropZoneProps(target: Location) {
    return {
      onDragOver: (e: DragEvent) => {
        e.preventDefault();
        if (dragOver !== target) setDragOver(target);
      },
      onDragLeave: () => setDragOver((cur) => (cur === target ? null : cur)),
      onDrop: (e: DragEvent) => handleDrop(e, target),
    };
  }

  function dragHandleProps(item: Item, from: Location) {
    return {
      draggable: true,
      onDragStart: (e: DragEvent) => {
        e.dataTransfer.setData("application/json", encode(item.id, from));
        e.dataTransfer.effectAllowed = "move";
        setDragging(item.id);
      },
      onDragEnd: () => setDragging(null),
    };
  }

  return (
    <div className="tab-panel">
      <div className="paperdoll">
        {EQUIP_SLOTS.map((slot) => {
          const item = equipment[slot];
          return (
            <div
              key={slot}
              className={`doll-slot doll-${slot} ${dragOver === slot ? "drag-over" : ""}`}
              {...dropZoneProps(slot)}
            >
              {item ? (
                <div
                  className={`slot-item ${dragging === item.id ? "dragging" : ""}`}
                  style={{ color: RARITY_COLORS[item.rarity] }}
                  onDoubleClick={() => onMoveItem(item.id, slot, "inventory")}
                  {...dragHandleProps(item, slot)}
                >
                  <ItemIcon item={item} />
                  <ItemTooltip item={item} />
                </div>
              ) : (
                <span className="doll-slot-label">{SLOT_LABELS[slot] ?? slot}</span>
              )}
            </div>
          );
        })}
      </div>

      <h3>Inventory ({inventory.length})</h3>
      {inventory.length === 0 && <p className="empty-note">No items yet. Clear dungeons to find loot.</p>}
      <div className={`inventory-dropzone ${dragOver === "inventory" ? "drag-over" : ""}`} {...dropZoneProps("inventory")}>
        <div className="inventory-grid">
          {inventory.map((item) => (
            <div
              key={item.id}
              className={`inv-cell ${dragging === item.id ? "dragging" : ""}`}
              style={{ color: RARITY_COLORS[item.rarity] }}
              onDoubleClick={() => onMoveItem(item.id, "inventory", item.slot)}
              {...dragHandleProps(item, "inventory")}
            >
              <ItemIcon item={item} />
              <ItemTooltip item={item} />
              {(() => {
                const comparisons = getComparisons(item.slot, equipment);
                return comparisons.length > 0 ? (
                  <div className="compare-group">
                    {comparisons.map(({ item: ci, label }) => (
                      <ComparePanel key={ci.id} item={ci} label={label} />
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
          ))}
        </div>
      </div>
      <p className="empty-note">Drag items onto a slot to equip, or double-click to equip/unequip.</p>
    </div>
  );
}
