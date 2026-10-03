# Components and theme

All components are named exports of `@teb-ooo/ui`, each with an exported `*Props` interface. Every component accepts `className` (layout utilities only) and the attributes of the element it renders. Components consume the shared classes in `theme.css` (`.btn`, `.chip`, `.input`, `.panel`, ...) and the semantic tokens; none sets a font size or names a palette value.


**Finding a component without a browser.** The gallery's public MCP server (`https://ui.teb.ooo/mcp`, tools `mcp__design-system__search-entries`, `get-entry`, `list-entries`, `list-tokens`, `get-color-ramp`) answers by name, by other names (aliases) and with typos; use it before you ask the `ui` agent for a component or pick a colour. Loading the tools and the typical calls are in the shared brain's `docs/design-system.md`, section "Where to look".
## Button
The only button. Extends Base UI `Button` props.
- `intent?: "default" | "solid" | "danger" | "warning"` (default `"default"`): outlined, primary, and two tinted intents.
- `icon?: ReactNode`: shown before the children. With no children the button is a square icon button.
- `active?: boolean`: toggled-on look, sets `aria-pressed`.
- `tip?: ReactNode`: tooltip; for an icon-only button a string tip is also the accessible name.
- `dashed?: boolean`: the dashed add affordance.
- `loading?: boolean`: spinner, `aria-busy`, activation blocked, stays focusable.
- `disabled`, `onClick`, `type` (default `"button"`), ref to the `<button>`.

## LinkButton
The look of `Button` for anchors: `intent`, `icon`, `active` (`aria-current="page"`), `tip`, plus anchor attributes.

## Input
Text input on Base UI `Input`; ref to the `<input>`. Inside a `Field` it takes id, description and invalid state from the field.

## Field
Label, control, description and error, wired for assistive tech (label association, `aria-describedby`, `aria-invalid`, error in `role="alert"`).
- `label: ReactNode` (required), `error?: ReactNode` (sets invalid), `description?: ReactNode`, `children`: the control.

## className on components
Every component takes `className` for layout utilities only (width, margin, flex). It is appended to the component's own classes, not merged: `cn` joins strings and the package has no class-merging library, so when your class sets the same property as the component's own (a width on `Select`, `Combobox` or `SearchInput`, whose default is `w-56`, `w-72` or `min-w-48`), both apply and the stylesheet order decides. Override with Tailwind's important suffix: `className="w-32!"`. A property the component does not set (margin, `flex-none`) needs no suffix.

## NumberField
A number typed or stepped (0.31.0): `label`, `value: number | null`, `onValueChange`, `onValueCommit?` (Enter, leaving the box, or letting go of a stepper), `min?`, `max?`, `step` (1), `largeStep` (Shift+arrow, default ten steps), `smallStep` (Alt+arrow, a tenth), `unit?` (text inside the box, such as `kHz`), `format?` (`Intl.NumberFormat` options), `steppers` (minus and plus buttons, default true: the way to step on a phone), `description?`, `error?`, `disabled?`, `readOnly?`. ArrowUp/ArrowDown step, Home/End jump to the limits, typing is parsed in the person's locale, digits are tabular.

## Popover (one anchored panel, three modes)
Popovers, hover cards and tips are inverted (0.60.0): white on a dark page, black on a light one, no border; `panel-inverse` in theme.css flips the tokens inside them. They draw an arrow (0.62.0) toward the trigger, kept pointing at its middle and on the right edge when the panel flips or shifts to fit.
`Popover` (0.33.0) is the one anchored-panel component. `trigger` is the element that opens it (a `Button`, `LinkButton`, any focusable element); `side?`, `align?`, `className?` (the width, 18rem by default) apply to all modes. The mode is `openOn` plus what it holds, and the types stop combinations that cannot work:

