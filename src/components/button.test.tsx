import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Check } from "lucide-react";
import { Button } from "./button";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";

describe("Button", () => {
  it("renders a real button, type=button by default", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "button");
  });
  it.each(["default", "solid", "danger"] as const)("supports intent %s", (intent) => {
    render(<Button intent={intent}>Go</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-intent", intent);
  });
  it("defaults to the default intent", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-intent", "default");
  });
  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
  it("fires onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it("loading is busy, blocks clicks, stays focusable", async () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Go</Button>);
    const b = screen.getByRole("button");
    expect(b).toHaveAttribute("aria-busy", "true");
    await userEvent.click(b);
    expect(onClick).not.toHaveBeenCalled();
    b.focus();
    expect(b).toHaveFocus();
  });
  it("forwards the ref", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Go</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

describe("Button extras", () => {
  it("warning intent uses the shared class", () => {
    render(<Button intent="warning">Discard</Button>);
    expect(screen.getByRole("button")).toHaveClass("btn", "btn-warning");
  });
  it("uses the shared button classes for solid and danger", () => {
    render(<><Button intent="solid">a</Button><Button intent="danger">b</Button></>);
    expect(screen.getByRole("button", { name: "a" })).toHaveClass("btn-solid");
    expect(screen.getByRole("button", { name: "b" })).toHaveClass("btn-danger");
  });
  it("active sets aria-pressed and the active marker", () => {
    render(<Button active>Filter</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button")).toHaveAttribute("data-active");
  });
  it("has no aria-pressed when active is not given", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-pressed");
  });
  it("icon-only is a square button named by its tip", () => {
    render(<Button icon={<svg data-testid="i" />} tip="Delete" />);
    const b = screen.getByRole("button", { name: "Delete" });
    expect(b).toHaveClass("btn-icon");
  });
  it("shows the tip on keyboard focus", async () => {
    const user = userEvent.setup();
    render(<Button tip="Saves the draft">Save</Button>);
    await user.tab();
    expect(await screen.findByText("Saves the draft")).toBeInTheDocument();
  });
  it("dashed draws the add affordance", () => {
    render(<Button dashed>add</Button>);
    expect(screen.getByRole("button")).toHaveClass("btn-add");
  });
  it("never sets a title attribute", () => {
    render(<Button tip="Tip" icon={<svg />} />);
    expect(screen.getByRole("button")).not.toHaveAttribute("title");
  });
});

describe("button layout", () => {
  it("Button and Menu accept an element or a component", async () => {
    const { container } = render(
      <>
        <Button icon={Check}>One</Button>
        <Button icon={<Check />}>Two</Button>
      </>,
    );
    expect(container.querySelectorAll("svg").length).toBe(2);
  });
});
