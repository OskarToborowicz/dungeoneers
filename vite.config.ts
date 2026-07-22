import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), svgr()],
    base: env.VITE_BASE_PATH || "/",
    resolve: {
      dedupe: ["react", "react-dom"],
    },
  };
});
