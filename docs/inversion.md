# Reversal: white on a dark page, black on a light one

The design language reverses the page's colours on whatever the person is on or in: a hovered button, an open dropdown, a focused input, a floating popup, an active row. The thing you are on is the brightest thing there. There is one mechanism, defined once at the end of `theme.css` (REVERSAL), and components opt in with a class; they never write hover colours.

## How it works
1. **A reversed token set.** Inside a reversed surface the colour tokens (`--color-ground`, `--color-ink`, the lines, the state colours) are the opposite scheme's, chosen by `light-dark()`, so it follows the OS or a forced theme with no JavaScript. A test (`test/contrast.test.ts`) checks the set is exactly the dark set on a light page and the light set on a dark page, so it cannot drift.
2. **The paint.** The same selectors fill with the page colour and draw text in ink, taken from the reversed tokens. Children (icons, chips, faint text, borders) read correctly without colours of their own, because their tokens are reversed too.
3. **No JavaScript reads the scheme.** A media-query hook plus a context would only duplicate what `color-scheme` and `light-dark()` already do, and would flash on first paint. The one piece of context is `PortalContainerProvider`: a popup is drawn in a portal outside the container that forces a theme (the gallery's light and dark examples), so that container provides itself and the popups below it are drawn inside it.

## The classes
| Class | What it is |
|---|---|
| `.panel-inverse` | A floating surface (popover, tooltip, menu, dialog, toast, the palette), reversed always, no border |
| `.invert` | Reversed now: an active row |
| `.hover-invert` | Reverses while hovered: a card, a checkbox |
| `.reverses` | Reverses while hovered, dragged, focused or open: a slider thumb |
| `.btn`, `.input` | Reverse by themselves: a button hovered or open, a single-line input focused or open (a textarea drops to the page colour) |

## Adding a component
Give its interactive part one of the classes above. Do not add `hover:bg-ink`, `hover:text-ground` and the like: `test/design.test.ts` refuses them. A state Base UI marks differently (`data-popup-open`, `data-dragging`, `aria-expanded`) is already listed in the REVERSAL selectors; a new one is added there, once. A control that reverses needs no focus outline of its own where the reversal already shows the focus (inputs); keyboard focus on a button keeps its outline.

## Popups and forced themes
A popup uses `usePortalContainer()` for its `Portal` (the primitives that wrap Base UI already do). An app never forces a theme, so it never needs `PortalContainerProvider`; the gallery's `ThemeFrame` does.
