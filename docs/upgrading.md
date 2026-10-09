# Upgrading @teb-ooo/ui and @teb-ooo/web

What an app must change when it moves between versions, newest first; only what needs action is listed, the rest is in `components.md`.

## To ui 0.75.0 (from 0.74.x)

The `@teb-ooo/web` peer is now `^0.9.10` (was `^0.7.5 || ^0.8.0 || ^0.9.0`), because `QueryState` uses `describeError`. An app on an older web moves to 0.9.10 or newer first (nothing else in web changed for it). New: `QueryState` and `ErrorState`.

## To ui 0.108.0 (from 0.107.x)

New: `ColorPicker` (square, hue bar, hex field; `hexToRgb` and `rgbToHex`) and `onHighlight(value | null)` on `Select` and `Combobox` (lyapunov). Nothing to change.

## To ui 0.107.0 (from 0.106.x)

REMOVED: `FrequencyInput`, `formatKhz`, `FrequencyInputProps` and `FrequencyInputHandle` (ui-lkhr). waves, its only user, draws its own readout and knob. An app that imports any of them keeps the 0.106.x version of ui or builds its own.

## To ui 0.106.0 (from 0.105.x)

New: `Command.onHighlight(command | null)` on a command that opens a nested view, to preview the highlighted choice (lyapunov). An app that watched the palette's DOM for `aria-selected` drops that. Nothing else to change.

## To ui 0.105.1 (from 0.105.0)

Fix: the `Sheet` side panel from `lg` is full height again (it was as tall as its content, so a long body never scrolled: `lg:bottom-auto` undid `lg:inset-y-0`). An app that worked around it with `lg:bottom-0!` can drop that (lyapunov).

## To ui 0.105.0 (from 0.104.x)

New: `FrequencyInput` takes a `ref` with `edit()` to open its editor from a command, so no key event has to be faked (waves-x1d). Nothing to change.

## To ui 0.104.0 (from 0.103.x)

New: `VirtualList` (a windowed list of any items, fixed or measured heights) and `DataTable` `virtualize` (`true`, `false` or a row count; default 100 as before) (ui-utzr). `DataTable` now also windows rows that wrap (`lines` 2 or 3), which it drew all of before: nothing to change, long wrapped tables just get cheaper. Rows of one line behave as before.

## To ui 0.103.0 (from 0.102.x)

`Chip tone="muted"` has a background now (the raised surface, with the muted ink): without one it read as plain text, not a chip (ui-rm2j). That includes the unlocked chip of the lock toggle.

`SplitPane`: the divider's default limits are 6rem to 96rem (they were 16 and 48), and the list can never take the last 6rem of the pane from the detail (ui-6mqa). An app that relied on the old limits passes `minSize={16} maxSize={48}`. The automatic width at wide screens still stops at 48rem. A saved width outside the old range is now kept.

## To ui 0.102.0 (from 0.101.x)

New: `Column.tone` on `DataTable`, a status column whose whole cell is painted in the state colour instead of holding a chip (ui-00s1). Optional: swap a status `Chip` for it. A toast's tone is a bar down its left edge drawn as its own element (the colour did not show in light mode before), and a one-line toast is centred vertically (ui-zbc5). Nothing to change.

## To ui 0.101.0 (from 0.100.x)

No code change. `LineChart` `loading` is drawn like the table's skeleton: still, after the 100ms delay, rules and one bar at the chart's height, with "Loading" for assistive technology (it pulsed in a bordered box before) (ui-wnup).

## To ui 0.100.0 (from 0.99.x)

No code change. The shadow of floating surfaces (`panel-float`: popovers, dialogs, toasts, menus) is about a third as strong on a light page; dark is unchanged (ui-fb8h).

## To ui 0.99.0 (from 0.98.x)

