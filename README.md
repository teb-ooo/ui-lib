# @teb-ooo/ui

The factory design system: a Tailwind 4 theme (`theme.css`: semantic tokens that follow the OS light or dark scheme, Geist Mono self-hosted as the only typeface, two type sizes), a small set of atomic React components built on Base UI, and the base layout for every email the factory sends (`email/`). It is purely atomic: no shell, navigation, layouts or auth state. Run the tests with `npm test`, type-check with `npm run typecheck`, and browse everything in the design gallery (`docs/`; `npm run docs:build` writes the static site to `docs/dist`, which is git-ignored build output; `npm run release` builds the package and the gallery).

Stories: every component has a co-located `*.stories.tsx` (format in [docs/stories.md](docs/stories.md)); they stay out of the published package.

Usage: `@import "@teb-ooo/ui/theme.css";` in the app's CSS, then `import { Button } from "@teb-ooo/ui"`. Component props are in [docs/components.md](docs/components.md); the email placeholder contract is in [docs/email.md](docs/email.md). After editing `theme.css` run `npm run build:email-tokens` to regenerate `email/tokens.json` (a test fails if they drift).
