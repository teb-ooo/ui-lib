import { useEffect, useMemo, useRef } from "react";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { Kbd } from "./kbd";
import { Switch } from "./switch";
import { Textarea } from "./textarea";
import { useOptionalToast } from "./toast";

/** A page element the person picked, as `useFeedback()` from `@teb-ooo/web` reports it. */
export interface FeedbackElement {
  selector: string;
  role: string;
  text: string;
}

/**
 * What the panel needs: the object `useFeedback()` from `@teb-ooo/web` returns. It is written out here so this package
 * does not depend on that one; anything with this shape works.
 */
export interface FeedbackController {
  available: boolean;
  isOpen: boolean;
  close: () => void;
  text: string;
  setText: (text: string) => void;
  element: FeedbackElement | null;
  picking: boolean;
  startPicking: () => void;
  stopPicking: () => void;
  clearElement: () => void;
  /** Whether the picked element goes with the report; with `setIncludeElement` it shows a switch. */
  includeElement?: boolean;
  setIncludeElement?: (on: boolean) => void;
  /** Viewport point of the click that picked the element; the panel opens next to it. */
  anchor?: { x: number; y: number } | null;
  includeScreenshot: boolean;
  setIncludeScreenshot: (on: boolean) => void;
  screenshot: { url: string; type: string; size: number } | null;
  screenshotError: string | null;
  capturing: boolean;
  retakeScreenshot: () => void;
  sends: string[];
  status: "idle" | "sending" | "sent" | "failed";
  result: { bead: string; agent: string; status: string } | null;
  error: string | null;
  restoredDraft: boolean;
  submit: () => Promise<void>;
}

export interface FeedbackPanelProps {
  /** What `useFeedback()` returns. */
  feedback: FeedbackController;
}

/** Marks the panel's nodes so the screenshot and the element picker leave them out. */
const IGNORE = { "data-feedback-ignore": "" };

function agentLine(agent: string, status: string): string {
  return status === "offline" || status === "logged_out"
    ? `${agent} is ${status === "offline" ? "offline" : "signed out"}; it will see it when it is back.`
    : `${agent} was notified${status === "working" ? " (it is working now)" : ""}.`;
}

/**
 * The feedback panel: a popover next to the click that picked an element (or near the top of the page when nothing was
 * picked), holding one text box (Enter sends, Shift+Enter adds a line) and two switches, for the screenshot and for the
 * picked element. Neither is previewed. There is no title, Cancel or close button: Escape or a press outside closes it.
 * A sent message is confirmed with a toast. Opened from Cmd+K ("Send feedback", `useFeedbackCommand` in
 * `@teb-ooo/ui/cmdk`), never from a header button. While an element is being picked the panel steps aside so the page
 * can be clicked.
 */
export function FeedbackPanel({ feedback: f }: FeedbackPanelProps) {
  const toast = useOptionalToast();
  const textRef = useRef<HTMLTextAreaElement | null>(null);
  const announced = useRef<unknown>(null);
  const sent = f.status === "sent" && f.result;
  const ax = f.anchor?.x;
  const ay = f.anchor?.y;
  // A point with no size, so the panel sits just below the click; with no pick it hangs from the top centre of the page.
  const anchor = useMemo(() => {
    const x = ax ?? window.innerWidth / 2;
    const y = ay ?? Math.round(window.innerHeight * 0.15);
    return { getBoundingClientRect: () => DOMRect.fromRect({ x, y, width: 0, height: 0 }) };
  }, [ax, ay]);
  // A sent message is confirmed with a toast and the panel closes; without a toast host the panel says it itself.
  useEffect(() => {
    if (!toast || !sent || announced.current === sent) return;
    announced.current = sent;
    toast.show({ title: `Feedback sent, tracked as ${sent.bead}`, description: agentLine(sent.agent, sent.status), tone: "ok" });
    f.close();
  }, [toast, sent, f]);
  if (!f.available) return null;
  const hint = f.picking ? (
    // While the panel steps aside to let the page be clicked, say what to do: a keyboard shortcut gives no other sign.
    <div role="status" {...IGNORE} className="anim-enter panel panel-float pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 px-3 py-2 text-ink">
      Click the element this is about
      <span className="flex items-center gap-1 text-ink-muted">
        <Kbd shortcut="esc" /> to skip
      </span>
    </div>
  ) : null;
  const confirm = Boolean(sent) && !toast;
  return (
    <>
      {hint}
      <BasePopover.Root open={f.isOpen && !f.picking} onOpenChange={(open) => (open ? undefined : f.close())} modal={false}>
        <BasePopover.Portal>
          <BasePopover.Positioner {...IGNORE} anchor={anchor} side="bottom" align="start" sideOffset={8} collisionPadding={8} className="z-50 outline-none">
            <BasePopover.Popup
              {...IGNORE}
              aria-label="Send feedback"
              initialFocus={textRef}
              className="anim-fade panel panel-float flex w-80 max-w-[calc(100vw-1rem)] flex-col gap-2 p-3 text-ink outline-none"
            >
              {confirm ? (
                <div role="status" className="flex flex-col gap-1">
                  <p className="text-ink">Sent, tracked as {f.result?.bead}.</p>
                  <p className="text-ink-muted">{agentLine(f.result?.agent ?? "", f.result?.status ?? "")}</p>
                </div>
              ) : (
                <>
                  {f.restoredDraft ? <p className="text-ink-faint">Your unsent text from last time is back.</p> : null}
                  <Textarea
                    ref={textRef}
                    aria-label="Send feedback"
                    placeholder="Send feedback"
                    value={f.text}
                    onChange={(e) => f.setText(e.target.value)}
                    onKeyDown={(e) => {
                      // Enter sends; Shift+Enter adds a line. Not while an input method is composing a character.
                      if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
                      e.preventDefault();
                      if (f.text.trim() !== "" && !f.capturing && f.status !== "sending") void f.submit();
                    }}
                    rows={3}
                  />
                  <Switch label="Include screenshot" checked={f.includeScreenshot} onCheckedChange={(on) => f.setIncludeScreenshot(on)} />
                  {f.element && f.setIncludeElement ? (
                    <Switch label="Include DOM node" checked={f.includeElement ?? true} onCheckedChange={(on) => f.setIncludeElement?.(on)} />
                  ) : null}
                  {f.capturing ? <p className="text-ink-muted">Taking the screenshot.</p> : null}
                  {f.status === "sending" ? <p className="text-ink-muted">Sending.</p> : null}
                  {f.screenshotError ? (
                    <p role="alert" className="text-danger">
                      {f.screenshotError}
                    </p>
                  ) : null}
                  {f.status === "failed" ? (
                    <div role="alert" className="flex flex-col gap-1">
                      <p className="text-danger">{f.error ?? "The feedback could not be sent."}</p>
                      <p className="text-ink-muted">Your text is kept as a draft on this device.</p>
                    </div>
                  ) : null}
                </>
              )}
            </BasePopover.Popup>
          </BasePopover.Positioner>
        </BasePopover.Portal>
      </BasePopover.Root>
    </>
  );
}
