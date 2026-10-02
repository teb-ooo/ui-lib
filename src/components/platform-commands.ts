import { useEffect, useLayoutEffect, useRef } from "react";
import { ExternalLink, LayoutDashboard, ListTodo, LogOut, MessageSquarePlus, Palette, User } from "lucide-react";
import { LOGOUT_PATH, platformLinks } from "@teb-ooo/web";
import type { Command, CommandIcon } from "../cmdk/types";
import { useCommandHost } from "./command-host";

const group = "Platform";

const icons: Record<string, CommandIcon> = {
  "platform:profile": User,
  "platform:dashboard": LayoutDashboard,
  "platform:tracker": ListTodo,
  "platform:design-system": Palette,
};

export interface PlatformCommandsInput {
  /** Whether someone is signed in (Sign out only then). */
  signedIn: boolean;
  /** `useFeedback()`'s `available` and `open`. */
  feedback: { available: boolean; open: () => void };
}

/** Full-page navigation, kept apart so tests can replace it. */
export const navigation = {
  go: (url: string): void => window.location.assign(url),
};

/**
 * The platform's commands, built from the list in `@teb-ooo/web`: Sign out, My profile, Send feedback (the owner only),
 * and the platform's other apps. They are registered by `Shell` under their own group, so no app registers them and no
 * app can remove them.
 */
export function platformCommands({ signedIn, feedback }: PlatformCommandsInput): Command[] {
  return [
    {
      id: "platform:sign-out",
      title: "Sign out",
      group,
      keywords: ["logout", "log out", "leave"],
      icon: LogOut,
      when: () => signedIn,
      run: () => navigation.go(LOGOUT_PATH),
    },
    ...platformLinks().map(
      (l): Command => ({
        id: l.id,
        title: l.title,
        group,
        keywords: l.keywords,
        icon: icons[l.id] ?? ExternalLink,
        run: () => navigation.go(l.href),
      }),
    ),
    {
      id: "send-feedback",
      title: "Send feedback",
      group,
      keywords: ["report", "bug", "problem", "idea", "suggestion", "screenshot", "tell the agent"],
      icon: MessageSquarePlus,
      when: () => feedback.available,
      run: () => feedback.open(),
    },
  ];
}

/** Registers the platform commands while the shell is mounted. A no-op outside a `CommandProvider`. */
export function usePlatformCommands(input: PlatformCommandsInput): void {
  const host = useCommandHost();
  const latest = useRef(input);
  useLayoutEffect(() => {
    latest.current = input;
  });
  const handle = useRef<{ update: () => void } | null>(null);
  useEffect(() => {
    if (!host) return;
    const h = host.register(() => platformCommands(latest.current));
    handle.current = h;
    return () => {
      handle.current = null;
      h.unregister();
    };
  }, [host?.register]); // eslint-disable-line react-hooks/exhaustive-deps -- `register` is stable
  useEffect(() => handle.current?.update(), [input.signedIn, input.feedback.available]);
}
