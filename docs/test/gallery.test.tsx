import { describe, expect, it } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryHistory } from "@tanstack/react-router";
import { buildProps, scanAll } from "../scripts/scan-lib";
import { entries, labelOf, slugOf } from "../src/registry";
import { groupEntries } from "../src/chrome/sidebar";
import { makeRouter } from "../src/router";
import propsJson from "../src/generated/props.json";

async function renderAt(url: string) {
  const router = makeRouter(createMemoryHistory({ initialEntries: [url] }));
  let utils!: ReturnType<typeof render>;
  await act(async () => {
    utils = render(<RouterProvider router={router} />);
  });
  return utils;
}

describe("discovery", () => {
  const scanned = scanAll();

  it("finds every story file, and the registry matches the build-time scan", () => {
    expect(scanned.length).toBeGreaterThanOrEqual(12);
    expect(entries.length).toBe(scanned.length);
    for (const s of scanned) {
      const e = entries.find((x) => x.slug === s.slug);
      expect(e, `registry misses ${s.slug}`).toBeDefined();
      expect(e?.title).toBe(s.title);
      expect(e?.group).toBe(s.group);
      expect(e?.variants.map((v) => v.name)).toEqual(s.variants);
    }
  });

  it("covers every group and every component of the ui package", () => {
    expect(groupEntries(entries).map((g) => g.group)).toEqual(["Foundations", "Atoms", "Molecules", "Email"]);
    const comps = entries.map((e) => e.component);
    for (const c of ["Button", "Input", "Field", "Dialog", "Avatar", "Badge", "Kbd"]) expect(comps).toContain(c);
  });

  it("derives labels and slugs", () => {
    expect(labelOf("WithForm")).toBe("With form");
    expect(slugOf("../../src/components/button.stories.tsx", "Atoms")).toBe("atoms/button");
  });
});

describe("props generation", () => {
  const docs = buildProps(scanAll());

  it("reads the Button props from its TypeScript interface", () => {
    const button = docs["Button"];
    expect(button?.props.map((p) => p.name)).toEqual(expect.arrayContaining(["intent", "loading", "className"]));
    const intent = button?.props.find((p) => p.name === "intent");
    expect(intent?.type).toContain('"solid"');
    expect(intent?.default).toBe('"default"');
    expect(intent?.required).toBe(false);
  });

  it("marks required props", () => {
    expect(docs["Dialog"]?.props.find((p) => p.name === "title")?.required).toBe(true);
    expect(docs["Avatar"]?.props.find((p) => p.name === "name")?.required).toBe(true);
  });

  it("the generated file is current (run `npm run props`)", () => {
    expect(propsJson).toEqual(JSON.parse(JSON.stringify(docs)));
  });
});

