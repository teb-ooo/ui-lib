# Best practices from the first UI review round

What five apps got wrong most often and how to build it right the first time. Each item names the component to use. See `components.md` for props.

## 1. Every data screen has four states
Loading, error, empty and loaded are designed, not left to chance. For a table, `DataTable` draws them from its props (below). For any other screen over a query, `QueryState` does it: `<QueryState query={q} empty={<EmptyState title="No notes yet" />}>{(data) => <Notes data={data} />}</QueryState>` shows the delayed loading line, the error sentence (`describeError`) with Retry, your empty state, then your screen; a failed refresh keeps the data on screen. Do not hand-write `isPending ? ... : error ? ... : ...`.
- **Loading:** `DataTable loading` (its skeleton waits 100ms before it appears; wrap your own loading line or spinner in `Delayed`); hide counts ("0 rules") until the data is there. With `createQueryClient` an error shows within about a second.
- **Error:** `DataTable error={error.userMessage} onRetry={refetch}`. Never print `error.message` ("Internal Server Error: internal error"); `ApiError.userMessage` is a sentence for a person.
- **Empty:** say why it is empty. `EmptyState` is the component: with a filter on, name the filter and offer "Clear filters" (`<EmptyState title="No retired rules" description="The Retired filter is on." action={<Button>Clear filters</Button>} />`); with none, say how to add the first one. Pass it as `DataTable`'s `empty`.
- **Loaded:** the normal screen.

## 2. Unavailable, empty and forbidden are three different states
- The service did not answer: say so ("The platform did not answer. Try again.") with a Retry; do not show an empty state.
- Nothing there for this person: the empty state.
- Not allowed: `NotAllowed` (a titled page or pane that says who may: "Only administrators may see the users."); do not redirect silently, and if you must redirect, show a toast saying why. Render it from the component once you know who the person is (`useIsAdmin()`); do not throw from a route's `beforeLoad` or `loader`, the router logs that as a console error.

## 3. A not-found page and a not-found pane
Give the router `NotFound` (page variant) as its not-found component, with a `LinkButton` back to the start: in TanStack Router either `createRouter({ defaultNotFoundComponent })` or a `notFoundComponent` on the root route works. A plain `LinkButton` is an anchor and reloads the whole app; give it the router's link with `render`: `<LinkButton render={(props) => <Link to="/rules" {...props} />}>Back to the rules</LinkButton>`. In a split pane, an unknown item shows `NotFound variant="pane"`. Never a bare line of text.

## 4. One gutter
The page title, the filter row and the table start at the same left edge. Put them in one `Container` (16px on a phone, 24px from `md`). A `bleed` table (edge to edge, for use inside a `SplitPane`) insets its text to the same gutter (16px, 24px from md, ui 0.49); do not mix a bleed table with a differently padded title.

