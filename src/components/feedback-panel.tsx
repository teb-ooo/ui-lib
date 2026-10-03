import { useEffect, useMemo, useRef } from "react";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { Camera, Loader2, SquareDashed } from "lucide-react";
import { Kbd } from "./kbd";
import { Button } from "./button";
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
  /** Viewport box of the picked element; the panel opens below it, centred, and moves aside when it would not fit. */
  anchor?: { x: number; y: number; width?: number; height?: number } | null;
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
 * picked), holding a full-bleed text box (Enter sends, Shift+Enter adds a line) above a footer, divided by a full-width line, with
 * the icon toggles for the screenshot and the DOM node inline and the Send button. Neither is previewed. There is no title, Cancel or close button: Escape or a press outside closes it.
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
  const aw = f.anchor?.width ?? 0;
  const ah = f.anchor?.height ?? 0;
  // The picked element's box, clipped to the viewport. Below it, centred, is where the panel goes; it flips above, then
  // beside, when there is no room. When the element fills the screen there is nowhere outside it, so the panel sits
  // inside, at its bottom centre. With no pick it hangs from the top centre of the page.
  const place = useMemo(() => {
    if (ax === undefined || ay === undefined) {
      const x = window.innerWidth / 2;
      return { rect: { x, y: Math.round(window.innerHeight * 0.15), width: 0, height: 0 }, side: "bottom" as const };
    }
    const left = Math.max(ax, 0);
    const top = Math.max(ay, 0);
    const right = Math.min(ax + aw, window.innerWidth);
    const bottom = Math.min(ay + ah, window.innerHeight);
    const room = { below: window.innerHeight - bottom, above: top, left, right: window.innerWidth - right };
    if (Math.max(room.below, room.above, room.left, room.right) < 160) {
      return { rect: { x: (left + right) / 2, y: bottom - 8, width: 0, height: 0 }, side: "top" as const };
    }
    return { rect: { x: left, y: top, width: Math.max(right - left, 0), height: Math.max(bottom - top, 0) }, side: "bottom" as const };
  }, [ax, ay, aw, ah]);
  const anchor = useMemo(() => ({ getBoundingClientRect: () => DOMRect.fromRect(place.rect) }), [place]);
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
    <div role="status" {...IGNORE} className="anim-enter panel-inverse panel-float pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 px-3 py-2 text-ink">
      Click the element this is about
      <span className="flex items-center gap-1 text-ink-muted">
        <Kbd shortcut="esc" /> to skip
      </span>
    </div>
  ) : null;
  const confirm = Boolean(sent) && !toast;
  const canSend = f.text.trim() !== "" && !f.capturing && f.status !== "sending";
  return (
    <>
      {hint}
      <BasePopover.Root open={f.isOpen && !f.picking} onOpenChange={(open) => (open ? undefined : f.close())} modal={false}>
        <BasePopover.Portal>
          <BasePopover.Positioner {...IGNORE} anchor={anchor} side={place.side} align="center" sideOffset={8} collisionPadding={8} collisionAvoidance={{ side: "flip", align: "shift", fallbackAxisSide: "end" }} className="z-50 outline-none">
            <BasePopover.Popup
              {...IGNORE}
              aria-label="Send feedback"
              initialFocus={textRef}
              className="anim-fade panel-inverse panel-float flex w-96 max-w-[calc(100vw-1rem)] flex-col overflow-hidden text-ink outline-none"
            >
              {confirm ? (
                <div role="status" className="flex flex-col gap-1 p-3">
                  <p className="text-ink">Sent, tracked as {f.result?.bead}.</p>
                  <p className="text-ink-muted">{agentLine(f.result?.agent ?? "", f.result?.status ?? "")}</p>
                </div>
              ) : (
                <>
                  {f.restoredDraft ? <p className="px-3 pt-2 text-ink-faint">Your unsent text from last time is back.</p> : null}
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
                      if (canSend) void f.submit();
                    }}
                    rows={3}
                    className="resize-none rounded-none border-0 bg-transparent px-3 py-2 outline-none focus:bg-transparent focus-visible:outline-none"
                  />
                  {f.screenshotError || f.status === "failed" ? (
                    <div className="flex flex-col gap-1 px-3 pb-2">
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
                    </div>
                  ) : null}
                  <div className="flex items-center gap-1 border-t border-line px-2 py-1">
                    {/* While the picture is taken the icon becomes the spinner in place: nothing moves. */}
                    <Button
                      icon={f.capturing ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Camera aria-hidden="true" className="size-4" />}
                      tip="Include screenshot"
                      active={f.includeScreenshot}
                      aria-busy={f.capturing || undefined}
                      className="border-transparent"
                      onClick={() => f.setIncludeScreenshot(!f.includeScreenshot)}
                    />
                    {f.element && f.setIncludeElement ? (
                      <Button
                        icon={<SquareDashed aria-hidden="true" className="size-4" />}
                        tip="Include DOM node"
                        active={f.includeElement ?? true}
                        className="border-transparent"
                        onClick={() => f.setIncludeElement?.(!(f.includeElement ?? true))}
                      />
                    ) : null}
                    <Button intent="solid" className="ml-auto" loading={f.status === "sending"} disabled={!canSend} onClick={() => void f.submit()}>
                      Send
                    </Button>
                  </div>
                </>
              )}
            </BasePopover.Popup>
          </BasePopover.Positioner>
        </BasePopover.Portal>
      </BasePopover.Root>
    </>
  );
}
