import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Page, PageBody } from "./page";
import { PageHeader } from "./section";

describe("page layout", () => {
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
