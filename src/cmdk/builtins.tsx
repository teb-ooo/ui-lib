import { Compass, ExternalLink, Keyboard } from "lucide-react";
import type { AnyRouter } from "@tanstack/react-router";
import { openInNewTab } from "./external";
import { getPlayground } from "@teb-ooo/web";
import type { Command } from "./types";

export const SHORTCUTS_ID = "builtin:keyboard-shortcuts";

/** Routes that never appear under "Go to": private (a first segment starting with `_`), or needing params (`$id`, splats). */
export function isNavigableRoute(path: string): boolean {
  // Optional params are written `{-$name}`; any other `$` is a required param or a splat.
  if (path.replace(/\{-\$[^}]*\}/gu, "").includes("$")) return false;
  const first = path.split("/").find((s) => s !== "") ?? "";
  return !first.startsWith("_");
}

/** One "Go to" command per navigable route of the app's router that has a title. */
export function navigationCommands(router: AnyRouter | undefined): Command[] {
  if (!router) return [];
  const byPath = router.routesByPath as Record<string, { options?: { staticData?: { title?: string; palette?: boolean } } } | undefined>;
  return Object.keys(byPath)
    .filter(isNavigableRoute)
    // A route opts out with `staticData: { palette: false }`: a public page, or one the app lists itself.
    .filter((path) => byPath[path]?.options?.staticData?.palette !== false)
    // A route with no title has no name a person would know (its path is not one): it is not offered. Give the route a title to list it.
    .filter((path) => (byPath[path]?.options?.staticData?.title ?? "") !== "")
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
  const playground = getPlayground;
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
  ];
}
