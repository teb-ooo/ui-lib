import type { ComponentType } from "react";
import type { Story, StoryDefault, StoryGroup, StoryMeta } from "../../src/stories";

export const GROUPS: readonly StoryGroup[] = ["Foundations", "Atoms", "Molecules", "Email"];

export interface Variant {
  /** Export name, PascalCase. */
  name: string;
  /** Human label: "With form". */
  label: string;
  Component: ComponentType;
  meta: StoryMeta;
}

export interface Entry {
  slug: string;
  group: StoryGroup;
  title: string;
  description: string;
  component: string | null;
  package: string;
  /** Line users paste; null when there is nothing to import. */
  importLine: string | null;
  variants: Variant[];
}

type StoryModule = { default: StoryDefault } & Record<string, unknown>;

const modules = import.meta.glob<StoryModule>(
  ["../../src/**/*.stories.tsx", "../../../cmdk/src/**/*.stories.tsx"],
  { eager: true },
);

const PACKAGES: ReadonlyArray<{ marker: string; name: string }> = [
  { marker: "/cmdk/src/", name: "@teb-ooo/cmdk" },
  { marker: "/src/", name: "@teb-ooo/ui" },
];

export function labelOf(name: string): string {
  const spaced = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function slugOf(path: string, group: string): string {
  const base = path.slice(path.lastIndexOf("/") + 1).replace(/\.stories\.tsx$/, "");
  return `${group.toLowerCase()}/${base}`;
}

export function buildEntries(mods: Record<string, StoryModule>): Entry[] {
  const entries: Entry[] = [];
  for (const [path, mod] of Object.entries(mods)) {
    const def = mod.default;
    const pkg = PACKAGES.find((p) => path.includes(p.marker))?.name ?? "@teb-ooo/ui";
    const variants: Variant[] = Object.entries(mod)
      .filter(([k, v]) => k !== "default" && typeof v === "function")
      .map(([name, v]) => {
        const story = v as Story;
        return { name, label: labelOf(name), Component: story as ComponentType, meta: story.storyMeta ?? {} };
      });
    const component = def.component ?? null;
    entries.push({
      slug: slugOf(path, def.group),
      group: def.group,
      title: def.title,
      description: def.description,
      component,
      package: pkg,
      importLine: component
        ? `import { ${component} } from "${pkg}";`
        : def.group === "Foundations"
          ? `@import "${pkg}/theme.css";`
          : null,
      variants,
    });
  }
  return entries.sort(
    (a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || a.title.localeCompare(b.title),
  );
}

export const entries: Entry[] = buildEntries(modules);

export function findEntry(group: string, slug: string): Entry | undefined {
  return entries.find((e) => e.slug === `${group}/${slug}`);
}