No code change. `Sidebar`: the scroller is the sidebar's full width and the height between the header and the footer (the padding moved inside it), so its scrollbar sits on the sidebar's edge instead of 8px in (ui-yult). Every popup that was drawn outside a forced theme (`FeedbackPanel`, `Sheet`, `Shell`'s drawer, `SplitPane`'s sheet, the platform bar menu, `ViewMenu`, `SuggestionList`, the column menu of `DataTable`, the editor's popovers) is now drawn inside it like the other popups, so it reverses the right way round (ui-aajw).

## To ui 0.98.0 (from 0.97.x)

`Tabs` is a bar now: the tab row is inside a band with 8px of padding and a rule under it (ui-1igi). An app that put its own padding or border around the tabs drops it. With `gutter` the bar's padding is the page gutter, so the first pill (not its text) sits on the gutter, 12px further left than before.

## To ui 0.97.0 (from 0.96.x)

New: `LineChart` `onSelect` and `selected` (ah-zum). Nothing to change.

## To ui 0.96.2 (from 0.96.1)

`LineChart`: the left margin follows the longest value label, so a label like `1500 MB` is no longer clipped (ah-2z3).

## To ui 0.96.1 (from 0.96.0)

Docs and the story only.

## To ui 0.96.0 (from 0.95.x)

`FrequencyInput`: the editor no longer takes room. It is a popover frame drawn over the readout (12px beyond it sideways, 8px above, field and a full-width `Set frequency` button inside), so the header, the knob and the neighbours stay where they are (waves-gqe). An app that made room for the stacked button drops that space.

## To ui 0.95.0 (from 0.94.x)

`Toast`: the stack is drawn inside the theme frame an app or the gallery forces (`PortalContainerProvider`), so a toast reverses the right way round when the chosen theme differs from the OS (ui-mrf1). Nothing to change. The gallery's "Palette" and "Color tokens" entries are one entry, "Color" (ui-mw1m).

## To ui 0.94.0 (from 0.93.x)

`Tabs`: the pill's bounce is no longer clipped at the ends of the row (the row has 8px of room each side, taken back with a negative margin so nothing moves; `gutter` still lines the first tab's text up with the page gutter) and overshoots less (ui-ct1g).

New: `LineChart` (ah-2z3). Nothing to change.

## To ui 0.93.0 (from 0.92.x)

`Tabs`: the pill's motion now squashes it (shorter and a little wider, more the further it travels) and springs it back to full size instead of leaning it. No change for apps.

## To ui 0.92.0 (from 0.91.x)

`Card` no longer has its own background: it is the page's colour with the border, like the page around it (ui-3w0k). Nothing to change; the `active` card keeps its raised fill.

## To ui 0.91.0 (from 0.90.x)

`Tabs` lost its bottom rule and underline: the chosen tab now sits on a raised pill that zips (stretches and bounces) from tab to tab (ui-wdjb). Nothing to change in props; an app that styled the rule (`border-b` on the tab list) or tested for the underline drops that. `gutter` still lines the first tab's text up.

## To ui 0.90.0 (from 0.89.x)

New: `startAdornment` and `endAdornment` on `Input`, `NumberField`, `Select` and `Combobox`, and `hideLabel` on `NumberField` (waves-21l). Nothing to change: a control without an adornment renders as before.

## To ui 0.89.2 (from 0.89.1)

A `DataTable` column with `rotate` writes its header at 45 degrees (rising to the right from the column's centre), not vertically as 0.89.0 and 0.89.1 did; the header row is as tall as the longest label needs. Nothing to change in code.

## To ui 0.89.1 (from 0.89.0)

The platform bar's connection dot (reconnecting or degraded) comes after the environment mark instead of before it, so its appearing and disappearing no longer moves the staging mark. Nothing to change.

## To ui 0.89.0 (from 0.88.x)

New: `DataTable` columns take `rotate` (the header at 45 degrees) and `align: "center"`, and `StatusMark` is a new atom, for a matrix of runs by checks (ah-dln). Nothing to change. A rotated header takes a Tab stop (it shows its full name on focus).

## To ui 0.88.0 (from 0.87.x)

**Breaking, small:** `DataTable` has no rows-per-page select any more, and `Pagination` loses `pageSizes` and `onPageSizeChange`. The app picks the one `pageSize` that suits the table (100 for a dense list of one-line rows, 25 for tall ones); the person is not offered a choice. Remove `pageSizes` and `onPageSizeChange` from any `pagination` object you build by hand; a table fed by `useListTable` from `@teb-ooo/web` 0.10.0 needs nothing (that release drops them from the hook too: remove the `pageSizes` option, and a `limit` in the address is ignored). The `@teb-ooo/web` peer is now `^0.9.10 || ^0.10.0`.

## To ui 0.87.3 (from 0.84.0 to 0.87.2)

Fix, take it at once: from 0.84.0 to 0.87.2 `theme.css` wrote the relative reversal as nested rules, and an app's CSS tooling (Tailwind with lightningcss) flattened them into every combination of the parent selectors, so the built CSS grew from about 80 kB to 4.4 MB (62 kB gzip) in every app, on every page. The levels are written flat now and the built CSS is back to its old size; `test/theme-size.test.ts` builds the block the way an app does and refuses a result more than four times what was written. An app on 0.84.0 to 0.87.2 can check `dist/assets/*.css`: anything near 4 MB is this.

## To ui 0.87.1 (from 0.87.0)

Fix: `EntrancePage` worked its cloud of points out in a Web Worker, which a consuming app's bundler turned into a `data:` URL that a content security policy of `script-src 'self'` (the platform's) blocks. The cloud is now worked out in short slices on the page's own thread (the same cloud, byte for byte, kept in IndexedDB for the next visit), so no worker, no extra asset and nothing for the bundler or the policy to decide. Use 0.87.1, not 0.87.0.

