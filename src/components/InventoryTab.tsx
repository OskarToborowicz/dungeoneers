import { useState, type DragEvent } from "react";
import { ItemIcon } from "./ItemIcon";
import { ItemTooltip } from "./ItemTooltip";
import { CompareGroup } from "./ComparePanel";
import { RARITY_COLORS } from "../game/data/items";
import { useItemHover } from "./useItemHover";
import type { ClassId, EquipmentSlot, Item } from "../game/types";

type Location = EquipmentSlot | "inventory";

interface Props {
  equipment: Partial<Record<EquipmentSlot, Item>>;
  inventory: Item[];
  classId: ClassId;
  onMoveItem: (itemId: string, from: Location, to: Location) => void;
}

const EQUIP_SLOTS: EquipmentSlot[] = [
  "helm", "amulet", "weapon", "armor", "shield",
  "gloves", "belt", "boots", "ring1", "ring2",
];

const SLOT_LABELS: Partial<Record<EquipmentSlot, string>> = {
  shield: "off hand",
};

function encode(itemId: string, from: Location) {
  return JSON.stringify({ itemId, from });
}

function bestSlot(item: Item, equipment: Partial<Record<EquipmentSlot, Item>>): EquipmentSlot {
  if (item.slot === "ring1" || item.slot === "ring2") {
    if (!equipment.ring1) return "ring1";
    if (!equipment.ring2) return "ring2";
    return "ring1";
  }
  return item.slot;
}

export function InventoryTab({ equipment, inventory, classId, onMoveItem }: Props) {
  const [dragOver, setDragOver] = useState<Location | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ id: string; from: Location } | null>(null);
  const { hovered, onMouseEnter, onMouseLeave, tooltipStyle, compareStyle, clearHover } = useItemHover();

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
      onDragOver: (e: DragEvent) => { e.preventDefault(); if (dragOver !== target) setDragOver(target); },
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
        clearHover();
        const icon = (e.currentTarget as HTMLElement).querySelector<SVGElement>(".item-icon");
        if (icon) e.dataTransfer.setDragImage(icon, 17, 17);
      },
      onDragEnd: () => { setDragging(null); clearHover(); },
    };
  }

  function tapItem(item: Item, from: Location) {
    if (selected?.id === item.id && selected.from === from) {
      setSelected(null);
      return;
    }
    if (!selected && from !== "inventory") return;
    if (selected) {
      if (selected.from === "inventory" && from !== "inventory") {
        onMoveItem(selected.id, "inventory", from as EquipmentSlot);
        setSelected(null);
        return;
      }
      if (selected.from !== "inventory" && from === "inventory") {
        onMoveItem(item.id, "inventory", selected.from as EquipmentSlot);
        setSelected(null);
        return;
      }
    }
    setSelected({ id: item.id, from });
  }

  function tapSlot(slot: EquipmentSlot) {
    if (!selected) return;
    onMoveItem(selected.id, selected.from, slot);
    setSelected(null);
    clearHover();
  }

  const isSelected = (id: string, from: Location) => selected?.id === id && selected.from === from;
  const hasSelected = selected !== null;

  function findItem(id: string): Item | undefined {
    return inventory.find(i => i.id === id) ?? Object.values(equipment).find(i => i?.id === id);
  }

  function isValidTarget(slot: EquipmentSlot): boolean {
    const activeId = selected?.id ?? dragging;
    if (!activeId) return false;
    const item = findItem(activeId);
    if (!item) return false;
    if (item.slot === "ring1" || item.slot === "ring2") return slot === "ring1" || slot === "ring2";
    if (slot === "shield" && item.slot === "weapon" && !item.twoHanded && !equipment.weapon?.twoHanded) {
      return classId === "barbarian" || classId === "assassin";
    }
    return slot === item.slot;
  }

  return (
    <div className={`tab-panel${dragging ? " is-dragging" : ""}${hasSelected ? " is-selecting" : ""}`}>
      <div className="paperdoll">
        {EQUIP_SLOTS.map((slot) => {
          const item = equipment[slot];
          return (
            <div
              key={slot}
              className={`doll-slot doll-${slot} ${dragOver === slot ? (isValidTarget(slot) ? "drag-over" : "drag-over-invalid") : ""} ${isValidTarget(slot) ? "tap-target" : ""}`}
              onClick={() => { if (hasSelected) tapSlot(slot); }}
              {...dropZoneProps(slot)}
            >
              {item ? (
                <div
                  className={`slot-item ${dragging === item.id ? "dragging" : ""} ${isSelected(item.id, slot) ? "tap-selected" : ""}`}
                  style={{ color: RARITY_COLORS[item.rarity] }}
                  onClick={(e) => { e.stopPropagation(); hasSelected ? tapSlot(slot) : tapItem(item, slot); }}
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
      <div
        className={`inventory-dropzone ${dragOver === "inventory" ? "drag-over" : ""}`}
        onClick={() => { if (hasSelected) setSelected(null); }}
        {...dropZoneProps("inventory")}
      >
        <div className="inventory-grid">
          {inventory.map((item) => (
            <div
              key={item.id}
              className={`inv-cell ${dragging === item.id ? "dragging" : ""} ${isSelected(item.id, "inventory") ? "tap-selected" : ""}`}
              style={{ color: RARITY_COLORS[item.rarity] }}
              onClick={(e) => { e.stopPropagation(); tapItem(item, "inventory"); }}
              onDoubleClick={() => onMoveItem(item.id, "inventory", bestSlot(item, equipment))}
              onMouseEnter={(e) => { if (hasSelected) setSelected(null); onMouseEnter(item, e); }}
              onMouseLeave={onMouseLeave}
              {...dragHandleProps(item, "inventory")}
            >
              <ItemIcon item={item} />
            </div>
          ))}
        </div>
      </div>
      <p className="empty-note">
        {hasSelected ? "Tap a slot to equip — tap item again to deselect." : "Tap to select · tap slot to equip · double-tap to equip/unequip."}
      </p>

      {hovered && !dragging && !hasSelected && (
        <>
          <div style={tooltipStyle()!}>
            <ItemTooltip item={hovered.item} />
          </div>
          <div style={compareStyle()!}>
            <CompareGroup slot={hovered.item.slot} equipment={equipment} />
          </div>
        </>
      )}
    </div>
  );
}
