import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { root as rootDir } from "./root";
import { COLOR_TOKENS, hexPalette, readThemeBlocks, textSizePx } from "../scripts/colors.ts";

const root = `${rootDir}/`;
const tokens = JSON.parse(readFileSync(`${root}email/tokens.json`, "utf8")) as {
  light: Record<string, string>;
  dark: Record<string, string>;
  text: { body: { size: string; lineHeight: string }; display: { size: string; lineHeight: string; weight: string } };
  maxWidth: string;
};
const theme = readThemeBlocks(`${root}theme.css`);
const themeCss = readFileSync(`${root}theme.css`, "utf8");
const html = readFileSync(`${root}email/base.html.tmpl`, "utf8");
const txt = readFileSync(`${root}email/base.txt.tmpl`, "utf8");

describe("email/tokens.json", () => {
  it("matches theme.css (run `npm run build:email-tokens` if this fails)", () => {
    expect(tokens.light).toEqual(hexPalette(theme.light));
    expect(tokens.dark).toEqual(hexPalette(theme.dark));
  });
  it("holds literal hex values only", () => {
    for (const mode of [tokens.light, tokens.dark]) {
      for (const n of COLOR_TOKENS) expect(mode[n]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe("email base templates", () => {
  it("html uses the light tokens as literal values and no CSS variables", () => {
    for (const n of ["ground", "surface", "ink", "ink-muted", "line"]) {
      expect(html).toContain(tokens.light[n] as string);
    }
    expect(html).not.toContain("var(--");
    expect(html).not.toMatch(/oklch/i);
  });
  it("uses exactly the two type sizes, as literals from theme.css", () => {
    expect(tokens.text.body).toEqual(textSizePx(themeCss, "body"));
    expect(tokens.text.display).toEqual({ ...textSizePx(themeCss, "display"), weight: "700" });
    expect(tokens.text.body).toEqual({ size: "14px", lineHeight: "1.6" });
    expect(tokens.text.display).toEqual({ size: "32px", lineHeight: "1.3", weight: "700" });
    const sizes = new Set([...html.matchAll(/font-size:\s*([\d.]+px)/g)].map((m) => m[1]).filter((v) => v !== "1px"));
    expect([...sizes].sort()).toEqual(["14px", "32px"]);
  });
  it("uses one system monospace stack and names no display face", () => {
    const families = new Set([...html.matchAll(/font-family:([^;"]+)/g)].map((m) => (m[1] ?? "").trim()));
    expect([...families]).toEqual([(tokens as unknown as { fontFamily: string }).fontFamily]);
    expect(html).not.toMatch(/nova|geist/i);
  });
  it("html dark-mode block uses the dark tokens", () => {
    for (const n of ["ground", "surface", "ink", "ink-muted", "line"]) {
      expect(html).toContain(tokens.dark[n] as string);
    }
  });
  it("is a table-based 560px layout with a colour-scheme meta", () => {
    expect(html).toContain("<table");
    expect(html).toContain(`max-width:${tokens.maxWidth}`);
    expect(html).toContain('name="color-scheme"');
    expect(html).toContain("LOGO SLOT");
  });
  it.each([
    ["html", html],
    ["txt", txt],
  ])("%s honours the placeholder contract", (_n, src) => {
    for (const p of ["{{.Title}}", "{{.FactoryName}}", "{{.Footer}}", '{{template "content" .}}']) {
      expect(src).toContain(p);
    }
    const actions = [...src.matchAll(/\{\{[^}]*\}\}/g)].map((m) => m[0]);
    const allowed = new Set(["{{.Title}}", "{{.Preheader}}", "{{.FactoryName}}", "{{.Footer}}", '{{template "content" .}}']);
    for (const a of actions) expect(allowed.has(a), `unexpected action ${a}`).toBe(true);
  });
  it("html carries the preheader", () => {
    expect(html).toContain("{{.Preheader}}");
  });
  it("names no third-party product", () => {
    expect(`${html}${txt}`).not.toMatch(/\b(ory|kratos|hydra|resend|postmark)\b/i);
  });
});
