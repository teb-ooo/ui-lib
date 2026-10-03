import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FeedbackPanel } from "./feedback-panel";
import { ToastProvider } from "./toast";
import type { FeedbackController } from "./feedback-panel";

function controller(over: Partial<FeedbackController> = {}): FeedbackController {
  return {
    available: true, isOpen: true, close: vi.fn(), text: "", setText: vi.fn(), element: null, picking: false, startPicking: vi.fn(),
    stopPicking: vi.fn(), clearElement: vi.fn(), includeScreenshot: false, setIncludeScreenshot: vi.fn(), screenshot: null,
    screenshotError: null, capturing: false, retakeScreenshot: vi.fn(), sends: ["The page: /x", "Viewport: 1 × 1"], status: "idle",
    result: null, error: null, restoredDraft: false, submit: vi.fn(async () => undefined), ...over,
  };
}

describe("FeedbackPanel", () => {
  it("renders nothing when feedback is not available, and nothing while closed or picking", () => {
    const { rerender } = render(<FeedbackPanel feedback={controller({ available: false })} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<FeedbackPanel feedback={controller({ isOpen: false })} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<FeedbackPanel feedback={controller({ picking: true })} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("takes the text and only sends when there is text", () => {
    const f = controller();
    const { rerender } = render(<FeedbackPanel feedback={f} />);
    expect(screen.getByRole("dialog", { name: "Send feedback" })).toBeTruthy();
    // What is sent is no longer listed in the dialog.
    expect(screen.queryByText("The page: /x")).toBeNull();
    expect(screen.queryByText(/It goes to the agent/)).toBeNull();
    fireEvent.change(screen.getByRole("textbox", { name: "What should change?" }), { target: { value: "hello" } });
    expect(f.setText).toHaveBeenCalledWith("hello");
    expect(screen.getByRole("button", { name: "Send" }).hasAttribute("disabled")).toBe(true);
    const g = controller({ text: "hello" });
    rerender(<FeedbackPanel feedback={g} />);
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(g.submit).toHaveBeenCalled();
  });

  it("Enter sends, Shift+Enter does not, and an empty text never sends", () => {
    const empty = controller();
    const { rerender } = render(<FeedbackPanel feedback={empty} />);
    fireEvent.keyDown(screen.getByRole("textbox", { name: "What should change?" }), { key: "Enter" });
    expect(empty.submit).not.toHaveBeenCalled();
    const f = controller({ text: "hello" });
    rerender(<FeedbackPanel feedback={f} />);
    const box = screen.getByRole("textbox", { name: "What should change?" });
    fireEvent.keyDown(box, { key: "Enter", shiftKey: true });
    expect(f.submit).not.toHaveBeenCalled();
    fireEvent.keyDown(box, { key: "Enter" });
    expect(f.submit).toHaveBeenCalledTimes(1);
    const busy = controller({ text: "hello", status: "sending" });
    rerender(<FeedbackPanel feedback={busy} />);
    fireEvent.keyDown(screen.getByRole("textbox", { name: "What should change?" }), { key: "Enter" });
    expect(busy.submit).not.toHaveBeenCalled();
  });

  it("with a toast host a sent message is a toast and the dialog closes", async () => {
    const f = controller({ status: "sent", result: { bead: "ui-9", agent: "ui", status: "idle" } });
    render(
      <ToastProvider>
        <FeedbackPanel feedback={f} />
      </ToastProvider>,
    );
    expect(await screen.findByText("Feedback sent, tracked as ui-9")).toBeTruthy();
    expect(screen.getByText("ui was notified.")).toBeTruthy();
    expect(f.close).toHaveBeenCalledTimes(1);
  });

  it("puts the cursor in the text when the dialog shows", async () => {
    render(<FeedbackPanel feedback={controller()} />);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "What should change?" })));
  });

  it("while an element is being picked it says what to do and how to skip, since a hotkey gives no other sign", () => {
    const { rerender } = render(<FeedbackPanel feedback={controller({ picking: true })} />);
    const hint = screen.getByRole("status");
    expect(hint.textContent).toContain("Click the element this is about");
    expect(hint.hasAttribute("data-feedback-ignore")).toBe(true);
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<FeedbackPanel feedback={controller({ picking: false })} />);
    expect(screen.queryByText(/Click the element this is about/)).toBeNull();
  });

  it("marks its own nodes so the screenshot and the picker leave them out", () => {
    render(<FeedbackPanel feedback={controller()} />);
    expect(screen.getByRole("dialog").hasAttribute("data-feedback-ignore")).toBe(true);
  });

  it("picks an element, shows it, and can forget it", () => {
    const f = controller({ element: { selector: "main > button", role: "button", text: "Save" } });
    render(<FeedbackPanel feedback={f} />);
    expect(screen.getByText("main > button")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Forget the picked element" }));
    expect(f.clearElement).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Pick another element" }));
    expect(f.startPicking).toHaveBeenCalled();
  });

  it("shows the screenshot preview and a switch for it", () => {
    const f = controller({ includeScreenshot: true, screenshot: { url: "blob:x", type: "image/png", size: 2048 } });
    render(<FeedbackPanel feedback={f} />);
    expect(screen.getByRole("img", { name: "Screenshot preview" }).getAttribute("src")).toBe("blob:x");
    fireEvent.click(screen.getByRole("switch", { name: "Include a screenshot" }));
    expect(f.setIncludeScreenshot).toHaveBeenCalledWith(false);
  });

  it("without a toast host the dialog says Sent with the bead and whether the agent was reached", () => {
    const { rerender } = render(<FeedbackPanel feedback={controller({ status: "sent", result: { bead: "ui-9", agent: "ui", status: "idle" } })} />);
    expect(screen.getByText("Sent, tracked as ui-9.")).toBeTruthy();
    expect(screen.getByText("ui was notified.")).toBeTruthy();
    rerender(<FeedbackPanel feedback={controller({ status: "sent", result: { bead: "ui-9", agent: "ui", status: "offline" } })} />);
    expect(screen.getByText(/ui is offline; it will see it when it is back/)).toBeTruthy();
  });

  it("shows a failure and that the text is kept", () => {
    render(<FeedbackPanel feedback={controller({ text: "x", status: "failed", error: "Not up." })} />);
    expect(screen.getByRole("alert").textContent).toContain("Not up.");
    expect(screen.getByText(/kept as a draft/)).toBeTruthy();
  });
});
