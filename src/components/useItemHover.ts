import { useState, useRef, type CSSProperties } from "react";
import type { Item } from "../game/types";

interface HoveredItem {
  item: Item;
  rect: DOMRect;
}

export function useItemHover() {
  const [hovered, setHovered] = useState<HoveredItem | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onMouseEnter(item: Item, e: React.MouseEvent) {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setHovered({ item, rect: (e.currentTarget as HTMLElement).getBoundingClientRect() });
  }

  function onMouseLeave() {
    hideTimer.current = setTimeout(() => setHovered(null), 80);
  }

  function tooltipStyle(): CSSProperties | null {
    if (!hovered) return null;
    const midY = hovered.rect.top + hovered.rect.height / 2;
    return {
      position: "fixed",
      top: midY,
      left: hovered.rect.right + 10,
      transform: "translateY(-50%)",
      zIndex: 9999,
      pointerEvents: "none",
      width: 170,
    };
  }

  function compareStyle(): CSSProperties | null {
    if (!hovered) return null;
    const midY = hovered.rect.top + hovered.rect.height / 2;
    const panelWidth = 170;
    const rawLeft = hovered.rect.left - panelWidth - 10;
    const clampedLeft = Math.max(4, rawLeft);
    return {
      position: "fixed",
      top: midY,
      left: clampedLeft,
      transform: "translateY(-50%)",
      zIndex: 9999,
      pointerEvents: "none",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    };
  }

  function clearHover() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setHovered(null);
  }

  return { hovered, onMouseEnter, onMouseLeave, tooltipStyle, compareStyle, clearHover };
}
