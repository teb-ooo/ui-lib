import { useState } from "react";
import { Button } from "./button";
import { FeedbackPanel } from "./feedback-panel";
import type { FeedbackController } from "./feedback-panel";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "FeedbackPanel",
  group: "Molecules",
  aliases: ["feedback", "report a problem", "bug report", "send feedback", "suggestion box", "screenshot", "element picker"],
  description:
    "The feedback dialog: free text, an optional picked element, an optional screenshot with a preview and a line saying what is sent. It is driven by useFeedback() from @teb-ooo/web and opened only from Cmd+K (Send feedback, useFeedbackCommand in @teb-ooo/ui/cmdk); there is no header button, and only the superadmin or the app owner ever sees it. These examples use a stand-in controller and send nothing.",
  component: "FeedbackPanel",
  source: "src/components/feedback-panel.tsx",
} satisfies StoryDefault;

const sends = ["The page: /atoms/button", "Console errors: the last 2 of up to 20", "Viewport: 1280 × 800", "Your browser: the user agent"];

/** A controller that keeps its own state and sends nothing. */
function useDemo(preset: Partial<FeedbackController> = {}): FeedbackController & { open: () => void } {
  const [isOpen, setOpen] = useState(false);
  const [text, setText] = useState(preset.text ?? "");
  const [element, setElement] = useState(preset.element ?? null);
  const [include, setInclude] = useState(preset.includeScreenshot ?? false);
  const [status, setStatus] = useState<FeedbackController["status"]>(preset.status ?? "idle");
  return {
    available: true,
    isOpen,
    // The real opener comes from Cmd+K; this one is the story's own.
    open: () => setOpen(true),
    close: () => setOpen(false),
    text,
    setText,
    element,
    picking: false,
    startPicking: () => setElement({ selector: "main > section:nth-of-type(2) > button", role: "button", text: "Save" }),
    stopPicking: () => undefined,
    clearElement: () => setElement(null),
    includeScreenshot: include,
    setIncludeScreenshot: setInclude,
    screenshot: include && preset.screenshot ? preset.screenshot : null,
    screenshotError: null,
    capturing: false,
    retakeScreenshot: () => undefined,
    sends: element ? [...sends, `The element you picked: ${element.selector}`] : sends,
    status,
    result: preset.result ?? null,
    error: preset.error ?? null,
    restoredDraft: preset.restoredDraft ?? false,
    submit: async () => setStatus(preset.status === "failed" ? "failed" : "sent"),
  };
}

function Demo({ preset }: { preset?: Partial<FeedbackController> }) {
  const f = useDemo(preset);
  return (
    <>
      <Button onClick={f.open}>Open the panel</Button>
      <FeedbackPanel feedback={f} />
    </>
  );
}

export const Default = () => <Demo />;
Default.storyMeta = { state: "default", description: "Opened from the button here; in an app it opens from Cmd+K." } satisfies StoryMeta;

export const WithElementPicked = () => (
  <Demo preset={{ text: "This button looks cramped on a phone.", element: { selector: "main > section:nth-of-type(2) > button", role: "button", text: "Save" } }} />
);

export const Sent = () => <Demo preset={{ text: "Thanks", status: "sent", result: { bead: "ui-123", agent: "ui", status: "idle" } }} />;
Sent.storyMeta = { description: "After sending: the bead it became and whether the agent was reached." } satisfies StoryMeta;

export const AgentOffline = () => <Demo preset={{ text: "Thanks", status: "sent", result: { bead: "ui-124", agent: "ui", status: "offline" } }} />;

export const Failed = () => <Demo preset={{ text: "Please look at the header.", status: "failed", error: "The agent route is not up." }} />;
Failed.storyMeta = { state: "error", description: "A failed send keeps the text as a draft on this device." } satisfies StoryMeta;
