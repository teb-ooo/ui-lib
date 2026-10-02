import { useMemo } from "react";
import { cn } from "../lib/cn";

export type DiffTokenKind = "same" | "add" | "del";
export interface DiffToken {
  kind: DiffTokenKind;
  text: string;
}

const MAX_CELLS = 4_000_000;

/** Word-level diff of two strings: words and whitespace are tokens, runs of the same kind are merged. */
export function diffWords(before: string, after: string): DiffToken[] {
  const a = before.split(/(\s+)/).filter((t) => t !== "");
  const b = after.split(/(\s+)/).filter((t) => t !== "");
  const out: DiffToken[] = [];
  const push = (kind: DiffTokenKind, text: string) => {
    const last = out[out.length - 1];
    if (last && last.kind === kind) last.text += text;
    else out.push({ kind, text });
  };
  // Trim the common head and tail first, so the table only covers what changed.
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head++;
  let tail = 0;
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++;
  for (let i = 0; i < head; i++) push("same", a[i] ?? "");
  const am = a.slice(head, a.length - tail);
  const bm = b.slice(head, b.length - tail);
  if (am.length * bm.length > MAX_CELLS) {
    if (am.length) push("del", am.join(""));
    if (bm.length) push("add", bm.join(""));
  } else {
    const w = bm.length + 1;
    const t = new Uint32Array((am.length + 1) * w);
    for (let i = am.length - 1; i >= 0; i--) {
      for (let j = bm.length - 1; j >= 0; j--) {
        t[i * w + j] = am[i] === bm[j] ? (t[(i + 1) * w + j + 1] ?? 0) + 1 : Math.max(t[(i + 1) * w + j] ?? 0, t[i * w + j + 1] ?? 0);
      }
    }
    let i = 0;
    let j = 0;
    while (i < am.length && j < bm.length) {
      if (am[i] === bm[j]) {
        push("same", am[i] ?? "");
        i++;
        j++;
      } else if ((t[(i + 1) * w + j] ?? 0) >= (t[i * w + j + 1] ?? 0)) {
        push("del", am[i] ?? "");
        i++;
      } else {
        push("add", bm[j] ?? "");
        j++;
      }
    }
    while (i < am.length) push("del", am[i++] ?? "");
    while (j < bm.length) push("add", bm[j++] ?? "");
  }
  for (let i = a.length - tail; i < a.length; i++) push("same", a[i] ?? "");
  return out;
}

interface Common {
  /** `inline` shows one text with additions and removals marked; `split` shows before and after side by side (stacked on a phone). @default "inline" */
  layout?: "inline" | "split";
  /** Names of the two sides, for `split`. @default "Before" and "After" */
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}
export interface DiffStringsProps extends Common {
  before: string;
  after: string;
  tokens?: undefined;
}
export interface DiffTokensProps extends Common {
  /** A diff computed by the app (a different algorithm, or one that knows its markup). */
  tokens: DiffToken[];
  before?: undefined;
  after?: undefined;
}
export type DiffProps = DiffStringsProps | DiffTokensProps;

function Tokens({ tokens, side }: { tokens: DiffToken[]; side?: "before" | "after" }) {
  return (
    <>
      {tokens.map((t, i) => {
        if (t.kind === "same") return <span key={i}>{t.text}</span>;
        if (t.kind === "add") {
          if (side === "before") return null;
          return (
            <ins key={i} className="diff-add">
              <span className="sr-only">[added: </span>
              {t.text}
              <span className="sr-only">]</span>
            </ins>
          );
        }
        if (side === "after") return null;
        return (
          <del key={i} className="diff-del">
            <span className="sr-only">[removed: </span>
            {t.text}
            <span className="sr-only">]</span>
          </del>
        );
      })}
    </>
  );
}

/**
 * Word-level difference between two texts: additions on a state-coloured ground, removals struck through. The marks
 * are never colour alone (underline and strikethrough, and screen-reader text), so they survive colour blindness.
 */
export function Diff(props: DiffProps) {
  const { layout = "inline", beforeLabel = "Before", afterLabel = "After", className } = props;
  const tokens = useMemo(() => props.tokens ?? diffWords(props.before, props.after), [props.tokens, props.before, props.after]);
  const changed = tokens.some((t) => t.kind !== "same");
  if (layout === "split") {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2", className)}>
        <div className="flex flex-col gap-1">
          <span className="text-ink-muted uppercase">{beforeLabel}</span>
          <p className="m-0 whitespace-pre-wrap break-words text-ink">
            <Tokens tokens={tokens} side="before" />
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-ink-muted uppercase">{afterLabel}</span>
          <p className="m-0 whitespace-pre-wrap break-words text-ink">
            <Tokens tokens={tokens} side="after" />
          </p>
        </div>
      </div>
    );
  }
  return (
    <p data-changed={changed ? "" : undefined} className={cn("m-0 whitespace-pre-wrap break-words text-ink", className)}>
      <Tokens tokens={tokens} />
    </p>
  );
}
