import { useState, useRef, useLayoutEffect, useEffect, type CSSProperties } from "react";
import type { Item } from "../game/types";

interface HoveredItem {
  item: Item;
  rect: DOMRect;
}

const MARGIN = 8;

function clampedTop(midY: number, elHeight: number): number {
  const raw = midY - elHeight / 2;
  return Math.max(MARGIN, Math.min(raw, window.innerHeight - elHeight - MARGIN));
}

export function useItemHover() {
  const [hovered, setHovered] = useState<HoveredItem | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const compareRef = useRef<HTMLDivElement | null>(null);
  const [tooltipHeight, setTooltipHeight] = useState(0);
  const [compareHeight, setCompareHeight] = useState(0);

  useLayoutEffect(() => {
    setTooltipHeight(tooltipRef.current?.offsetHeight ?? 0);
    setCompareHeight(compareRef.current?.offsetHeight ?? 0);
  }, [hovered]);

  useEffect(() => {
    if (!hovered) return;
    const handler = (e: TouchEvent) => {
      if ((e.target as Element).closest(".inv-cell, .shop-item-cell")) return;
      setHovered(null);
    };
    document.addEventListener("touchstart", handler, { passive: true });
    return () => document.removeEventListener("touchstart", handler);
  }, [hovered]);

  function onMouseEnter(item: Item, e: React.MouseEvent) {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setHovered({ item, rect: (e.currentTarget as HTMLElement).getBoundingClientRect() });
  }

  function onMouseLeave() {
    hideTimer.current = setTimeout(() => setHovered(null), 80);
  }

  const isMobile = window.innerWidth < 600;

  function tooltipStyle(): CSSProperties | null {
    if (!hovered) return null;
    const midY = hovered.rect.top + hovered.rect.height / 2;
    if (isMobile) {
      const totalH = tooltipHeight + (compareHeight > 0 ? compareHeight + 8 : 0);
      const top = totalH > 0 ? clampedTop(midY, totalH) : midY;
      return {
        position: "fixed",
        top,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        pointerEvents: "none",
        width: 170,
        visibility: tooltipHeight > 0 ? "visible" : "hidden",
      };
    }
    const top = tooltipHeight > 0 ? clampedTop(midY, tooltipHeight) : midY;
    const rawLeft = hovered.rect.right + 10;
    const left = Math.min(rawLeft, window.innerWidth - 170 - MARGIN);
    return {
      position: "fixed",
      top,
      left,
      zIndex: 9999,
      pointerEvents: "none",
      width: 170,
      visibility: tooltipHeight > 0 ? "visible" : "hidden",
    };
  }

  function compareStyle(): CSSProperties | null {
    if (!hovered) return null;
    const midY = hovered.rect.top + hovered.rect.height / 2;
    if (isMobile) {
      const totalH = tooltipHeight + (compareHeight > 0 ? compareHeight + 8 : 0);
      const top = totalH > 0 ? clampedTop(midY, totalH) + tooltipHeight + 8 : midY;
      return {
        position: "fixed",
        top,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        visibility: compareHeight > 0 ? "visible" : "hidden",
      };
    }
    const top = compareHeight > 0 ? clampedTop(midY, compareHeight) : midY;
    const panelWidth = 170;
    const rawLeft = hovered.rect.left - panelWidth - 10;
    const clampedLeft = Math.max(MARGIN, rawLeft);
    return {
      position: "fixed",
      top,
      left: clampedLeft,
      zIndex: 9999,
      pointerEvents: "none",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      visibility: compareHeight > 0 ? "visible" : "hidden",
    };
  }

  function clearHover() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setHovered(null);
  }

  function showTooltip(item: Item, el: HTMLElement) {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setHovered({ item, rect: el.getBoundingClientRect() });
  }

  return { hovered, onMouseEnter, onMouseLeave, tooltipStyle, compareStyle, clearHover, showTooltip, tooltipRef, compareRef };
}
