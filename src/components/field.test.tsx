import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Field } from "./field";
import { Input } from "./input";

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
