import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useMinWidth } from "../hooks/use-media-query";
import { cn } from "../lib/cn";
import { readStored, removeStored, writeStored } from "../lib/storage";
import { Button } from "./button";
import { usePortalContainer } from "../lib/theme-scope";

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
   * The list's width in rem at narrow desktop widths. Until the person moves the divider the list grows with the screen,
   * to 38% of the pane and no further than 48rem (or `maxSize` if that is smaller), so a wide screen is not mostly an empty
   * detail area.
   * @default 28
   */
  defaultSize?: number;
  /** The narrowest the list can be dragged, in rem. Deliberately small: the person decides. @default 6 */
  minSize?: number;
  /** The widest the list can be dragged, in rem. It can never take the room the detail needs (6rem stays), whatever this says. @default 96 */
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

const DETAIL_MIN = 6;
const AUTO_MAX = 48;
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
  minSize = 6,
  maxSize = 96,
  onSizeChange,
  persistKey,
  closeLabel = "Close",
  className,
}: SplitPaneProps) {
  const portalContainer = usePortalContainer();
  const wide = useMinWidth("lg");
  const storageKey = persistKey ? `teb-ui:split-pane:${persistKey}` : null;
  const [size, setSize] = useState(() => {
    const raw = storageKey ? readStored(storageKey) : null;
    const saved = Number(raw);
    if (raw !== null && Number.isFinite(saved) && saved > 0) return Math.min(maxSize, Math.max(minSize, saved));
    return defaultSize;
  });
  // False until a saved width is restored, the divider moves or a key changes it: then the width follows the screen.
  const [sized, setSized] = useState(() => (storageKey ? readStored(storageKey) !== null : false));
  const sizeRef = useRef(size);
  const dragging = useRef<{ startX: number; startSize: number } | null>(null);

  const root = useRef<HTMLDivElement | null>(null);
  // The list never takes the last 6rem of the pane: the detail always keeps a usable strip, whatever maxSize says.
  const room = () => {
    const w = root.current?.getBoundingClientRect().width ?? 0;
    return w > 0 ? Math.max(minSize, w / remPx() - DETAIL_MIN) : maxSize;
  };
  const change = (rem: number) => {
    const next = Math.min(maxSize, room(), Math.max(minSize, rem));
    sizeRef.current = next;
    setSized(true);
    setSize(next);
    onSizeChange?.(next);
  };
  const save = () => {
    if (storageKey) writeStored(storageKey, String(sizeRef.current));
  };
  const reset = () => {
    change(defaultSize);
    setSized(false);
    if (storageKey) removeStored(storageKey);
  };
  const remPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

  if (!wide) {
    return (
      <div className={cn("flex h-full min-h-0 flex-col", className)}>
        <div className="min-h-0 flex-1">{list}</div>
        <BaseDialog.Root open={detailOpen} onOpenChange={(open) => (open ? undefined : onDetailClose())}>
          <BaseDialog.Portal container={portalContainer}>
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
    <div ref={root} className={cn("flex h-full min-h-0", className)}>
      <div className="min-h-0 shrink-0" style={{ width: sized ? `${size}rem` : `clamp(${defaultSize}rem, 38%, ${Math.min(maxSize, AUTO_MAX)}rem)` }}>
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
          className={cn(
            // At rest it is the 1px rule of the fixed pane. The grab area is 12px wide (the ::before) and the rule grows to
            // 3px (the ::after) on hover, focus and drag, over its neighbours, so no layout space is taken.
            "relative z-10 w-px shrink-0 cursor-col-resize touch-none bg-line outline-none",
            "before:absolute before:inset-y-0 before:-left-1.5 before:w-3 before:content-['']",
            "after:pointer-events-none after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-ink-muted after:opacity-0 after:transition-[width,opacity]",
            "hover:after:w-[3px] hover:after:opacity-100 focus-visible:after:w-[3px] focus-visible:after:opacity-100 active:after:w-[3px] active:after:opacity-100",
          )}
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
