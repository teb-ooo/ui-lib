import { resolve } from "node:path";
import { defineConfig } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { scanAll } from "./scripts/scan-lib.ts";

const uiRoot = resolve(import.meta.dirname, "..");

/** Emits dist/manifest.json listing every entry, for the exit check. */
function manifest(): Plugin {
  return {
    name: "gallery-manifest",
    generateBundle() {
      const entries = scanAll().map((s) => ({
        title: s.title,
        group: s.group,
        slug: s.slug,
        path: `/${s.slug}`,
        package: s.packageName,
        component: s.component ?? null,
        variants: s.variants,
      }));
      this.emitFile({ type: "asset", fileName: "manifest.json", source: `${JSON.stringify({ entries }, null, 2)}\n` });
    },
  };
}

export const fsAllow = [resolve(uiRoot, ".."), uiRoot];

export const shared = {
  // One copy of React and Base UI for the gallery, ui's stories and the command package.
  resolve: {
    dedupe: ["react", "react-dom", "@base-ui/react", "lucide-react", "@tanstack/react-router"],
    alias: {
      "@teb-ooo/ui/theme.css": resolve(uiRoot, "theme.css"),
      "@teb-ooo/ui": resolve(uiRoot, "src/index.ts"),
    },
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss(), manifest()],
  ...shared,
  server: { fs: { allow: fsAllow } },
  build: { outDir: "dist", emptyOutDir: true },
});
