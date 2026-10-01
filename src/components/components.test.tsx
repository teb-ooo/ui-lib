import { describe, expect, it, vi } from "vitest";
import { createRef } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Avatar, Button, Chip, Dialog, Field, initialsOf, Input, Kbd, LinkButton, Tooltip } from "../index";

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

describe("Input", () => {
  it("accepts typing and forwards the ref", async () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} aria-label="Name" />);
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "alex");
    expect(ref.current?.value).toBe("alex");
  });
  it("can be disabled", () => {
    render(<Input aria-label="Name" disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});

describe("Field", () => {
  it("labels the control", () => {
    render(<Field label="Username"><Input /></Field>);
    expect(screen.getByLabelText("Username")).toBeInstanceOf(HTMLInputElement);
  });
  it("wires the error: invalid, described by, announced", async () => {
    render(
      <Field label="Username" error="Already taken" description="3 to 32 characters">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText("Username");
    await waitFor(() => expect(input).toHaveAttribute("aria-invalid", "true"));
    expect(input).toHaveAccessibleDescription(/Already taken/);
    expect(input).toHaveAccessibleDescription(/3 to 32 characters/);
    expect(screen.getByRole("alert")).toHaveTextContent("Already taken");
  });
  it("shows no error and is valid without one", () => {
    render(<Field label="Email"><Input /></Field>);
    const input = screen.getByLabelText("Email");
    expect(input).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("Dialog", () => {
  it("opens from its trigger, is named, moves focus in, closes on Escape and restores focus", async () => {
    const user = userEvent.setup();
    render(
      <Dialog trigger={<Button>Open</Button>} title="Remove passkey" description="This cannot be undone." footer={<Button intent="danger">Remove</Button>}>
        <Input aria-label="Confirm" />
      </Dialog>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Remove passkey" });
    expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
  it("closes with the close control and reports onOpenChange", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Dialog defaultOpen onOpenChange={onOpenChange} title="Hello" />);
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });
  it("is controlled by `open`", async () => {
    const { rerender } = render(<Dialog open={false} title="T" />);
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<Dialog open title="T" />);
    expect(await screen.findByRole("dialog", { name: "T" })).toBeInTheDocument();
  });
});

describe("Avatar", () => {
  it("falls back to initials when there is no image, named for assistive tech", () => {
    render(<Avatar name="alex_tebbs" />);
    const a = screen.getByRole("img", { name: "alex_tebbs" });
    expect(a).toHaveTextContent("AT");
  });
  it("falls back for a single word", () => {
    render(<Avatar name="alex" size="lg" />);
    expect(screen.getByRole("img", { name: "alex" })).toHaveTextContent("AL");
    expect(screen.getByRole("img")).toHaveAttribute("data-size", "lg");
  });
  it("shows initials while the image has not loaded (jsdom never loads images)", () => {
    render(<Avatar name="Sam Lee" src="/avatar/1" />);
    expect(screen.getByRole("img", { name: "Sam Lee" })).toHaveTextContent("SL");
  });
  it("computes initials", () => {
    expect(initialsOf("  ")).toBe("?");
    expect(initialsOf("ada lovelace")).toBe("AL");
    expect(initialsOf("x")).toBe("X");
  });
});


describe("Chip", () => {
  it.each([
    ["default", null],
    ["ok", "chip-ok"],
    ["warn", "chip-warn"],
    ["muted", "chip-muted"],
    ["danger", "chip-danger"],
    ["link", "chip-link"],
    ["agent", "chip-agent"],
  ] as const)("tone %s", (tone, cls) => {
    render(<Chip tone={tone}>x</Chip>);
    const c = screen.getByText("x");
    expect(c).toHaveClass("chip");
    if (cls) expect(c).toHaveClass(cls);
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

describe("LinkButton", () => {
  it("is a real link with the button look", () => {
    render(<LinkButton href="/docs" intent="solid">Docs</LinkButton>);
    const a = screen.getByRole("link", { name: "Docs" });
    expect(a).toHaveAttribute("href", "/docs");
    expect(a).toHaveClass("btn", "btn-solid");
  });
  it("marks the current page", () => {
    render(<LinkButton href="/here" active>Here</LinkButton>);
    expect(screen.getByRole("link")).toHaveAttribute("aria-current", "page");
  });
  it("icon-only takes its name from the tip", () => {
    render(<LinkButton href="/x" icon={<svg />} tip="Open" />);
    expect(screen.getByRole("link", { name: "Open" })).toHaveClass("btn-icon");
  });
});

describe("Tooltip", () => {
  it("opens on hover and describes the trigger", async () => {
    const user = userEvent.setup();
    render(<Tooltip tip="Hello" delay={0}><Button>Target</Button></Tooltip>);
    await user.hover(screen.getByRole("button", { name: "Target" }));
    expect(await screen.findByText("Hello")).toBeInTheDocument();
  });
});

describe("Dialog placement", () => {
  it("centre is the default", async () => {
    render(<Dialog defaultOpen title="T" />);
    expect((await screen.findByRole("dialog")).getAttribute("data-placement")).toBe("center");
  });
  it("top places the panel near the top", async () => {
    render(<Dialog defaultOpen placement="top" title="T" />);
    const d = await screen.findByRole("dialog");
    expect(d).toHaveAttribute("data-placement", "top");
    expect(d.className).toContain("top-[15vh]");
    expect(d.className).toContain("max-w-lg");
  });
  it("bare has no close control and keeps the accessible name", async () => {
    render(<Dialog defaultOpen bare title="Palette"><input aria-label="Search" /></Dialog>);
    expect(await screen.findByRole("dialog", { name: "Palette" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  });
  it("can focus a chosen element on open", async () => {
    const ref = createRef<HTMLInputElement>();
    render(<Dialog defaultOpen bare title="P" initialFocus={ref}><input ref={ref} aria-label="Search" /></Dialog>);
    await waitFor(() => expect(screen.getByLabelText("Search")).toHaveFocus());
  });
});

describe("Kbd", () => {
  const setPlatform = (platform: string) =>
    Object.defineProperty(window.navigator, "platform", { value: platform, configurable: true });

  it("renders each key as its own kbd and names the group", () => {
    setPlatform("Linux x86_64");
    const { container } = render(<Kbd shortcut="mod+k" />);
    const keys = container.querySelectorAll("kbd");
    expect([...keys].map((k) => k.textContent)).toEqual(["Ctrl", "K"]);
    expect(screen.getByRole("group", { name: "Control K" })).toBeInTheDocument();
  });
  it("renders mod as Command on Apple platforms", () => {
    setPlatform("MacIntel");
    const { container } = render(<Kbd shortcut="mod+k" />);
    expect([...container.querySelectorAll("kbd")].map((k) => k.textContent)).toEqual(["⌘", "K"]);
    expect(screen.getByRole("group", { name: "Command K" })).toBeInTheDocument();
    setPlatform("Linux x86_64");
  });
  it("renders sequences with then", () => {
    const { container } = render(<Kbd shortcut="g i" />);
    expect([...container.querySelectorAll("kbd")].map((k) => k.textContent)).toEqual(["G", "I"]);
    expect(container).toHaveTextContent("then");
    expect(screen.getByRole("group", { name: "G then I" })).toBeInTheDocument();
  });
  it("maps shift, enter, esc and arrows", () => {
    const { container } = render(<Kbd shortcut="shift+enter up esc" />);
    expect([...container.querySelectorAll("kbd")].map((k) => k.textContent)).toEqual(["⇧", "↵", "↑", "Esc"]);
    expect(screen.getByRole("group", { name: "Shift Enter then Up arrow then Escape" })).toBeInTheDocument();
  });
  it("children override the shortcut", () => {
    const { container } = render(<Kbd shortcut="mod+k">Any key</Kbd>);
    expect(container.querySelectorAll("kbd")).toHaveLength(1);
    expect(container).toHaveTextContent("Any key");
    expect(container.querySelector("[aria-label]")).toBeNull();
  });
  it("renders on the server with the Ctrl default", async () => {
    const { renderToString } = await import("react-dom/server");
    setPlatform("MacIntel");
    expect(renderToString(<Kbd shortcut="mod+k" />)).toContain("Ctrl");
    setPlatform("Linux x86_64");
  });
});
