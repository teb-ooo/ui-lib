import { Children, isValidElement } from "react";
import type { AnchorHTMLAttributes, HTMLAttributes, ReactElement, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Checkbox, Prose } from "@teb-ooo/ui";

export interface MarkdownProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className"> {
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
  /**
   * Makes task list items tickable: called with the item's index among the task items in render order (task items in
   * fenced code are not counted) and the new state. Give it, and the app saves the changed source. Without it the
   * checkboxes are read-only.
   */
  onToggleTask?: (index: number, checked: boolean) => void;
  /**
   * Draw images. False leaves them out (the alt text is shown instead, or nothing), so a note's author cannot make the
   * reader's browser fetch an address. @default true
   */
  images?: boolean;
  className?: string;
}

interface Node {
  type: string;
  value?: string;
  url?: string;
  checked?: boolean | null;
  data?: { hProperties?: Record<string, unknown> };
  children?: Node[];
}

/** A remark plugin: numbers the task list items in document order so a tick can be reported by index. */
function remarkTaskIndex() {
  return () => (tree: Node) => {
    let n = 0;
    const walk = (node: Node) => {
      if (node.type === "listItem" && typeof node.checked === "boolean") {
        node.data = { ...node.data, hProperties: { ...node.data?.hProperties, "data-task-index": n++ } };
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
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
export function Markdown({ children, wikiLink, renderLink, onToggleTask, images = true, className, ...rest }: MarkdownProps) {
  const plugins = [remarkGfm, remarkTaskIndex(), ...(wikiLink ? [remarkWikiLinks(wikiLink)] : [])];
  return (
    <Prose {...rest} {...(className !== undefined ? { className } : {})}>
      <ReactMarkdown
        remarkPlugins={plugins as never}
        components={{
          img: ({ src, alt }) => (images && src ? <img src={src} alt={alt ?? ""} /> : alt ? <span className="text-ink-muted">{alt}</span> : null),
          li: ({ node: _node, children: kids, ...props }) => {
            const index = (props as Record<string, unknown>)["data-task-index"];
            if (typeof index !== "number" || !onToggleTask) return <li {...(props as object)}>{kids}</li>;
            const swapped = Children.map(kids, (child) => {
              if (isValidElement(child) && child.type === "input") {
                const checked = Boolean((child.props as { checked?: boolean }).checked);
                return <Checkbox aria-label="Task done" checked={checked} onCheckedChange={(next) => onToggleTask(index, next === true)} />;
              }
              return child;
            });
            return <li {...(props as object)}>{swapped}</li>;
          },
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
