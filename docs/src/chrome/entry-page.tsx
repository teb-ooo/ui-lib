import { useEffect } from "react";
import { ClipboardCopy } from "lucide-react";
import { useRegisterCommands } from "@teb-ooo/cmdk";
import type { Entry } from "../registry";
import { CopyButton, copyText } from "./copy-button";
import { PropsTable } from "./props-table";
import { Variants } from "./variants";

export function EntryPage({ entry }: { entry: Entry }) {
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
        <p className="m-0 text-ink-faint">{entry.group}</p>
        <h1 className="display-lg m-0">{entry.title}</h1>
        <p className="m-0 max-w-prose text-ink-muted">{entry.description}</p>
        {importLine ? (
          <div className="flex flex-wrap items-center gap-2">
            <code className="chip text-ink" data-testid="import-line">
              {importLine}
            </code>
            <CopyButton text={importLine} label="Copy import" />
          </div>
        ) : null}
      </header>

      <section className="flex flex-col gap-3" aria-labelledby="variants-heading">
        <h2 id="variants-heading" className="m-0 text-ink-muted uppercase">
          Variants
        </h2>
        <Variants entry={entry} />
      </section>

      <PropsTable component={entry.component} />
    </article>
  );
}
