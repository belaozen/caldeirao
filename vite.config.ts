import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Build to a single dist/index.html with JS and CSS inlined, so the game still opens offline.
export default defineConfig({
  plugins: [viteSingleFile()],
});
