import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Relative URLs: the entrance scene loads its worker file as `new URL("./assets/...", import.meta.url)`, which must resolve beside the chunk in node_modules, not at the site root.
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    lib: {
      entry: { index: "src/index.ts", "cmdk/index": "src/cmdk/index.ts", "editor/index": "src/editor/index.ts", "markdown/index": "src/markdown/index.ts", "entrance/index": "src/entrance/index.ts" },
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      // @teb-ooo/ui is external so the cmdk entry imports the package itself instead of bundling a second copy of the components.
      external: [/^react($|\/)/, /^react-dom($|\/)/, /^@base-ui\/react($|\/)/, /^lucide-react($|\/)/, /^@tanstack\//, /^@teb-ooo\/ui($|\/)/, /^@teb-ooo\/web($|\/)/, /^@tiptap\//, /^prosemirror-/, /^react-markdown$/, /^remark-/, /^three($|\/)/],
    },
    emptyOutDir: true,
  },
});
