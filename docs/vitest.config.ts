import { defineConfig, mergeConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fsAllow, shared } from "./vite.config.ts";

export default mergeConfig(
  { ...shared, plugins: [react()], server: { fs: { allow: fsAllow } } },
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: ["test/setup.ts"],
      include: ["test/**/*.test.{ts,tsx}"],
      css: true,
      server: { deps: { inline: [/@teb-ooo/] } },
    },
  }),
);
