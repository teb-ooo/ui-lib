import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@teb-ooo/ui";
import { entries, GROUPS } from "../registry";
import type { Entry } from "../registry";

/** Entries grouped in sidebar order; empty groups are dropped. */
export function groupEntries(list: Entry[]): Array<{ group: string; items: Entry[] }> {
  return GROUPS.map((group) => ({ group, items: list.filter((e) => e.group === group) })).filter((g) => g.items.length > 0);
}

/**
 * Grouped navigation, one level deep. Candidate for the ui package as a nav list atom:
 * rows are the shared .btn class with the active marker.
 */
export function Sidebar({ current, onNavigate }: { current: string | null; onNavigate?: () => void }) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  return (
    <nav aria-label="Design system" className="flex flex-col gap-4">
      {groupEntries(entries).map(({ group, items }) => {
        const collapsed = closed[group] === true;
        const listId = `nav-${group.toLowerCase()}`;
        return (
          <div key={group} className="flex flex-col gap-1">
            <Button
              className="w-full justify-start border-transparent"
              icon={collapsed ? <ChevronRight aria-hidden="true" className="size-4" /> : <ChevronDown aria-hidden="true" className="size-4" />}
              aria-expanded={!collapsed}
              aria-controls={listId}
              onClick={() => setClosed({ ...closed, [group]: !collapsed })}
            >
              {group}
            </Button>
            <ul id={listId} hidden={collapsed} className="m-0 flex list-none flex-col gap-1 p-0">
              {items.map((e) => (
                <li key={e.slug}>
                  <Link
                    to="/$group/$slug"
                    params={{ group: e.group.toLowerCase(), slug: e.slug.split("/")[1] ?? "" }}
                    onClick={onNavigate}
                    aria-current={current === e.slug ? "page" : undefined}
                    className="btn w-full justify-start border-transparent pl-8"
                    data-active={current === e.slug ? "" : undefined}
                  >
                    {e.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
