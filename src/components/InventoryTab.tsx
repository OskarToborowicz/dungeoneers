import { useState } from "react";
import {
  DndContext, DragOverlay,
  PointerSensor, TouchSensor, useSensor, useSensors,
  useDraggable, useDroppable,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { ItemIcon } from "./ItemIcon";
import { ItemTooltip } from "./ItemTooltip";
import { CompareGroup } from "./ComparePanel";
import { RARITY_COLORS } from "../game/data/items";
import { useItemHover } from "./useItemHover";
import type { ClassId, EquipmentSlot, Item } from "../game/types";

type Location = EquipmentSlot | "inventory";

interface DragData {
  itemId: string;
  from: Location;
}

interface Props {
  equipment: Partial<Record<EquipmentSlot, Item>>;
  inventory: Item[];
  classId: ClassId;
  onMoveItem: (itemId: string, from: Location, to: Location) => void;
  onToggleFavorite: (itemId: string) => void;
  onSort: () => void;
}

const EQUIP_SLOTS: EquipmentSlot[] = [
  "helm", "amulet", "weapon", "armor", "shield",
  "gloves", "belt", "boots", "ring1", "ring2",
];

const SLOT_LABELS: Partial<Record<EquipmentSlot, string>> = {
  shield: "off hand",
};

function bestSlot(item: Item, equipment: Partial<Record<EquipmentSlot, Item>>): EquipmentSlot {
  if (item.slot === "ring1" || item.slot === "ring2") {
    if (!equipment.ring1) return "ring1";
    if (!equipment.ring2) return "ring2";
    return "ring1";
  }
  return item.slot;
}

// ── sub-components (must live inside DndContext) ──────────────────────────────

function InvCellDnd({
  item, isDragging, isSelected, onTap, onDoubleTap,
  onMouseEnter, onMouseLeave, onShowTooltip, onToggleFavorite,
}: {
  item: Item;
  isDragging: boolean;
  isSelected: boolean;
  onTap: () => void;
  onDoubleTap: () => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onShowTooltip: (el: HTMLElement) => void;
  onToggleFavorite: () => void;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: item.id,
    data: { itemId: item.id, from: "inventory" } satisfies DragData,
  });
  return (
    <div
      className={`inv-cell${isDragging ? " dragging" : ""}${isSelected ? " tap-selected" : ""}`}
      style={{ color: RARITY_COLORS[item.rarity] }}
      onClick={(e) => { e.stopPropagation(); onTap(); onShowTooltip(e.currentTarget as HTMLElement); }}
      onDoubleClick={onDoubleTap}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div ref={setNodeRef} {...listeners} {...attributes} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", touchAction: "none" }}>
        <ItemIcon item={item} />
      </div>
      <button
        className={`fav-btn${item.favorite ? " fav-btn--active" : ""}`}
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
        onTouchStart={(e) => e.stopPropagation()}
        aria-label={item.favorite ? "Unmark favorite" : "Mark as favorite"}
      >★</button>
    </div>
  );
}

function SlotItemDnd({
  item, slot, isDragging, isSelected, onTap, onDoubleClick,
}: {
  item: Item;
  slot: EquipmentSlot;
  isDragging: boolean;
  isSelected: boolean;
  onTap: () => void;
  onDoubleClick: () => void;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `equip-${item.id}`,
    data: { itemId: item.id, from: slot } satisfies DragData,
  });
  return (
    <div
      className={`slot-item${isDragging ? " dragging" : ""}${isSelected ? " tap-selected" : ""}`}
      style={{ color: RARITY_COLORS[item.rarity] }}
      onClick={(e) => { e.stopPropagation(); onTap(); }}
      onDoubleClick={onDoubleClick}
    >
      <div ref={setNodeRef} {...listeners} {...attributes} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", touchAction: "none" }}>
        <ItemIcon item={item} />
      </div>
      <ItemTooltip item={item} />
    </div>
  );
}

function DollSlotDnd({
  slot, isOver, isValid, isTapTarget, children, onSlotClick,
}: {
  slot: EquipmentSlot;
  isOver: boolean;
  isValid: boolean;
  isTapTarget: boolean;
  children: React.ReactNode;
  onSlotClick: (e: React.MouseEvent) => void;
}) {
  const { setNodeRef } = useDroppable({ id: slot });
  const overClass = isOver ? (isValid ? " drag-over" : " drag-over-invalid") : "";
  return (
    <div
      ref={setNodeRef}
      className={`doll-slot doll-${slot}${overClass}${isTapTarget ? " tap-target" : ""}`}
      onClick={onSlotClick}
    >
      {children}
    </div>
  );
}

function InventoryDropzoneDnd({ children, isOver }: { children: React.ReactNode; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id: "inventory" });
  return (
    <div ref={setNodeRef} className={`inventory-dropzone${isOver ? " drag-over" : ""}`}>
      {children}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

const RARITY_RANK: Record<string, number> = { unique: 0, "very rare": 1, rare: 2, magic: 3, normal: 4 };
const SLOT_RANK: Record<string, number> = { weapon: 0, helm: 1, armor: 2, belt: 3, gloves: 4, boots: 5, amulet: 6, ring1: 7, ring2: 8, shield: 9 };

export function sortInventory(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    const fd = (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
    if (fd !== 0) return fd;
    const rd = RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity];
    if (rd !== 0) return rd;
    const ld = b.itemLevel - a.itemLevel;
    if (ld !== 0) return ld;
    return (SLOT_RANK[a.slot] ?? 99) - (SLOT_RANK[b.slot] ?? 99);
  });
}

