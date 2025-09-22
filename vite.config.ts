import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import * as path from "node:path";

export default defineConfig({
  css: {
    // Forcer PostCSS au lieu de lightningcss (évite bugs de compatibilité)
    transformer: "postcss",
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(), // pour respecter les chemins définis dans tsconfig.json
  ],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "app"), // raccourci pour import "~/..."
    },
  },
  build: {
    outDir: "dist", // dossier de sortie du build
    sourcemap: true, // utile pour le debug en prod (optionnel)
    target: "esnext", // génère du JS moderne (plus optimisé)
  },
  server: {
    port: 5173, // port de dev (change si besoin)
    open: true, // ouvre automatiquement le navigateur
  },
  define: {
    // tu peux injecter des variables d'env ici si besoin
    __APP_VERSION__: JSON.stringify("1.0.0"),
  },
});
