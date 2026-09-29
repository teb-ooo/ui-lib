import { useState } from "react";
import type { ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { CommandProvider, CommandTrigger } from "@teb-ooo/cmdk";
import { Button, Chip } from "@teb-ooo/ui";
import { GalleryCommands } from "./gallery-commands";
import { Sidebar } from "./sidebar";
import { ThemeControl } from "./theme-control";

/** Command palette provider, header with the theme control and trigger, sidebar (a menu on phones) and content pane. */
export function Shell({ current, children }: { current: string | null; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <CommandProvider>
      <GalleryCommands />
      <div className="flex min-h-dvh flex-col bg-ground text-ink">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-line bg-ground px-4">
          <Button
            className="md:hidden"
            icon={menuOpen ? <X aria-hidden="true" className="size-4" /> : <Menu aria-hidden="true" className="size-4" />}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="sidebar"
            onClick={() => setMenuOpen(!menuOpen)}
          />
          <span className="display">Design</span>
          <Chip tone="muted">ui</Chip>
          <div className="ml-auto flex items-center gap-2">
            <ThemeControl />
            <CommandTrigger />
          </div>
        </header>
        <div className="flex flex-1">
          <aside
            id="sidebar"
            className={`${menuOpen ? "block" : "hidden"} w-full shrink-0 overflow-y-auto border-line p-4 md:sticky md:top-14 md:block md:h-[calc(100dvh-3.5rem)] md:w-64 md:border-r`}
          >
            <Sidebar current={current} onNavigate={() => setMenuOpen(false)} />
          </aside>
          <main className={`${menuOpen ? "hidden md:block" : "block"} min-w-0 flex-1 p-4 md:p-8`}>{children}</main>
        </div>
      </div>
    </CommandProvider>
  );
}
