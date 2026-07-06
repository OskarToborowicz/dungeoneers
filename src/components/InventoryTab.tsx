import { useState, type DragEvent } from "react";
import { ItemIcon } from "./ItemIcon";
import { ItemTooltip } from "./ItemTooltip";
import { RARITY_COLORS, sellValue } from "../game/data/items";
import type { EquipmentSlot, Item } from "../game/types";

type Location = EquipmentSlot | "inventory";

interface Props {
  equipment: Partial<Record<EquipmentSlot, Item>>;
  inventory: Item[];
  onMoveItem: (itemId: string, from: Location, to: Location) => void;
  onSell: (item: Item) => void;
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

export function InventoryTab({ equipment, inventory, onMoveItem, onSell }: Props) {
  const [dragOver, setDragOver] = useState<Location | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  function handleDrop(e: DragEvent, target: Location) {
    e.preventDefault();
    setDragOver(null);
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
                  title={item.name}
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
              title={item.name}
              onDoubleClick={() => onMoveItem(item.id, "inventory", item.slot)}
              {...dragHandleProps(item, "inventory")}
            >
              <ItemIcon item={item} />
              <ItemTooltip item={item} />
              <button
                className="sell-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSell(item);
                }}
              >
                {sellValue(item)}g
              </button>
            </div>
          ))}
        </div>
      </div>
      <p className="empty-note">Drag items onto a slot to equip, or double-click to equip/unequip.</p>
    </div>
  );
}
