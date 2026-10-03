import type { ReactNode } from "react";
import { Menu } from "@base-ui/react/menu";
import { Bot, LogIn, LogOut, Menu as MenuIcon, MessageCircle, Search, User } from "lucide-react";
import { cn } from "../lib/cn";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { turnElapsedMs } from "@teb-ooo/web";
import { Kbd } from "./kbd";
import { LiveIndicator } from "./live-indicator";
import { FEEDBACK_SHORTCUT } from "./platform-commands";
import type { LiveStatus } from "./live-indicator";

export type AgentBarStatus = "working" | "idle" | "offline" | "logged_out";

export interface AgentBarDetails {
  /** The current action: a label such as "Editing" and a safe target such as a repo-relative path. */
  action?: { label: string; target: string } | null;
  /** RFC 3339 start of the current turn, or "". */
  turnStartedAt?: string;
  serverTime?: number;
  receivedAt?: number;
}
import { Tooltip } from "./tooltip";

export interface PlatformBarProps {
  /** The app's name (`playground.appName`): the only text in the bar. */
  appName: string;
  /** `staging` (or another non-production environment) shows an orange 48 by 8 px bar after the name; production shows nothing. */
  env?: string;
  /** What `useLiveStatus()` from `@teb-ooo/web` reports. The dot shows only for `reconnecting` and `degraded`: connected, off and `null` (an app with no live data) show nothing. */
  live: LiveStatus | null;
  /** The signed-in person; `null` when signed out; `undefined` while it is not known yet. */
  user?: { name: string; email?: string } | null;
  /** Where "My profile" goes, or null when it cannot be resolved (local development). */
  profileHref?: string | null;
  signOutHref: string;
  signInHref: string;
  onOpenPalette: () => void;
  paletteOpen?: boolean;
  /** The app's agent session (`playground.claudeSessionUrl`): the agent icon is a link that opens it in a new tab. Absent when the app has none. */
  agentHref?: string;
  /**
   * The agent's status (`useAgentStatus()` from `@teb-ooo/web`): a dot on the agent icon. `null` or absent (not the owner,
   * a test browser, no route) draws no dot. Without `agentHref` the icon is shown anyway when there is a status.
   */
  agentStatus?: AgentBarStatus | null;
  /** What the agent is doing, for the bubble beside the agent icon while it works (from `useAgentStatus()`); needs `agentStatus`. */
  agentDetails?: AgentBarDetails;
  /** The agent bubble showed or hid (it is shown exactly while the agent works): the app polls faster while it is shown. */
  onAgentOpenChange?: (open: boolean) => void;
  /** Present only for the owner: the Send feedback icon. */
  onFeedback?: () => void;
  /** Present on a phone: the menu icon that opens the sidebar drawer. */
  onOpenMenu?: () => void;
  menuLabel?: string;
}

const iconButton =
  "inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-ink-muted outline-none transition-colors hover:bg-surface-raised hover:text-ink focus-visible:bg-surface-raised focus-visible:text-ink focus-visible:ring-1 focus-visible:ring-ink-muted";

function Icon({ tip, shortcut, children, ...rest }: { tip: string; shortcut?: string; children: ReactNode } & Record<string, unknown>) {
  return (
    <Tooltip
      tip={
        shortcut ? (
          <span className="inline-flex items-center gap-2">
            {tip}
            <Kbd shortcut={shortcut} />
          </span>
        ) : (
          tip
        )
      }
      side="bottom"
    >
      <button type="button" aria-label={tip} className={iconButton} {...rest}>
        {children}
      </button>
    </Tooltip>
  );
}

const agentTexts: Record<AgentBarStatus, string> = {
  working: "is working",
  idle: "is idle",
  offline: "is offline",
  logged_out: "is signed out",
};

// Colour is state: the agent colour while it works (pulsing), quiet when idle, warning when it cannot be reached,
// danger when it is signed out. Idle and offline differ by fill versus ring as well, not by colour alone.
const agentDots: Record<AgentBarStatus, string> = {
  working: "bg-agent motion-safe:animate-pulse",
  idle: "bg-ink-faint",
  offline: "border border-warning bg-transparent",
  logged_out: "bg-danger",
};

