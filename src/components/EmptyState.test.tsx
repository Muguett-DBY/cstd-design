import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { EmptyState, ChatEmptyState, NoSearchResultsState, NoConversationsState, NoAssetsState, NoSelectionState } from "./EmptyState";

describe("EmptyState", () => {
  test("renders title and text", () => {
    render(<EmptyState title="No items" text="Nothing here yet" />);
    expect(screen.getByText("No items")).toBeTruthy();
    expect(screen.getByText("Nothing here yet")).toBeTruthy();
  });

  test("renders children when provided", () => {
    render(
      <EmptyState title="Empty" text="No data">
        <button>Action</button>
      </EmptyState>
    );
    expect(screen.getByText("Action")).toBeTruthy();
  });

  test("renders custom icon when provided", () => {
    render(<EmptyState title="Test" text="Text" icon={<span data-testid="custom-icon" />} />);
    expect(screen.getByTestId("custom-icon")).toBeTruthy();
  });
});

describe("ChatEmptyState", () => {
  test("renders chat empty state with suggestions", () => {
    render(<ChatEmptyState />);
    expect(screen.getByText("开始你的第一次对话")).toBeTruthy();
  });
});

describe("NoSearchResultsState", () => {
  test("renders search query", () => {
    render(<NoSearchResultsState query="test query" />);
    expect(screen.getByText(/test query/)).toBeTruthy();
  });

  test("renders clear button when onClear provided", () => {
    const onClear = vi.fn();
    render(<NoSearchResultsState query="test" onClear={onClear} />);
    const button = screen.getByText("清除筛选");
    button.click();
    expect(onClear).toHaveBeenCalled();
  });
});

describe("NoConversationsState", () => {
  test("renders create button when onCreate provided", () => {
    const onCreate = vi.fn();
    render(<NoConversationsState onCreate={onCreate} />);
    const button = screen.getByText("新建会话");
    button.click();
    expect(onCreate).toHaveBeenCalled();
  });
});

describe("NoAssetsState", () => {
  test("renders upload button when onUpload provided", () => {
    const onUpload = vi.fn();
    render(<NoAssetsState onUpload={onUpload} />);
    const button = screen.getByText("上传文件");
    button.click();
    expect(onUpload).toHaveBeenCalled();
  });

  test("shows kind-specific label", () => {
    render(<NoAssetsState kind="image" />);
    expect(screen.getAllByText(/图片/).length).toBeGreaterThan(0);
  });
});

describe("NoSelectionState", () => {
  test("renders select all button when onSelectAll provided", () => {
    const onSelectAll = vi.fn();
    render(<NoSelectionState onSelectAll={onSelectAll} />);
    const button = screen.getByText("全选可见项");
    button.click();
    expect(onSelectAll).toHaveBeenCalled();
  });
});
