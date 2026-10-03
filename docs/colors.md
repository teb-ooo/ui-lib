# Colour

How colour works in `@teb-ooo/ui`: direct colours, semantic colours, and how an app chooses its own.

## Two layers
- **Direct colours** name a colour: every Tailwind v4 hue in OKLCH from 50 to 950 (`--color-red-500`, `--color-teal-200`, ...), plus one pure gray ramp, `--color-neutral-50` to `--color-neutral-950` (zero chroma). The tinted grays (slate, gray, zinc, stone, mauve, olive, mist, taupe) are removed. Seventeen hues: red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose.
- **Semantic colours** say what a colour is for. The package defines five states (`danger`, `warning`, `ok`, `link`, `agent`); `Chip color` is the one place an app may pick a palette hue for itself (a swatch for a category it names), drawn with hue steps 50/200/700 in light and 950/900/400 in dark and the chrome grays (`ground`, `surface`, `surface-raised`, `line`, `line-strong`, `ink`, `ink-muted`, `ink-faint`). Components use only these role tokens; colour stays state-only and is never decoration.

## How a role gets its colour
Each state and the chrome gray has a **semantic ramp**, `--color-danger-50` to `--color-danger-950` (and `--color-gray-50` to `-950`), that points at a direct colour (`--color-danger-500: var(--color-red-500)`). The role tokens pick steps of the ramp for each scheme: `--color-danger` is step 400 in dark and 700 in light; `-hover` 300 and 800; `-soft` 950 and 50; `-line` 900 and 200. Chrome: surface gray 900 / 100, raised 800 / 200, line 700 / 300, line-strong 500 / 500, muted 300 / 700, faint 400 / 600. Ground and ink are pure black and white.

The ramps are also utilities: `bg-danger-100`, `text-ok-700`, `border-link-300`.

## Choosing your own colours (an app)
Repoint a semantic ramp once, in one file of your own CSS imported after the theme (say `web/src/colors.css`):

```css
@import "@teb-ooo/ui/theme.css";

:root {
  --color-danger-50: var(--color-rose-50);
  --color-danger-100: var(--color-rose-100);
  /* ... 200 to 900 ... */
  --color-danger-950: var(--color-rose-950);
}
```

Only the steps you want to change need to be repointed (the role tokens use 50, 200, 300, 400, 700, 800, 900 and 950). Other semantic names an app needs (`primary`, `success`) can be new ramps of its own in the same file, built the same way, then used as `bg-primary-600`. Direct colours may be named only in that file; everywhere else use semantic names.