## To ui 0.87.0 (from 0.86.x)

New entry point `@teb-ooo/ui/entrance` with `EntrancePage`: the signed-out front door with the swingset scene (lifted from id). Nothing to change for an app that does not use it. To use it an app installs `three` (an optional peer dependency of ui: take the version named in its `peerDependencies`, saved exact) and replaces its own `/enter` page's wrapper with `<EntrancePage title="Sign in" busy={...}>` around its button. Keep your own button and copy: the scene only draws the picture. Give the button `bg-ground` so the mist never shows through it.

## To ui 0.86.2 (from 0.86.1)

Fix: a hovered button inside a surface three reversals deep was white on white (invisible), because only three levels of the relative reversal were written out and the hover is a fourth. Six levels are written out now.

## To ui 0.86.1 (from 0.86.0)

Fix: the palette's search box turned into a white box when focused, since 0.84.0 (a focused input inside a reversed surface flips back, and the palette is one). An input with the attribute `data-bare` is left out of the focus reversal; the palette's input has it. An app with its own chrome-less input inside a reversed surface can set it too.

## To ui 0.86.0 (from 0.85.x)

The form step of generated commands is now stepped through inside the palette (one field per step in the palette's own input, then a review) instead of a dialog over it. Nothing to change for an app that only tags operations. Removed: `PaletteFormDialog` (exported in 0.80 to 0.85; nothing in the apps used it directly) and `PaletteRuntime.prompt`. New: a command may return `{ form }` (a `CommandForm`) from `run`; `PaletteView` takes `inputLabel`, `note`, `emptyMessage`, `enterLabel` and an error with `plain`.

## To ui 0.85.0 (from 0.84.x)

`Sidebar`: the current page is reversed (it was a quiet raised fill), and a new `width` prop (`wide`, the default and unchanged, or `fit`). Audit your sidebar: if it has static links only and is mostly empty space, set `width="fit"`; see best-practices.md section 16. Nothing breaks if you do nothing, except the new look of the current item.

## To ui 0.84.0 (from 0.83.x)

Reversal is relative now: a reversal inside a reversed surface restores the page's own look (a hovered button in a reversed row is dark on a light row, in a dark page), and a third level reverses again. Before, any reversal inside a reversed surface repeated the same colours, so a hovered button in a reversed row or popup became invisible (white on white). Nothing to change in code; a screen that relied on the old behaviour (a hovered button inside a popover or an active row) now looks as a button on the page does. New: the Reversal entry in the gallery.

## To ui 0.83.1 (from 0.83.0)

Fix: the active row of a `DataTable` was drawn un-reversed (black in dark mode, white in light) because its class was named `invert`, which is also a Tailwind utility (`filter: invert(1)`) that inverted the reversed row again. The class is `reversed` now. **An app that put `className="invert"` on its own surface following the docs of 0.71 to 0.83 must change it to `reversed`** (search for `"invert"` and `invert ` in class names); until then that surface shows Tailwind's pixel inversion, not the theme's reversal.

## To ui 0.82.0 (from 0.81.x)

New: `form.options.<field>.also`, fixed values offered before the list's own items. Nothing to change.

## To ui 0.81.0 (from 0.80.x)

New in the form step: `form.fields` (the order of the questions), `form.options` (choices from a list operation). Changed: a text field is a multi-line box only above 1000 characters of `maxLength` and with no `format` (it was 200), and an email field is an email input; an app that relied on the box for a field of 201 to 1000 characters gets a one-line input.

## To ui 0.80.0 (from 0.79.x)

New: the form step of `PaletteFromApi` (`args: { field: "prompt" }`, `form: { submit }` in an x-palette tag; `PaletteFormDialog` and `PaletteFormRequest` are exported). Only an app that passes its own `call` to `PaletteFromApi` needs a change: `PaletteCall.args` values can now be numbers and booleans (a form's answers keep their type), so send a body field as it is and stringify only for a query.

## To ui 0.76.1 (from 0.75.x; 0.76.0 was tagged but never published)

**Tone spelling.** `Alert`, `Chip` and `Toast` take `tone="warning"`, the one spelling the token, `Button` and `Meter` already use; `tone="warn"` still works and is removed in the next minor release (change it now: a search for `tone="warn"` finds them). The class is `.chip-warning` (`.chip-warn` is gone; an app that used the class itself renames it). `Alert`'s `data-tone` now says `warning`.

**Palette errors.** A failed palette command shows `describeError`'s sentence, never a thrown `Error`'s own message: a command that wants its text shown rejects with `{ detail: "..." }` (a problem document) or an `ApiError`. `paletteFetch` now sends the playground request defaults (cookies, `X-Request-Id`), throws an `ApiError`, and sends a signed-out person to sign in.

**Web peer.** Already `^0.9.10` since 0.75.0.

## To ui 0.71.0 (from 0.70.x)

Visual change, nothing to change in code: hovered and open controls reverse (white on a dark page, black on a light one), a focused input drops to the page colour, the dropdown popups are inverted panels, and the environment mark is yellow. An app that styled a button's hover itself with its own classes may now fight the new rule.

## To ui 0.70.0 (from 0.69.x)

Breaking only if an app still uses them (none of the nine did): `useFeedbackCommand` (and its type `FeedbackCommandSource`) and the `signOutPath` prop of `CommandProvider` are removed; the Shell registers Send feedback and Sign out.

## To ui 0.69.1 (from 0.69.0)

No change needed. Documentation only: the Go `palette` package (playground-go v0.15.0) and `paletteRouteProblems` in `@teb-ooo/web/testing` 0.9.6 for `PaletteFromApi` tags.

## To ui 0.69.0 (from 0.68.x)

No change needed. New in `@teb-ooo/ui/cmdk`: `PaletteFromApi`, `usePaletteSelection`, `paletteFetch`, `commandsFromSpec`, `sourcesFromSpec`, `paletteProblems`, `untaggedActions` (Cmd+K commands from `x-palette` tags in the API document; see components.md) and `Command.minChars` (hide a command until the query has that many characters).

## To ui 0.68.0 (from 0.67.x)

No change needed. `AudioPlayer` takes `autoPlay` (requested by waves for continuing into the next recorded minute).

## To ui 0.67.0 (from 0.66.x)

No code change needed. Signed out, the platform bar draws neither the agent link nor the search icon (Cmd+K still opens the palette). `PlatformBar` gallery stories and tests that relied on them without a `user` must pass one.

## To ui 0.66.2 (from 0.65.x)

No change needed. The AudioPlayer story plays `/silence.wav` from the gallery's own origin (a data address is blocked by a `default-src 'self'` policy: an app that sets `media-src` must allow where its audio comes from).

## To ui 0.66.1 (from 0.65.x)

No change needed. New `Alert` and `AudioPlayer` (0.66.0; see components.md), requested by the waves UI review. 0.66.1 only adds their documentation.

## To ui 0.65.0 (from 0.64.x)

No change needed. `RichTextEditor` shows a (+) Insert block button at the end of an empty line (it types `/` to open the block menu).

## To ui 0.64.1 (from 0.64.0)

No change needed. The agent bubble measured its text while still scaling in, so it could open too narrow; it now measures the layout width.

## To ui 0.64.0 (from 0.63.x)

No code change needed. The platform bar's agent icon is now a plain link to the agent's session (it no longer opens a popover). While the agent works, a chat bubble to its left shows the action and the turn time (`Running a command  24m23s`) at all times; it animates in and out and its width glides when the text changes. `onAgentOpenChange` now reports whether the bubble is shown (that is, whether the agent is working). Without `agentHref` the icon is not a link.

## To ui 0.63.2 (from 0.63.0)

No change needed. Fixes the toast stack: the newest toast is now in front (older ones were painted over it, so the front looked empty).

## To ui 0.63.1 (from 0.63.0)

No change needed. The toast stack uses real 3D: the viewport has a perspective and older toasts are pushed back along z (`translateZ`) instead of scaled.

## To ui 0.63.0 (from 0.62.x)

No code change needed. Toasts are a 3D stack and leave by sliding off to the right (timed out, dismissed or swiped right). Hover or focus fans the stack out and pauses the timers. The `anim-toast` class is gone (theme.css has `.toast` and `.toast-content`); an app that used it by hand, which it should not, must drop it.

## To ui 0.62.2 (from 0.62.0)

No change needed. The popover arrow tucks 1px under the popup edge (no seam), the left and right arrows sat 2.5px off the popup, and the feedback text box really has no resize grip.

## To ui 0.62.1 (from 0.62.0)

No change needed. The Send feedback icon in the platform bar and in Cmd+K is Lucide's message circle.

## To ui 0.62.0 (from 0.61.x)

No change needed. Popovers, hover cards, tooltips and the feedback panel draw an arrow (class `popover-arrow`, 10 by 5px, the popup's own fill) toward the middle of their trigger. It follows the popup when it is flipped to another side or shifted to stay on screen, stays 8px from the popup's corners, and is left out where there is nothing to point at (the feedback panel with no picked element, or placed inside a screen-filling one). The side offset grew from 6 to 9px to make room for it.

## To ui 0.61.0 (from 0.60.x)

No change needed. The Cmd+K palette is inverted like the popovers (white on a dark page, black on a light one, no border). `Dialog` gains `inverted`.

## To ui 0.60.1 (from 0.59.x)

No code change needed. Popovers, hover cards, tooltips and the feedback panel are inverted: white on a dark page, black on a light one, with no border (they lift off the page by their fill and shadow alone). New class `panel-inverse` (theme.css) redefines the colour tokens as the opposite scheme for everything inside, through `light-dark()`, so it follows the OS scheme or a forced `data-theme`. Menus, selects, comboboxes and dialogs keep the bordered `panel`.

## To ui 0.59.6 (from 0.59.1)

No change needed. The feedback panel is laid out as a full-bleed text box over a footer (divider line, icon toggles for the screenshot and the DOM node inline, Send button on the right; no "Taking the screenshot" line, the camera shows a spinner instead).

## To ui 0.59.1 and web 0.9.4 (from 0.59.0 and 0.9.3)

No change needed. The feedback panel opens centred below the picked element's box (not at the click point) and flips above, beside or inside it when it would not fit; the element stays outlined while the panel is open. `useFeedback().anchor` is now the element's box `{x, y, width, height}`.

## To ui 0.59.0 and web 0.9.3 (from 0.58.x and 0.9.2)

No change needed. The feedback panel is now a popover next to the click that picked the element instead of a centred dialog, trimmed to a text box (placeholder "Send feedback") and the switches Include screenshot and Include DOM node; there is no title, Cancel or close button and no screenshot preview. `useFeedback` gains `anchor`, `includeElement` and `setIncludeElement`; with an older web the panel still works and opens near the top centre.

## To ui 0.58.0 (from 0.57.x)

New platform command in every app's Cmd+K (owner only): Switch to staging / Switch to production, which opens the same page in the other environment. The palette entrance is 50% faster (93ms instead of 140ms).

## To ui 0.57.2 (from 0.57.1)

The palette enters at scale 1.2 shrinking to 1 while fading in (see 0.57.1).

## To ui 0.57.1 (from 0.57.0)

The Cmd+K palette eases in (it was mounted already open, so it appeared at once): the panel starts at scale 1.2 and shrinks to 1 over 140ms while it fades in (scale 1.04 on a phone, where it fills the screen), and the backdrop fades in; reduced motion shows it at once.

## To ui 0.57.0 (from 0.56.x)

`Markdown` gains `onToggleTask`, `images` and wrapper props (requested by notes); no change needed.

## To ui 0.56.0 (from 0.55.x)

No change needed. New entry `@teb-ooo/ui/markdown` with `Markdown`; it needs the optional peers `react-markdown` and `remark-gfm`, which only an app using it installs.

## To ui 0.55.0 and web 0.9.1 (from 0.54.x and 0.9.0)

No change needed. New `useListTable` in `@teb-ooo/web` (server-driven lists on `DataTable`) and `DataTable` `pagination.hasNext` for cursor lists. See best-practices.md section 14.

## To ui 0.54.1 (from 0.54.0)

Story only: the broken-picture example uses an undecodable data URI, so the route makes no failing request.

## To ui 0.54.0 (from 0.53.x)

No change needed. New `ImagePreview` (a picture in the panel look with a max height, an optional Open full size link and no broken-image icon).

## To ui 0.53.1 (from 0.53.0)

Tests and docs only (0.53.0 was published with two tests still to update).

## To ui 0.53.0 and web 0.9.0 (from 0.52.x and 0.8.x): BREAKING, the assistant is removed

The platform's end-user assistant is gone (owner decision 2026-10-03), so its hooks are removed from the shared packages. **ui:** the built-in "Ask assistant..." command and its no-results fallback row, `ASK_ASSISTANT_ID`, and the `assistant` field of `readPlayground()` are removed; `window.__PLAYGROUND__.assistant` is ignored. An app that has its own assistant (an app with its own assistant) registers its own palette command with `useRegisterCommands` like any other. The no-results state is just "No results". **web:** the `AssistantEvents` type is removed and `setPlayground()` in `@teb-ooo/web/testing` no longer defaults `assistant: false`; `useEventStream` is unchanged and still supports POST streaming for any endpoint. ui 0.53.0 accepts web 0.7.5, 0.8.x and 0.9.x.

## To ui 0.52.2 (from 0.52.1)

Stories only: DataTable FitToRows and WrappedLines, a count in the FilterBar phone story, a sticky header in the Page document story.

## To ui 0.52.1 (from 0.52.0)

While text is selected the strip above the editor hides (the selection toolbar takes over), so the two never overlap on the first line.

## To ui 0.52.0 (from 0.51.x)

`RichTextEditor` shows a selection toolbar above selected text (Bold, Italic, Code, Link, draft). Visible; turn it off with `selectionToolbar={false}`. With text selected there are now two Link buttons (the strip and the selection toolbar).

## To ui 0.51.0 (from 0.50.x)

`RichTextEditor` gains a Link button and an inline address field (set, change and remove a link on the selected text, validated by `validateHref`). Visible: the toolbar has one more button.

## To ui 0.50.3 (from 0.50.2)

Visible: `RichTextEditor` reserves a strip (2rem) above the text for its toolbar by default so it no longer covers the row above; pass `toolbar="overlay"` for the old floating toolbar. Cmd or Ctrl+I in the editor is italic and no longer opens Send feedback.

## To ui 0.50.0 (from 0.49.x)

No change needed. New entry `@teb-ooo/ui/editor` with `RichTextEditor` (see components.md). It needs the engine's packages, which are optional peers: install them only in an app that uses the editor. Nothing else in the package loads them.

## To ui 0.49.0 (from 0.48.x)

Visible: a `bleed` `DataTable`'s text (header, rows, pagination, select-all row) is inset 24px from md instead of 16px, so it lines up with `PageHeader`/`Section`/`Container` text (the doc already said so; it was a bug). A long description in `PageHeader` or `Section` wraps beside the actions instead of pushing them under it. New `NotAllowed`. Docs: best-practices sections 2 and 13.

## To ui 0.48.0 (from 0.47.x)

No change needed. New: `DataTable fit` (as tall as its rows, shrinks to the space left, then scrolls), `PageBody gutter`, `sticky` on `PageHeader` and `Section`, `PageColumns` (two scroll surfaces side by side from lg). A bleed `DataTable`, `Section` and `PageHeader` carry `data-bleed`.

## To ui 0.47.1 (from 0.47.0)

Docs only: section 11 names `Page` and `PageBody` among the layout primitives.

## To ui 0.47.0 and web 0.8.3 (from 0.46.x and 0.8.2)

No change needed; additions from the second review round: `LinkButton render`, `PageHeader size="compact"`, `FilterBar collapsedEnd` (visible change: on a phone `end` now sits in the Filters sheet by default, and a bar with no filters shows no Filters button), `Field hideLabel`, `Column lines`, `EmptyState`, `Page`/`PageBody`, `Tabs fill`; `icon` accepts an element or a component on Button, LinkButton and Menu items. web: `ApiError.userMessage` now returns a 4xx `detail` when the server sent one (it used to replace every 403/404 with a stock sentence). See best-practices.md sections 3, 5, 7, 12.

## To ui 0.46.1 (from 0.46.0)

Accordion panels animate from and to zero height (the padding moved inside the panel, so it no longer leaves a 16px sliver at the end of the close).

## To ui 0.46.0 (from 0.45.x)

No code change; visible, quick and subtle motion across the library (140ms in, 100ms out, transform and opacity only; reduced motion keeps fades and drops movement): popups, menus, selects and tooltips grow a little from their anchor and drift 4px from the side they open on; dialogs settle in from 6px below; toasts rise and sink; the shell drawer slides in; accordion and collapsible panels open by height; the tabs underline slides; checkmarks pop; switches and checkboxes change colour smoothly; buttons, inputs and chips change colour in 100ms and a pressed button sits 1px lower; the feedback banner eases in. Tokens: `--motion-in`, `--motion-out`, `--ease-out`, `--ease-in`. A test that asserts an element is gone immediately after closing must wait for the 100ms exit (Base UI unmounts after the transition).

## To ui 0.45.0 (from 0.44.x)

No change needed. New: `Card` and `CardGrid` (tiles in a responsive grid, arrow-key navigation), `PageHeader` and `Section` (page bands with full-width rules), `ToggleGroup required` (a view switch that cannot be cleared). `best-practices.md` section 11 states the page layout rule: lines are full width, content is inset by the gutter.

## To ui 0.44.4 (from 0.44.3)

No change needed. A palette result's accessible name is now "title, hint" (it was the title and hint spans run together). New `runCommandSource(source, query)` for testing a command source. `cmdk.md` has a new section on testing the palette.

## To ui 0.44.3 (from 0.44.2)

Docs only: `best-practices.md` gains a section on a filter row above a split pane and one on colour in a list view.

## To ui 0.44.2 (from 0.44.1)

New `FrequencyInput knobSide`, `Button`/`LinkButton` `tipSide`. Visible change: a FrequencyInput knob drag now snaps the change relative to the start value (it snapped the absolute value to 0.05), so a value such as 9905.27 moves in clean steps and keeps its offset. The page cursor is `ew-resize` during the drag.

## To ui 0.44.1 (from 0.44.0)

The Send feedback hotkey is Cmd or Ctrl+I again (it was Cmd or Ctrl+; from 0.38.2). Nothing to change in an app. Some browsers bind Cmd+I (Page Info in Firefox); the hotkey takes it over while the app has focus. In a rich-text editor Cmd+I is italic: an editor that wants it must stop the keydown before it reaches the document.

## To ui 0.44.0 (from 0.43.x): BREAKING for Chip priority

`Chip priority={0..4}` and the `--color-p0..p4` tokens from 0.42.0 are removed: priority is one app's idea and does not belong in the design system. Use `Chip color="red"` (any of the 17 palette hues, `CHIP_COLORS`) and map your own levels to hues in your code, for example `const hue = ["red", "orange", "yellow", "sky", "teal"][priority]`. `color` is for categories an app names; `tone` still carries state.

## To ui 0.43.0 (from 0.42.x)

Visible change, no code needed: loading skeletons, the "Loading" line, a loading Button's spinner and the palette's "Searching..." line now stay invisible for 100ms and then fade in, so a fast response no longer flashes them. New `Delayed` wrapper for your own loading UI (see components.md). The delay is `--loading-delay`; set it in your CSS to change it. A test that looks for a skeleton immediately must wait 100ms or check the element's presence, which is unchanged.

## To ui 0.42.0 (from 0.41.x)

No change needed. New `Chip priority={0..4}` and a priority colour scale (`--color-p0` to `--color-p4` with `-soft` and `-line`, ramps `--color-p0-50` to `-950`, repointable like any state ramp). Use it for a five-level priority; colour for labels and categories is still not offered.

## To ui 0.41.0 (from 0.40.x)

- **SplitPane (visible change):** until the person moves the divider the list now grows with the screen, from `defaultSize` up to 38% of the pane and never beyond `maxSize` (it was a fixed `defaultSize`). At 1280 nothing changes; at 1920 the list is wider and the detail area less empty. A `persistKey` width, once saved, stays fixed as before; a double-click on the divider returns to the responsive width. To keep the old fixed width set `maxSize` equal to `defaultSize`.
- New **NotFound** component (page and pane variants) for the router's not-found page and for an unknown item in a detail area.
- New guide: `docs/best-practices.md`.

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