- `openOn="click"` (default): a popover for details that need interaction. `title` (the panel's accessible name), `showTitle?`, `children`, `open?`/`defaultOpen?`/`onOpenChange?`, `modal?` (false: the page stays usable; Escape or an outside press closes), `showClose?`, `closeLabel?`. Focus goes in and returns to the trigger.
- `openOn="hover"` with `children` and `title`: a hover card. It opens when the pointer rests (`delay`, 300 ms), stays while the pointer is on it (`closeDelay`, 150 ms), and also opens on click or Enter so the keyboard and a touch screen reach it. No close button.
- `openOn="hover"` with `tip`: a tooltip: one line, shown on hover and keyboard focus (`delay`, 400 ms), role `tooltip`, described to the trigger while open, never interactive, no children.

`Tooltip` is the tip mode under its own name (`tip`, `children`, `side?`, `delay?`) and is what `tip` on `Button` and `LinkButton` uses. Use a menu for a list of actions and `Dialog` for something that needs an answer.

## Menu
A list of actions anchored to a trigger (0.34.0): `trigger` (a `Button` or any element; its name is the menu's name), `items`, `side?` (bottom), `align?` (start), `className?`. Items: an action `{id, label, onSelect, icon?, danger?, shortcut?, disabled?}`, an on/off row `{type: "checkbox", id, label, checked, onCheckedChange}` (stays open when flipped), `{type: "separator", id}` and `{type: "heading", id, label}`. Arrow keys move, Enter or Space chooses, a letter jumps to a row, Escape closes and focus returns to the trigger; rows are 44px tall on a phone. Use `Popover` for details and `Select` to choose a value.

## Tabs
A row of tabs and one panel at a time (0.34.0): `tabs: {value, label, panel, badge?, disabled?}[]`, `value`, `onValueChange`, `label` (the list's accessible name), `activation?` (`automatic`: arrows show the panel at once; `manual`: Enter or Space), `keepMounted?` (keep hidden panels' state), `className?`. Left/Right/Home/End move; a disabled tab can be reached but not chosen; the row scrolls sideways on a narrow screen. Use `ToggleGroup` to filter, not to switch panels.

## Accordion, Collapsible
Sections you open and close (0.34.0): `Accordion` takes `items: {value, title, content, trailing?, disabled?}[]`, `multiple?` (true), `value?`/`defaultValue?`/`onValueChange?` (arrays of open `value`s). `trailing` is a control at the end of the header, beside the toggle button and not inside it (a `Switch` that enables the section, a count): it works while the section is closed. Enter or Space toggles, Up and Down move between headers. `Collapsible` is one section: `title`, `children`, `open?`/`defaultOpen?`/`onOpenChange?`, `trailing?`.

## Meter
A read-only measurement against a scale (0.34.0): `label`, `value`, `min?` (0), `max?` (100), `zones?: {from, tone: "ok" | "warning" | "danger"}[]` (the bar takes the tone of the last zone at or below the value: colour is state; none means neutral), `format?`, `showValue?` (true), `orientation?` (`vertical` fills from the bottom: give it a height), `className?`. `role="meter"` with value, minimum, maximum and spoken text. Not a progress bar and not an input (use `Slider`).

## Sheet
A panel that holds controls without leaving the page (0.35.0): on a phone a bottom sheet (up to 85% of the height) with a drag handle (drag it down 96px to close), from the lg breakpoint a full-height side panel (`side?: "left" | "right"`, right by default; 24rem wide, `className` such as `lg:w-[28rem]` changes it). `title`, `description?`, `children`, `footer?`, `trigger?` or `open`/`defaultOpen`/`onOpenChange`, `closeLabel?`. `modal` (true) dims and blocks the page and traps focus; `modal={false}` has no backdrop and leaves the page usable beside it (a control panel next to a live view); a non-modal sheet closes on Escape or its close button, not on a click outside. Focus returns to the trigger. Use `Dialog` for a short question and `Popover` for details anchored to a control.

## FrequencyInput
The hero control of a tuner (0.36.0): `value` (kHz), `onValueChange` (live: every knob move, each arrow key, a typed value when set), `onValueCommit?` (finished: a typed value set, a knob drag ended, an arrow key), `min?` (0.01), `max?` (30000), `label?`, `optimistic?` (half opacity: a change waits for confirmation), `dimmed?` (35% and inert), `disabled?` (inert at half opacity), `playbackMode?` (warning colour while rewinding), `step?` (1 kHz), `fineStep?` (0.01), `submitLabel?`, `knobTip?`. The readout is the display type size, kHz with two decimals zero-padded (`00740.00`, `formatKhz`), a spin button: arrow keys step it (Shift fine, PageUp/PageDown ten steps), Enter or Space or a click opens the masked editor (`00000.00`, everything selected; the first digit clears it to blanks and digits fill from the left skipping the point, five before it and then the decimals, so `7 0 7 4` is 7074.00; non-digits are ignored; Backspace blanks the slot before the caret; a **Set frequency** button, disabled when the value is outside the range; Enter sets a valid value and just closes for an invalid one, Escape or a press outside cancels). The round 32px knob is dragged sideways with a mouse or a finger: 0.5 kHz per pixel snapped to 0.05, with Shift 0.003 kHz per pixel snapped to 0.01, clamped, turning 2 degrees per pixel; it is also a slider for the keyboard.

## Dialog
`inverted` (0.61.0): the inverted, borderless surface of `Popover`. The Cmd+K palette uses it.
Modal on Base UI `Dialog`: focus moves in, Escape closes, focus returns to the trigger.
- `title: ReactNode` (required; the accessible name), `description?`, `footer?`, `children?`
- `trigger?: ReactElement` (usually a `Button`), or control it with `open` / `onOpenChange(open, details)`; `defaultOpen`.
- `placement?: "center" | "top" | "right"` (default `"center"`): `center` is a small centred panel (`max-w-md`); `top` is a wider panel (`max-w-lg`) at 15vh from the top, the shape of a command palette; `right` is a full-height drawer docked to the right edge (`max-w-xl`, full width on a phone) that slides in (`anim-slide-right`), for a history, an inspector or any side panel. All use a `bg-black/50` backdrop and the `anim-backdrop` and `anim-fade` transitions.
- `bare?: boolean`: no padding, header or close control; children fill the panel edge to edge and the title is announced but not drawn. A palette renders its own input and list inside a bare, top-placed dialog.
- `initialFocus?: boolean | RefObject<HTMLElement | null>`: what to focus on open (`false` leaves focus alone).
- `closeLabel?: string` (default `"Close"`), `className` (layout classes for the panel).

What a command palette needs, without reaching into internals: `<Dialog open onOpenChange placement="top" bare initialFocus={inputRef} title="Command palette">...</Dialog>`, `Kbd` for shortcut hints, and the shared classes `.panel`, `.input`, `.btn`, `.chip`.

## FieldGrid, FieldRow
A record's fields as rows (a `dl`): label rail on the left (8rem, right-aligned), value on the right; stacked on a phone. `FieldGrid` takes `label` (accessible name). `FieldRow` takes `label`, `children`, `draft?` (muted value), `actions?` (shown on row hover and focus, always on touch).

## SuggestionList, handleSuggestionKey
A listbox at the text caret for a rich-text editor's suggestions (`[[` mentions, `@`, `/`). The editor owns open, items and active index, because the keys arrive at the editor; the list draws and positions (Base UI Popover, focus is never taken). Props: `open`, `items: {id, label, hint?}[]`, `activeIndex`, `onActiveIndexChange?` (hover), `onSelect(item)`, `onClose?`, `anchor` (a function returning the caret `DOMRect`, or an element), `label`, `id?` (options are `${id}-option-${i}`: put it in the editor's `aria-controls` and `aria-activedescendant`), `emptyLabel?`. `handleSuggestionKey(event, {count, activeIndex, onActiveIndexChange, onSelect, onClose})` returns whether it used the key: Up/Down wrap, Enter/Tab choose, Escape closes.

## Diff, diffWords
Word-level difference: `<Diff before after />` or `<Diff tokens />` (`{kind: "same" | "add" | "del", text}[]`, an app's own algorithm). `layout?: "inline" | "split"` (split is before and after side by side, stacked on a phone), `beforeLabel?`, `afterLabel?`. Additions are on the ok ground and underlined, removals on the danger ground and struck through, with screen-reader text, so colour is never the only signal. `diffWords(a, b)` is exported.

## Graph
An ego network (`nodes`, `edges`, `centerId`). Colour is state only, so a node's type is its shape (by sorted kind), an optional Lucide icon from `kinds[kind].icon`, and a legend entry; a draft node or edge is dashed and faint; the centre is larger with an ink outline. The layout is concentric rings (0.26.4; `layoutRings`, `hopsFrom` are exported, `layoutGraph` returns its nodes): hop 1 evenly spaced, hop 2 ordered by its hop-1 neighbours' angle, ellipses that use the width, the height grows with the node count, names are cut to the room on their ring and kept inside the box, a relation label that cannot be placed clear is left out. It is laid out at the real pixel width so labels keep their size on a phone. Depth control (1 to `maxDepth` hops; `depth` / `onDepthChange` to control it), a Graph/List switch (the list gives every node, its hops and relations as text), nodes are focusable (Enter or Space chooses; `onNodeSelect`, and `nodeHref` for real links). `label` names it for assistive tech.

## Toast
`useToast()` returns `{ show({ title, description?, tone?, timeout? }), dismiss(id?) }`; `tone` is `default`, `ok`, `warn` or `danger` (colour is state). Toasts form a 3D stack (0.63.0) at the bottom right (full width on a phone), above dialogs: the newest in front, older ones peeking out behind it, smaller and faded (at most four; a fifth waits invisibly). Hovering or focusing the stack fans it out to full size and pauses every timer, so a message is never lost while you read it. A toast leaves by sliding off to the right, whether it timed out (five seconds, eight for `danger`, `timeout: 0` keeps it), was dismissed with its button (on the front toast, or on any toast once the stack is open), or was swiped right on a touch screen. Announced politely (a `danger` one urgently). Built on Base UI Toast, no extra dependency. The `Shell` mounts the `ToastProvider`, so an app only calls `useToast()`; it throws outside one. `ToastProvider` is exported for stories and tests.

## Tooltip
The tip mode of `Popover`: the one tooltip mechanism (never a `title` attribute). `<Tooltip tip="Save"><Button>...</Button></Tooltip>`; `side?: "top" | "bottom" | "left" | "right"`, `delay?: number` (ms, default 400). `Button` and `LinkButton` take a `tip` prop that uses it.

## Chip
A static token: status, count or reference. `tone?: "default" | "ok" | "warn" | "muted" | "danger" | "link" | "agent"`. `color?: ChipColor` (0.44.0) draws an app-chosen swatch: one of the 17 palette hues (`CHIP_COLORS`: red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose) with a soft background, line and ink that read well in light and dark. Use it for categories the app names (labels, projects, a priority level the app maps to hues); `tone` is for state. The app decides what a colour means.

Actions (0.22.0): `onRemove` (+ `removeLabel`) adds an X; `locked` with `onLockedChange` (+ `lockLabel`, `unlockLabel`) adds a padlock toggle whose accessible name is the action it performs (a draft to canon promotion, for example). Both are real buttons inside the chip.

**Badge was removed in 0.21.0.** It was only a Chip with fewer tones. Use `Chip`: change `import { Badge }` to `import { Chip }`, `<Badge>` to `<Chip>`, and the tone `accent` to `link` (`default` and `danger` keep their names). Searching "badge" in the gallery finds Chip.

## Kbd
Keyboard shortcut hint. `shortcut` (`mod+k`, `g i`) or free-text children. `mod` is the Command key on Apple platforms and Ctrl elsewhere. Each key is a square keycap (1.5rem each way for a single character, wider for words such as Ctrl, with the glyph centred) and it reacts, subtly, to its own real key being pressed: it darkens a touch and sits a pixel lower (`data-pressed`). One shared set of window listeners serves every keycap on the page; keys let go on window blur, and with Command held a letter lets go by itself.

## Avatar
Square, image with fallback initials. `name` (required), `src?`, `size?: "sm" | "md" | "lg"` (1.5rem, the control height, 3rem). `initialsOf(name)` is exported.

## Textarea
Multi-line text input; like `Input` it takes id, description and invalid state from a `Field`. `rows?: number` (default 3); resizes vertically only; native textarea attributes; ref to the `<textarea>`.

## Checkbox
Base UI Checkbox: `checked`, `defaultChecked`, `onCheckedChange(checked)`, `indeterminate`, `disabled`, `name`. Give it an `aria-label` or wrap it in a `<label>`.

## Switch
An on/off preference that applies immediately (`role="switch"`, `aria-checked`). `label` (visible text and accessible name), `description?`, `checked`/`defaultChecked`, `onCheckedChange(checked)`, `disabled`, `name`. Use `Checkbox` for choices that wait for a submit.

## FilePicker
A button that opens the file chooser. `onFiles(files: File[])` (the chooser resets afterwards, so the same file can be chosen twice), `accept?`, `multiple?`, `children` (the label), `icon?`, `intent?`, `loading?`, `disabled?`. A ref exposes `open()` so a Cmd+K command can open the chooser.

## LiveIndicator
A single dot for whether a screen gets live updates, placed in the app header right next to the "staging" label. It is only a dot: never a chip, never visible text. `status: "live" | "reconnecting" | "degraded" | "off"` (what `useLive()` from `@teb-ooo/web` reports). `tip` adds a tooltip (`true` for the status name, or your text). It has `role="status"` and an accessible label; degraded is an amber ring, reconnecting pulses (unless the user prefers reduced motion).

## FeedbackPanel
(Inverted like `Popover`: see `panel-inverse`, 0.60.0.)
The feedback panel, driven by `useFeedback()` from `@teb-ooo/web`: `feedback` (its return value). It is a popover (0.59.0) next to the click that picked an element (`feedback.anchor`, `useFeedback` 0.9.3), or near the top centre when no element was picked. It opens into picking an element first (a banner says "Click the element this is about, Esc to skip", since a hotkey gives no other sign; click the element, then the text has the cursor; Escape skips the pick). It is bespoke: a full-bleed text box with the placeholder "Send feedback" (Enter sends, Shift+Enter adds a line) above a footer, divided from it by a full-width line, holding the icon toggles for the screenshot (a camera; it becomes a spinner in place while the picture is taken, so nothing shifts) and the DOM node inline (the node only when an element was picked, on by default) and the Send button; neither the screenshot nor the node is previewed. There is no title, Cancel or close button: Escape or a press outside closes it. A sent message is confirmed with a toast (`Feedback sent, tracked as <bead>`, and whether the agent was reached); without a toast host (outside the `Shell`) the panel shows the confirmation itself. It renders nothing unless `feedback.available` (the superadmin or the app's owner). The `Shell` renders it and registers "Send feedback" (bar icon and Cmd+K, the owner only). Its nodes carry `data-feedback-ignore` so the screenshot and the element picker leave them out. The `FeedbackController` type describes what it needs (`anchor`, `includeElement` and `setIncludeElement` are optional), so this package does not depend on `@teb-ooo/web`.

## Container
Centres page content with the page gutter. `width?: "narrow" | "default" | "wide" | "full"` (40rem, 64rem, 90rem, none; default `"default"`).

## SplitPane
List and detail. Side by side from the `lg` breakpoint; below it the list fills the screen and an open detail is a full-screen sheet.
- `list`, `detail`: ReactNodes; `detailOpen: boolean`, `onDetailClose()`; `detailLabel: string` (accessible name); `placeholder?` (wide, while nothing is open).
- `resizable?` (drag the divider, or arrow keys/Home/End on it), `defaultSize?` (the list width in rem at narrow desktop widths, 28; until the divider is moved the list grows with the screen to 38% of the pane, never beyond `maxSize`, so a wide screen is not mostly an empty detail area), `minSize?` (16), `maxSize?` (48), `onSizeChange?(rem)`, `persistKey?` (saves the list width in `localStorage`, restores it within min/max, a double-click on the divider resets it to `defaultSize`), `closeLabel?`.
- The resizable divider looks like the fixed pane's 1px rule at rest. Its grab area is 12px wide, and on hover, focus and drag the rule grows to 3px over its neighbours without taking layout space (0.26.3).
- Fill the height its parent gives it.

## DataTable
Dense keyboard-driven table for many rows. The props table in the gallery is generated from the types.
- `columns: Column<T>[]` (`id`, `header`, `cell(row)`, `sortable?`, `width?`, `align?`, `hideBelow?: "sm" | "md" | "lg"` (hidden while the table itself is narrower than 24, 36 or 48rem, so a narrow pane drops columns by itself; the Columns menu says how many are hidden), `hideable?`), `rows`, `rowKey(row)`, `label`.
- Sorting is controlled: `sort`, `onSortChange`; the app sorts. `columnVisibility` + `onColumnVisibilityChange` add a Columns menu (an icon button at the end of the header row); `persistKey` (a string) saves the column configuration in `localStorage` (key `teb-ui:data-table:<persistKey>`) and restores it on the next visit, and also adds the menu. A controlled `columnVisibility` wins over the saved one.
- `activeKey` (matched by key, so it survives re-sorts) + `onActiveKeyChange`; `onRowClick` (click, or Enter on the active row); `selectedKeys` + `onSelectedKeysChange` add a checkbox column.
- `loading`, `empty`, `error` (+ `onRetry`, `retryLabel` add a Retry button under the message); `hasMore` + `onLoadMore` for cursor paging (called when the end is within 400px of view).
- `resizable` (and `resizable: false` on a column to opt out): drag the right edge of a header to resize it, or focus the handle and press Left/Right (Home or a double-click resets); minimum 4rem; `fr` widths become pixels on the first drag; widths are saved with `persistKey` (separate from the column choice) else kept in the table. `columnMenu: false` hides the Columns menu while `persistKey` still saves.
- `pagination` `{ page (from 0), pageSize, total, totalIsLowerBound?, onPageChange, pageSizes?, onPageSizeChange? }`: a footer under the table says "1-100 of 3455" (the server's total; "500+" for a lower bound) with Previous and Next icon buttons and an optional rows-per-page select; the table shows only the rows given (one page), `onLoadMore` is not used, Alt+PageUp/Alt+PageDown change page, a new page starts at the top. Works with `bleed` (footer inset like the cells) and cards.
- Range selection (with `selectedKeys`): Shift+click a checkbox selects the rows from the last toggled one to it, taking that row's state (an unchecked anchor removes the range); Ctrl/Cmd+click and plain clicks toggle one; Shift+Space does the same from the active row; Shift+Up/Down extend the selection from the anchor and shrink it back; shift+mousedown does not select text. The header checkbox selects or clears only this page's rows (indeterminate when some are selected). Selection is by `rowKey`, so it survives rows being replaced; a page change clears nothing.
- `bleed`: edge to edge, no outer border, radius or background; header rule and row dividers run the full width.
- `renderCard` + `cardsBelow` (default `"md"`): below the breakpoint a list of cards replaces the table (cards are not windowed). With `selectedKeys` each card has a checkbox and the list starts with a select-all row, so bulk actions work on a phone.
- Rows are one control-height line and are windowed past 100 rows. Keys: Up, Down, PageUp, PageDown, Home, End move the active row; Enter opens; Space toggles selection. Give it a parent with a height.

## FilterBar, SearchInput, ToggleGroup, Select, Combobox, ViewMenu
The filter row. `Option` is `{ value: string; label: string; count?: number }`; values are strings.
- `FilterBar`: a wrapping flex row; `end?: ReactNode` sits at the right (a count, a `ViewMenu`). `primary?: ReactNode` (the SearchInput and the main action) keeps the bar to one row on a phone: below `sm` the `children` open in a bottom sheet behind a "Filters" button (`filtersLabel?`, `activeCount?` shows how many are set).
- `SearchInput`: `value`, `onValueChange`, `label?` ("Search"), `clearLabel?`; clear button when non-empty, Escape clears; ref to the input.
- `ToggleGroup`: `options`, `label`, `value` and `onValueChange` (`string | null`, or `string[]` with `multiple`).
- `Select` and single `Combobox` share one field look (border, background, height, one chevron); Combobox adds typing and a clear button once it has a value.
- `Select`: `options`, `value` (`string | null`), `onValueChange`, `label`, `placeholder?`, `disabled?`.
- `Combobox`: searchable; `options`, `label`, `placeholder?`, `emptyLabel?`, `value`/`onValueChange` as `Select`, or `multiple` with `string[]` and chips.
- `ViewMenu`: `views: {id, name}[]`, `activeId`, `onSelect(id | null)`, `onSave?(name)`, `onDelete?(id)`, `defaultLabel?`. The app stores the views.

## Sidebar and Shell
- `Sidebar`: `items: {id, label, href, icon?, active?, badge?, group?}[]` (0.26.4: an item under a group heading with no icon is indented 12px, half of what it was, and no empty icon slot is drawn), `header?`, `footer?`, `collapsed?` + `onCollapsedChange?` (icons only, with tooltips; shows the toggle), `label?`, and `renderLink?(item, content, props)` to draw links with the app's router (put `props` on the element, `content` inside it).
- `Shell` (0.23.0, closed): `sidebar?` (0.24.0: leave it out for an app with no sidebar: no column, no menu icon, no drawer, the page takes the full width), `children`, and the labels `menuLabel?`, `drawerLabel?`, `closeLabel?`. It draws the platform's top bar itself and has **no `header` prop, no slot and nothing an app can add to the bar**. From `md` the sidebar is a left column; below it the bar's menu icon opens the sidebar as a drawer (always expanded, closes on navigation). The shell registers the platform commands in Cmd+K (`usePlatformCommands`, group "Platform"), owns the feedback panel (`useFeedback` and `FeedbackPanel` from the app are gone) and reads the person, live status and platform links from `@teb-ooo/web`. Mount it once at the root, inside `CommandProvider`, the router and the query client.
- `PlatformBar`: the bar itself, for the gallery only; an app never renders it. 36px (2.25rem) tall, one line at every width. The only text is the app's name (`playground.appName`, drawn in capitals); the live dot (`LiveIndicator`, on the left right after the name, only when live updates are reconnecting or degraded: connected, off and an app with no live stream draw nothing), the environment mark (a 48 by 8 px bar in the agent colour (purple) right after the name, shown off production; it has no text, an accessible name and a tooltip), the Cmd+K search icon, the agent icon (opens `playground.claudeSessionUrl` in a new tab; only when the app has a session) with a status dot and, on click, a popover (0.32.0) showing the agent's status, its current action (a label and a safe target from the platform), a ticking turn timer and a link to the session (`agentDetails`, `onAgentOpenChange`); the dot (0.29.0, from `useAgentStatus()` in `@teb-ooo/web` 0.7.4: working pulses in the agent colour, idle is quiet, offline is a warning ring, signed out is red; shown to the owner only, and no dot when the platform route `/_playground/agent` is missing), Send feedback (owner only: same rule as the command) and the person menu (My profile, Sign out; Sign in when signed out) are icons with an accessible name and a tooltip. On a phone the menu icon that opens the sidebar drawer joins them. Icon order, left to right (0.37.0): agent, search, Send feedback, person. Send feedback has its own hotkey, Cmd or Ctrl+I (no Shift like Cmd+K; some browsers bind it, for example Page Info in Firefox, and the hotkey takes it over while the app has focus; it is also italic in a rich-text editor, so an editor that wants Cmd+I must stop the event; owner only; Cmd or Ctrl+; from 0.38.2 to 0.44.0), shown on its tooltip and in the palette; the search icon's tooltip shows Cmd or Ctrl+K. Props are data, never slots: `appName`, `env?`, `live`, `user?`, `profileHref?`, `signOutHref`, `signInHref`, `onOpenPalette`, `paletteOpen?`, `agentHref?`, `agentStatus?`, `onFeedback?`, `onOpenMenu?`, `menuLabel?`.

**Upgrading an app to 0.23 (breaking; the platform shell contract, docs/shell.md).** Needs `@teb-ooo/web` 0.7.0 (a peer dependency now). In `__root.tsx`: (1) delete the `AppHeader` and the `header` prop of `Shell`; (2) delete every control the header held (the staging chip, `CommandTrigger`, sign in/out, the Claude link, the assistant link: the person menu and palette cover them; app-specific links belong in the sidebar, the page or a Cmd+K command); (3) delete `useFeedback()`, `useFeedbackCommand()` and `<FeedbackPanel />`: the shell does them; (4) keep `CommandProvider` around `Shell`; (5) `useLive` stays where it is, the dot follows it by itself; (6) drop `signOutPath` from `CommandProvider` if set.

## Command palette
`@teb-ooo/ui/cmdk` (a subpath export, part of this package since 0.6.0; formerly `@teb-ooo/cmdk`): `CommandProvider`, `CommandTrigger`, `useRegisterCommands`, `useCommandPalette`, `fuzzyMatch`. Needs `@tanstack/react-router` (an optional peer of the package, required only for this subpath). Full guide: [cmdk.md](cmdk.md).

## Hooks
`useMinWidth("sm" | "md" | "lg")` and `useMediaQuery(query)`; `BREAKPOINTS` holds the widths (40rem, 48rem, 64rem).

## Theme
Import once: `@import "@teb-ooo/ui/theme.css";`.
- **Themes.** Dark is the default; light follows `prefers-color-scheme: light`. Tokens live under `:root`, are redefined inside the media query, and are also reachable through `[data-theme="dark"]` and `[data-theme="light"]`, which exist only so a gallery can force a theme. Apps never set `data-theme`, never store a theme preference and ship no theme script or toggle. Components never branch on the theme (no `dark:` variants).
- **Colour tokens** (utilities like `bg-surface`, `text-ink-muted`, `border-line`): `ground` (exactly #000000 dark, #FFFFFF light), `surface`, `surface-raised`, `line`, `line-strong`, `ink`, `ink-muted`, `ink-faint`, and the state colours `danger`, `warning`, `ok`, `link`, `agent`, each with `-hover`, `-soft` and `-line`. Neutrals are zero-chroma grays. Colour is state only. Every colour is a role token that points, through a semantic ramp (`--color-danger-50` to `-950`), at a direct palette colour (every Tailwind hue 50 to 950 in OKLCH, one pure `neutral` gray); an app repoints a ramp to change what a role means. Full guide: [colors.md](colors.md).
- **Type.** Exactly two sizes: body 14px on a 1.6 line, set on `body`; display 32px on a 1.3 line, only through `.display-lg`, for page titles and empty-state headlines. Titles are not bold: there is one weight, and a title differs by size alone. One typeface: components never set a size, a weight or a family; hierarchy inside body size is colour. Geist Mono is `--font-sans` and `--font-mono`, including controls, `code`, `kbd` and `pre`.
- **Shape.** One control height `--control-h` (1.75rem) and one radius `--radius` (0.25rem, the plain `rounded` utility).
- **Shared classes** (components layer): `.btn`, `.btn-solid`, `.btn-danger`, `.btn-warning`, `.btn-icon`, `.btn-add`, `.chip` with `.chip-ok`, `.chip-warn`, `.chip-muted`, `.chip-danger`, `.chip-link`, `.chip-agent`, `.input`, `.panel`, and the popup transitions `anim-fade`, `anim-slide-right`, `anim-backdrop`.
- **Font.** Geist Mono (variable woff2, OFL) is in `fonts/` with its license. There is no second typeface.
- **Design test.** `test/design.test.ts` is the rule set (sizes, radius, weights, palette and literal colours, theme control, raw buttons, title attributes, product names). Copy it unchanged to an app's `web/test/`.

## Prose
Wrap rendered rich text (a markdown render, an editor's content) in `<Prose>` and its elements are styled: `p`, `h1`-`h6`, `ul`/`ol`, `blockquote`, `pre`/`code`, `hr`, `a`, `table`, `img`, task-list checkboxes. One type size and no heavier weight: h1 is uppercase with a rule under it, h2 has a dotted rule, h3 is a muted uppercase label, h4 is italic, h5/h6 are muted; `strong` and `em` are the browser's bold and italic. The Prose story is the type scale demo; the styles live under `.prose` in theme.css, so iterate there. It does not parse markdown: pass it HTML elements.

## NotFound
The page or pane for something that is not there: `title` ("Nothing here"), `description`, `action` (a `LinkButton` back), `variant` "page" (display-size heading in a narrow column) or "pane" (an unknown item in a detail area). Give it to the router: `createRouter({ defaultNotFoundComponent: () => <NotFound action={<LinkButton href="/">Back to the start</LinkButton>} /> })`.

## Delayed loading feedback
Loading UI waits 100ms before it appears and then fades in over 150ms (`.anim-delayed`, the delay is `--loading-delay`), so a response that arrives at once shows nothing instead of a skeleton that flashes. The package does this itself for DataTable skeleton rows and its "Loading" line, the spinner of a `Button loading` (the button is still disabled at once) and the palette's "Searching..." line. For an app's own loading line, skeleton or spinner, wrap it in `<Delayed>`; failures and empty states are not delayed.

## Parity options (0.44.2)
- `FrequencyInput knobSide="start"` puts the tuning knob before the number (default `"end"`, after the unit). A knob drag snaps the change, not the absolute value (from 9905.27 one pixel is +0.50, two are +1.00), and the page cursor stays `ew-resize` for the whole drag.
- `Button` and `LinkButton` take `tipSide` (`top` default, `bottom`, `left`, `right`) for where the tip opens.

## Card, CardGrid
(0.45.0) A tile for one thing. `Card`: `title`, `description?` (two lines), `meta?` (chips and status in a wrapping row), `footer?` (a quiet line under a rule), `marker?` (top right, for a "Needs you" chip), `href?` (the whole card is a link) or `onClick?` (the whole card is a button), `active?`, `aria-label?`. The card is the one interactive element, so it holds text, chips and status only, never another control. `CardGrid`: `label` (names the list), `minCardWidth?` (rem, 18); as many columns as fit, one on a phone; Tab reaches every card and the arrow keys move between them (Home/End jump). A table/cards switch is a `ToggleGroup` with `required` and the same rows rendered two ways (see the Card story). On a phone `DataTable`'s own `renderCard` is still the way to show a table's rows as cards inside the table.

## Section, PageHeader
(0.45.0) Page bands. `PageHeader`: `title` (display size), `description?`, `actions?`, `width?`, children; a full-width rule under it. `Section`: `title?`, `description?`, `actions?`, `rule?` ("bottom" default, "top", "both", "none"), `width?`, children. The rule is edge to edge; the content is inset by the page gutter (`Container`, 16px, 24px from md). See best-practices.md, "Page layout: rules run to the edges".

## Motion
(0.46.0) Quick and subtle: things arrive in `--motion-in` (140ms) and leave in `--motion-out` (100ms) with `--ease-out`/`--ease-in`; only transform and opacity move. Popups and menus grow a little from their anchor (`--transform-origin`) and drift 4px from the side they open on; dialogs settle in from 6px below; toasts rise 12px; drawers and sheets slide; accordion and collapsible panels open by height; the tabs underline slides to the active tab; a checkmark pops; controls change colour in 100ms and a pressed button sits 1px lower. `prefers-reduced-motion` keeps the fades and removes the movement. Classes for your own Base UI popups: `anim-fade` (popup), `anim-toast`, `anim-slide-left`/`anim-slide-right`, `anim-collapse` (height), `anim-backdrop`; `anim-pop` and `anim-enter` for things that appear without Base UI.

## Review round 2 additions (0.47.0)
- `LinkButton render`: draw the link with your router (`render={(props) => <Link to="/x" {...props} />}`); without it the link is a plain anchor. `icon` on `Button`, `LinkButton` and `Menu` items takes an element or a component.
- `PageHeader size="compact"`: one row about 45px high, body-size title, the sentence muted beside it, the children (filters) in the middle and `actions` at the right; for a table screen or for a record's title in a split pane.
- `FilterBar`: no Filters button when there are no filters; `collapsedEnd` ("sheet" default, "row"): where `end` goes on a phone when `primary` collapses the filters.
- `Field hideLabel`: the label for screen readers only.
- `Column lines: 2 | 3`: the cell wraps to that many lines and the row grows (up to 100 rows).
- `EmptyState` (`title`, `description?`, `action?`): the state of a list with nothing to show.
- `Page` and `PageBody` (`fill`): the frame of a screen with one scroll surface; `Tabs fill`. See best-practices.md section 12.
- web 0.8.3: `ApiError.userMessage` keeps a 4xx detail when there is one.

## Layout recipes (0.48.0)
`DataTable fit`; `PageBody gutter`; `PageHeader`/`Section` `sticky`; `PageColumns` (`firstWidth`, rem). See best-practices.md, "Screen recipes that need more than one surface".

## NotAllowed, bleed gutter (0.49.0)
`NotAllowed` (`title`, `description`, `action`, `variant`) next to `NotFound`: a titled page or pane for something the person may not see; render it from the component, do not throw from a route loader. A `bleed` `DataTable`'s text is inset to the page gutter, 16px and 24px from md (it was 16px), matching `PageHeader`, `Section` and `Container`. `PageHeader` and `Section` keep `actions` at the right and let a long description wrap beside them.

## RichTextEditor (import from @teb-ooo/ui/editor, 0.50.0)
The shared writing surface: page-like rich text with no box. `import { RichTextEditor } from "@teb-ooo/ui/editor"`. The editor engine packages are **optional peer dependencies** an app installs only if it uses this entry: `@tiptap/core`, `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`, `@tiptap/suggestion` (3.x). The rest of the package never loads them.
- Props: `label` (accessible name of the textbox, "Body"), `value` / `onChange` (ProseMirror JSON in the engine's camelCase node names: `paragraph`, `heading` (level 1 to 3), `bulletList`, `orderedList`, `listItem`, `blockquote`, `codeBlock`, `horizontalRule`, `mention` {id, label}; marks `bold`, `italic`, `code`, `link` {href}, `draft`; an empty document is `{ type: "doc" }`; no hard breaks, strike or underline), `placeholder`, `readOnly`, `mentions` ({ `search(query)` returning `{ id, label, hint? }[]`, `onClick(id)` }), `draft` ({ `label` }: the draft mark and a toolbar toggle), `validateHref` (default http, https and mailto; links are never autolinked), `variant` ("page" at least 6rem tall with a click on the empty area below focusing the end; "inline" as tall as its text), `onFocusEnd`.
- Props also: `toolbar` ("reserved" default: the toolbar has a strip of its own above the text, invisible until focus, so it never covers a neighbouring row and nothing moves when it appears; "overlay": floats above the text without taking space).
- Typography is `Prose`. The toolbar (`role="toolbar"` "Formatting": Bold, Italic, Code, Heading, Bullet list, Numbered list, Quote, and the draft toggle) sits above the text and is invisible and inert until the editor has focus, so there is no empty strip. `/` opens a block menu (Heading, Text, Bullet list, Numbered list, Quote, Divider, Link an entry) and `[[` opens the mentions list at the caret, both with `SuggestionList`; Enter inserts an atomic mention chip and a space. A mention is a link chip (`span[data-mention-id]`); draft text is a muted span (`span[data-draft]`).
- **Selection toolbar** (0.52.0, `selectionToolbar`, default on): a small toolbar (`role="toolbar"` "Selection": Bold, Italic, Code, Link and the draft toggle) floats above selected text while the editor has focus; the Link button opens the address field inside it. On a phone it is one row that scrolls sideways. The strip above the text stays.
- **Link editor** (0.51.0): select text (or put the caret in a link) and press Link in the toolbar: an address field opens beside it; Enter applies, Escape cancels and returns to the text, Remove link unsets it. The address must pass `validateHref` (default http, https, mailto) or the field says so. The toolbar stays visible while the field has focus and is reachable by Tab.
- External changes to `value` replace the content only while the editor is not focused; an update that leaves the document as the app already has it is not reported.
- Cmd or Ctrl+I in the editor is italic: the editor keeps the keydown from reaching the document, so the Send feedback hotkey does not fire while you type (0.50.3).

## ImagePreview (0.54.0)
A picture in the panel look: `src`, `alt` (required), `maxHeight` (rem, 20; proportions kept), `href` (adds an "Open full size" link that opens in a new tab), `openLabel`. If the picture fails to load nothing is drawn (no broken-image icon). Use it for a screenshot or an attachment preview instead of a raw `img`.

## Server-driven lists (0.55.0)
`DataTable`'s `pagination.hasNext` (optional) says whether the server sent a next cursor and then decides Next, even when the last page is exactly full; pair it with `total` as the rows seen so far and `totalIsLowerBound` set to the same value (the pager reads "26-50 of 50+"). `useListTable` in `@teb-ooo/web` 0.9.1 builds all of this (search, filters, sort, cursor stack, page size) over a generated list hook: spread its `table` onto `DataTable`. Search, filter and sort go to the server through the list operation's parameters, not over one page of rows in the client.

## Markdown (import from @teb-ooo/ui/markdown, 0.56.0)
`<Markdown>{source}</Markdown>` renders markdown in the `Prose` look: headings, emphasis, lists, quotes, code, tables, task lists, strikethrough, links and images. `react-markdown` (10.x) and `remark-gfm` (4.x) are **optional peer dependencies**: install them only in an app that uses this entry. Props: `wikiLink?: (title) => href` (turns `[[Title]]` into a link; text inside code and links is left alone; without it `[[Title]]` stays text), `renderLink?: (props) => element` (draws internal links with your router's link component; `http`, `https` and `mailto` links always use a plain anchor that opens in a new tab), `className`. Safe by default: raw HTML in the source is shown as text, never rendered, and `javascript:` addresses are dropped. Headings differ by case, style and rules, never size (see `Prose`).

- `Markdown` (0.57.0): `onToggleTask(index, checked)` makes task items tickable with the ui `Checkbox` (index in render order among task items; items inside fenced code are not counted; without it the boxes are read-only), `images` (default true; `false` leaves images out and shows the alt text, so a note's author cannot make the reader's browser fetch an address), and any other props (a `data-testid`, `aria-*`) go to the wrapper.

- **Switch to staging / Switch to production** (0.58.0): a platform command (group Platform, Cmd+K) that opens the same page (path, query and hash kept) in the other environment: `app.teb.ooo` and `app-staging.teb.ooo` swap. Owner only, like Send feedback, and only on a staging or production address (not on localhost).
