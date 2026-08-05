import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// @ts-expect-error - plain ESM helper shared by the three apps, no types file
import preloadFonts from "./tools/vite-preload-fonts.mjs";

/**
 * One alias, `@` → `./src`. Everything the app imports lives under `src/`,
 * including the shared design layer at `src/lib/{core,ui,brand}` — this project
 * has no dependency on any sibling project and no workspace linkage.
 */
export default defineConfig({
  plugins: [react(), preloadFonts()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { port: 3000, host: true },
  preview: { port: 3000, host: true },
  build: { outDir: "dist", sourcemap: true },
});
