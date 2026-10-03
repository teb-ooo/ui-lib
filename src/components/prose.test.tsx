import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Prose } from "./prose";

describe("Prose", () => {
  it("wraps its content in the prose class and keeps extra classes", () => {
    const { container } = render(
      <Prose className="max-w-prose">
        <h1>Title</h1>
        <p>Body</p>
      </Prose>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("prose");
    expect(root.className).toContain("max-w-prose");
    expect(root.querySelector("h1")?.textContent).toBe("Title");
  });
});
