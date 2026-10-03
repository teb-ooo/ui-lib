# Upgrading @teb-ooo/ui and @teb-ooo/web

What an app must change when it moves between versions, newest first; only what needs action is listed, the rest is in `components.md`.

## To ui 0.40.0 (from 0.39.4)

No change needed. New `Prose` component for rich text (headings, lists, quotes, code, tables): wrap your rendered markdown or editor content in it instead of styling elements locally. See the Prose story (the type scale demo).

## To ui 0.39.4 and web 0.8.2 (from 0.39.3 and 0.8.1)

No change needed; visible differences:

- **Dialog, Sheet, Shell, FeedbackPanel** dim the page when opened from inside another dialog (a phone's detail view is a dialog): the backdrop was skipped for nested dialogs.
- **DataTable** `onRetry` / `retryLabel`: a Retry button under `error`. Pass the query's `refetch`.
- **Palette** a command's `hint` takes the width the title leaves (it was cut at 40%).
- **web** `ApiError.userMessage` is a sentence for a person ("The server could not do that. Try again in a moment."); show it instead of `message` ("Internal Server Error: internal error"). `createQueryClient` retries once after 500 ms (was twice with growing delays), so a failing list shows its error within about a second.

## To ui 0.39.3 (from 0.39.2)

No change needed. **Chip** `tone="muted"` is quiet text as documented: it no longer draws the outline that made it look like a button (the box keeps its size, so rows stay aligned).

## To ui 0.39.2 and web 0.8.1 (from 0.39.1 and 0.8.0)

No change needed. **Switch**: the off thumb is a light grey (it was dark, so an off switch could read as on). **DataTable** with `bleed`: cards have 16px side padding, like the footer and the page gutter. **web** `friendlyMessage` also words pattern errors ("Use lowercase letters, digits and underscore.").

## To ui 0.39.1 and web 0.8.0 (from 0.38.x and 0.7.x)

0.39.0 was published with a peer range that excluded web 0.8.0; use 0.39.1.

No change is required; these are additions and one wording change.

- **web 0.8.0** `useForm().fieldError(name)` now returns a sentence for a person ("Enter a value.", "Use at most 20 characters.") instead of the schema wording ("expected length >= 1"); `errors` keeps the raw text, and `friendlyMessage(text)` is exported for other places that show a field message. A test that matches the old wording in `fieldError` must change.
- **ui 0.39.0 DataTable** with `selectedKeys`: below `cardsBelow` each card now has a checkbox and the list starts with a select-all row (bulk actions work on a phone).
- **ui 0.39.0 FilterBar**: new `primary` slot. Put the SearchInput and the main action there and the filters in `children`; on a phone the filters open in a sheet behind a "Filters" button (`activeCount` shows how many are set). Without `primary` nothing changes.

## To ui 0.26.3 and web 0.7.3 (from 0.25.x and 0.7.2)

No code change is needed in an app that is already on the closed shell (0.23 or later). Visible differences, so nobody is surprised:

- **FeedbackPanel** (the `Shell` owns it, an app never renders it): Enter sends and Shift+Enter adds a line; the intro line and the "what is sent" list are gone; a sent message is confirmed by a toast and the dialog closes. New `useToast()` / `ToastProvider` (the `Shell` mounts the provider; `useToast` throws outside it).
- **web 0.7.3** `useFeedback` opens straight into picking an element (`pickOnOpen`, default true); Escape skips the pick. An app that calls `useFeedback` itself (it should not since 0.23) gets the new behaviour; pass `pickOnOpen: false` to keep the old one.
- **Platform bar:** the live dot is on the left after the name and shows only when live updates are reconnecting or degraded; the app name is in capitals; the staging mark is an orange 48x8 bar after the name; the bar is 36px.
- **FieldRow** label and value share a baseline; **SplitPane**'s resizable divider is the 1px rule with a 12px grab area (it grows to 3px on hover); **Sidebar** and **DataTable** show a keyboard focus ring.
- Tests: a Playwright or unit test that finds the bar by `role="banner"` sees one `header` of 36px; one that looks for the old header content (a "staging" chip, a Sign in button, a Claude link) must change.

## To ui 0.25.0 and web 0.7.2 (from 0.24.x)

- `@teb-ooo/ui` peer-depends on `@teb-ooo/web ^0.7.2` and `@tanstack/react-query ^5.80`: bump web to 0.7.2 or later together with ui.
- The bar is 36px (was 24px) and the live dot shows only in an app that has a live stream (`useLive` or `useLiveQueries` mounted); `web` 0.7.2 adds `useHasLiveStream`.

## To ui 0.24.0 (from 0.23.x)

- `Shell`'s `sidebar` is optional: leave it out (or pass `null`) for an app with no sidebar. No code change for others.

## To ui 0.23.0 and web 0.7.0 (from 0.22.x): BREAKING

The closed platform shell (see `components.md`, "Upgrading an app to 0.23"). In `web/src/routes/__root.tsx`:

1. Delete the `AppHeader` and `Shell`'s `header` prop (the prop no longer exists, so it is a type error).
2. Delete every control the header held: the staging chip, `CommandTrigger`, sign in and sign out, the Claude link, the assistant link. The platform bar and Cmd+K cover them; app-specific links belong in the sidebar, the page or a Cmd+K command.
3. Delete `useFeedback()`, `useFeedbackCommand()` and `<FeedbackPanel />`: the `Shell` does all three (one instance).
4. Keep `<CommandProvider>` around `<Shell>` (the shell must be inside it, the router and the query client). `useLive` stays where it is.
5. Drop `signOutPath` from `CommandProvider` if set (ignored now). The built-in Profile and Sign out commands are gone: the shell registers the platform commands (group "Platform").
6. `@teb-ooo/web` 0.7.0 is a peer of `@teb-ooo/ui`.

## web 0.7.1 (from 0.7.0)

- `useUser` / `fetchUser` call `/auth/me?optional=1` (200 `{anonymous:true}` when signed out on playground-go 0.7.2 or later, 401 on older servers; both mean signed out). A Playwright mock must match the query: `page.route("**/auth/me*", ...)`, not `"**/auth/me"`. An msw handler on `*/auth/me` already matches. Pass `optional: false` to ask the plain URL.

## Also (from 0.22.x)

- `Badge` was removed in 0.21.0: use `Chip` (tone `accent` is now `link`).
