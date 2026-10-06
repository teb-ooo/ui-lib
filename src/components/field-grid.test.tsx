import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FieldGrid, FieldRow } from "../index";

describe("FieldGrid", () => {
  it("lists rows with their labels and marks drafts", () => {
    render(
      <FieldGrid label="Fields">
        <FieldRow label="Name">Mira</FieldRow>
        <FieldRow label="Summary" draft actions={<button type="button">Edit</button>}>
          Unsure
        </FieldRow>
      </FieldGrid>,
    );
    expect(screen.getByLabelText("Fields").tagName).toBe("DL");
    expect(screen.getByText("Name").tagName).toBe("DT");
    expect(screen.getByText("Unsure").className).toContain("text-ink-muted");
    expect(screen.getByText("Mira").className).toContain("text-ink");
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });
});
