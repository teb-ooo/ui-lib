# Components and theme

All components are named exports of `@teb-ooo/ui`, each with an exported `*Props` interface. Every component accepts `className` (layout utilities only) and the attributes of the element it renders. Components consume the shared classes in `theme.css` (`.btn`, `.chip`, `.input`, `.panel`, ...) and the semantic tokens; none sets a font size or names a palette value.

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

## Dialog
Modal on Base UI `Dialog`: focus moves in, Escape closes, focus returns to the trigger.
- `title: ReactNode` (required; the accessible name), `description?`, `footer?`, `children?`
- `trigger?: ReactElement` (usually a `Button`), or control it with `open` / `onOpenChange(open, details)`; `defaultOpen`.
- `placement?: "center" | "top"` (default `"center"`): `center` is a small centred panel (`max-w-md`); `top` is a wider panel (`max-w-lg`) at 15vh from the top, the shape of a command palette. Both use a `bg-black/50` backdrop and the `anim-backdrop` and `anim-fade` transitions.
- `bare?: boolean`: no padding, header or close control; children fill the panel edge to edge and the title is announced but not drawn. A palette renders its own input and list inside a bare, top-placed dialog.
- `initialFocus?: boolean | RefObject<HTMLElement | null>`: what to focus on open (`false` leaves focus alone).
- `closeLabel?: string` (default `"Close"`), `className` (layout classes for the panel).

What a command palette needs, without reaching into internals: `<Dialog open onOpenChange placement="top" bare initialFocus={inputRef} title="Command palette">...</Dialog>`, `Kbd` for shortcut hints, and the shared classes `.panel`, `.input`, `.btn`, `.chip`.

## Tooltip
The one tooltip mechanism (never a `title` attribute). `<Tooltip tip="Save"><Button>...</Button></Tooltip>`; `side?: "top" | "bottom" | "left" | "right"`, `delay?: number` (ms, default 400). `Button` and `LinkButton` take a `tip` prop that uses it.

## Chip
A static token: status, count or reference. `tone?: "default" | "ok" | "warn" | "muted" | "danger" | "link" | "agent"`.

## Badge (deprecated)
Renders a `Chip` (`accent` maps to `link`). Use `Chip`; `Badge` stays until 1.0.

## Kbd
Keyboard shortcut hint. `shortcut` (`mod+k`, `g i`) or free-text children. `mod` is the Command key on Apple platforms and Ctrl elsewhere.

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

## Container
Centres page content with the page gutter. `width?: "narrow" | "default" | "wide" | "full"` (40rem, 64rem, 90rem, none; default `"default"`).

## SplitPane
List and detail. Side by side from the `lg` breakpoint; below it the list fills the screen and an open detail is a full-screen sheet.
- `list`, `detail`: ReactNodes; `detailOpen: boolean`, `onDetailClose()`; `detailLabel: string` (accessible name); `placeholder?` (wide, while nothing is open).
- `resizable?` (drag the divider, or arrow keys/Home/End on it), `defaultSize?` (list width in rem, 28), `minSize?` (16), `maxSize?` (48), `onSizeChange?(rem)`, `closeLabel?`.
- Fill the height its parent gives it.

## DataTable
Dense keyboard-driven table for many rows. The props table in the gallery is generated from the types.
- `columns: Column<T>[]` (`id`, `header`, `cell(row)`, `sortable?`, `width?`, `align?`, `hideBelow?: "sm" | "md" | "lg"` (hidden while the table itself is narrower than 24, 36 or 48rem, so a narrow pane drops columns by itself; the Columns menu says how many are hidden), `hideable?`), `rows`, `rowKey(row)`, `label`.
- Sorting is controlled: `sort`, `onSortChange`; the app sorts. `columnVisibility` + `onColumnVisibilityChange` add a Columns menu (an icon button at the end of the header row); `persistKey` (a string) saves the column configuration in `localStorage` (key `teb-ui:data-table:<persistKey>`) and restores it on the next visit, and also adds the menu. A controlled `columnVisibility` wins over the saved one.
- `activeKey` (matched by key, so it survives re-sorts) + `onActiveKeyChange`; `onRowClick` (click, or Enter on the active row); `selectedKeys` + `onSelectedKeysChange` add a checkbox column.
- `loading`, `empty`, `error`; `hasMore` + `onLoadMore` for cursor paging (called when the end is within 400px of view).
- `bleed`: edge to edge, no outer border, radius or background; header rule and row dividers run the full width.
- `renderCard` + `cardsBelow` (default `"md"`): below the breakpoint a list of cards replaces the table (cards are not windowed).
- Rows are one control-height line and are windowed past 100 rows. Keys: Up, Down, PageUp, PageDown, Home, End move the active row; Enter opens; Space toggles selection. Give it a parent with a height.

