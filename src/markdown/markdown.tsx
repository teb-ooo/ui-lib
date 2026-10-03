import { isValidElement } from "react";
import type { AnchorHTMLAttributes, ReactElement, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prose } from "@teb-ooo/ui";

export interface MarkdownProps {
  /** The markdown source. */
  children: string;
  /**
   * Turns `[[Title]]` into a link: give the address for a title (`(title) => "/notes/by-title/" + encodeURIComponent(title)`).
   * Without it `[[Title]]` stays text.
   */
  wikiLink?: (title: string) => string;
  /**
   * Draws links with your router's link component: `renderLink={(props) => <Link to={props.href} {...props} />}`. Without it a
   * link is a plain anchor. External links (`http`, `https`, `mailto`) always use the plain anchor, opening in a new tab.
   */
  renderLink?: (props: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) => ReactElement;
  className?: string;
}

interface Node {
  type: string;
  value?: string;
  url?: string;
  children?: Node[];
}

/** A remark plugin: `[[Title]]` in text becomes a link; text inside links and code is left alone. */
function remarkWikiLinks(hrefFor: (title: string) => string) {
  const split = (value: string): Node[] => {
    const out: Node[] = [];
    let last = 0;
    for (const m of value.matchAll(/\[\[([^\]\n]+)\]\]/g)) {
      const title = (m[1] ?? "").trim();
      if (title === "") continue;
      if (m.index! > last) out.push({ type: "text", value: value.slice(last, m.index) });
      out.push({ type: "link", url: hrefFor(title), children: [{ type: "text", value: title }] });
      last = m.index! + m[0].length;
    }
    if (last === 0) return [{ type: "text", value }];
    if (last < value.length) out.push({ type: "text", value: value.slice(last) });
    return out;
  };
  const walk = (node: Node) => {
    if (!node.children || node.type === "link" || node.type === "code" || node.type === "inlineCode") return;
    node.children = node.children.flatMap((child) => (child.type === "text" && child.value ? split(child.value) : [child]));
    node.children.forEach(walk);
  };
  return () => (tree: Node) => walk(tree);
}

const external = (href: string) => /^(https?:|mailto:)/i.test(href);

/**
 * Renders markdown (headings, lists, quotes, code, tables, task lists, strikethrough, links) in the `Prose` look. Raw HTML in
 * the source is shown as text, never rendered, and unsafe link addresses (`javascript:`) are dropped. Import it from
 * `@teb-ooo/ui/markdown`; `react-markdown` and `remark-gfm` are optional peer dependencies the app installs.
 */
export function Markdown({ children, wikiLink, renderLink, className }: MarkdownProps) {
  const plugins = wikiLink ? [remarkGfm, remarkWikiLinks(wikiLink)] : [remarkGfm];
  return (
    <Prose {...(className !== undefined ? { className } : {})}>
      <ReactMarkdown
        remarkPlugins={plugins as never}
        components={{
          a: ({ href, children: kids }) => {
            const to = href ?? "";
            if (to === "") return <>{kids}</>;
            if (external(to)) {
              return (
                <a href={to} target="_blank" rel="noreferrer">
                  {kids}
                </a>
              );
            }
            const node = renderLink ? renderLink({ href: to, children: kids }) : <a href={to}>{kids}</a>;
            return isValidElement(node) ? node : <a href={to}>{kids}</a>;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </Prose>
  );
}
