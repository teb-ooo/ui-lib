import baseHtml from "../../email/base.html.tmpl?raw";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Base layout",
  group: "Email",
  description:
    "The base email layout with sample data. Placeholders: {{.Title}}, {{.Preheader}}, {{.FactoryName}}, {{.Footer}} and {{template \"content\" .}}. Mail clients ignore CSS variables, so the layout uses literal values from email/tokens.json.",
} satisfies StoryDefault;

const sample = {
  Title: "Set up your passkey",
  Preheader: "You have been invited. This link expires in one hour.",
  FactoryName: "teb.ooo",
  Footer: "You received this message because an administrator invited you.",
};

const content =
  '<p style="margin:0 0 16px 0;">Hello alex,</p><p style="margin:0 0 16px 0;">Use the link below to set up a passkey and finish creating your account.</p><p style="margin:0;"><a href="https://example.invalid/invite" style="color:#2c57cd;">Set up your passkey</a></p>';

/** Simple string replace of the Go template placeholders; the real rendering happens in Go. */
function renderSample(template: string, data: Record<string, string>, body: string): string {
  return template
    .replace('{{template "content" .}}', body)
    .replace(/\{\{\.(\w+)\}\}/g, (_m, key: string) => data[key] ?? "");
}

function Frame({ html, height }: { html: string; height: number }) {
  return (
    <iframe
      title="Email preview"
      srcDoc={html}
      sandbox=""
      className="w-full max-w-xl rounded-ctl border border-line bg-ground"
      style={{ height }}
    />
  );
}

export const Welcome = () => <Frame html={renderSample(baseHtml, sample, content)} height={520} />;
Welcome.storyMeta = { description: "Rendered in an iframe; dark mode follows your system setting." } satisfies StoryMeta;

export const Minimal = () => (
  <Frame
    html={renderSample(baseHtml, { ...sample, Title: "Your code" }, '<p style="margin:0;">Your code is 123456.</p>')}
    height={380}
  />
);
