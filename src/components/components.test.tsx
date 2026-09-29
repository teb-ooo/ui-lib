import { describe, expect, it, vi } from "vitest";
import { createRef } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Avatar, Badge, Button, Dialog, Field, initialsOf, Input, Kbd } from "../index";

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

describe("Badge", () => {
  it("renders text with a tone", () => {
    render(<Badge tone="accent">staging</Badge>);
    const b = screen.getByText("staging");
    expect(b).toHaveAttribute("data-tone", "accent");
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
