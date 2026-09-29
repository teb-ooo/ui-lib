import baseHtml from "../../email/base.html.tmpl?raw";
import tokens from "../../email/tokens.json";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Base layout",
  group: "Email",
  description:
    "The base email layout with sample data, rendered twice: Light and Dark. Mail clients ignore CSS variables, so the layout uses literal values from email/tokens.json, and the dark rendering swaps the light literals for the dark ones.",
} satisfies StoryDefault;

const sample = {
  Title: "Set up your passkey",
  Preheader: "You have been invited. This link expires in one hour.",
  FactoryName: "teb.ooo",
  Footer: "You received this message because an administrator invited you.",
};

const content =
  '<p style="margin:0 0 16px 0;">Hello alex,</p><p style="margin:0 0 16px 0;">Use the link below to set up a passkey and finish creating your account.</p><p style="margin:0;"><a href="https://example.invalid/invite" style="color:inherit;text-decoration:underline;">Set up your passkey</a></p>';

/** Simple string replace of the Go template placeholders; the real rendering happens in Go. */
function renderSample(template: string, data: Record<string, string>, body: string): string {
  return template
    .replace('{{template "content" .}}', body)
    .replace(/\{\{\.(\w+)\}\}/g, (_m, key: string) => data[key] ?? "");
}

/** Removes the template's own dark-mode media block so a preview shows exactly one scheme. */
function withoutDarkMedia(html: string): string {
  const start = html.indexOf("@media (prefers-color-scheme: dark)");
  if (start < 0) return html;
  let i = html.indexOf("{", start) + 1;
  for (let depth = 1; depth > 0 && i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") depth--;
  }
  return html.slice(0, start) + html.slice(i);
}

type Palette = Record<string, string>;

/** Replaces every light literal with the dark literal of the same token, in one pass so results are never re-replaced. */
function toDark(html: string, lightSet: Palette, darkSet: Palette): string {
  const map = new Map<string, string>();
  for (const name of Object.keys(lightSet)) {
    const from = lightSet[name]?.toLowerCase();
    const to = darkSet[name];
    if (from && to && !map.has(from)) map.set(from, to);
  }
  return html.replace(/#[0-9a-f]{6}/gi, (hex) => map.get(hex.toLowerCase()) ?? hex);
}

function Frame({ label, html, height }: { label: string; html: string; height: number }) {
  return (
    <figure className="m-0 flex min-w-0 flex-1 flex-col gap-2">
      <figcaption className="text-ink-muted uppercase">{label}</figcaption>
      <iframe title={`Email preview, ${label.toLowerCase()}`} srcDoc={html} sandbox="" className="w-full rounded border border-line" style={{ height }} />
    </figure>
  );
}

function Pair({ html, height }: { html: string; height: number }) {
  const light = withoutDarkMedia(html);
  const dark = toDark(light, tokens.light, tokens.dark);
  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row">
      <Frame label="Light" html={light} height={height} />
      <Frame label="Dark" html={dark} height={height} />
    </div>
  );
}

export const Welcome = () => <Pair html={renderSample(baseHtml, sample, content)} height={520} />;
Welcome.storyMeta = { description: "Light and Dark, rendered in sandboxed iframes with sample data." } satisfies StoryMeta;

export const Minimal = () => (
  <Pair html={renderSample(baseHtml, { ...sample, Title: "Your code" }, '<p style="margin:0;">Your code is 123456.</p>')} height={380} />
);
