import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { InfoLine } from "./InfoLine";

describe("InfoLine", () => {
  test("renders label and value", () => {
    render(<InfoLine label="Status" value="Active" />);
    expect(screen.getByText("Status")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
  });

  test("renders with different content", () => {
    render(<InfoLine label="Count" value="42" />);
    expect(screen.getByText("Count")).toBeTruthy();
    expect(screen.getByText("42")).toBeTruthy();
  });
});
