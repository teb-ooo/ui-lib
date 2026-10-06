import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PaletteFromApi, paletteFetch, usePaletteSelection } from "../../src/cmdk/index";
import type { OpenApiDocument } from "../../src/cmdk/index";
import { renderApp } from "./harness";
import { redirectToLogin } from "@teb-ooo/web";

vi.mock("@teb-ooo/web", async (original) => ({ ...(await original<typeof import("@teb-ooo/web")>()), redirectToLogin: vi.fn() }));

const spec: OpenApiDocument = {
  paths: {
    "/api/items": { get: { operationId: "list-items", "x-palette": { source: { group: "Items", title: "{name}", route: "/items/{id}" } } } },
    "/api/items/{id}/archive": {
      post: { operationId: "archive-item", "x-palette": { title: "Archive this item", group: "Item", when: { route: "/items/$id" }, args: { id: "route.id" }, confirm: true } },
    },
    "/api/items/{id}/pin": {
      post: { operationId: "pin-item", "x-palette": { title: "Pin {name}", group: "Item", when: { route: "/items", needs: "selection" }, args: { id: "selection.id" } } },
    },
  },
};

function Selected() {
  usePaletteSelection({ id: "9", name: "Salt" });
  return <p>list</p>;
}

async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Open command palette" }));
  return await screen.findByRole("combobox", { name: "Search commands" });
}

describe("PaletteFromApi", () => {
  it("offers the action tagged for the open route, confirms, calls the operation with the route parameter", async () => {
    const call = vi.fn(async () => null);
    const confirm = vi.fn(() => true);
    const client = new QueryClient();
    const user = userEvent.setup();
    await renderApp({ initialPath: "/items/42", extra: <QueryClientProvider client={client}><PaletteFromApi spec={spec} call={call} confirm={confirm} /></QueryClientProvider> });
    await open(user);
    await user.click(await screen.findByRole("option", { name: /Archive this item/ }));
    await waitFor(() => expect(call).toHaveBeenCalledWith({ operationId: "archive-item", method: "post", path: "/api/items/{id}/archive", args: { id: "42" } }));
    expect(confirm).toHaveBeenCalledWith("Archive this item?", { danger: false });
  });

  it("does not offer it on another route, and offers a selection action once a screen publishes its row", async () => {
    const call = vi.fn(async () => null);
    const client = new QueryClient();
    const user = userEvent.setup();
    await renderApp({
      initialPath: "/items",
      routes: [{ path: "/items", component: () => <Selected /> }, { path: "/items/$id" }],
      extra: <QueryClientProvider client={client}><PaletteFromApi spec={spec} call={call} /></QueryClientProvider>,
    });
    await open(user);
    expect(screen.queryByRole("option", { name: /Archive this item/ })).toBeNull();
    await user.click(await screen.findByRole("option", { name: /Pin Salt/ }));
    await waitFor(() => expect(call).toHaveBeenCalledWith({ operationId: "pin-item", method: "post", path: "/api/items/{id}/pin", args: { id: "9" } }));
  });
});

describe("the default confirm", () => {
  it("is a dialog over the page: Cancel does not call the operation, Confirm does", async () => {
    const call = vi.fn(async () => null);
    const user = userEvent.setup();
    await renderApp({ initialPath: "/items/42", extra: <QueryClientProvider client={new QueryClient()}><PaletteFromApi spec={spec} call={call} /></QueryClientProvider> });
    await open(user);
    await user.click(await screen.findByRole("option", { name: /Archive this item/ }));
    const dialog = await screen.findByRole("dialog", { name: "Archive this item?" });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Archive this item?" })).toBeNull());
    expect(call).not.toHaveBeenCalled();
    await open(user);
    await user.click(await screen.findByRole("option", { name: /Archive this item/ }));
    await user.click(within(await screen.findByRole("dialog", { name: "Archive this item?" })).getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(call).toHaveBeenCalledTimes(1));
  });
});

describe("after.invalidate", () => {
  it("invalidates the queries of a generated hook, whose key is [method, path, init], and leaves others alone", async () => {
    const call = vi.fn(async () => null);
    const client = new QueryClient();
    client.setQueryData(["get", "/api/items", { params: {} }], { items: [] });
    client.setQueryData(["get", "/api/other", { params: {} }], { items: [] });
    const withAfter: OpenApiDocument = {
      paths: { "/api/items/{id}/archive": { post: { operationId: "archive-item", "x-palette": { title: "Archive this item", group: "Item", when: { route: "/items/$id" }, args: { id: "route.id" }, after: { invalidate: ["/api/items"] } } } } },
    };
    const user = userEvent.setup();
    await renderApp({ initialPath: "/items/42", extra: <QueryClientProvider client={client}><PaletteFromApi spec={withAfter} call={call} /></QueryClientProvider> });
    await open(user);
    await user.click(await screen.findByRole("option", { name: /Archive this item/ }));
    await waitFor(() => expect(client.getQueryState(["get", "/api/items", { params: {} }])?.isInvalidated).toBe(true));
    expect(client.getQueryState(["get", "/api/other", { params: {} }])?.isInvalidated).toBe(false);
  });
});

describe("paletteFetch", () => {
  it("fills path parameters, puts the rest in the query of a GET and in a JSON body otherwise, and throws a problem's detail", async () => {
    const f = vi.fn(async () => Response.json({ items: [] }));
    const call = paletteFetch({ fetch: f as unknown as typeof fetch });
    await call({ operationId: "x", method: "get", path: "/api/people/{id}", args: { id: "a b", q: "x" } });
    expect(f).toHaveBeenLastCalledWith("/api/people/a%20b?q=x", expect.objectContaining({ method: "GET", credentials: "include" }));
    await call({ operationId: "y", method: "post", path: "/api/people/{id}/rename", args: { id: "1", title: "T" } });
    expect(f).toHaveBeenLastCalledWith("/api/people/1/rename", expect.objectContaining({ method: "POST", body: JSON.stringify({ title: "T" }) }));
    const bad = paletteFetch({ fetch: (async () => new Response(JSON.stringify({ detail: "Not yours." }), { status: 403 })) as unknown as typeof fetch });
    await expect(bad({ operationId: "z", method: "post", path: "/x", args: {} })).rejects.toThrow("Not yours.");
  });

  it("sends a signed-out person to sign in, like the rest of the app, and still throws", async () => {
    const out = paletteFetch({ fetch: (async () => new Response("", { status: 401 })) as unknown as typeof fetch });
    await expect(out({ operationId: "z", method: "post", path: "/x", args: {} })).rejects.toBeTruthy();
    expect(redirectToLogin).toHaveBeenCalled();
  });

  it("sends the playground request defaults: cookies, Accept and a request id", async () => {
    const f = vi.fn(async () => Response.json({}));
    await paletteFetch({ fetch: f as unknown as typeof fetch })({ operationId: "x", method: "get", path: "/api/a", args: {} });
    const init = (f.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.credentials).toBe("include");
    expect(new Headers(init.headers).get("X-Request-Id")).toBeTruthy();
  });
});