describe("routing and chrome", () => {
  it("redirects / to the first entry", async () => {
    await renderAt("/");
    expect(await screen.findByRole("heading", { level: 1, name: entries[0]?.title ?? "" })).toBeInTheDocument();
  });

  it("renders /atoms/button with variants, import line and props table", async () => {
    await renderAt("/atoms/button");
    expect(await screen.findByRole("heading", { level: 1, name: "Button" })).toBeInTheDocument();
    expect(screen.getByTestId("import-line")).toHaveTextContent('import { Button } from "@teb-ooo/ui";');
    const variants = screen.getByTestId("variants");
    expect(within(variants).getByText("Disabled")).toBeInTheDocument();
    expect(within(variants).getByText("Loading")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Props" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: /^intent/ })).toBeInTheDocument();
  });

  it("highlights the current entry in a one-level sidebar", async () => {
    await renderAt("/atoms/button");
    const nav = await screen.findByRole("navigation", { name: "Design system" });
    const current = within(nav).getByRole("link", { name: "Button" });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Input" })).not.toHaveAttribute("aria-current");
    for (const g of ["Foundations", "Atoms", "Molecules", "Email"]) {
      expect(within(nav).getByRole("button", { name: g })).toHaveAttribute("aria-expanded", "true");
    }
  });

  it("collapses a group from its header", async () => {
    await renderAt("/atoms/button");
    const nav = await screen.findByRole("navigation", { name: "Design system" });
    await userEvent.click(within(nav).getByRole("button", { name: "Atoms" }));
    expect(within(nav).getByRole("button", { name: "Atoms" })).toHaveAttribute("aria-expanded", "false");
    expect(within(nav).queryByRole("link", { name: "Button" })).toBeNull();
  });

  it("navigates by link click (permalink per entry)", async () => {
    const router = makeRouter(createMemoryHistory({ initialEntries: ["/atoms/button"] }));
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
    await userEvent.click(await screen.findByRole("link", { name: "Badge" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Badge" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/atoms/badge");
  });

  it("the frame route renders variants only, no chrome", async () => {
    await renderAt("/atoms/button?frame=1&theme=dark");
    expect(await screen.findByTestId("frame")).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByRole("banner")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Props" })).toBeNull();
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    document.documentElement.removeAttribute("data-theme");
  });

  it("has exactly one theme control, in the header, that sets data-theme on <html> for everything", async () => {
    window.localStorage.clear();
    await renderAt("/atoms/button");
    const group = await screen.findByRole("group", { name: "Theme" });
    expect(screen.getAllByRole("group", { name: /theme/i })).toHaveLength(1);
    expect(group.closest("header")).toHaveClass("sticky");
    expect(within(group).getByRole("button", { name: "system" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(within(group).getByRole("button", { name: "dark" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(window.localStorage.getItem("theme")).toBe("dark");
    expect(within(group).getByRole("button", { name: "dark" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(within(group).getByRole("button", { name: "light" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    await userEvent.click(within(group).getByRole("button", { name: "system" }));
    expect(document.documentElement).not.toHaveAttribute("data-theme");
    expect(window.localStorage.getItem("theme")).toBeNull();
    // previews are in the page (no per-variant toggles, no iframes) so they inherit
    expect(screen.getByTestId("variants").querySelector("iframe")).toBeNull();
    expect(screen.getByTestId("variants")).not.toHaveAttribute("data-theme");
  });

  it("shows both grounds at once on the colour tokens page", async () => {
    await renderAt("/foundations/color");
    await screen.findByRole("heading", { level: 1, name: "Color tokens" });
    const dark = screen.getAllByLabelText("dark theme");
    const light = screen.getAllByLabelText("light theme");
    expect(dark.length).toBeGreaterThan(0);
    expect(dark).toHaveLength(light.length);
    for (const el of dark) expect(el).toHaveAttribute("data-theme", "dark");
    for (const el of light) expect(el).toHaveAttribute("data-theme", "light");
  });

  it("renders each email twice, Light and Dark, with dark literals substituted", async () => {
    await renderAt("/email/base");
    const light = (await screen.findAllByTitle("Email preview, light"))[0] as HTMLIFrameElement;
    const dark = (await screen.findAllByTitle("Email preview, dark"))[0] as HTMLIFrameElement;
    const l = light.getAttribute("srcdoc") ?? "";
    const d = dark.getAttribute("srcdoc") ?? "";
    expect(l).toContain("Set up your passkey");
    expect(l).not.toContain("{{");
    expect(l).toContain("background-color:#ffffff");
    expect(d).toContain("background-color:#000000");
    expect(d).not.toContain("background-color:#ffffff");
    expect(l).not.toContain("prefers-color-scheme: dark");
    expect(screen.getAllByText("Light").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Dark").length).toBeGreaterThan(0);
  });

  it("shows not found for an unknown entry", async () => {
    await renderAt("/atoms/nope");
    expect(await screen.findByText("No such entry.")).toBeInTheDocument();
  });
});

describe("command palette", () => {
  it("has a trigger in the header", async () => {
    await renderAt("/atoms/button");
    expect(await screen.findByRole("button", { name: "Open command palette" })).toBeInTheDocument();
  });

  it("Cmd/Ctrl+K opens it, finds Button and navigates to the entry", async () => {
    const router = makeRouter(createMemoryHistory({ initialEntries: ["/foundations/color"] }));
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
    await screen.findByRole("heading", { level: 1, name: "Color tokens" });
    await userEvent.keyboard("{Control>}k{/Control}");
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByRole("combobox"), "Button");
    expect(await within(dialog).findByText("Components")).toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("heading", { level: 1, name: "Button" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/atoms/button");
  });

  it("offers Copy import statement on a component page only", async () => {
    await renderAt("/atoms/button");
    await userEvent.keyboard("{Control>}k{/Control}");
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByRole("combobox"), "Copy import");
    const options = await within(dialog).findAllByRole("option");
    expect(options[0]).toHaveTextContent("Copy import statement");
  });

  it("does not offer Copy import statement on the email entry, and Toggle theme is a gallery command", async () => {
    await renderAt("/email/base");
    await userEvent.keyboard("{Control>}k{/Control}");
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByRole("combobox"), "theme");
    const options = await within(dialog).findAllByRole("option");
    expect(options.map((o) => o.textContent).join("|")).toContain("Toggle theme");
    await userEvent.clear(within(dialog).getByRole("combobox"));
    await userEvent.type(within(dialog).getByRole("combobox"), "Copy import");
    expect(within(dialog).queryAllByRole("option").map((o) => o.textContent).join("|")).not.toContain("Copy import statement");
  });
});

describe("design language", () => {
  it("design.docs.test.ts is the ui package's design test plus exactly one allowance (the gallery may force a theme)", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const shared = readFileSync(join(__dirname, "..", "..", "test", "design.test.ts"), "utf8");
    const docs = readFileSync(join(__dirname, "design.docs.test.ts"), "utf8");
    const expected = shared
      .replace(" * The playground's design-language test.", () => {
        const m = /^ \* GALLERY COPY[\s\S]*?diverge in any other way\./m.exec(docs);
        return m ? m[0] : "";
      })
      .replace('  it("has no theme control:', '  it.skip("has no theme control:');
    expect(docs).toBe(expected);
  });
});
