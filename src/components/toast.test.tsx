import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PortalContainerProvider } from "../lib/theme-scope";
import { ToastProvider, useToast } from "./toast";

function Fire() {
  const toast = useToast();
  return <button onClick={() => toast.show({ title: "Saved" })}>Show</button>;
}

describe("Toast", () => {
  it("is drawn inside the forced theme's container, so it reverses the right way round", async () => {
    const frame = document.createElement("div");
    frame.setAttribute("data-theme", "dark");
    document.body.append(frame);
    render(
      <PortalContainerProvider container={frame}>
        <ToastProvider>
          <Fire />
        </ToastProvider>
      </PortalContainerProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Show" }));
    const toast = await screen.findByText("Saved");
    expect(frame.contains(toast)).toBe(true);
    frame.remove();
  });
});
