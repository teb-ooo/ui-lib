import { useState } from "react";
import type { ReactNode } from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { LOGOUT_PATH, platformLinks, playground, useAgentStatus, useFeedback, useHasLiveStream, useLiveStatus, useUser } from "@teb-ooo/web";
import { useMinWidth } from "../hooks/use-media-query";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { useCommandHost } from "./command-host";
import { FeedbackPanel } from "./feedback-panel";
import { PlatformBar } from "./platform-bar";
import { ToastProvider } from "./toast";
import { usePlatformCommands } from "./platform-commands";
import { ShellContext } from "./shell-context";

export interface ShellProps {
  /**
   * Usually a `Sidebar`. From the md breakpoint it is a column on the left; below it, a drawer opened from the bar's menu icon.
   * Leave it out (or `null`) for an app with no sidebar: there is then no column, no menu icon and no drawer, and the page
   * takes the full width at every breakpoint.
   */
  sidebar?: ReactNode;
  children: ReactNode;
  /** Label of the phone menu icon. @default "Open menu" */
  menuLabel?: string;
  /** Accessible name of the phone drawer. @default "Menu" */
  drawerLabel?: string;
  /** Label of the drawer's close button. @default "Close" */
  closeLabel?: string;
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
export function Shell({ sidebar = null, children, menuLabel = "Open menu", drawerLabel = "Menu", closeLabel = "Close", className }: ShellProps) {
  const wide = useMinWidth("md");
  const hasSidebar = sidebar !== null && sidebar !== undefined && sidebar !== false;
  const [open, setOpen] = useState(false);
  const host = useCommandHost();
  const liveStatus = useLiveStatus();
  const hasLive = useHasLiveStream();
  const { user, isLoading } = useUser();
  const feedback = useFeedback();
  const [agentOpen, setAgentOpen] = useState(false);
  const agent = useAgentStatus({ fast: agentOpen });
  usePlatformCommands({ signedIn: user !== null && user !== undefined, feedback });
  const next = encodeURIComponent(typeof window === "undefined" ? "/" : window.location.pathname + window.location.search);
  const profile = platformLinks().find((l) => l.id === "platform:profile");
  return (
    <ToastProvider>
    <div className={cn("flex h-dvh w-full flex-col overflow-hidden bg-ground text-ink", className)}>
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
        {...(wide || !hasSidebar ? {} : { onOpenMenu: () => setOpen(true), menuLabel })}
      />
      <FeedbackPanel feedback={feedback} />
      <div className="flex min-h-0 flex-1">
        {wide && hasSidebar ? <aside className="shrink-0 border-r border-line">{sidebar}</aside> : null}
        <main className="min-h-0 min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
      {wide || !hasSidebar ? null : (
        <BaseDialog.Root open={open} onOpenChange={setOpen}>
          <BaseDialog.Portal>
            <BaseDialog.Backdrop className="anim-backdrop fixed inset-0 z-50 bg-black/50" />
            <BaseDialog.Popup className="anim-fade fixed inset-y-0 left-0 z-50 flex w-[min(20rem,85vw)] flex-col border-r border-line bg-ground text-ink outline-none">
              <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
                <BaseDialog.Title className="text-ink">{drawerLabel}</BaseDialog.Title>
                <BaseDialog.Close render={<Button icon={<X aria-hidden="true" className="size-4" />} aria-label={closeLabel} className="border-transparent" />} />
              </div>
              <div className="min-h-0 flex-1">
                <ShellContext.Provider value={{ inDrawer: true, closeDrawer: () => setOpen(false) }}>{sidebar}</ShellContext.Provider>
              </div>
            </BaseDialog.Popup>
          </BaseDialog.Portal>
        </BaseDialog.Root>
      )}
    </div>
    </ToastProvider>
  );
}
