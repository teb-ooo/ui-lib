import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { setViewportWidth } from "../../test/cmdk/viewport";
import { Check } from "lucide-react";
import { Button } from "./button";
import { DataTable } from "./data-table";
import { EmptyState } from "./empty-state";
import { Field } from "./field";
import { FilterBar } from "./filter-bar";
import { Input } from "./input";
import { LinkButton } from "./link-button";
import { Menu } from "./menu";
import { Page, PageBody } from "./page";
import { PageHeader } from "./section";
import { Tabs } from "./tabs";

describe("router-aware LinkButton", () => {
  it("draws the link through render, with the class and children", () => {
    const render1 = vi.fn((props: Record<string, unknown>) => <a data-router="1" {...props} href="/rules" />);
    render(<LinkButton render={render1 as never}>Back to the rules</LinkButton>);
    const a = screen.getByRole("link", { name: "Back to the rules" });
    expect(a.getAttribute("data-router")).toBe("1");
    expect(a.className).toContain("btn");
  });
});

describe("icons", () => {
  it("Button and Menu accept an element or a component", async () => {
    const { container } = render(
      <>
        <Button icon={Check}>One</Button>
        <Button icon={<Check />}>Two</Button>
      </>,
    );
    expect(container.querySelectorAll("svg").length).toBe(2);
  });
  it("Menu items accept a component icon", () => {
    render(<Menu trigger={<Button>Open</Button>} items={[{ type: "action", id: "a", label: "A", icon: Check, onSelect: () => undefined }]} />);
    expect(screen.getByRole("button", { name: "Open" })).toBeTruthy();
  });
});

describe("Field hideLabel", () => {
  it("keeps the label for screen readers only", () => {
    render(
      <Field label="Tag" hideLabel>
        <Input />
      </Field>,
    );
    expect(screen.getByLabelText("Tag")).toBeTruthy();
    expect(screen.getByText("Tag").className).toContain("sr-only");
  });
});

describe("PageHeader compact", () => {
  it("is one row with the title at the body size", () => {
    render(<PageHeader size="compact" title="Rules" description="55 rules" actions={<button>New</button>}>filters</PageHeader>);
    const h = screen.getByRole("heading", { name: "Rules" });
    expect(h.className).not.toContain("display-lg");
    expect(screen.getByText("filters")).toBeTruthy();
  });
});

describe("FilterBar", () => {
  it("shows no Filters button on a phone when there are no filters, and puts end in the sheet", () => {
    setViewportWidth(390);
    const { rerender } = render(<FilterBar aria-label="f" primary={<span>search</span>} end={<span>12 rules</span>} />);
    expect(screen.queryByRole("button", { name: /Filters/ })).toBeNull();
    rerender(
      <FilterBar aria-label="f" primary={<span>search</span>} end={<span>12 rules</span>}>
        <button>Open only</button>
      </FilterBar>,
    );
    expect(screen.queryByText("12 rules")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    expect(screen.getByText("12 rules")).toBeTruthy();
  });
});

describe("DataTable lines", () => {
  it("lets a cell take two lines and the row grow", () => {
    const { container } = render(
      <DataTable label="T" rowKey={(r: { id: string }) => r.id} rows={[{ id: "a" }]} columns={[{ id: "a", header: "A", cell: () => "x".repeat(200), lines: 2 }]} />,
    );
    expect(container.querySelector(".line-clamp-2")).not.toBeNull();
    expect(container.querySelector('[role="row"].min-h-\\[var\\(--control-h\\)\\]')).not.toBeNull();
  });
});

describe("EmptyState, Page and Tabs fill", () => {
  it("renders the empty state with its action", () => {
    render(<EmptyState title="No retired rules" action={<button>Clear filters</button>} />);
    expect(screen.getByRole("status").textContent).toContain("No retired rules");
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeTruthy();
  });
  it("Page and PageBody carry the scroll model classes", () => {
    const { container } = render(
      <Page>
        <PageBody fill>x</PageBody>
        <PageBody>y</PageBody>
      </Page>,
    );
    const [fill, scroll] = [...(container.firstElementChild as HTMLElement).children];
    expect(fill!.className).toContain("lg:overflow-hidden");
    expect(scroll!.className).toContain("lg:overflow-auto");
  });
  it("Tabs fill makes the panel a scrolling flex column", () => {
    render(<Tabs label="t" value="a" onValueChange={() => undefined} fill tabs={[{ value: "a", label: "A", panel: <p>one</p> }]} />);
    expect(screen.getByRole("tabpanel").className).toContain("overflow-auto");
  });
});

describe("ah's wrapper needs", () => {
  it("DataTable fit is only as tall as its rows and marks a bleed table", () => {
    const { container } = render(<DataTable label="T" bleed fit rowKey={(r: { id: string }) => r.id} rows={[{ id: "a" }]} columns={[{ id: "a", header: "A", cell: () => "x" }]} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("flex-initial");
    expect(root.className.split(" ")).not.toContain("h-full");
    expect(root.getAttribute("data-bleed")).toBe("");
  });
  it("PageBody gutter spares bleed bands; sticky pins a header", () => {
    const { container } = render(
      <Page>
        <PageHeader title="T" sticky />
        <PageBody gutter>
          <p>text</p>
        </PageBody>
      </Page>,
    );
    expect(container.querySelector("section")!.className).toContain("sticky");
    expect(container.querySelector("section")!.hasAttribute("data-bleed")).toBe(true);
    expect([...container.querySelectorAll("div")].some((d) => d.className.includes("[&>:not([data-bleed])]:px-4"))).toBe(true);
  });
  it("PageColumns sets the first column width", async () => {
    const { PageColumns } = await import("./page");
    const { container } = render(<PageColumns firstWidth={20}><PageBody>a</PageBody><PageBody>b</PageBody></PageColumns>);
    expect((container.firstElementChild as HTMLElement).style.getPropertyValue("--first-column")).toBe("20rem");
  });
});
