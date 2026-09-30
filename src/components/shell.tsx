import { useState } from "react";
import type { ReactNode } from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import { useMinWidth } from "../hooks/use-media-query";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { ShellContext } from "./shell-context";

export interface ShellProps {
  /** Usually a `Sidebar`. From the md breakpoint it is a column on the left; below it, a drawer opened from the header. */
  sidebar: ReactNode;
  /** The top bar of the content area (page title, search, user). On a phone the menu button sits before it. */
  header?: ReactNode;
  children: ReactNode;
  /** Label of the phone menu button. @default "Open menu" */
  menuLabel?: string;
  /** Accessible name of the phone drawer. @default "Menu" */
  drawerLabel?: string;
  /** Label of the drawer's close button. @default "Close" */
  closeLabel?: string;
  className?: string;
}

/**
 * The page frame: sidebar and content, the full viewport height. The content area scrolls; the sidebar stays.
 * It has no routing or navigation content of its own: the app supplies the sidebar and the header.
 */
export function Shell({ sidebar, header, children, menuLabel = "Open menu", drawerLabel = "Menu", closeLabel = "Close", className }: ShellProps) {
  const wide = useMinWidth("md");
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("flex h-dvh w-full overflow-hidden bg-ground text-ink", className)}>
      {wide ? <aside className="shrink-0 border-r border-line">{sidebar}</aside> : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-12 shrink-0 items-center gap-2 border-b border-line px-4">
          {wide ? null : <Button icon={<Menu aria-hidden="true" className="size-4" />} aria-label={menuLabel} onClick={() => setOpen(true)} />}
          {header}
        </header>
        <main className="min-h-0 min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
      {wide ? null : (
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
  );
}
