# Story format

Every component (and every foundation) has a co-located `*.stories.tsx`: `src/components/button.stories.tsx` beside `button.tsx`, and `src/foundations/*.stories.tsx` for the theme. The design gallery discovers them with `import.meta.glob("../src/**/*.stories.tsx")` (the gallery's Tailwind must also `@source` the `src` directory so story classes exist). The published package also ships them for consuming apps (the `ui` gallery app): `npm run build` (run by `prepack`) copies `src/**/*.stories.tsx` to `stories/**` with relative imports rewritten to `@teb-ooo/ui`, `@teb-ooo/ui/stories` (types) and `@teb-ooo/ui/email/*`, so an app globs `node_modules/@teb-ooo/ui/stories/**/*.stories.tsx` (and `@source`s that directory for Tailwind). `stories/` is generated and git-ignored; test files are never shipped. A test fails when an exported component has no story or a story module is malformed.

Types live in `src/stories.ts` (`StoryDefault`, `StoryMeta`, `Story`, `StoryGroup`, `StoryState`).

## Default export

```ts
export default {
  title: "Button",                 // sidebar and search name
  group: "Atoms",                  // "Foundations" | "Atoms" | "Molecules" | "Email"
  description: "One or two sentences of usage notes.",
  component: "Button",             // optional: exported component name, for the props table
  source: "src/components/button.tsx", // optional: file that declares its props interface
} satisfies StoryDefault;
```

`title`, `group` and `description` are required. If `component` is given it must be an export of `src/index.ts` and `source` must be given too.

## Named exports: variants

Every named export is one variant: a zero-argument React function component whose PascalCase export name is the variant label.

```tsx
export const Disabled = () => <Button disabled>Save</Button>;
Disabled.storyMeta = {
  description: "Optional text under the variant.",
  state: "disabled",      // "default" | "hover" | "focus" | "disabled" | "loading" | "error"
  background: "neutral",  // "neutral" (default) | "surface"
} satisfies StoryMeta;
```

`storyMeta` is optional, as is every field in it. A story module has at least one variant. Variants must render with no props and no providers. Cover default, each intent or tone, disabled, loading and error wherever the component supports them.

## Foundations

`foundations/color`, `type`, `spacing` and `radius` render the tokens live from `theme.css`: the semantic colour tokens in the current scheme, the two type sizes, `--control-h`, `--radius`. Stories inside `src` never set `data-theme` (the design test forbids it); showing dark and light side by side, and the theme control, live in the gallery under `docs/`. There is no motion story because the theme defines no motion tokens.
