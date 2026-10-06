import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  // The cmdk module imports the package by name; in the repo that name is the source.
  resolve: { alias: { "@teb-ooo/ui/stories": fileURLToPath(new URL("./src/stories.ts", import.meta.url)), "@teb-ooo/ui": fileURLToPath(new URL("./src/index.ts", import.meta.url)) } },
  test: {
    // One jsdom per test file (vitest hints at sharing it to save time). Declined on purpose: the tests set globals, the
    // document's focus and the viewport width, and a shared environment would let one file's leftovers fail another.
    environment: "jsdom",
    environmentOptions: { jsdom: { url: "http://hello-staging.teb.ooo/" } },
    setupFiles: ["test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
    css: false,
  },
});
