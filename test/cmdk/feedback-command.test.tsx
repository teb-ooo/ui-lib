import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { useFeedbackCommand } from "../../src/cmdk/index";
import { renderApp } from "./harness";

function Probe({ available, open }: { available: boolean; open: () => void }) {
  useFeedbackCommand({ available, open });
  return null;
}
const has = (title: string) => screen.queryAllByRole("option").some((o) => o.textContent?.includes(title));

describe("useFeedbackCommand", () => {
  it("lists Send feedback in the palette only when feedback is available, and runs open", async () => {
    const user = userEvent.setup();
    const open = vi.fn();
    await renderApp({ extra: <Probe available open={open} /> });
    await user.keyboard("{Control>}k{/Control}");
    await screen.findByRole("combobox");
    await user.keyboard("send feedback");
    expect(has("Send feedback")).toBe(true);
    await user.keyboard("{Enter}");
    expect(open).toHaveBeenCalled();
  });

  it("is absent for everyone else", async () => {
    const user = userEvent.setup();
    await renderApp({ extra: <Probe available={false} open={() => undefined} /> });
    await user.keyboard("{Control>}k{/Control}");
    await screen.findByRole("combobox");
    await user.keyboard("send feedback");
    expect(has("Send feedback")).toBe(false);
  });
});