## 5. Wrapped and clipped text
Decide for every piece of text what happens when it is too long, and test it with a 120-character value at 390 and 1280.
- **Table cell:** `DataTable` truncates with an ellipsis. A cell that holds an icon and text must keep the text in a `min-w-0 truncate` span, or the ellipsis is lost.
- **Columns:** give the one long column \`width: "1fr"\` and the others a fixed width; use \`hideBelow\` for columns that can wait. A table must never be wider than its area at 1280.
- **Titles in a pane:** body size, wrapping, not the display size (the display size is for page titles). For the title of a record shown in a split pane use `PageHeader size="compact"` (body-size title, actions at the right); the default `PageHeader` is for a page.
- **A list of sentences** (rules, notes with long titles): give the long column `lines: 2` (or 3) and the rows grow to fit instead of cutting at one line; it works up to 100 rows (above that the table is windowed on a fixed row height and every cell is one line).
- **Unbroken strings** (names, hashes, URLs): \`break-words\`.
- **Meta lines** ("Updated 3 minutes ago · 31 words"): let each item wrap whole; do not start a line with the separator.
- **Logs and code:** \`whitespace-pre-wrap break-words\`, or scroll per line; never break in the middle of words.

## 6. Wide screens
A list and detail layout uses `SplitPane`; the list grows with the screen (ui 0.41). Keep reading text in a `Container width="narrow"`. A table that is the whole page uses `width="wide"` or `full`.

## 6b. A filter row for a list with a detail pane
Put the `FilterBar` once above the `SplitPane`, full width, so it never depends on the list's width; the split pane starts below it. Do not put the filters inside the list column and then hide them behind a button because the column is narrow. On a phone the same bar uses `primary` and the filters open in a sheet. Count, view menu and the main action go in the bar's `end` slot.

## 7. Phones
- Filters: `FilterBar primary={<SearchInput .../>}` so the bar is one row and the filters open behind a Filters button. On a desktop the children follow the primary controls in the same row; on a phone `end` (a count, a view menu) moves into the Filters sheet (`collapsedEnd="row"` keeps it in the bar), and there is no Filters button when there are no filters. Controls in a filter bar say what they are by their own label: `Field hideLabel` keeps the label for screen readers without drawing it.
- Bulk actions: `DataTable` cards get checkboxes when `selectedKeys` is set. Keep the bulk bar to one row: icon buttons plus a "More actions" `Menu`.
- Action rows: the two or three main actions inline, the rest in a `Menu`.
- Test at 390 px: nothing scrolls sideways, every action is reachable.

## 8. Use the component, not a look-alike
- Tabs are `Tabs`, not a row of toggle buttons.
- Lists inside a panel use divider rows, not a bordered box per row (box inside box).
- A chip carries state. A green "active" chip on every row says nothing: show a chip only for the unusual value (retired, failing, draft).
- Rendered rich text (markdown, editor content) sits in `Prose`; do not style `h1`, `ul` and `blockquote` locally.
- Every `ToggleGroup`, `Select` and input sits in a `Field`, so labels look the same.

## 9. Check before you ask for a review
At 390 and 1280: no horizontal scroll, no clipped text without an ellipsis, left edges aligned, the four states of each data screen, a not-found page, the palette reaches every feature, zero console errors.

## 10. Colour in a list view
- Colour is for the unusual. The most common value (closed, open, active) should be quiet or neutral so the exceptions stand out; a column of one green chip says nothing.
- One meaning per colour in a screen. Purple means agent activity only; do not also use it for labels or pinned states.
- Two chips side by side must not look alike (an amber status next to a yellow priority).
- Red is for failure, danger and destructive actions. A primary action that is not destructive (Close a bead) is a normal button, not a red outline.
- Colour per label or category (`Chip color`) is the app's choice: give a family of labels one hue by prefix, not one hue per string, or the list turns into noise.
- Show a fact once: a state that is a chip in the header is not also a label chip.

## 11. Page layout: rules run to the edges
The rule that makes a page feel bounded: **lines are full width, content is inset.**
- A divider between two parts of a page (header, toolbar, list, footer) runs from edge to edge of the content area, to the sidebar on the left and the window on the right. It is never inset to the gutter and never stops short.
- Text, controls and chips inside a band sit in the page gutter (`Container`: 16px on a phone, 24px from `md`). The rule and the content therefore have different left edges on purpose: the line meets the sidebar, the text does not.
- A list or table is a band too: use `DataTable bleed` (rules edge to edge, text inset to the gutter), not a bordered box floating in the page. A box (`panel`) is for something that sits inside a band: a card, a dialog, a code block.
- A split pane's divider is a full-height 1px rule; the filter row above it is a full-width band with its own bottom rule.
- Build the page from bands inside `Page`: `PageHeader`, then `Section`s (or a `FilterBar` inside a `Section`), then the list or the `SplitPane`. Do not wrap them in your own `Page`, `Bar` or `Pane` components; the primitives are `Shell`, `Sidebar`, `Page`, `PageBody`, `PageHeader`, `Section`, `Container`, `SplitPane`, `DataTable` (`Page` and `PageBody` give the one scroll surface, section 12).
- For tiles instead of rows use `CardGrid` and `Card`.

## 12. Scrolling: one scroll surface per screen
The model (from ah's layout-and-scrolling notes):
- The `Shell` fixes the frame: the window never scrolls and the content area is the viewport height under the bar.
- From `lg` a screen is fixed chrome (the `PageHeader`, a `Section` with the filters) plus exactly **one** scroll surface. Below `lg` nothing is fixed and the content area scrolls the whole page as one. `Page` and `PageBody` are that frame (see the Page story).
- A scroll area never sits inside another one.
- A screen is a **table screen** (`<PageBody fill>` holding one `DataTable` or `SplitPane`, which scrolls itself with a sticky header) or a **document screen** (`<PageBody>` is the scroll surface: a form, a note, sections). Never both on one screen. Row detail opens in a `Dialog` or a `SplitPane`.
- Tabs as the body of a screen: `Tabs fill` makes each panel the scroll surface (a flex column under the tab row).
- Every clipped edge is visible: a scrolling region ends at a rule or a divider, never at a hard cut in the middle of content.
- Do not fake a scroll with `max-h` plus `overflow`; give the region a real parent height (the `Page` does) or let the page scroll.

### Screen recipes that need more than one surface
- **A table that is only as tall as its rows** (a short list in a scrolling pane, or a table above other content): `DataTable fit`. It is as tall as its header and rows (at least the header and two rows), shrinks to the space its parent leaves and then scrolls inside itself; in a parent that scrolls it is just as tall as its rows. Without `fit` the table fills its parent.
- **Page gutter for everything but bleed bands:** `PageBody gutter` gives every direct child 16px (24px from md) except bleed tables, `Section` and `PageHeader` (they touch both edges and inset their own content).
- **A header that stays on a phone:** `PageHeader sticky` / `Section sticky` pin the band to the top while the whole page scrolls.
- **Details beside tabs:** `PageColumns` puts two `PageBody`s side by side from lg, each its own scroll surface (the rule is one surface per column); below lg they stack in source order and the page scrolls as one; give the second `max-lg:order-first` to show it first on a phone.

## 13. Small things that trip people
- A `LinkButton` or `Button` that is a direct child of a `Section` (a column) stretches to the full width: wrap it in a `div` (or put it in the section's `actions`).
- A `Chip tone="muted"` keeps the chip's padding, so quiet status text in a table cell starts about 8px right of its column header. If that matters, show the common value as plain text (`text-ink-faint`) and use a chip only for the unusual one.

## 14. A list the server pages is searched by the server
Never filter, sort or search the rows of one page in the client: the row you want may be on page 3. Use `useListTable` (`@teb-ooo/web` 0.9.1) over the generated list hook and spread its `table` onto `DataTable`; it sends the search (debounced), filters and sort as the operation's parameters, keeps the cursor stack for Next and Previous and returns to the first page on any change. Name the active search and filters in the empty state and offer Clear filters (`hasActiveFilters`, `clearFilters`). See the web package README.

## 15. Commands from the API (0.69.0)
Every user action is an API operation ([API-qan](https://rb.teb.ooo/API-qan)) and must be reachable from Cmd+K ([UI-yze](https://rb.teb.ooo/UI-yze)). Prefer tagging the operation with `x-palette` and rendering `PaletteFromApi` over a hand-written command: the title, group, where it applies, the confirm and the refresh are data on the operation, and a test (`untaggedActions`) fails when a mutating operation has neither a tag nor `x-palette: false` with a reason. Write the title as the sentence of the button ("Disable {person}"). Give an action a `when` (the screen it belongs to, and `field: { status: "staged" }` for a state of the selected row, published with `usePaletteSelection`, and `differs: { id: "user.subject" }` to keep an action off the signed-in person's own row) unless it really fits anywhere; one without it is hidden until two characters are typed. Say who may see an action or a search with `role: "admin"` (an administrator or the owner) or `role: "owner"` on the tag, so a person the API would answer 403 never sees or asks for it (`PaletteFromApi enabled={false}` turns the lot off). An action that needs the person to type something marks those arguments `"prompt"` (`args: { code: "prompt", title: "prompt" }`): choosing it opens a form step, a dialog with one field per argument built from the operation's request body schema (text, number, yes/no, or one of a list), validated by it, with the server's field errors under their fields; `form: { submit: "Create rule", fields: ["scope", "title"] }` names its button and the order of the questions (a generated API document sorts object keys, so without `fields` they come alphabetical), and `form: { options: { scope: { from: "list-apps", value: "name", also: ["platform"] } } }` makes a text field a select of the items of a list operation (a GET), loaded when the form opens (a text box if it cannot be loaded); `also` lists fixed values offered first. A one-line text with a `format` (an email) or up to 1000 characters is a single-line input; only a longer free text is a box. A field whose options depend on another field, a list or an object is not asked for this way (`paletteProblems` says which). Keep hand-written commands for what a tag cannot say: a target the page does not hold, a body with a dependent or nested field, and interface-only actions (sorting, ticking a task, switching a view). One command per row of a child list ("Remove change 2 from {proposal}", "Remove passkey {name}") stays hand-written: register one command per row with `useRegisterCommands` and the rows as `deps`, from the screen that holds them.
