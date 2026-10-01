import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Home, ListChecks } from "lucide-react";
import { Shell } from "./shell";
import { Sidebar } from "./sidebar";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Shell",
  group: "Molecules",
  description:
    "The closed platform shell: the platform's slim top bar (built in, nothing an app can add), a sidebar and the content, the full viewport height. From the md breakpoint the sidebar is a column; below it the bar's menu icon opens it as a drawer. The shell also registers the platform commands in Cmd+K and owns the feedback panel. The app supplies only the sidebar and the page. Use it once, at the root, inside CommandProvider, the router and the query client.",
  aliases: ["top bar", "header", "app bar", "navbar", "platform bar", "app shell", "layout", "page frame", "scaffold", "chrome", "frame", "drawer layout"],
  component: "Shell",
  source: "src/components/shell.tsx",
} satisfies StoryDefault;

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

export const Default = () => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <QueryClientProvider client={client}>
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
      >
        <p className="p-4 text-ink-muted">Page content. On a phone the menu icon in the bar opens the sidebar as a drawer.</p>
      </Shell>
    </div>
    </QueryClientProvider>
  );
};
Default.storyMeta = { description: "Shown in a framed box here; a real page uses the whole window. The bar is the platform's: there is no header prop." } satisfies StoryMeta;
