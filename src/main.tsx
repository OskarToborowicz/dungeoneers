import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import diabloFontUrl from "./assets/diablo.ttf?url";
import "./index.css";
import App from "./App.tsx";

// Preload the heading font before first paint so `font-display: optional`
// (see index.css) can apply it within its block period — the font shows on
// first render without the swap-in reflow that causes layout shift (CLS).
const fontPreload = document.createElement("link");
fontPreload.rel = "preload";
fontPreload.as = "font";
fontPreload.type = "font/ttf";
fontPreload.href = diabloFontUrl;
fontPreload.crossOrigin = "anonymous";
document.head.appendChild(fontPreload);

// iOS Safari's viewport units (dvh/svh) don't account for the landscape
// tab bar — visualViewport.height is the only reliable visible height.
// Exposed as --app-vh for the mobile/landscape height locks in CSS.
function syncViewportHeight() {
  const vv = window.visualViewport;
  // Pinch-zoom also fires visualViewport resize — freeze the layout
  // height instead of shrinking the whole app to the magnified area.
  if (vv && vv.scale > 1.001) return;
  const h = vv?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--app-vh", `${h}px`);
}
syncViewportHeight();
window.addEventListener("resize", syncViewportHeight);
window.visualViewport?.addEventListener("resize", syncViewportHeight);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
