import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "./input";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";

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
