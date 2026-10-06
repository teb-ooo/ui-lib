import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "./section";

describe("PageHeader compact", () => {
  it("is one row with the title at the body size", () => {
    render(<PageHeader size="compact" title="Rules" description="55 rules" actions={<button>New</button>}>filters</PageHeader>);
    const h = screen.getByRole("heading", { name: "Rules" });
    expect(h.className).not.toContain("display-lg");
    expect(screen.getByText("filters")).toBeTruthy();
  });
});
