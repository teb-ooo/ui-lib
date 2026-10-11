import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { LOGOUT_PATH, platformLinks, playground, useAgentStatus, useFeedback, useHasLiveStream, useLiveStatus, useUser } from "@teb-ooo/web";
import { useMinWidth } from "../hooks/use-media-query";
import { cn } from "../lib/cn";
import { usePortalContainer } from "../lib/theme-scope";
import { useCommandHost } from "./command-host";
import { FeedbackPanel } from "./feedback-panel";
import { PlatformBar } from "./platform-bar";
import { ToastProvider } from "./toast";
import { usePlatformCommands } from "./platform-commands";
import { ShellContext } from "./shell-context";

export interface ShellProps {
  /**
   * Usually a `Sidebar`. From the md breakpoint it is a column on the left; below it, opened from the bar's menu icon, it is revealed under the page, which slides aside (it is not a modal: Escape, a tap or a drag on the page closes it).
   * Leave it out (or `null`) for an app with no sidebar: there is then no column, no menu icon and no drawer, and the page
   * takes the full width at every breakpoint.
   */
  sidebar?: ReactNode;
  children: ReactNode;
  /** Label of the phone menu icon. @default "Open menu" */
  menuLabel?: string;
  /** Accessible name of the phone menu. @default "Menu" */
  drawerLabel?: string;
  /** Label of the button that closes the menu: the dimmed content pushed aside. @default "Close" */
  closeLabel?: string;
  /** Label of the skip link, the first Tab stop: it jumps past the platform bar and the sidebar to the content. @default "Skip to content" */
  skipLabel?: string;
  className?: string;
}

/**
 * The closed platform shell: the platform's top bar (`PlatformBar`, built in), the sidebar and the content, the full
 * viewport height. The content scrolls; the sidebar stays. There is no header prop, no slot and nothing an app can put
 * in the bar: the app name, the live dot, the environment mark, the palette trigger, Send feedback (owner only) and the
 * person menu come from the platform. The shell also registers the platform commands in the palette and owns the
 * feedback panel, so mount it inside `CommandProvider` (and the router and query client). App navigation and actions
 * belong in the sidebar, the page and Cmd+K commands.
 */
