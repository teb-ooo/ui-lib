import { useMemo } from "react";
import { useRouter } from "@tanstack/react-router";
import { Blocks } from "lucide-react";
import { useRegisterCommands } from "@teb-ooo/cmdk";
import type { Command } from "@teb-ooo/cmdk";
import { entries } from "../registry";

/** One command per gallery entry, in the "Components" group. "Toggle theme" and "Go to" come from the palette itself. */
export function entryCommands(navigate: (group: string, slug: string) => void): Command[] {
  return entries.map((e) => {
    const [group = "", slug = ""] = e.slug.split("/");
    return {
      id: `entry:${e.slug}`,
      title: e.title,
      group: "Components",
      icon: Blocks,
      keywords: [e.group, e.component ?? "", e.package].filter(Boolean),
      run: () => navigate(group, slug),
    };
  });
}

export function GalleryCommands() {
  const router = useRouter();
  const commands = useMemo(
    () =>
      entryCommands((group, slug) => {
        void router.navigate({ to: "/$group/$slug", params: { group, slug } });
      }),
    [router],
  );
  useRegisterCommands(commands, [commands]);
  return null;
}
