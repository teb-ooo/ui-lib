import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import { CommandProvider } from "@teb-ooo/cmdk";
import { EntryPage } from "./chrome/entry-page";
import { GalleryCommands } from "./chrome/gallery-commands";
import { Shell } from "./chrome/shell";
import { Variants } from "./chrome/variants";
import { useEffect } from "react";
import { setPageTheme } from "./gallery-theme";
import { entries, findEntry } from "./registry";
import type { Entry } from "./registry";

export interface EntrySearch {
  /** `1` renders the variants only, without chrome, for screenshots. */
  frame?: "1";
  theme?: "light" | "dark";
}

function parseSearch(s: Record<string, unknown>): EntrySearch {
  const out: EntrySearch = {};
  if (String(s["frame"]) === "1") out.frame = "1";
  if (s["theme"] === "light" || s["theme"] === "dark") out.theme = s["theme"];
  return out;
}

function NotFound() {
  return (
    <Shell current={null}>
      <p className="m-0 text-ink-muted">No such entry.</p>
    </Shell>
  );
}

/** The palette provider sits here, above the routed content, so it is not remounted on navigation. */
function Root() {
  return (
    <CommandProvider>
      <GalleryCommands />
      <Outlet />
    </CommandProvider>
  );
}

const rootRoute = createRootRoute({ component: Root, notFoundComponent: NotFound });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    const first = entries[0];
    if (!first) return;
    throw redirect({ to: "/$group/$slug", params: { group: first.group.toLowerCase(), slug: first.slug.split("/")[1] ?? "" } });
  },
});

/** Variants only, no chrome. `?theme=` forces a scheme for this load without remembering it, for screenshots. */
function Frame({ entry, theme }: { entry: Entry; theme: "light" | "dark" | undefined }) {
  useEffect(() => {
    if (theme) setPageTheme(theme);
  }, [theme]);
  return (
    <div className="min-h-dvh bg-ground p-4 text-ink" data-testid="frame">
      <Variants entry={entry} />
    </div>
  );
}

function EntryRoute() {
  const { group, slug } = useParams({ from: "/$group/$slug" });
  const search = useSearch({ from: "/$group/$slug" }) as EntrySearch;
  const entry = findEntry(group, slug);
  if (!entry) return <NotFound />;
  if (search.frame === "1") {
    return <Frame entry={entry} theme={search.theme} />;
  }
  return (
    <Shell current={entry.slug}>
      <EntryPage entry={entry} />
    </Shell>
  );
}

const entryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "$group/$slug",
  validateSearch: parseSearch,
  component: EntryRoute,
});

export const routeTree = rootRoute.addChildren([indexRoute, entryRoute]);

export function makeRouter(history?: Parameters<typeof createRouter>[0]["history"]) {
  return createRouter({ routeTree, ...(history ? { history } : {}) });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof makeRouter>;
  }
}
