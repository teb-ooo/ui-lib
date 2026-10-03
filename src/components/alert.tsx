import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, OctagonAlert, X } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./button";

export type AlertTone = "info" | "ok" | "warn" | "danger";

export interface AlertProps {
  /** What kind of message it is. Colour is state: `ok` worked, `warn` needs care, `danger` failed, `info` is neutral. @default "info" */
  tone?: AlertTone;
  /** A short heading in the base size, before the text. */
  title?: ReactNode;
  /** The message: say what happened and what to do about it. */
  children?: ReactNode;
  /** The way out: a `Button` or `LinkButton`, shown at the end. */
  action?: ReactNode;
  /** Adds a dismiss button that calls this. */
  onDismiss?: () => void;
  /** Label of the dismiss button. @default "Dismiss" */
  dismissLabel?: string;
  className?: string;
}

const tones: Record<AlertTone, { box: string; icon: string; Icon: typeof Info }> = {
  info: { box: "border-line-strong bg-surface", icon: "text-ink-muted", Icon: Info },
  ok: { box: "border-ok-line bg-ok-soft", icon: "text-ok", Icon: CheckCircle2 },
  warn: { box: "border-warning-line bg-warning-soft", icon: "text-warning", Icon: AlertTriangle },
  danger: { box: "border-danger-line bg-danger-soft", icon: "text-danger", Icon: OctagonAlert },
};

/**
 * A message that stays on the page: a source that keeps dropping, saved data that is not backed up, a failed save, a
 * confirmation that needs an answer. It is announced when it appears (`role="alert"` for `danger`, `status` for the
 * rest). Use `Toast` for something that goes away by itself, `Field`'s error for one input, `Dialog` for a decision that
 * blocks the page.
 */
export function Alert({ tone = "info", title, children, action, onDismiss, dismissLabel = "Dismiss", className }: AlertProps) {
  const t = tones[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} data-tone={tone} className={cn("flex items-start gap-3 rounded border p-3 text-ink", t.box, className)}>
      <t.Icon aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", t.icon)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title ? <p className="text-ink">{title}</p> : null}
        {children ? <div className={title ? "text-ink-muted" : "text-ink"}>{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
      {onDismiss ? <Button icon={<X aria-hidden="true" className="size-3" />} aria-label={dismissLabel} tip={dismissLabel} className="border-transparent" onClick={onDismiss} /> : null}
    </div>
  );
}
