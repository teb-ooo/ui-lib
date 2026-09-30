# Releasing @teb-ooo/ui

How a new version of the package is cut and published; only the `ui` agent does this, from its checkout at `/app/ui-lib`.

1. Make the change on `main` (stories and `docs/components.md` in the same commit as the component).
2. Bump `version` in `package.json` (patch for fixes and docs, minor for a new component or prop) and run `npm install --package-lock-only` so the lockfile agrees.
3. Before a minor release (0.x minors break caret ranges): check the packages that peer-depend on this one (`@teb-ooo/cmdk`, `@teb-ooo/web`) allow the new version, e.g. `npm view @teb-ooo/cmdk peerDependencies`; if not, get them released first.
4. Test: `npm run typecheck`, `npm test` and `npm run check:release-age` all pass.
5. Commit with a bead id, then tag the commit `vX.Y.Z` and push both: `git push origin main vX.Y.Z`.
6. Publish: `scripts/publish.sh`. It refuses unless the tree is clean and `HEAD` carries the tag, builds a mode-600 temporary npm config from `UI_LIB_NPM_PASSWORD` (the `ui-publisher` account, allowed to publish only this package), publishes to `http://npm-registry:4873/` and deletes the config. Add `--dry-run` to rehearse. The password is never printed or written anywhere else.
7. Check: `npm view @teb-ooo/ui version` shows the new version.
8. Tell the apps that asked for it (messages to the orchestrator's channel or the asking agent) that the version exists. Apps pin the exact version and upgrade under the 14-day release-age gate.
