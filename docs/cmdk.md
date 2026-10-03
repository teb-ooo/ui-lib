# Command palette (`@teb-ooo/ui/cmdk`)

The Cmd+K command palette for every playground app: a provider that owns the registry, recents and global shortcuts, a hook to register contextual commands, and a keyboard-first, phone-friendly palette built on `@teb-ooo/ui`. It has built-ins in every app (navigation to each route, Claude app, profile, sign out, keyboard shortcuts, assistant) and its own fuzzy scorer, with no runtime dependencies. Run the tests with `npm test`, type-check with `npm run typecheck`, and build with `npm run build`.

## Usage

Peers: `react`, `react-dom`, `@tanstack/react-router` (optional for the rest of `@teb-ooo/ui`, required here) and `lucide-react`. The palette is part of `@teb-ooo/ui` (one version); until 0.6.0 it was the separate package `@teb-ooo/cmdk`.

CSS: nothing extra. `@import "@teb-ooo/ui/theme.css";` already scans the palette classes and defines the `--cmdk-loaded` sentinel.

Mount the provider once, inside the router, with the `Shell` inside it (`web/src/routes/__root.tsx`). The trigger is the search icon in the shell's platform bar; an app draws no trigger of its own:

```tsx
import { CommandProvider } from "@teb-ooo/ui/cmdk";
import { Shell } from "@teb-ooo/ui";
import { Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <CommandProvider>
      <Shell sidebar={<AppSidebar />}>
        <Outlet />
      </Shell>
    </CommandProvider>
  ),
});
```

**Platform commands (0.23.0).** The `Shell` registers them under the group "Platform", so an app neither registers nor can remove them: Sign out (a GET to `/auth/logout`, only while signed in), My profile (id app), Go to dashboard (ah), Go to work tracker (bd), Go to design system (ui) and Send feedback (the owner only). The list of links lives in `@teb-ooo/web` (`platformLinks()`), so it can grow without app changes. "Open in Claude app" stays a built-in under General.

Register commands where the action lives. They exist while the component is mounted:

```tsx
import { useRegisterCommands } from "@teb-ooo/ui/cmdk";
import { Plus } from "lucide-react";

function ItemsPage() {
  const navigate = useNavigate();
  useRegisterCommands([
    { id: "items.new", title: "New item", group: "Items", keywords: ["create", "add"],
      shortcut: "n i", icon: Plus, run: () => navigate({ to: "/items/new" }) },
    { id: "items.export", title: "Export CSV", group: "Items", run: async () => { await exportCsv(); } },
    { id: "items.move", title: "Move to...", group: "Items", children: [/* Command[] */] },
  ]);
  // ...
}
```

`run` may return a promise (spinner, inline error on failure) or a `Command[]` (opens a nested view). `deps` (second argument) says when the list itself changed; `run` and `when` always see the latest render. `shortcut` is a chord (`mod+shift+n`) or a sequence (`g i`). `useCommandPalette()` returns `{ open, close, isOpen }`.

`CommandProvider`'s `signOutPath` is deprecated and ignored: Sign out is a platform command now. The built-in Profile and Sign out commands are gone for the same reason. `useFeedbackCommand` is deprecated too: the `Shell` registers Send feedback and owns the feedback panel, so an app calls neither it nor `useFeedback`. `CommandTrigger` is for the gallery only: the bar has the trigger.

**Search sources (0.27.0).** Registered commands are a fixed list, filtered in the browser. To make the palette search an app's own listing or search API (jump to an entry, an issue, a note), register a source where the data's screen lives:

```tsx
import { useCommandSource } from "@teb-ooo/ui/cmdk";

useCommandSource({
  id: "entries",
  group: "Entries",
  search: async (query, signal) => {
    // `api` is the app's client from web/src/api (createApi from @teb-ooo/web), as in every app.
    const page = await queryClient.fetchQuery(api.queryOptions("get", "/api/search", { params: { query: { q: query, limit: 8 } }, signal }));
    return page.items.map((e) => ({ id: `entry:${e.id}`, title: e.title, group: "Entries", run: () => navigate({ to: "/entries/$id", params: { id: e.id } }) }));
  },
}, []);
```

The source's `group` is the section heading the palette draws; the `group` on each returned command is required by the `Command` type but is not used for these results, so use the same string in both. `search(query, signal)` returns commands in the server's order (they are not filtered again); `signal` aborts when the query changes or the palette closes. A command's `hint` (0.28.0) is quiet text after its title, such as an entry's type ("City"); it takes the width the title does not need (0.39.4), right-aligned. Options: `minChars` (2), `debounceMs` (150), `limit` (8). Results appear under `group` after the matching commands, only at the root of the palette, with a quiet "Searching..." line while the request runs (earlier results stay) and "Could not search ..." when it fails. Use the generated hooks' query options (WEB rules: no raw `fetch`). Several sources can be registered; they are asked in parallel. A source may legitimately fail or return nothing (the backend is down, the promotion candidate has no data, the person may not see it), so tests must not assume results from one: test the source's `search` function and the command it returns directly, or mock the API, and only assert the palette's own states (Searching, failed line) against a controlled source.

Give every route a title so it reads well under "Go to": `createFileRoute("/items")({ staticData: { title: "Items" }, component: ItemsPage })`. The `title?: string` field is added to TanStack's `StaticDataRouteOption` by this package.

The palette has no theme handling: it uses the ui tokens, so it follows the system colour scheme like the rest of the app. Built-ins read `window.__PLAYGROUND__` (`env`, `assistant`, `claude_session_url`, `app_name`; camelCase keys are accepted too) and are safe when it is absent.

## Focus, and development warnings

- **After the palette closes.** `run(ctx)` receives `ctx.afterClose(fn)`: `fn` runs once the palette has closed and focus has gone back to where it was, so a command can move focus or scroll without `requestAnimationFrame`. (When a shortcut ran the command and no palette is open, it runs on a microtask.)

  ```tsx
  run: (ctx) => ctx.afterClose(() => nameInput.current?.focus())
  ```
- **Router.** `CommandProvider` belongs inside `RouterProvider` (navigation commands come from the router). With no router, development builds warn once; pass `standalone` when that is intended (a gallery, a test).
- **`deps`.** `useRegisterCommands(commands, deps)`: pass what the list (ids, titles, groups, shortcuts) depends on. If the list changes while `deps` does not, development builds warn once.
- **`theme.css`.** It also defines `--cmdk-loaded`; if the app forgot `@import "@teb-ooo/ui/theme.css"`, development builds warn once instead of rendering an unstyled palette silently.

The warnings never run in production builds or under jsdom.

## Writing commands people can use (from the first review round)

- **One command per kind of thing, not one per value.** "Show billing rules, Show search rules, ..." for every domain floods the first screen of the palette on a phone. Make one command, "Filter by domain", and put the values in its `children`.
- **Name groups so they cannot collide.** Two groups called "Issues" (commands and a source) read as a bug. Name command groups by what they do ("Issue actions", "Filters") and a source's group by what it finds ("Issues").
- **Use a source for entries, a command for actions.** Entries (rules, issues, people) come from `useCommandSource`; the palette highlights the matched text in them from ui 0.38.5, so upgrade old apps.
- **Give the palette what the screen can do before what it can find**: commands for the open item first, then the platform commands, then entries.
- A command's `hint` takes the width its title leaves (0.39.4): use it for a type or a code, not a sentence.
