import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusMark } from "./status-mark";
import type { MarkStatus } from "./status-mark";

describe("StatusMark", () => {
  it.each([
    ["ok", "ok"],
    ["fail", "failed"],
    ["info", "info"],
    ["none", "not run"],
  ] as const)("%s is named %s by default", (status: MarkStatus, word) => {
    render(<StatusMark status={status} />);
    expect(screen.getByRole("img", { name: word }).getAttribute("data-status")).toBe(status);
  });

  it("takes the name of the thing it marks, and each state has its own icon", () => {
    const { container } = render(
      <>
        <StatusMark status="ok" label="Backups: ok" />
        <StatusMark status="fail" label="DNS: failed" />
      </>,
    );
    expect(screen.getByRole("img", { name: "DNS: failed" })).toBeTruthy();
    const [ok, fail] = [...container.querySelectorAll("svg")];
    expect(ok?.getAttribute("class")).not.toBe(fail?.getAttribute("class")); // lucide names the icon in its class
    expect(ok?.getAttribute("aria-hidden")).toBe("true");
  });
});
