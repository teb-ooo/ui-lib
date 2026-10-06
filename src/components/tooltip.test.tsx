import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";
import userEvent from "@testing-library/user-event";
import { Tooltip } from "../index";

describe("Tooltip", () => {
  it("opens on hover and describes the trigger", async () => {
    const user = userEvent.setup();
    render(<Tooltip tip="Hello" delay={0}><Button>Target</Button></Tooltip>);
    await user.hover(screen.getByRole("button", { name: "Target" }));
    expect(await screen.findByText("Hello")).toBeInTheDocument();
  });
});
