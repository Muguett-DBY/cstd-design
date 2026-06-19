import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Segmented } from "./Segmented";

describe("Segmented", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders all options", () => {
    render(
      <div>
        <Segmented
          value="a"
          options={[["a", "Option A"], ["b", "Option B"], ["c", "Option C"]]}
          onChange={() => {}}
        />
      </div>,
    );
    expect(screen.getAllByText("Option A")).toHaveLength(1);
    expect(screen.getAllByText("Option B")).toHaveLength(1);
    expect(screen.getAllByText("Option C")).toHaveLength(1);
  });

  it("calls onChange with the selected value when clicked", async () => {
    const onChange = vi.fn();
    render(
      <div>
        <Segmented
          value="a"
          options={[["a", "Option A"], ["b", "Option B"]]}
          onChange={onChange}
        />
      </div>,
    );
    const buttons = screen.getAllByRole("radio");
    expect(buttons).toHaveLength(2);
    await userEvent.click(buttons[1]);
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("marks the active option with aria-checked=true", () => {
    render(
      <div>
        <Segmented
          value="b"
          options={[["a", "Option A"], ["b", "Option B"]]}
          onChange={() => {}}
        />
      </div>,
    );
    const buttons = screen.getAllByRole("radio");
    expect(buttons[0].getAttribute("aria-checked")).toBe("false");
    expect(buttons[1].getAttribute("aria-checked")).toBe("true");
  });

  it("has role=radiogroup on the container", () => {
    const { container } = render(
      <div>
        <Segmented
          value="a"
          options={[["a", "Option A"]]}
          onChange={() => {}}
        />
      </div>,
    );
    const radiogroup = container.querySelector('[role="radiogroup"]');
    expect(radiogroup).not.toBeNull();
  });
});
