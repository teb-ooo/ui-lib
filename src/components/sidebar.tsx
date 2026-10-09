import type { ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { Tooltip } from "./tooltip";
import { useShell } from "./shell-context";

export interface SidebarItem {
  id: string;
  label: string;
  icon?: ReactNode;
  href: string;
  /** Marks the current page (`aria-current="page"`). */
  active?: boolean;
  /** A count or short text after the label. */
  badge?: number | string;
  /** Heading for a run of items: it is drawn before the first item of each new group. */
  group?: string;
}

export interface SidebarLinkProps {
  className: string;
  "aria-current"?: "page";
  onClick: () => void;
}

export interface SidebarProps {
  items: SidebarItem[];
  /** Above the items (a name or logo). Hidden text should still have an accessible name. */
  header?: ReactNode;
  /** Below the items (the signed-in user, a link). */
  footer?: ReactNode;
  /** Icons only. Ignored inside the phone drawer. */
  collapsed?: boolean;
  /** Giving this shows the collapse toggle. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Accessible name of the navigation. @default "Main" */
  label?: string;
  /**
   * `wide` is a fixed 16rem column: right for items that change (a list of threads, projects) or have long labels.
   * `fit` sizes the column to its longest label, between 10rem and 16rem: right for a handful of static links, where
   * a fixed 16rem is mostly empty space. Audit the sidebar of a screen with static links only and choose `fit`.
   * Ignored when collapsed to icons and in the phone drawer.
   * @default "wide"
   */
  width?: "wide" | "fit";
  /**
   * Draws an item's link so an app can use its router's link: put `props` on the element you return and `content` inside it.
   * The default is a plain anchor.
   */
  renderLink?: (
    item: SidebarItem,
    content: ReactNode,
    props: SidebarLinkProps,
  ) => ReactNode;
  className?: string;
}

const link =
  "flex h-[var(--control-h)] items-center gap-2 rounded px-2 text-ink-muted no-underline outline-none hover:bg-surface hover:text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-solid focus-visible:outline-ink-muted";

/** Left navigation: items with icon, label, badge and current-page state (reversed), collapsible to icons. The app supplies the items. */
export function Sidebar({
  items,
  header,
  footer,
  collapsed = false,
  onCollapsedChange,
  label = "Main",
  width = "wide",
  renderLink,
  className,
}: SidebarProps) {
  const { inDrawer, closeDrawer } = useShell();
  const iconsOnly = collapsed && !inDrawer;
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col bg-ground",
        iconsOnly ? "w-12" : width === "fit" ? "w-fit min-w-40 max-w-64" : "w-64",
        inDrawer && "w-full",
        className,
      )}
    >
      {header ? (
        <div className="shrink-0 px-2 pt-2">
          <div
            className={cn(
              "flex min-h-[var(--control-h)] items-center px-2 text-ink",
              iconsOnly && "justify-center px-0",
            )}
          >
            {header}
          </div>
        </div>
      ) : null}
      {/* The scroller is the sidebar's full width and the height between the header and the footer, so its scrollbar sits on the sidebar's own edge and the items scroll right up to the header and footer; the padding is inside it. */}
      <nav aria-label={label} className="min-h-0 flex-1 overflow-y-auto p-2">
        <ul className="flex flex-col gap-0.5">
          {items.map((item, i) => {
            const content = (
              <>
                {item.icon !== undefined || iconsOnly ? (
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    {item.icon}
                  </span>
                ) : null}
                {iconsOnly ? (
                  <span className="sr-only">{item.label}</span>
                ) : (
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                )}
                {!iconsOnly && item.badge !== undefined ? (
                  <span className="text-ink-faint">{item.badge}</span>
                ) : null}
              </>
            );
            const props: SidebarLinkProps = {
              className: cn(
                link,
                // The current page is reversed (white on a dark page): its icon, label and badge read as the other theme.
                item.active && "reversed",
                iconsOnly && "justify-center px-0",
                // An item under a group heading with no icon is indented by half of what an empty icon slot used to take.
                !iconsOnly && item.group !== undefined && item.icon === undefined && "pl-5",
              ),
              ...(item.active ? { "aria-current": "page" as const } : {}),
              onClick: closeDrawer,
            };
            const node = renderLink ? (
              renderLink(item, content, props)
            ) : (
              <a href={item.href} {...props}>
                {content}
              </a>
            );
            const heading =
              item.group !== undefined && item.group !== items[i - 1]?.group;
            return (
              <li key={item.id}>
                {heading ? (
                  iconsOnly ? (
                    <div role="presentation" className="my-2 h-px bg-line" />
                  ) : (
                    <p className="px-2 pt-3 pb-1 text-ink-faint uppercase">
                      {item.group}
                    </p>
                  )
                ) : null}
                {iconsOnly ? (
                  <Tooltip tip={item.label} side="right">
                    {node as React.ReactElement<Record<string, unknown>>}
                  </Tooltip>
                ) : (
                  node
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      {footer ? (
        <div className={cn("shrink-0 px-2 pb-2", iconsOnly && "px-0")}>{footer}</div>
      ) : null}
      {onCollapsedChange && !inDrawer ? (
        <div
          className={cn("flex shrink-0 px-2 pb-2", iconsOnly ? "justify-center" : "justify-end")}
        >
          <Button
            icon={
              collapsed ? (
                <PanelLeftOpen aria-hidden="true" className="size-4" />
              ) : (
                <PanelLeftClose aria-hidden="true" className="size-4" />
              )
            }
            tip={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            onClick={() => onCollapsedChange(!collapsed)}
            className="border-transparent"
          />
        </div>
      ) : null}
    </div>
  );
}
