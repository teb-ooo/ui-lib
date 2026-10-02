import { MessageSquarePlus } from "lucide-react";
import { useRegisterCommands } from "./use-register-commands";

/** What the command needs from `useFeedback()` in `@teb-ooo/web`. */
export interface FeedbackCommandSource {
  available: boolean;
  open: () => void;
}

/**
 * @deprecated The `Shell` registers Send feedback itself (and draws the icon in the bar), so an app calls neither
 * this nor `useFeedback` any more. This hook now only registers the same command id again, which the palette dedupes.
 *
 * Registers "Send feedback" in the palette, only while `feedback.available` (the superadmin or the app's owner, not a
 * test browser), so nobody else sees it. Feedback is reached only through Cmd+K: there is no header button.
 */
export function useFeedbackCommand(feedback: FeedbackCommandSource): void {
  useRegisterCommands(
    feedback.available
      ? [
          {
            id: "send-feedback",
            title: "Send feedback",
            group: "General",
            keywords: ["report", "bug", "problem", "idea", "suggestion", "screenshot", "tell the agent"],
            icon: MessageSquarePlus,
            run: () => feedback.open(),
          },
        ]
      : [],
    [feedback.available],
  );
}
