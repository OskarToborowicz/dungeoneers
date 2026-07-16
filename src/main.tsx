import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

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
