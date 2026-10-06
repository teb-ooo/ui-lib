import { useState } from "react";
import { Bell, Home, ListChecks, Settings } from "lucide-react";
import { Sidebar } from "./sidebar";
import type { SidebarItem } from "./sidebar";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Sidebar",
  group: "Molecules",
  description:
    "Left navigation: items with an icon, label, badge and current-page state, collapsible to icons with tooltips. The app supplies the items and, through renderLink, its router's link. Inside a Shell it becomes the phone drawer.",
  aliases: ["navigation", "nav", "side menu", "navbar", "menu", "left nav", "drawer", "rail"],
  component: "Sidebar",
  source: "src/components/sidebar.tsx",
} satisfies StoryDefault;

const items: SidebarItem[] = [
  { id: "home", label: "Home", href: "#home", icon: <Home aria-hidden="true" className="size-4" /> },
  { id: "tasks", label: "Tasks", href: "#tasks", icon: <ListChecks aria-hidden="true" className="size-4" />, active: true, badge: 12 },
  { id: "inbox", label: "Inbox", href: "#inbox", icon: <Bell aria-hidden="true" className="size-4" />, badge: 3 },
  { id: "settings", label: "Settings", href: "#settings", icon: <Settings aria-hidden="true" className="size-4" /> },
];

export const Default = () => (
  <div className="panel h-80 w-fit">
    <Sidebar items={items} header="Tracker" footer={<span className="text-ink-faint">ada@example.com</span>} />
  </div>
);
Default.storyMeta = { description: "Expanded, with a header and a footer. The current page is reversed: white on a dark page, black on a light one." } satisfies StoryMeta;

export const Collapsible = () => {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <div className="panel h-80 w-fit">
      <Sidebar items={items} header="T" collapsed={collapsed} onCollapsedChange={setCollapsed} />
    </div>
  );
};
Collapsible.storyMeta = { description: "Collapsed to icons; hover or focus an icon for its name. The toggle expands it again." } satisfies StoryMeta;

export const Fit = () => (
  <div className="flex items-start gap-4">
    <div className="panel h-80 w-fit" data-testid="sidebar-fit">
      <Sidebar items={items} header="Tracker" width="fit" />
    </div>
    <div className="panel h-80 w-fit" data-testid="sidebar-wide">
      <Sidebar items={items} header="Tracker" />
    </div>
  </div>
);
Fit.storyMeta = { description: "A handful of static links: width=\"fit\" (left) sizes the column to its longest label, between 10rem and 16rem; the default wide column (right) is a fixed 16rem and mostly empty here. Use fit for static links, wide for items that change or have long labels." } satisfies StoryMeta;
