import { useState } from "react";
import { Home, ListChecks } from "lucide-react";
import { Shell } from "./shell";
import { Sidebar } from "./sidebar";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Shell",
  group: "Molecules",
  description:
    "The page frame: a sidebar and a content area with a top bar, the full viewport height. From the md breakpoint the sidebar is a column; below it a menu button opens it as a drawer. The app supplies the sidebar and the header; the Shell has no routing or navigation of its own. Use it once, at the root of a page.",
  component: "Shell",
  source: "src/components/shell.tsx",
} satisfies StoryDefault;

export const Default = () => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="panel h-96 overflow-hidden [&>div]:!h-full">
      <Shell
        sidebar={
          <Sidebar
            header="Tracker"
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
            items={[
              { id: "home", label: "Home", href: "#home", icon: <Home aria-hidden="true" className="size-4" />, active: true },
              { id: "tasks", label: "Tasks", href: "#tasks", icon: <ListChecks aria-hidden="true" className="size-4" />, badge: 4 },
            ]}
          />
        }
        header={<span className="text-ink">Home</span>}
      >
        <p className="p-4 text-ink-muted">Page content. On a phone the menu button in the top bar opens the sidebar as a drawer.</p>
      </Shell>
    </div>
  );
};
Default.storyMeta = { description: "Shown in a framed box here; a real page uses the whole window." } satisfies StoryMeta;
