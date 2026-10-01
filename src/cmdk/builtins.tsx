import { Compass, ExternalLink, Keyboard, Sparkles } from "lucide-react";
import type { AnyRouter } from "@tanstack/react-router";
import { openInNewTab } from "./external";
import { readPlayground } from "./playground-global";
import type { Command } from "./types";

/** Id of the "Ask assistant..." command, which doubles as the no-results fallback row. */
export const ASK_ASSISTANT_ID = "builtin:ask-assistant";
export const SHORTCUTS_ID = "builtin:keyboard-shortcuts";

/** Routes that never appear under "Go to": private (a first segment starting with `_`), or needing params (`$id`, splats). */
export function isNavigableRoute(path: string): boolean {
  // Optional params are written `{-$name}`; any other `$` is a required param or a splat.
  if (path.replace(/\{-\$[^}]*\}/gu, "").includes("$")) return false;
  const first = path.split("/").find((s) => s !== "") ?? "";
  return !first.startsWith("_");
}

/** One "Go to" command per navigable route of the app's router. */
export function navigationCommands(router: AnyRouter | undefined): Command[] {
  if (!router) return [];
  const byPath = router.routesByPath as Record<string, { options?: { staticData?: { title?: string } } } | undefined>;
  return Object.keys(byPath)
    .filter(isNavigableRoute)
    .sort((a, b) => a.localeCompare(b))
    .map((path): Command => {
      const title = byPath[path]?.options?.staticData?.title;
      return {
        id: `go:${path}`,
        title: title && title !== "" ? title : path,
        group: "Go to",
        keywords: title ? [path, "go to", "navigate"] : ["go to", "navigate"],
        icon: Compass,
        run: () => router.navigate({ to: path }),
      };
    });
}

export interface BuiltinDeps {
  router: AnyRouter | undefined;
  /** All currently registered commands with a shortcut, for the "Keyboard shortcuts" view. */
  listShortcuts: () => Command[];
}

/** The commands the provider registers in every app. */
export function builtinCommands({ router, listShortcuts }: BuiltinDeps): Command[] {
  const playground = readPlayground;
  return [
    ...navigationCommands(router),
    {
      id: "builtin:claude-app",
      title: "Open in Claude app",
      group: "General",
      keywords: ["claude", "session", "agent"],
      icon: ExternalLink,
      when: () => playground().claudeSessionUrl !== "",
      run: () => openInNewTab(playground().claudeSessionUrl),
    },
    {
      id: SHORTCUTS_ID,
      title: "Keyboard shortcuts",
      group: "General",
      keywords: ["keys", "hotkeys", "help"],
      icon: Keyboard,
      children: listShortcuts,
    },
    {
      id: ASK_ASSISTANT_ID,
      title: "Ask assistant...",
      group: "Assistant",
      keywords: ["ai", "chat", "help", "claude"],
      icon: Sparkles,
      when: () => playground().assistant,
      run: (ctx) => {
        const q = ctx.fallback ? ctx.query.trim() : "";
        return router?.navigate({ to: "/assistant", search: q ? { q } : {} });
      },
    },
  ];
}