export function InventoryTab({ equipment, inventory, classId, onMoveItem, onToggleFavorite, onSort }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ id: string; from: Location } | null>(null);
  const { hovered, onMouseEnter, onMouseLeave, tooltipStyle, compareStyle, clearHover, showTooltip, tooltipRef, compareRef } = useItemHover();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const hasSelected = selected !== null;
  const isSelected = (id: string, from: Location) => selected?.id === id && selected.from === from;

  function findItem(id: string): Item | undefined {
    return inventory.find(i => i.id === id) ?? Object.values(equipment).find(i => i?.id === id);
  }

  function isValidTarget(slot: string): boolean {
    const activeId = selected?.id ?? draggingId;
    if (!activeId) return false;
    const item = findItem(activeId);
    if (!item) return false;
    if (item.slot === "ring1" || item.slot === "ring2") return slot === "ring1" || slot === "ring2";
    if (slot === "shield" && item.slot === "weapon" && !item.twoHanded && !equipment.weapon?.twoHanded) {
      return classId === "barbarian" || classId === "assassin";
    }
    return slot === item.slot;
  }

  function tapItem(item: Item, from: Location) {
    if (selected?.id === item.id && selected.from === from) { setSelected(null); return; }
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

  function handleDragStart(e: DragStartEvent) {
    const data = e.active.data.current as DragData;
    setDraggingId(data.itemId);
    clearHover();
    setSelected(null);
  }

  function handleDragOver(e: DragOverEvent) {
    setDragOverId(e.over ? String(e.over.id) : null);
  }

  function handleDragEnd(e: DragEndEvent) {
    setDraggingId(null);
    setDragOverId(null);
    if (!e.over) return;
    const { itemId, from } = e.active.data.current as DragData;
    const to = String(e.over.id) as Location;
    if (from !== to) onMoveItem(itemId, from, to);
  }

  const activeItem = draggingId ? findItem(draggingId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div
        className={`tab-panel${draggingId ? " is-dragging" : ""}${hasSelected ? " is-selecting" : ""}`}
        onClick={() => { if (hasSelected) setSelected(null); }}
      >
        <div className="inventory-wrapper">
        <div className="paperdoll">
          {EQUIP_SLOTS.map((slot) => {
            const item = equipment[slot];
            const isOver = dragOverId === slot;
            const valid = isValidTarget(slot);
            return (
              <DollSlotDnd
                key={slot}
                slot={slot}
                isOver={isOver}
                isValid={valid}
                isTapTarget={valid && hasSelected}
                onSlotClick={(e) => {
                  e.stopPropagation();
                  if (hasSelected) { if (valid) tapSlot(slot); else setSelected(null); }
                }}
              >
                {item ? (
                  <SlotItemDnd
                    item={item}
                    slot={slot}
                    isDragging={draggingId === item.id}
                    isSelected={isSelected(item.id, slot)}
                    onTap={() => { if (hasSelected) { if (valid) tapSlot(slot); else setSelected(null); } else tapItem(item, slot); }}
                    onDoubleClick={() => onMoveItem(item.id, slot, "inventory")}
                  />
                ) : (
                  <span className="doll-slot-label">{SLOT_LABELS[slot] ?? slot}</span>
                )}
              </DollSlotDnd>
            );
          })}
        </div>
        <div className="inventory-right">
        <div className="inventory-label-row">
          <h3 className="inventory-label">Inventory ({inventory.length})</h3>
          <button className="sort-btn" onClick={onSort}>Sort</button>
        </div>
        {inventory.length === 0 && <p className="empty-note">No items yet. Clear dungeons to find loot.</p>}
        <InventoryDropzoneDnd isOver={dragOverId === "inventory"}>
          <div className="inventory-grid">
            {inventory.map((item) => (
              <InvCellDnd
                key={item.id}
                item={item}
                isDragging={draggingId === item.id}
                isSelected={isSelected(item.id, "inventory")}
                onTap={() => tapItem(item, "inventory")}
                onDoubleTap={() => onMoveItem(item.id, "inventory", bestSlot(item, equipment))}
                onMouseEnter={(e) => onMouseEnter(item, e)}
                onMouseLeave={onMouseLeave}
                onShowTooltip={(el) => showTooltip(item, el)}
                onToggleFavorite={() => onToggleFavorite(item.id)}
              />
            ))}
          </div>
        </InventoryDropzoneDnd>

        <p className="empty-note">
          {hasSelected ? "Tap a slot to equip — tap item again to deselect." : "Tap to select · tap slot to equip · double-tap to equip/unequip."}
        </p>
        </div>

        {hovered && !draggingId && (
          <>
            <div ref={tooltipRef} style={tooltipStyle()!}>
              <ItemTooltip item={hovered.item} />
            </div>
            <div ref={compareRef} style={compareStyle()!}>
              <CompareGroup slot={hovered.item.slot} equipment={equipment} hoveredItem={hovered.item} />
            </div>
          </>
        )}
      </div>

      <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
        {activeItem && (
          <div style={{ color: RARITY_COLORS[activeItem.rarity], opacity: 0.85 }}>
            <ItemIcon item={activeItem} />
          </div>
        )}
      </DragOverlay>
      </div>
    </DndContext>
  );
}
