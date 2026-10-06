import { Button } from "./button";
import { ToastProvider, useToast } from "./toast";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Toast",
  group: "Atoms",
  description:
    "A short message that goes away by itself: 'Saved', 'Feedback sent'. A stack at the bottom right (full width on a phone), announced to assistive technology, paused on hover or focus, with a dismiss button. The Shell provides it; an app calls useToast().show({ title, description?, tone? }).",
  aliases: ["snackbar", "notification", "flash message", "alert", "message", "growl", "banner"],
  component: "ToastProvider",
  source: "src/components/toast.tsx",
} satisfies StoryDefault;

function Buttons() {
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => toast.show({ title: "Saved" })}>Plain</Button>
      <Button onClick={() => toast.show({ title: "Feedback sent, tracked as ui-12", description: "ui was notified.", tone: "ok" })}>Success</Button>
      <Button onClick={() => toast.show({ title: "Offline", description: "Changes are kept on this device.", tone: "warning" })}>Warning</Button>
      <Button onClick={() => toast.show({ title: "Could not save", description: "Try again in a moment.", tone: "danger" })}>Failure</Button>
    </div>
  );
}

export const Tones = () => (
  <ToastProvider>
    <Buttons />
  </ToastProvider>
);
Tones.storyMeta = { description: "Press a button: toasts stack at the bottom right and leave after five seconds (eight for a failure)." } satisfies StoryMeta;
