import { useEffect, useState } from "react";
import { ClipboardCopy } from "lucide-react";
import { useRegisterCommands } from "@teb-ooo/cmdk";
import { Button } from "@teb-ooo/ui";
import type { Entry } from "../registry";
import { CopyButton, copyText } from "./copy-button";
import { PropsTable } from "./props-table";
import { Variants } from "./variants";
import type { PreviewTheme } from "./variants";

const THEMES: readonly PreviewTheme[] = ["system", "light", "dark"];

export function EntryPage({ entry }: { entry: Entry }) {
  const [theme, setTheme] = useState<PreviewTheme>("system");
  // Contextual command: only registered while an entry with something to import is on screen.
  const importLine = entry.importLine;
  useRegisterCommands(
    importLine
      ? [
          {
            id: "copy-import",
            title: "Copy import statement",
            group: "This page",
            icon: ClipboardCopy,
            keywords: [entry.title, "import", "copy"],
            run: async () => {
              await copyText(importLine);
            },
          },
        ]
      : [],
    [importLine, entry.title],
  );
  useEffect(() => {
    document.title = `${entry.title} · Design`;
  }, [entry.title]);
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="m-0 text-sm text-muted">{entry.group}</p>
        <h1 className="m-0 text-xl">{entry.title}</h1>
        <p className="m-0 max-w-prose text-base text-muted">{entry.description}</p>
        {entry.importLine ? (
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded-ctl border border-line bg-surface px-2 py-1 text-sm text-ink" data-testid="import-line">
              {entry.importLine}
            </code>
            <CopyButton text={entry.importLine} label="Copy import" />
          </div>
        ) : null}
      </header>

      <section className="flex flex-col gap-3" aria-labelledby="variants-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="variants-heading" className="m-0 text-lg">
            Variants
          </h2>
          <div role="group" aria-label="Preview theme" className="flex gap-2">
            {THEMES.map((t) => (
              <Button key={t} intent={theme === t ? "solid" : "default"} aria-pressed={theme === t} onClick={() => setTheme(t)}>
                {t}
              </Button>
            ))}
          </div>
        </div>
        <Variants entry={entry} theme={theme} />
      </section>

      <PropsTable component={entry.component} />
    </article>
  );
}
