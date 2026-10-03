import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ImagePreview } from "./image-preview";

describe("ImagePreview", () => {
  it("draws the picture with its alt text, the max height and an open-full-size link", () => {
    render(<ImagePreview src="/a.png" alt="A screenshot" href="/a.png" maxHeight={10} />);
    const img = screen.getByRole("img", { name: "A screenshot" });
    expect(img.style.maxHeight).toBe("10rem");
    const link = screen.getByRole("link", { name: "Open full size" });
    expect(link.getAttribute("target")).toBe("_blank");
  });
  it("draws nothing when the picture fails to load", () => {
    const { container } = render(<ImagePreview src="/missing.png" alt="Missing" href="/missing.png" />);
    fireEvent.error(screen.getByRole("img", { name: "Missing" }));
    expect(container.firstChild).toBeNull();
  });
});
