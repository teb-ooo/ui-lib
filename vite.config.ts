import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    lib: {
      entry: { index: "src/index.ts", "cmdk/index": "src/cmdk/index.ts" },
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      // @teb-ooo/ui is external so the cmdk entry imports the package itself instead of bundling a second copy of the components.
      external: [/^react($|\/)/, /^react-dom($|\/)/, /^@base-ui\/react($|\/)/, /^lucide-react($|\/)/, /^@tanstack\//, /^@teb-ooo\/ui($|\/)/],
    },
    emptyOutDir: true,
  },
});
