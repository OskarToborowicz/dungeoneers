import { useState, useRef, useLayoutEffect, useEffect, type CSSProperties } from "react";
import type { Item } from "../game/types";

interface HoveredItem {
  item: Item;
  rect: DOMRect;
}

const MARGIN = 8;
const PANEL_WIDTH = 170;
const SIDE_GAP = 10;
const STACK_GAP = 8;
const COMPARE_MIN = 60;
// Must match the `@media (max-height: 500px)` rule in shared-ui.css that
// flips .compare-group to a horizontal row.
const SHORT_MAX = 500;

// Touch browsers synthesize mouseenter/mouseleave around every tap. The
// mouseenter opened the hover tooltip BEFORE the click was dispatched, so
// for cells mid-screen the overlay swallowed the click (no selection ever
// happened) while the cell's synthetic mouseleave started the 80ms hide
// timer — the tooltip flashed for a split second and vanished. On devices
// that can't hover, tooltips open exclusively through the tap path.
function canHover(): boolean {
  return window.matchMedia("(hover: hover)").matches;
}

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

// Landscape phones are too short to stack anything vertically — a two-panel
// compare group alone is taller than the viewport. Lay everything out as one
// horizontal, centered strip instead: [compare panels…] [tooltip]. The
// panels sit side by side via the max-height media query on .compare-group
// (shared-ui.css), so the strip is never taller than a single panel.
function rowLayout(midY: number, tooltipH: number, compareH: number, panelCount: number) {
  const maxAvail = Math.max(60, window.innerHeight - 2 * MARGIN);
  const compW = panelCount > 0 ? panelCount * PANEL_WIDTH + (panelCount - 1) * STACK_GAP : 0;
  const gap = compW > 0 ? STACK_GAP : 0;
  const total = compW + gap + PANEL_WIDTH;
  const left = Math.max(MARGIN, (window.innerWidth - total) / 2);
  const stripH = Math.min(Math.max(tooltipH, compareH) || maxAvail, maxAvail);
  return {
    top: clampedTop(midY, stripH),
    maxAvail,
    compareLeft: left,
    tooltipLeft: left + compW + gap,
  };
}

// Single source of truth for the stacked (tooltip above, compare below)
// layout. tooltipStyle() and compareStyle() previously each re-derived the
// split and could disagree; computing every number in one place guarantees
// the two boxes can never overlap. The compare panel keeps a reserved
// minimum slice of the height budget so a tall tooltip can't push it
// off-screen.
function stackedLayout(midY: number, tooltipH: number, compareH: number) {
  const maxAvail = Math.max(60, window.innerHeight - 2 * MARGIN);
  const gap = compareH > 0 ? STACK_GAP : 0;
  const reserved = compareH > 0 ? Math.min(compareH, COMPARE_MIN) + gap : 0;
  const tooltipMax = Math.max(40, Math.min(tooltipH || maxAvail, maxAvail - reserved));
  const compareMax =
    compareH > 0 ? Math.max(40, Math.min(compareH, maxAvail - tooltipMax - gap)) : 0;
  const tooltipRendered = Math.min(tooltipH, tooltipMax);
  const totalH = tooltipRendered + gap + Math.min(compareH, compareMax);
  const top = totalH > 0 ? clampedTop(midY, totalH) : midY;
  return {
    top,
    tooltipMax,
    tooltipScrolls: tooltipH > tooltipMax,
    compareTop: top + tooltipRendered + gap,
    compareMax,
  };
}

export function useItemHover() {
  const [hovered, setHovered] = useState<HoveredItem | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const compareRef = useRef<HTMLDivElement | null>(null);
  const [tooltipHeight, setTooltipHeight] = useState(0);
  const [compareHeight, setCompareHeight] = useState(0);
  const [comparePanels, setComparePanels] = useState(0);

  // scrollHeight, not offsetHeight: the boxes render with a maxHeight
  // computed from the *previous* item's measurements, and offsetHeight is
  // clamped by it. Measuring the clamped value locked the state at the old
  // height forever — the taller tooltip then overflowed its box (overflowY
  // stayed "visible") straight onto the compare panel below it.
  // scrollHeight always reports the natural content height.
  useLayoutEffect(() => {
    setTooltipHeight(tooltipRef.current?.scrollHeight ?? 0);
    setCompareHeight(compareRef.current?.scrollHeight ?? 0);
    setComparePanels(
      compareRef.current?.querySelectorAll(".compare-panel").length ?? 0,
    );
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
    if (!canHover()) return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setHovered({ item, rect: (e.currentTarget as HTMLElement).getBoundingClientRect() });
  }

  function onMouseLeave() {
    if (!canHover()) return;
    hideTimer.current = setTimeout(() => setHovered(null), 80);
  }

  const isMobile = window.innerWidth < 600;
  const isShort = window.innerHeight <= SHORT_MAX;

  function tooltipStyle(): CSSProperties | null {
    if (!hovered) return null;
    const midY = hovered.rect.top + hovered.rect.height / 2;
    if (isShort) {
      const r = rowLayout(midY, tooltipHeight, compareHeight, comparePanels);
      return {
        position: "fixed",
        top: r.top,
        left: r.tooltipLeft,
        zIndex: 9999,
        pointerEvents: !canHover() || tooltipHeight > r.maxAvail ? "auto" : "none",
        width: 170,
        maxHeight: r.maxAvail,
        overflowY: tooltipHeight > r.maxAvail ? "auto" : "visible",
        visibility: tooltipHeight > 0 ? "visible" : "hidden",
      };
    }
    const stacked = isMobile || !fitsSideBySide(hovered.rect);
    if (stacked) {
      const s = stackedLayout(midY, tooltipHeight, compareHeight);
      return {
        position: "fixed",
        top: s.top,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        pointerEvents: !canHover() || s.tooltipScrolls ? "auto" : "none",
        width: 170,
        maxHeight: s.tooltipMax,
        overflowY: s.tooltipScrolls ? "auto" : "visible",
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
    if (isShort) {
      const r = rowLayout(midY, tooltipHeight, compareHeight, comparePanels);
      return {
        position: "fixed",
        top: r.top,
        left: r.compareLeft,
        zIndex: 9999,
        pointerEvents: "auto",
        maxHeight: r.maxAvail,
        overflowY: "auto",
        visibility: compareHeight > 0 ? "visible" : "hidden",
      };
    }
    const stacked = isMobile || !fitsSideBySide(hovered.rect);
    if (stacked) {
      const s = stackedLayout(midY, tooltipHeight, compareHeight);
      // pointerEvents needs to be "auto" here (unlike the plain hover
      // tooltip) so a touch can actually scroll it when it overflows.
      return {
        position: "fixed",
        top: s.compareTop,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxHeight: s.compareMax,
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