function AgentDot({ status }: { status: AgentBarStatus }) {
  return <span aria-hidden="true" data-dot={status} className={cn("absolute right-0.5 top-0.5 size-2 rounded", agentDots[status])} />;
}

/** 24m23s, 1h02m, 45s: compact, no spaces. */
function compactElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m${String(sec).padStart(2, "0")}s`;
  return `${sec}s`;
}

function useElapsed(details: AgentBarDetails | undefined, active: boolean): string | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  if (!details) return null;
  const ms = turnElapsedMs({ turnStartedAt: details.turnStartedAt ?? "", serverTime: details.serverTime ?? 0, receivedAt: details.receivedAt ?? now }, now);
  return ms === null ? null : compactElapsed(ms);
}

/**
 * The chat bubble to the left of the agent icon while the agent works: what it is doing ("Running a command", or
 * "Thinking" with no action) and how long the turn has run, in lighter text. It is not opened by anything: it fades and
 * scales in when work starts and out when it stops, and when the status text changes its width glides to fit the new
 * text (width is the one layout property that moves here, because the text has to keep its shape). It is an inverted
 * panel like the popovers, with an arrow toward the icon.
 */
function AgentBubble({ working, details }: { working: boolean; details: AgentBarDetails | undefined }) {
  const [mounted, setMounted] = useState(working);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (working) {
      setMounted(true);
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 200);
    return () => clearTimeout(t);
  }, [working]);

  // The last text stays while the bubble fades out.
  const live = useRef({ label: "Thinking", elapsed: null as string | null });
  const elapsed = useElapsed(details, working);
  if (working) live.current = { label: details?.action?.label || "Thinking", elapsed };
  const { label, elapsed: time } = live.current;

  const inner = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setWidth(el.getBoundingClientRect().width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted]);

  if (!mounted) return null;
  return (
    <div
      role="status"
      aria-label="Agent progress"
      data-agent-bubble={shown ? "open" : "closed"}
      className="agent-bubble panel-inverse panel-float pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2"
    >
      <div className="agent-bubble-clip overflow-hidden" style={width === null ? undefined : { width }}>
        <div ref={inner} className="flex h-6 w-max items-center gap-2 whitespace-nowrap px-2">
          <span className="max-w-[40vw] truncate">{label}</span>
          {time ? <span className="tabular-nums text-ink-muted">{time}</span> : null}
        </div>
      </div>
      <span aria-hidden="true" data-side="left" className="popover-arrow" style={{ top: "50%", marginTop: -5 }} />
    </div>
  );
}

const menuItem =
  "flex min-h-[var(--control-h)] cursor-pointer items-center gap-2 rounded px-2 text-ink no-underline outline-none data-[highlighted]:bg-surface-raised";

/**
 * The platform's top bar, 2.25rem (36px) tall, one line, on every screen size. The only text is the app's name; everything
 * else is an icon with an accessible name and a tooltip (the environment mark is an orange bar after the name): the live dot, the palette trigger, Send
 * feedback (owner only) and the person menu.
 *
 * `Shell` draws it from the platform's own data and takes nothing from the app. It is exported for the design gallery
 * only: an app never renders it, and the platform shell contract (docs/shell.md) forbids adding anything to it.
 */
export function PlatformBar({
  appName,
  env,
  live,
  user,
  profileHref,
  signOutHref,
  signInHref,
  onOpenPalette,
  paletteOpen = false,
  agentHref,
  agentStatus,
  agentDetails,
  onAgentOpenChange,
  onFeedback,
  onOpenMenu,
  menuLabel = "Open menu",
}: PlatformBarProps) {
  // Connected is the expected state and shows nothing; the dot appears only when live updates are reconnecting or degraded.
  // `off` (a hidden tab, a test browser, a stream that is switched off) is not a fault either.
  const dot = live === "reconnecting" || live === "degraded" ? live : null;
  const marked = env !== undefined && env !== "" && env !== "production" && env !== "prod";
  const envName = marked ? env.charAt(0).toUpperCase() + env.slice(1) : "";
  const agentWorking = agentStatus === "working";
  useEffect(() => {
    onAgentOpenChange?.(agentWorking);
  }, [agentWorking, onAgentOpenChange]);
  return (
    <header className="flex h-9 shrink-0 items-center gap-1 border-b border-line bg-ground px-1 text-ink">
      {onOpenMenu ? (
        <Icon tip={menuLabel} onClick={onOpenMenu}>
          <MenuIcon aria-hidden="true" className="size-4" />
        </Icon>
      ) : null}
      <span className="truncate px-1 text-ink uppercase">{appName}</span>
      {dot ? (
        <LiveIndicator status={dot} tip className="size-7 justify-center rounded outline-none focus-visible:ring-1 focus-visible:ring-ink-muted" />
      ) : null}
      {marked ? (
        <Tooltip tip={envName} side="bottom">
          <span role="img" aria-label={envName} tabIndex={0} className="h-2 w-12 shrink-0 rounded bg-agent outline-none focus-visible:ring-1 focus-visible:ring-ink-muted" />
        </Tooltip>
      ) : null}
      <div className="flex-1" />
      {agentStatus ? (
        <span className="relative inline-flex">
          <AgentBubble working={agentStatus === "working"} details={agentDetails} />
          <Tooltip tip={`Agent ${agentTexts[agentStatus]}`} side="bottom">
            {agentHref ? (
              <a href={agentHref} target="_blank" rel="noopener noreferrer" aria-label={`Agent ${agentTexts[agentStatus]}`} data-agent-status={agentStatus} className={cn(iconButton, "relative")}>
                <Bot aria-hidden="true" className="size-4" />
                <AgentDot status={agentStatus} />
              </a>
            ) : (
              <span role="img" tabIndex={0} aria-label={`Agent ${agentTexts[agentStatus]}`} data-agent-status={agentStatus} className={cn(iconButton, "relative cursor-default")}>
                <Bot aria-hidden="true" className="size-4" />
                <AgentDot status={agentStatus} />
              </span>
            )}
          </Tooltip>
        </span>
      ) : agentHref ? (
        <Tooltip tip="Open the agent" side="bottom">
          <a href={agentHref} target="_blank" rel="noopener noreferrer" aria-label="Open the agent" className={cn(iconButton, "relative")}>
            <Bot aria-hidden="true" className="size-4" />
          </a>
        </Tooltip>
      ) : null}
      <Icon tip="Open command palette" shortcut="mod+k" aria-haspopup="dialog" aria-expanded={paletteOpen} onClick={onOpenPalette}>
        <Search aria-hidden="true" className="size-4" />
      </Icon>
      {onFeedback ? (
        <Icon tip="Send feedback" shortcut={FEEDBACK_SHORTCUT} onClick={onFeedback}>
          <MessageCircle aria-hidden="true" className="size-4" />
        </Icon>
      ) : null}
      {user === undefined ? (
        <span aria-hidden="true" className="size-7" />
      ) : user === null ? (
        <Tooltip tip="Sign in" side="bottom">
          <a href={signInHref} aria-label="Sign in" className={iconButton}>
            <LogIn aria-hidden="true" className="size-4" />
          </a>
        </Tooltip>
      ) : (
        <Menu.Root>
          <Tooltip tip="Account" side="bottom">
            <Menu.Trigger aria-label="Account" className={iconButton}>
              <User aria-hidden="true" className="size-4" />
            </Menu.Trigger>
          </Tooltip>
          <Menu.Portal>
            <Menu.Positioner align="end" sideOffset={4} className="z-50">
              <Menu.Popup className={cn("anim-fade panel panel-float min-w-48 p-1 text-ink outline-none")}>
                <div className="px-2 py-1 text-ink-muted">{user.email ?? user.name}</div>
                <Menu.Separator className="my-1 h-px bg-line" />
                {profileHref ? (
                  <Menu.Item render={<a href={profileHref} />} className={menuItem}>
                    <User aria-hidden="true" className="size-4" />
                    My profile
                  </Menu.Item>
                ) : null}
                <Menu.Item render={<a href={signOutHref} />} className={menuItem}>
                  <LogOut aria-hidden="true" className="size-4" />
                  Sign out
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      )}
    </header>
  );
}
