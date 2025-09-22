import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // ← Assure-toi que le nom ici correspond à l'import
import tsconfigPaths from "vite-tsconfig-paths";
import * as path from "node:path";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "app"),
    },
  },
});
