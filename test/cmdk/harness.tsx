import { render } from "@testing-library/react";
import { Outlet, RouterProvider, createMemoryHistory, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CommandProvider, CommandTrigger } from "../../src/cmdk/index";

export interface TestRoute {
  path: string;
  title?: string;
  component?: () => ReactNode;
}

export interface AppOptions {
  routes?: TestRoute[];
  /** Extra content rendered inside the provider, beside the trigger. */
  extra?: ReactNode;
  playground?: Record<string, unknown>;
  withRouter?: boolean;
  initialPath?: string;
  signOutPath?: string | false;
}

export const DEFAULT_ROUTES: TestRoute[] = [
  { path: "/", title: "Home" },
  { path: "/items", title: "Items" },
  { path: "/items/$id", title: "Item detail" },
  { path: "/settings" },
  { path: "/_agent", title: "Agent" },
];

/** Renders an app: memory router, `CommandProvider` at the root, a trigger and an input for focus tests. */
export async function renderApp(options: AppOptions = {}) {
  if (options.playground) (window as unknown as { __PLAYGROUND__?: unknown }).__PLAYGROUND__ = options.playground;
  const root = createRootRoute({
    component: () => (
      <CommandProvider {...(options.signOutPath !== undefined ? { signOutPath: options.signOutPath } : {})}>
        <header>
          <CommandTrigger />
          <input aria-label="page field" />
        </header>
        <Outlet />
        {options.extra}
      </CommandProvider>
    ),
  });
  const children = (options.routes ?? DEFAULT_ROUTES).map((r) =>
    createRoute({
      getParentRoute: () => root,
      path: r.path,
      staticData: r.title !== undefined ? { title: r.title } : undefined,
      component: r.component ?? (() => <p data-testid="page">{r.path}</p>),
    }),
  );
  const router = createRouter({
    routeTree: root.addChildren(children),
    history: createMemoryHistory({ initialEntries: [options.initialPath ?? "/"] }),
  });
  await router.load();
  const utils = render(<RouterProvider router={router} />);
  return { router, ...utils };
}

/** Renders the provider without any router. */
export function renderBare(ui: ReactNode) {
  return render(<CommandProvider>{ui}</CommandProvider>);
}
