import { useEffect, useLayoutEffect, useRef } from "react";
import { ArrowLeftRight, ExternalLink, LayoutDashboard, ListTodo, LogOut, MessageSquarePlus, Palette, User } from "lucide-react";
import { LOGOUT_PATH, getPlayground, platformLinks } from "@teb-ooo/web";
import type { Command, CommandIcon } from "../cmdk/types";
import { useCommandHost } from "./command-host";

const group = "Platform";

/** The hotkey of Send feedback (owner only): Cmd or Ctrl and I. No Shift, like Cmd+K. Some browsers bind it (Page Info in Firefox, Email this page in Safari); the hotkey takes it over while the app has focus. */
export const FEEDBACK_SHORTCUT = "mod+i";
/** The palette's own hotkey, shown on its icon. */
export const PALETTE_SHORTCUT = "mod+k";

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

/**
 * The same page in the other environment: `app-staging.teb.ooo/x?y#z` and `app.teb.ooo/x?y#z` swap. Null when the host is
 * not one of those (local development, an address with no dot) or when `env` says neither staging nor production.
 */
export function otherEnvironment(href: string, env: string): { to: "staging" | "production"; url: string } | null {
  let u: URL;
  try {
    u = new URL(href);
  } catch {
    return null;
  }
  const [label, ...rest] = u.hostname.split(".");
  if (!label || rest.length === 0) return null;
  if (env === "staging" && label.endsWith("-staging")) {
    u.hostname = [label.slice(0, -"-staging".length), ...rest].join(".");
    return { to: "production", url: u.toString() };
  }
  if (env === "production" && !label.endsWith("-staging")) {
    u.hostname = [`${label}-staging`, ...rest].join(".");
    return { to: "staging", url: u.toString() };
  }
  return null;
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
      id: "platform:switch-environment",
      // Read when the list is built: the title names where it goes ("Switch to staging").
      title: otherEnvironment(window.location.href, getPlayground().env)?.to === "staging" ? "Switch to staging" : "Switch to production",
      group,
      keywords: ["staging", "production", "prod", "environment", "swap", "other version", "live"],
      icon: ArrowLeftRight,
      // The owner only, like Send feedback, and only on a real staging or production address.
      when: () => feedback.available && otherEnvironment(window.location.href, getPlayground().env) !== null,
      run: () => {
        const other = otherEnvironment(window.location.href, getPlayground().env);
        if (other) navigation.go(other.url);
      },
    },
    {
      id: "send-feedback",
      title: "Send feedback",
      group,
      // Semicolon, two keys right of K: no Shift, and none of Chrome, Firefox, Safari or Edge uses Cmd or Ctrl with it.
      shortcut: FEEDBACK_SHORTCUT,
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
