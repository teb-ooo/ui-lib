import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { Crosshair, X } from "lucide-react";
import { Button } from "./button";
import { Chip } from "./chip";
import { Field } from "./field";
import { Switch } from "./switch";
import { Textarea } from "./textarea";

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
 * The feedback dialog: free text, an optional picked element, an optional screenshot with a preview, and a line saying
 * what is sent. Opened from Cmd+K ("Send feedback", `useFeedbackCommand` in `@teb-ooo/ui/cmdk`), never from a header
 * button. While an element is being picked the dialog steps aside so the page can be clicked.
 */
export function FeedbackPanel({ feedback: f }: FeedbackPanelProps) {
  if (!f.available) return null;
  const sent = f.status === "sent" && f.result;
  return (
    <BaseDialog.Root open={f.isOpen && !f.picking} onOpenChange={(open) => (open ? undefined : f.close())}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop {...IGNORE} className="anim-backdrop fixed inset-0 z-50 bg-black/50" />
        <BaseDialog.Popup
          {...IGNORE}
          aria-label="Send feedback"
          className="anim-fade panel panel-float fixed top-[10vh] left-1/2 z-50 flex max-h-[80vh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 flex-col gap-4 overflow-y-auto p-4 text-ink outline-none"
        >
          <div className="flex items-start justify-between gap-4">
            <BaseDialog.Title className="text-ink">Send feedback</BaseDialog.Title>
            <BaseDialog.Close render={<Button icon={<X aria-hidden="true" className="size-4" />} aria-label="Close" className="border-transparent" />} />
          </div>

          {sent ? (
            <div role="status" className="flex flex-col gap-2">
              <p className="text-ink">Sent, tracked as {f.result?.bead}.</p>
              <p className="text-ink-muted">{agentLine(f.result?.agent ?? "", f.result?.status ?? "")}</p>
            </div>
          ) : (
            <>
              <BaseDialog.Description className="text-ink-muted">It goes to the agent of this app as a task, with the page it came from.</BaseDialog.Description>
              {f.restoredDraft ? <p className="text-ink-faint">Your unsent text from last time is back.</p> : null}
              <Field label="What should change?">
                <Textarea value={f.text} onChange={(e) => f.setText(e.target.value)} rows={4} />
              </Field>

              <div className="flex flex-wrap items-center gap-2">
                <Button icon={<Crosshair aria-hidden="true" className="size-4" />} onClick={f.startPicking}>
                  {f.element ? "Pick another element" : "Pick an element"}
                </Button>
                {f.element ? (
                  <Chip tone="link">
                    {f.element.selector}
                  </Chip>
                ) : null}
                {f.element ? (
                  <Button icon={<X aria-hidden="true" className="size-3" />} aria-label="Forget the picked element" className="border-transparent" onClick={f.clearElement} />
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <Switch label="Include a screenshot" checked={f.includeScreenshot} onCheckedChange={(on) => f.setIncludeScreenshot(on)} />
                {f.capturing ? <p className="text-ink-muted">Taking the screenshot.</p> : null}
                {f.screenshotError ? (
                  <p role="alert" className="text-danger">
                    {f.screenshotError}
                  </p>
                ) : null}
                {f.screenshot ? (
                  <div className="flex flex-col gap-2">
                    <img src={f.screenshot.url} alt="Screenshot preview" className="max-h-48 w-full border border-line object-contain" />
                    <div>
                      <Button onClick={f.retakeScreenshot}>Take it again</Button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-ink-muted">What is sent besides your text</span>
                <ul className="flex flex-col text-ink-faint">
                  {f.sends.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>

              {f.status === "failed" ? (
                <div role="alert" className="flex flex-col gap-1">
                  <p className="text-danger">{f.error ?? "The feedback could not be sent."}</p>
                  <p className="text-ink-muted">Your text is kept as a draft on this device.</p>
                </div>
              ) : null}
            </>
          )}

          <div className="flex justify-end gap-2">
            <Button onClick={f.close}>{sent ? "Close" : "Cancel"}</Button>
            {sent ? null : (
              <Button intent="solid" loading={f.status === "sending"} disabled={f.text.trim() === "" || f.capturing} onClick={() => void f.submit()}>
                Send
              </Button>
            )}
          </div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