## FilterBar, SearchInput, ToggleGroup, Select, Combobox, ViewMenu
The filter row. `Option` is `{ value: string; label: string; count?: number }`; values are strings.
- `FilterBar`: a wrapping flex row; `end?: ReactNode` sits at the right (a count, a `ViewMenu`).
- `SearchInput`: `value`, `onValueChange`, `label?` ("Search"), `clearLabel?`; clear button when non-empty, Escape clears; ref to the input.
- `ToggleGroup`: `options`, `label`, `value` and `onValueChange` (`string | null`, or `string[]` with `multiple`).
- `Select` and single `Combobox` share one field look (border, background, height, one chevron); Combobox adds typing and a clear button once it has a value.
- `Select`: `options`, `value` (`string | null`), `onValueChange`, `label`, `placeholder?`, `disabled?`.
- `Combobox`: searchable; `options`, `label`, `placeholder?`, `emptyLabel?`, `value`/`onValueChange` as `Select`, or `multiple` with `string[]` and chips.
- `ViewMenu`: `views: {id, name}[]`, `activeId`, `onSelect(id | null)`, `onSave?(name)`, `onDelete?(id)`, `defaultLabel?`. The app stores the views.

## Sidebar and Shell
- `Sidebar`: `items: {id, label, href, icon?, active?, badge?, group?}[]`, `header?`, `footer?`, `collapsed?` + `onCollapsedChange?` (icons only, with tooltips; shows the toggle), `label?`, and `renderLink?(item, content, props)` to draw links with the app's router (put `props` on the element, `content` inside it).
- `Shell`: `sidebar`, `header?`, `children`; the full viewport height. From `md` the sidebar is a left column; below it a menu button opens the sidebar as a drawer (always expanded, closes on navigation). `menuLabel?`, `drawerLabel?`, `closeLabel?`. No routing or navigation content of its own; use it once at the root of a page.

## Command palette
`@teb-ooo/ui/cmdk` (a subpath export, part of this package since 0.6.0; formerly `@teb-ooo/cmdk`): `CommandProvider`, `CommandTrigger`, `useRegisterCommands`, `useCommandPalette`, `fuzzyMatch`. Needs `@tanstack/react-router` (an optional peer of the package, required only for this subpath). Full guide: [cmdk.md](cmdk.md).

## Hooks
`useMinWidth("sm" | "md" | "lg")` and `useMediaQuery(query)`; `BREAKPOINTS` holds the widths (40rem, 48rem, 64rem).

## Theme
Import once: `@import "@teb-ooo/ui/theme.css";`.
- **Themes.** Dark is the default; light follows `prefers-color-scheme: light`. Tokens live under `:root`, are redefined inside the media query, and are also reachable through `[data-theme="dark"]` and `[data-theme="light"]`, which exist only so a gallery can force a theme. Apps never set `data-theme`, never store a theme preference and ship no theme script or toggle. Components never branch on the theme (no `dark:` variants).
- **Colour tokens** (utilities like `bg-surface`, `text-ink-muted`, `border-line`): `ground` (exactly #000000 dark, #FFFFFF light), `surface`, `surface-raised`, `line`, `line-strong`, `ink`, `ink-muted`, `ink-faint`, and the state colours `danger`, `warning`, `ok`, `link`, `agent`, each with `-hover`, `-soft` and `-line`. Neutrals are zero-chroma grays. Colour is state only.
- **Type.** Exactly two sizes: body 14px on a 1.6 line, set on `body`; display 32px on a 1.3 line, only through `.display-lg`, for page titles and empty-state headlines. `.display-lg` also carries the only heavier weight (700) in the system. One typeface: components never set a size, a weight or a family; hierarchy inside body size is colour. Geist Mono is `--font-sans` and `--font-mono`, including controls, `code`, `kbd` and `pre`.
- **Shape.** One control height `--control-h` (1.75rem) and one radius `--radius` (0.25rem, the plain `rounded` utility).
- **Shared classes** (components layer): `.btn`, `.btn-solid`, `.btn-danger`, `.btn-warning`, `.btn-icon`, `.btn-add`, `.chip` with `.chip-ok`, `.chip-warn`, `.chip-muted`, `.chip-danger`, `.chip-link`, `.chip-agent`, `.input`, `.panel`, and the popup transitions `anim-fade`, `anim-slide-right`, `anim-backdrop`.
- **Font.** Geist Mono (variable woff2, OFL) is in `fonts/` with its license. There is no second typeface.
- **Design test.** `test/design.test.ts` is the rule set (sizes, radius, weights, palette and literal colours, theme control, raw buttons, title attributes, product names). Copy it unchanged to an app's `web/test/`.
