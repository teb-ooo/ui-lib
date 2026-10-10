import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FatalPage } from "./fatal-page";

describe("FatalPage", () => {
  it("is an alert with the title as its heading, the message, the detail and the action, all readable text", () => {
    render(<FatalPage title="BAD" message="The invitation has expired." detail="request 01HX" action={<a href="/enter">Ask for a new one</a>} />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "BAD" })).toBeTruthy();
    expect(screen.getByText("The invitation has expired.")).toBeTruthy();
    expect(screen.getByText("request 01HX")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ask for a new one" })).toBeTruthy();
  });

  it("the picture is hidden from assistive technology, and a browser without canvas still shows the page", () => {
    const { container } = render(<FatalPage message="Down." fullscreen={false} />);
    const canvas = container.querySelector("canvas")!;
    expect(canvas.getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByText("Down.")).toBeTruthy(); // jsdom has no 2D context: nothing is drawn and nothing throws
    expect(screen.getByRole("heading", { name: "BAD" })).toBeTruthy();
  });

  it("fills the window by default and sits in its box when fullscreen is false", () => {
    const { container, rerender } = render(<FatalPage />);
    expect((container.firstElementChild as HTMLElement).className).toContain("fixed");
    rerender(<FatalPage fullscreen={false} />);
    expect((container.firstElementChild as HTMLElement).className).not.toContain("fixed");
  });
});
