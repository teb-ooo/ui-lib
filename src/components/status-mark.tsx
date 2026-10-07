import { Check, Info, Minus, X } from "lucide-react";
import type { ReactElement } from "react";
import { cn } from "../lib/cn";

export type MarkStatus = "ok" | "fail" | "info" | "none";

export interface StatusMarkProps {
  /** `ok` passed (a check), `fail` failed (a cross), `info` worth a look but not a failure (an i), `none` not run or not applicable (a dash). */
  status: MarkStatus;
  /**
   * What the mark says, as its accessible name: "Backups: ok". A mark is read by screen readers and found by tests through
   * this, because the colour and the icon alone say nothing. @default the status word
   */
  label?: string;
  className?: string;
}

const MARKS = {
  ok: { Icon: Check, tone: "text-ok", word: "ok" },
  fail: { Icon: X, tone: "text-danger", word: "failed" },
  info: { Icon: Info, tone: "text-link", word: "info" },
  none: { Icon: Minus, tone: "text-ink-faint", word: "not run" },
} as const;

/**
 * A small state mark for a cell of a dense table or matrix (a run against its checks): an icon in the state's colour,
 * with an accessible name. Colour is never the only signal: each state has its own shape. Pair it with `DataTable`
 * columns of `width: "2.5rem"`, `align: "center"` and `rotate`.
 */
export function StatusMark({ status, label, className }: StatusMarkProps): ReactElement {
  const { Icon, tone, word } = MARKS[status];
  return (
    <span role="img" aria-label={label ?? word} data-status={status} className={cn("inline-flex size-4 items-center justify-center align-middle", tone, className)}>
      <Icon aria-hidden="true" className="size-4" strokeWidth={status === "none" ? 1.5 : 2.5} />
    </span>
  );
}
