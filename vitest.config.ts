import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  // The cmdk module imports the package by name; in the repo that name is the source.
  resolve: { alias: { "@teb-ooo/ui/stories": fileURLToPath(new URL("./src/stories.ts", import.meta.url)), "@teb-ooo/ui": fileURLToPath(new URL("./src/index.ts", import.meta.url)) } },
  test: {
    environment: "jsdom",
    environmentOptions: { jsdom: { url: "http://hello-staging.teb.ooo/" } },
    setupFiles: ["test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
    css: false,
  },
});