export function Shell({ sidebar = null, children, menuLabel = "Open menu", drawerLabel = "Menu", closeLabel = "Close", skipLabel = "Skip to content", className }: ShellProps) {
  const mainRef = useRef<HTMLElement>(null);
  const opener = useRef<Element | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const dragStart = useRef<number | null>(null);
  const tintHost = usePortalContainer();
  const [navWidth, setNavWidth] = useState<number | null>(null);
  const wide = useMinWidth("md");
  const hasSidebar = sidebar !== null && sidebar !== undefined && sidebar !== false;
  const [open, setOpen] = useState(false);
  // The menu stays in the page while the plane slides back, then goes.
  const [rendered, setRendered] = useState(false);
  const menu = !wide && hasSidebar;
  const openMenu = () => {
    opener.current = document.activeElement;
    setRendered(true);
    setOpen(true);
  };
  const closeMenu = () => setOpen(false);
  useEffect(() => {
    if (open) {
      navRef.current?.querySelector<HTMLElement>("a, button")?.focus();
      return;
    }
    if (!rendered) return;
    const t = window.setTimeout(() => setRendered(false), 260);
    (opener.current as HTMLElement | null)?.focus?.();
    return () => window.clearTimeout(t);
  }, [open, rendered]);
  // The menu is as wide as its content (the longest label), not a fixed column; the page slides aside by exactly that.
  useLayoutEffect(() => {
    if (rendered && navRef.current) setNavWidth(navRef.current.offsetWidth);
  }, [rendered]);
  useEffect(() => {
    if (wide) {
      setOpen(false);
      setRendered(false);
    }
  }, [wide]);
  const host = useCommandHost();
  const liveStatus = useLiveStatus();
  const hasLive = useHasLiveStream();
  const { user, isLoading } = useUser();
  const feedback = useFeedback();
  const [agentOpen, setAgentOpen] = useState(false);
  const agent = useAgentStatus({ fast: agentOpen });
  usePlatformCommands({ signedIn: user !== null && user !== undefined, admin: Boolean(user && (user.is_admin || user.is_owner)), feedback });
  const next = encodeURIComponent(typeof window === "undefined" ? "/" : window.location.pathname + window.location.search);
  const profile = platformLinks().find((l) => l.id === "platform:profile");
  return (
    <ToastProvider>
    {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- Escape closes the phone menu from anywhere inside the shell */}
    <div
      onKeyDown={(e) => {
        if (open && e.key === "Escape") closeMenu();
      }}
      style={{ ["--shell-nav-w" as string]: navWidth ? `${navWidth}px` : "min(14rem, 85vw)" }}
      // behind the pushed-aside page is the menu's colour, so its rounded corners show the menu continuing under them
      className={cn("relative h-dvh w-full overflow-hidden contain-paint text-ink", menu && rendered ? "bg-ink" : "bg-ground", className)}
    >
      {/* The phone menu lies under the page; the page slides aside to show it. */}
      {menu && rendered ? (
        <aside
          ref={navRef}
          aria-label={drawerLabel}
          inert={!open}
          className="panel-inverse absolute inset-y-0 left-0 w-max min-w-48 max-w-[85vw] overflow-hidden rounded-none border-0 pt-[env(safe-area-inset-top)] text-ink"
        >
          <ShellContext.Provider value={{ inDrawer: true, closeDrawer: closeMenu }}>{sidebar}</ShellContext.Provider>
        </aside>
      ) : null}
      <div
        className={cn(
          "relative flex h-full w-full flex-col overflow-hidden bg-ground transition-[translate] duration-200 ease-out motion-reduce:transition-none",
          menu && open && "panel-float rounded-plane translate-x-[var(--shell-nav-w)]",
        )}
      >
        <div inert={menu && open} className="flex min-h-0 flex-1 flex-col">
          {/* The first Tab stop: invisible until it has focus. It moves focus to the content without changing the address. */}
          <a
            href="#shell-main"
            onClick={(e) => {
              e.preventDefault();
              mainRef.current?.focus();
            }}
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:rounded focus:border focus:border-line-strong focus:bg-ground focus:px-3 focus:py-1 focus:text-ink focus:outline-none"
          >
            {skipLabel}
          </a>
          <PlatformBar
            appName={playground.appName || "app"}
            env={playground.env}
            live={hasLive ? liveStatus : null}
            user={isLoading ? undefined : user ? { name: user.username || user.email, email: user.email } : null}
            profileHref={profile?.href ?? null}
            signOutHref={LOGOUT_PATH}
            signInHref={`/auth/login?next=${next}`}
            onOpenPalette={() => host?.open()}
            paletteOpen={host?.isOpen ?? false}
            {...(playground.claudeSessionUrl ? { agentHref: playground.claudeSessionUrl } : {})}
            agentStatus={agent?.status ?? null}
            {...(agent ? { agentDetails: { action: agent.action, turnStartedAt: agent.turnStartedAt, serverTime: agent.serverTime, receivedAt: agent.receivedAt } } : {})}
            onAgentOpenChange={setAgentOpen}
            {...(feedback.available ? { onFeedback: feedback.open } : {})}
            {...(wide || !hasSidebar ? {} : { onOpenMenu: openMenu, menuLabel })}
          />
          <FeedbackPanel feedback={feedback} />
          <div className="flex min-h-0 flex-1">
            {wide && hasSidebar ? <aside className="shrink-0 border-r border-line">{sidebar}</aside> : null}
            <main ref={mainRef} id="shell-main" tabIndex={-1} className="min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain pb-[env(safe-area-inset-bottom)] outline-none">
              {children}
            </main>
          </div>
        </div>
        {/* While the menu is open the pushed-aside page is a button: a tap closes it, and so does a drag to the left. */}
        {menu && open ? (
          <button
            type="button"
            aria-label={closeLabel}
            onClick={closeMenu}
            onPointerDown={(e) => {
              dragStart.current = e.clientX;
              e.currentTarget.setPointerCapture?.(e.pointerId);
            }}
            onPointerUp={(e) => {
              if (dragStart.current !== null && dragStart.current - e.clientX > 48) closeMenu();
              dragStart.current = null;
            }}
            className="absolute inset-0 z-10 cursor-pointer touch-pan-y outline-none"
          />
        ) : null}
      </div>
      {/*
        iOS Safari paints the strip behind its bottom toolbar from the fixed element at the bottom edge, and keeps the colour of
        the last one (a closed panel's white) when it goes. This one never goes: it is the page's own colour, pinned to the
        viewport (so it is a portal: the shell contains its own fixed children), as tall as the home-indicator inset.
      */}
      {typeof document === "undefined"
        ? null
        : createPortal(<div aria-hidden="true" data-edge-tint style={{ ["--shell-nav-w" as string]: navWidth ? `${navWidth}px` : "min(14rem, 85vw)" }} className={cn("pointer-events-none fixed inset-x-0 bottom-0 h-[max(env(safe-area-inset-bottom),1px)]", menu && open ? "bg-[linear-gradient(to_right,var(--color-ink)_var(--shell-nav-w),var(--color-ground)_0)]" : "bg-ground")} />, tintHost ?? document.body)}
    </div>
    </ToastProvider>
  );
}
