import { describe, expect, it } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryHistory } from "@tanstack/react-router";
import { buildProps, scanAll } from "../scripts/scan-lib";
import { entries, labelOf, slugOf } from "../src/registry";
import { groupEntries } from "../src/chrome/sidebar";
import { scopedThemeCss } from "../src/preview-theme";
import { makeRouter } from "../src/router";
import propsJson from "../src/generated/props.json";
import themeCss from "../../theme.css?raw";

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

describe("preview theme", () => {
  it("re-scopes the two token blocks of theme.css", () => {
    const css = scopedThemeCss(themeCss);
    expect(themeCss.length, "theme.css?raw is empty").toBeGreaterThan(100);
    expect(css).toContain('.preview[data-theme="light"]{');
    expect(css).toContain('.preview[data-theme="dark"]{');
    expect(css).toMatch(/--ground: oklch\(0\.985/);
    expect(css).toMatch(/--ground: oklch\(0\.16 /);
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
    expect(screen.getByTestId("variants")).toHaveAttribute("data-theme", "dark");
  });

  it("switches the preview theme with the toggle", async () => {
    await renderAt("/atoms/button");
    await userEvent.click(await screen.findByRole("button", { name: "dark" }));
    expect(screen.getByTestId("variants")).toHaveAttribute("data-theme", "dark");
  });

  it("shows an email entry as an iframe with the placeholders substituted", async () => {
    await renderAt("/email/base");
    const frame = (await screen.findAllByTitle("Email preview"))[0] as HTMLIFrameElement;
    const html = frame.getAttribute("srcdoc") ?? "";
    expect(html).toContain("Set up your passkey");
    expect(html).not.toContain("{{");
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

  it("does not offer Copy import statement on the email entry, and Toggle theme is built in", async () => {
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
