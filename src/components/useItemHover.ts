import { useState, useRef, useLayoutEffect, useEffect, type CSSProperties } from "react";
import type { Item } from "../game/types";

interface HoveredItem {
  item: Item;
  rect: DOMRect;
}

const MARGIN = 8;
const PANEL_WIDTH = 170;
const SIDE_GAP = 10;

function clampedTop(midY: number, elHeight: number): number {
  const raw = midY - elHeight / 2;
  return Math.max(MARGIN, Math.min(raw, window.innerHeight - elHeight - MARGIN));
}

// Short landscape-phone screens can be shorter than the tooltip/compare
// content itself. `clampedTop` only ever adjusts *position* — it can't stop
// a too-tall box from rendering past the bottom of the screen. This works
// out `top` and a `maxHeight` together so the box is pinned within the
// viewport and scrolls internally instead of running off-screen.
function verticalFit(
  midY: number,
  naturalHeight: number,
): { top: number; maxHeight: number; scrolls: boolean } {
  const maxAvail = Math.max(60, window.innerHeight - 2 * MARGIN);
  const maxHeight = Math.min(naturalHeight || maxAvail, maxAvail);
  const top = naturalHeight > 0 ? clampedTop(midY, maxHeight) : midY;
  return { top, maxHeight, scrolls: naturalHeight > maxHeight };
}

// The desktop layout puts the tooltip to the right of the cell and the
// compare panel to the left. Near the viewport's edges either one gets
// clamped back onto the screen — which can clamp it right into the
// other panel's space. Only use the side-by-side layout when both sides
// actually have room; otherwise fall back to the centered/stacked layout
// (the same one used on narrow phones) so they can never collide.
function fitsSideBySide(rect: DOMRect): boolean {
  const fitsRight = rect.right + SIDE_GAP + PANEL_WIDTH + MARGIN <= window.innerWidth;
  const fitsLeft = rect.left - SIDE_GAP - PANEL_WIDTH - MARGIN >= 0;
  return fitsRight && fitsLeft;
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
      if (
        (e.target as Element).closest(
          ".inv-cell, .shop-item-cell, .item-tooltip, .compare-group",
        )
      )
        return;
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
    const stacked = isMobile || !fitsSideBySide(hovered.rect);
    if (stacked) {
      // Stacked layout: tooltip on top, compare panel directly below it.
      // Fit the *pair* within the viewport first so the tooltip is pinned
      // near the top instead of centering around a midpoint that would
      // push the combined block off-screen.
      const totalH = tooltipHeight + (compareHeight > 0 ? compareHeight + 8 : 0);
      const { top, maxHeight, scrolls } = verticalFit(midY, totalH);
      // The tooltip gets first claim on the shared budget; compareStyle()
      // mirrors this so the two never disagree about where the split is.
      const tooltipMaxHeight = compareHeight > 0 ? Math.min(tooltipHeight, maxHeight) : maxHeight;
      return {
        position: "fixed",
        top,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        pointerEvents: scrolls ? "auto" : "none",
        width: 170,
        maxHeight: tooltipMaxHeight,
        overflowY: tooltipHeight > tooltipMaxHeight ? "auto" : "visible",
        visibility: tooltipHeight > 0 ? "visible" : "hidden",
      };
    }
    const { top, maxHeight, scrolls } = verticalFit(midY, tooltipHeight);
    const rawLeft = hovered.rect.right + 10;
    const left = Math.min(rawLeft, window.innerWidth - 170 - MARGIN);
    return {
      position: "fixed",
      top,
      left,
      zIndex: 9999,
      pointerEvents: scrolls ? "auto" : "none",
      width: 170,
      maxHeight,
      overflowY: scrolls ? "auto" : "visible",
      visibility: tooltipHeight > 0 ? "visible" : "hidden",
    };
  }

  function compareStyle(): CSSProperties | null {
    if (!hovered) return null;
    const midY = hovered.rect.top + hovered.rect.height / 2;
    const stacked = isMobile || !fitsSideBySide(hovered.rect);
    if (stacked) {
      const totalH = tooltipHeight + (compareHeight > 0 ? compareHeight + 8 : 0);
      const { top: stackTop, maxHeight: stackMaxHeight } = verticalFit(midY, totalH);
      const tooltipMaxHeight = Math.min(tooltipHeight, stackMaxHeight);
      const top = totalH > 0 ? stackTop + tooltipMaxHeight + 8 : midY;
      // Whatever's left under the tooltip is this panel's budget — it
      // scrolls internally rather than running off the bottom of the
      // screen. pointerEvents needs to be "auto" here (unlike the plain
      // hover tooltip) so a touch can actually scroll it.
      const maxCompareHeight = Math.max(60, stackMaxHeight - tooltipMaxHeight - 8);
      return {
        position: "fixed",
        top,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxHeight: maxCompareHeight,
        overflowY: "auto",
        visibility: compareHeight > 0 ? "visible" : "hidden",
      };
    }
    const { top, maxHeight } = verticalFit(midY, compareHeight);
    const rawLeft = hovered.rect.left - PANEL_WIDTH - 10;
    const clampedLeft = Math.max(MARGIN, rawLeft);
    return {
      position: "fixed",
      top,
      left: clampedLeft,
      zIndex: 9999,
      pointerEvents: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      maxHeight,
      overflowY: "auto",
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
