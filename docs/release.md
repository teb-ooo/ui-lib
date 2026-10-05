# Releasing @teb-ooo/ui

How a new version of the package is cut and published; only the `ui` agent does this, from its checkout at `/app/ui-lib`.

1. Make the change on `main` (stories and `docs/components.md` in the same commit as the component).
2. Bump `version` in `package.json` (patch for fixes and docs, minor for a new component or prop) and run `npm install --package-lock-only` so the lockfile agrees.
3. Before a minor release (0.x minors break caret ranges; `scripts/publish.sh` now runs `scripts/check-peers.mjs`, which refuses a publish whose peer ranges would not resolve with the sibling package's latest, in both directions): check that `@teb-ooo/web` (which this package peer-depends on) still allows the new version and that this one's peer range on it covers its latest, e.g. `npm view @teb-ooo/web version`; `check-peers.mjs` does the comparison, so a refusal means releasing the sibling first.
4. Test: `npm run typecheck`, `npm run lint` (the template's Oxlint config, zero errors; warnings are tolerated), `npm test` and `npm run check:release-age` all pass (run them before tagging; `scripts/publish.sh` runs them again and refuses on a failure). A fresh clone passes `npm test`: the pack test builds `stories/` itself.
5. Commit with a bead id, then tag the commit `vX.Y.Z` and push both: `git push origin main vX.Y.Z`.
6. Publish: `scripts/publish.sh`. It refuses unless the tree is clean and `HEAD` carries the tag, builds a mode-600 temporary npm config from `UI_LIB_NPM_PASSWORD` (the `ui-publisher` account, allowed to publish only this package), publishes to `http://npm-registry:4873/` and deletes the config. Add `--dry-run` to rehearse. The password is never printed or written anywhere else.
7. Check: `npm view @teb-ooo/ui version` shows the new version.
8. Tell the apps that asked for it (messages to the orchestrator's channel or the asking agent) that the version exists. The template pins the exact version; an app may use a caret range (ah does), and upgrades go under the 14-day release-age gate.
