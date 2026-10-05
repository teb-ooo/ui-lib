import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Markdown } from "./index";

const source = `# Title

Some **bold**, *italic*, ~~struck~~ and \`code\`.

| A | B |
|---|---|
| 1 | 2 |

- [x] done
- [ ] todo

See [[Trip to Lisbon]] and [site](https://example.com) and [home](/notes).

<script>alert(1)</script>

[bad](javascript:alert(1))
`;

describe("Markdown", () => {
  it("renders headings, emphasis, tables and task lists inside Prose", () => {
    const { container } = render(<Markdown>{source}</Markdown>);
    expect(container.firstElementChild?.className).toContain("prose");
    expect(screen.getByRole("heading", { level: 1, name: "Title" })).toBeTruthy();
    expect(container.querySelector("strong")?.textContent).toBe("bold");
    expect(container.querySelector("del")?.textContent).toBe("struck");
    expect(container.querySelector("table th")?.textContent).toBe("A");
    expect(container.querySelectorAll('input[type="checkbox"]').length).toBe(2);
  });

  it("opens external links in a new tab and turns [[Title]] into a link only when asked", () => {
    const { rerender } = render(<Markdown>{source}</Markdown>);
    expect(screen.getByRole("link", { name: "site" }).getAttribute("target")).toBe("_blank");
    expect(screen.queryByRole("link", { name: "Trip to Lisbon" })).toBeNull();
    expect(screen.getByText(/\[\[Trip to Lisbon\]\]/)).toBeTruthy();
    rerender(<Markdown wikiLink={(t) => `/notes/by-title/${encodeURIComponent(t)}`}>{source}</Markdown>);
    expect(screen.getByRole("link", { name: "Trip to Lisbon" }).getAttribute("href")).toBe("/notes/by-title/Trip%20to%20Lisbon");
  });

  it("never renders raw HTML and drops javascript: addresses", () => {
    const { container } = render(<Markdown>{source}</Markdown>);
    expect(container.querySelector("script")).toBeNull();
    const bad = screen.queryByRole("link", { name: "bad" });
    expect(bad === null || !(bad.getAttribute("href") ?? "").startsWith("javascript")).toBe(true);
  });

  it("draws internal links through renderLink", () => {
    render(
      // eslint-disable-next-line jsx-a11y/anchor-has-content -- the link's children arrive in the spread props
      <Markdown renderLink={(p) => <a data-router="1" {...p} />}>
        {"[home](/notes)"}
      </Markdown>,
    );
    expect(screen.getByRole("link", { name: "home" }).getAttribute("data-router")).toBe("1");
  });

  it("leaves [[Title]] alone inside code", () => {
    const { container } = render(<Markdown wikiLink={() => "/x"}>{"`[[Title]]`"}</Markdown>);
    expect(container.querySelector("code")?.textContent).toBe("[[Title]]");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("onToggleTask makes the tasks tickable and reports the index in render order, not counting code", () => {
    const onToggle = vi.fn();
    render(<Markdown onToggleTask={onToggle}>{"- [x] one\n- [ ] two\n\n```\n- [ ] not a task\n```\n\n- [ ] three"}</Markdown>);
    const boxes = screen.getAllByRole("checkbox", { name: "Task done" });
    expect(boxes.length).toBe(3);
    fireEvent.click(boxes[1]!);
    expect(onToggle).toHaveBeenLastCalledWith(1, true);
    fireEvent.click(boxes[2]!);
    expect(onToggle).toHaveBeenLastCalledWith(2, true);
    fireEvent.click(boxes[0]!);
    expect(onToggle).toHaveBeenLastCalledWith(0, false);
  });

  it("without onToggleTask the checkboxes are read-only", () => {
    const { container } = render(<Markdown>{"- [ ] one"}</Markdown>);
    expect((container.querySelector('input[type="checkbox"]') as HTMLInputElement).disabled).toBe(true);
  });

  it("images={false} leaves images out and shows the alt text", () => {
    const { container, rerender } = render(<Markdown>{"![a pic](https://example.com/a.png)"}</Markdown>);
    expect(container.querySelector("img")?.getAttribute("src")).toBe("https://example.com/a.png");
    rerender(<Markdown images={false}>{"![a pic](https://example.com/a.png) and ![](https://example.com/b.png)"}</Markdown>);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("a pic")).toBeTruthy();
  });

  it("passes other props (a test id) to the wrapper", () => {
    render(<Markdown data-testid="note">{"hi"}</Markdown>);
    expect(screen.getByTestId("note").className).toContain("prose");
  });
});
