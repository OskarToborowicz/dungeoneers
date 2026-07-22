import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  plugins: [react(), svgr()],
  base: "/dungeoneers/",
  resolve: {
    dedupe: ["react", "react-dom"],
  },
});
