# @teb-ooo/ui

The playground design system: a Tailwind 4 theme (`theme.css`: semantic tokens that follow the OS light or dark scheme, Geist Mono self-hosted as the only typeface, two type sizes), a small set of atomic React components built on Base UI, and the base layout for every email the playground sends (`email/`). It is purely atomic: no shell, navigation, layouts or auth state. Run the tests with `npm test`, type-check with `npm run typecheck`, and browse everything in the design gallery, which is the `ui` app (https://ui.teb.ooo; it renders the package's stories live). There is no static gallery in this repository any more.

Stories: every component has a co-located `*.stories.tsx` (format in [docs/stories.md](docs/stories.md)); the package ships them (`stories/`) so the gallery app renders them live.

Usage: `@import "@teb-ooo/ui/theme.css";` in the app's CSS, then `import { Button } from "@teb-ooo/ui"`. Component props are in [docs/components.md](docs/components.md); the email placeholder contract is in [docs/email.md](docs/email.md). After editing `theme.css` run `npm run build:email-tokens` to regenerate `email/tokens.json` (a test fails if they drift).

Releasing (bump, test, tag, push, publish with `scripts/publish.sh`): [docs/release.md](docs/release.md).

The Cmd+K command palette is the subpath `@teb-ooo/ui/cmdk` ([docs/cmdk.md](docs/cmdk.md)).

Agents: the design gallery also serves a public, read-only MCP server at `https://ui.teb.ooo/mcp` (no token), shown in a session as `mcp__design-system__*` (load the deferred tools with ToolSearch, then call `search-entries` with the word you have and `get-entry` for props, an example and the import). Use it before asking for a component or choosing a colour. How and when: the shared brain's `docs/design-system.md`, section "Where to look".

## Lint

`npm run lint` runs Oxlint with the template's configuration (`.oxlintrc.json`, the same rules the apps are gated on); `scripts/publish.sh` refuses to publish with lint errors. Where a rule cannot see what a component does (a listbox driven by `aria-activedescendant`, a link given its text through props), the line carries an `eslint-disable-next-line` comment with the reason. There is no formatter: formatting is not enforced here (the apps' `oxfmt` check does not apply to this package).
