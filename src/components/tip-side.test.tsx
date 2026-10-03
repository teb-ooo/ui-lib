import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("tipSide", () => {
  it("opens the tip below an icon button when asked", async () => {
    render(<Button icon={<span />} tip="Refresh" tipSide="bottom" />);
    await userEvent.hover(screen.getByRole("button", { name: "Refresh" }));
    const tip = await screen.findByRole("tooltip");
    expect(tip.closest("[data-side]")?.getAttribute("data-side") ?? tip.getAttribute("data-side")).toBe("bottom");
  });
});
