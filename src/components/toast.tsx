import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { Toast as BaseToast } from "@base-ui/react/toast";
import { X } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./button";

export type ToastTone = "default" | "ok" | "warn" | "danger";

export interface ToastOptions {
  /** One short line: what happened. */
  title: ReactNode;
  /** A second line with the detail. */
  description?: ReactNode;
  /** Colour is state: `ok` for a thing that worked, `warn`, `danger` for a failure. @default "default" */
  tone?: ToastTone;
  /** Milliseconds before it goes away; 0 keeps it until it is closed. @default 5000 (danger: 8000) */
  timeout?: number;
}

export interface ToastApi {
  /** Shows a toast and returns its id. */
  show: (options: ToastOptions) => string;
  /** Closes one toast, or every toast without an id. */
  dismiss: (id?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** The toast API, or null outside a `ToastProvider` (the `Shell` provides one, so an app is always inside). */
export function useOptionalToast(): ToastApi | null {
  return useContext(ToastContext);
}

/** Shows short messages that go away by themselves: "Saved", "Feedback sent". Needs the `Shell` (or a `ToastProvider`) above it. */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be used inside <Shell> or <ToastProvider>");
  return api;
}

const tones: Record<ToastTone, string> = {
  default: "border-line-strong",
  ok: "border-ok-line",
  warn: "border-warning-line",
  danger: "border-danger-line",
};

function Bridge({ children }: { children: ReactNode }) {
  const manager = BaseToast.useToastManager();
  const api = useMemo<ToastApi>(
    () => ({
      show: ({ title, description, tone = "default", timeout }) =>
        manager.add({
          title,
          description,
          type: tone,
          timeout: timeout ?? (tone === "danger" ? 8000 : 5000),
          priority: tone === "danger" ? "high" : "low",
        }),
      dismiss: (id) => manager.close(id),
    }),
    [manager],
  );
  return <ToastContext.Provider value={api}>{children}</ToastContext.Provider>;
}

function List() {
  const { toasts } = BaseToast.useToastManager();
  return (
    <>
      {toasts.map((toast) => (
        <BaseToast.Root
          key={toast.id}
          toast={toast}
          className={cn(
            "anim-fade panel panel-float pointer-events-auto flex items-start gap-3 p-3 text-ink",
            tones[(toast.type as ToastTone | undefined) ?? "default"] ?? tones.default,
          )}
        >
          <BaseToast.Content className="flex min-w-0 flex-1 flex-col gap-1">
            <BaseToast.Title className="text-ink" />
            <BaseToast.Description className="text-ink-muted" />
          </BaseToast.Content>
          <BaseToast.Close
            aria-label="Dismiss"
            render={<Button icon={<X aria-hidden="true" className="size-3" />} aria-label="Dismiss" className="border-transparent" />}
          />
        </BaseToast.Root>
      ))}
    </>
  );
}

/**
 * Owns the toasts: a stack at the bottom right (full width on a phone) above everything else, announced to assistive
 * technology, paused while hovered or focused, closed by Escape-free dismiss buttons. The `Shell` mounts one, so an app
 * only calls `useToast()`.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <BaseToast.Provider limit={4}>
      <Bridge>{children}</Bridge>
      <BaseToast.Portal>
        <BaseToast.Viewport className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:left-auto sm:w-96">
          <List />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  );
}
