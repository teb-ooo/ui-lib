import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useMinWidth } from "../hooks/use-media-query";
import { cn } from "../lib/cn";
import { Button } from "./button";

export interface SplitPaneProps {
  /** The list, on the left. */
  list: ReactNode;
  /** The detail of the chosen item, on the right (or in a full-screen sheet on a phone). */
  detail: ReactNode;
  /** Whether an item is open. On a phone this shows the sheet; on a wide screen the detail area shows `placeholder` when false. */
  detailOpen: boolean;
  /** Called when the phone sheet is closed (Escape or the close button). */
  onDetailClose: () => void;
  /** Accessible name of the detail area and of the sheet. */
  detailLabel: string;
  /** What the wide detail area shows while nothing is open. */
  placeholder?: ReactNode;
  /**
   * Lets the list width be dragged, or changed with the arrow keys on the handle.
   * @default false
   */
  resizable?: boolean;
  /**
   * Initial list width in rem.
   * @default 28
   */
  defaultSize?: number;
  /** @default 16 */
  minSize?: number;
  /** @default 48 */
  maxSize?: number;
  /** Called with the list width in rem after each change. */
  onSizeChange?: (rem: number) => void;
  /**
   * Saves the list width in `localStorage` under this key when the divider is moved, restores it (within min and max)
   * on the next visit, and a double-click on the divider resets it to `defaultSize` and forgets it.
   */
  persistKey?: string;
  /** Label of the sheet's close button. @default "Close" */
  closeLabel?: string;
  className?: string;
}

const STEP = 1;

/** List and detail. Side by side from `lg` up; below it the list fills the screen and the detail opens as a full-screen sheet. */
export function SplitPane({
  list,
  detail,
  detailOpen,
  onDetailClose,
  detailLabel,
  placeholder,
  resizable = false,
  defaultSize = 28,
  minSize = 16,
  maxSize = 48,
  onSizeChange,
  persistKey,
  closeLabel = "Close",
  className,
}: SplitPaneProps) {
  const wide = useMinWidth("lg");
  const storageKey = persistKey ? `teb-ui:split-pane:${persistKey}` : null;
  const [size, setSize] = useState(() => {
    if (storageKey) {
      try {
        const saved = Number(window.localStorage.getItem(storageKey));
        if (Number.isFinite(saved) && saved > 0) return Math.min(maxSize, Math.max(minSize, saved));
      } catch {
        // storage blocked: use the default
      }
    }
    return defaultSize;
  });
  const sizeRef = useRef(size);
  const dragging = useRef<{ startX: number; startSize: number } | null>(null);

  const change = (rem: number) => {
    const next = Math.min(maxSize, Math.max(minSize, rem));
    sizeRef.current = next;
    setSize(next);
    onSizeChange?.(next);
  };
  const save = () => {
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, String(sizeRef.current));
    } catch {
      // not remembered
    }
  };
  const reset = () => {
    change(defaultSize);
    if (!storageKey) return;
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // nothing to forget
    }
  };
  const remPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

  if (!wide) {
    return (
      <div className={cn("flex h-full min-h-0 flex-col", className)}>
        <div className="min-h-0 flex-1">{list}</div>
        <BaseDialog.Root open={detailOpen} onOpenChange={(open) => (open ? undefined : onDetailClose())}>
          <BaseDialog.Portal>
            <BaseDialog.Popup className="anim-fade fixed inset-0 z-50 flex flex-col bg-ground text-ink outline-none">
              <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-2">
                <BaseDialog.Title className="text-ink">{detailLabel}</BaseDialog.Title>
                <BaseDialog.Close
                  render={<Button icon={<X aria-hidden="true" className="size-4" />} aria-label={closeLabel} className="border-transparent" />}
                />
              </div>
              <div className="min-h-0 flex-1 overflow-auto p-4">{detail}</div>
            </BaseDialog.Popup>
          </BaseDialog.Portal>
        </BaseDialog.Root>
      </div>
    );
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") change(size - STEP);
    else if (e.key === "ArrowRight") change(size + STEP);
    else if (e.key === "Home") change(minSize);
    else if (e.key === "End") change(maxSize);
    else return;
    e.preventDefault();
    save();
  };
  const onPointerDown = (e: PointerEvent) => {
    dragging.current = { startX: e.clientX, startSize: size };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    const d = dragging.current;
    if (d) change(d.startSize + (e.clientX - d.startX) / remPx());
  };

  return (
    <div className={cn("flex h-full min-h-0", className)}>
      <div className="min-h-0 shrink-0" style={{ width: `${size}rem` }}>
        {list}
      </div>
      {resizable ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize list"
          aria-valuenow={Math.round(size)}
          aria-valuemin={minSize}
          aria-valuemax={maxSize}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => {
            if (dragging.current) save();
            dragging.current = null;
          }}
          onDoubleClick={reset}
          className="w-1 shrink-0 cursor-col-resize touch-none border-x border-line outline-none hover:bg-surface-raised focus-visible:bg-surface-raised"
        />
      ) : (
        <div className="w-px shrink-0 bg-line" />
      )}
      <section aria-label={detailLabel} className="min-h-0 min-w-0 flex-1 overflow-auto">
        {detailOpen ? detail : <div className="p-4 text-ink-faint">{placeholder}</div>}
      </section>
    </div>
  );
}
