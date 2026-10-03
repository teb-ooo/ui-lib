# Best practices from the first UI review round

What five apps got wrong most often and how to build it right the first time. Each item names the component to use. See `components.md` for props.

## 1. Every data screen has four states
Loading, error, empty and loaded are designed, not left to chance.
- **Loading:** `DataTable loading` (its skeleton waits 100ms before it appears; wrap your own loading line or spinner in `Delayed`); hide counts ("0 rules") until the data is there. With `createQueryClient` an error shows within about a second.
- **Error:** `DataTable error={error.userMessage} onRetry={refetch}`. Never print `error.message` ("Internal Server Error: internal error"); `ApiError.userMessage` is a sentence for a person.
- **Empty:** say why it is empty. With a filter on, name the filter and offer "Clear filters" ("No retired rules. Show all rules"); with none, say how to add the first one.
- **Loaded:** the normal screen.

## 2. Unavailable, empty and forbidden are three different states
- The service did not answer: say so ("The platform did not answer. Try again.") with a Retry; do not show an empty state.
- Nothing there for this person: the empty state.
- Not allowed: say so ("You may not see this app") on a screen with a title; do not redirect silently, and if you must redirect, show a toast saying why.

## 3. A not-found page and a not-found pane
Give the router `NotFound` (page variant) as its not-found component, with a `LinkButton` back to the start. In a split pane, an unknown item shows `NotFound variant="pane"`. Never a bare line of text.

## 4. One gutter
The page title, the filter row and the table start at the same left edge. Put them in one `Container` (16px on a phone, 24px from `md`). A `bleed` table (edge to edge, for use inside a `SplitPane`) inset its text to the same gutter; do not mix a bleed table with a differently padded title.

## 5. Wrapped and clipped text
Decide for every piece of text what happens when it is too long, and test it with a 120-character value at 390 and 1280.
- **Table cell:** `DataTable` truncates with an ellipsis. A cell that holds an icon and text must keep the text in a `min-w-0 truncate` span, or the ellipsis is lost.
- **Columns:** give the one long column \`width: "1fr"\` and the others a fixed width; use \`hideBelow\` for columns that can wait. A table must never be wider than its area at 1280.
- **Titles in a pane:** body size, wrapping, not the display size (the display size is for page titles).
- **Unbroken strings** (names, hashes, URLs): \`break-words\`.
- **Meta lines** ("Updated 3 minutes ago · 31 words"): let each item wrap whole; do not start a line with the separator.
- **Logs and code:** \`whitespace-pre-wrap break-words\`, or scroll per line; never break in the middle of words.

## 6. Wide screens
A list and detail layout uses `SplitPane`; the list grows with the screen (ui 0.41). Keep reading text in a `Container width="narrow"`. A table that is the whole page uses `width="wide"` or `full`.

## 6b. A filter row for a list with a detail pane
Put the `FilterBar` once above the `SplitPane`, full width, so it never depends on the list's width; the split pane starts below it. Do not put the filters inside the list column and then hide them behind a button because the column is narrow. On a phone the same bar uses `primary` and the filters open in a sheet. Count, view menu and the main action go in the bar's `end` slot.

## 7. Phones
- Filters: `FilterBar primary={<SearchInput .../>}` so the bar is one row and the filters open behind a Filters button.
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
- Build the page from bands: `PageHeader`, then `Section`s (or a `FilterBar` inside a `Section`), then the list or the `SplitPane`. Do not wrap them in your own `Page`, `Bar` or `Pane` components; the primitives are `Shell`, `Sidebar`, `PageHeader`, `Section`, `Container`, `SplitPane`, `DataTable`.
- For tiles instead of rows use `CardGrid` and `Card`.
