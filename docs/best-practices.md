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
