import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ExportModal } from "./ExportModal";

describe("ExportModal", () => {
  test("keeps selected messages stable when date filters are applied", () => {
    const messages = [
      { id: "m1", role: "user", content: "第一条不应导出", status: "done", createdAt: "2026-01-01T10:00:00.000Z" },
      { id: "m2", role: "assistant", content: "第二条已选择", status: "done", createdAt: "2026-01-02T10:00:00.000Z" },
      { id: "m3", role: "assistant", content: "第三条不应替代第二条", status: "done", createdAt: "2026-01-03T10:00:00.000Z" },
    ];
    const { container } = render(<ExportModal isOpen onClose={vi.fn()} title="导出测试" messages={messages} />);

    fireEvent.click(screen.getByRole("button", { name: "选择消息" }));
    const checkboxes = Array.from(container.querySelectorAll<HTMLInputElement>(".export-message-item input[type='checkbox']"));
    fireEvent.click(checkboxes[1]);

    fireEvent.click(screen.getByRole("button", { name: "按日期筛选" }));
    const dateInputs = Array.from(container.querySelectorAll<HTMLInputElement>(".export-date-input"));
    fireEvent.change(dateInputs[0], { target: { value: "2026-01-02" } });
    fireEvent.change(dateInputs[1], { target: { value: "2026-01-03" } });

    fireEvent.click(screen.getByRole("button", { name: "预览导出内容" }));

    expect(screen.getByText("已选择 1 / 3 条 · 日期筛选中")).toBeTruthy();
    const preview = container.querySelector(".export-preview-markdown");
    expect(preview?.textContent).toContain("第二条已选择");
    expect(preview?.textContent).not.toContain("第三条不应替代第二条");
  });
});
