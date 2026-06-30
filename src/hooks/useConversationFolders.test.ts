import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useConversationFolders } from "./useConversationFolders";

const STORAGE_KEY = "cstd-design:conversationFolders";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

describe("useConversationFolders", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  test("starts with no folders", () => {
    const { result } = renderHook(() => useConversationFolders());
    expect(result.current.folders).toEqual([]);
  });

  test("ignores non-array saved folders and non-record assignments", () => {
    localStorageMock.getItem
      .mockReturnValueOnce(JSON.stringify({ id: "not-an-array" }))
      .mockReturnValueOnce(JSON.stringify(["conv1"]));

    const { result } = renderHook(() => useConversationFolders());

    expect(result.current.folders).toEqual([]);
    expect(result.current.getFolderConversations("folder1")).toEqual([]);
  });

  test("createFolder adds a folder with correct color", () => {
    const { result } = renderHook(() => useConversationFolders());

    act(() => {
      result.current.createFolder("工作");
    });

    expect(result.current.folders).toHaveLength(1);
    expect(result.current.folders[0].name).toBe("工作");
    expect(result.current.folders[0].color).toBe("#f59e0b");
    expect(result.current.folders[0].id).toBeTruthy();
  });

  test("createFolder cycles through colors", () => {
    const { result } = renderHook(() => useConversationFolders());

    act(() => { result.current.createFolder("Folder 1"); });
    act(() => { result.current.createFolder("Folder 2"); });
    act(() => { result.current.createFolder("Folder 3"); });

    expect(result.current.folders[0].color).toBe("#f59e0b");
    expect(result.current.folders[1].color).toBe("#10b981");
    expect(result.current.folders[2].color).toBe("#3b82f6");
  });

  test("deleteFolder removes folder and its assignments", () => {
    const { result } = renderHook(() => useConversationFolders());

    act(() => { result.current.createFolder("Test"); });
    const folderId = result.current.folders[0].id;
    act(() => { result.current.assignToFolder("conv1", folderId); });

    expect(result.current.getConversationFolder("conv1")).not.toBeNull();

    act(() => { result.current.deleteFolder(folderId); });

    expect(result.current.folders).toHaveLength(0);
    expect(result.current.getConversationFolder("conv1")).toBeNull();
  });

  test("renameFolder updates folder name", () => {
    const { result } = renderHook(() => useConversationFolders());

    act(() => { result.current.createFolder("Old Name"); });
    const folderId = result.current.folders[0].id;

    act(() => { result.current.renameFolder(folderId, "New Name"); });

    expect(result.current.folders[0].name).toBe("New Name");
  });

  test("assignToFolder assigns conversation to folder", () => {
    const { result } = renderHook(() => useConversationFolders());

    act(() => { result.current.createFolder("Test"); });
    const folderId = result.current.folders[0].id;

    act(() => { result.current.assignToFolder("conv1", folderId); });

    const assigned = result.current.getConversationFolder("conv1");
    expect(assigned).not.toBeNull();
    expect(assigned!.id).toBe(folderId);
  });

  test("assignToFolder with null removes assignment", () => {
    const { result } = renderHook(() => useConversationFolders());

    act(() => { result.current.createFolder("Test"); });
    const folderId = result.current.folders[0].id;
    act(() => { result.current.assignToFolder("conv1", folderId); });

    act(() => { result.current.assignToFolder("conv1", null); });

    expect(result.current.getConversationFolder("conv1")).toBeNull();
  });

  test("getFolderConversations returns conversations in folder", () => {
    const { result } = renderHook(() => useConversationFolders());

    act(() => { result.current.createFolder("Test"); });
    const folderId = result.current.folders[0].id;
    act(() => { result.current.assignToFolder("conv1", folderId); });
    act(() => { result.current.assignToFolder("conv2", folderId); });
    act(() => { result.current.assignToFolder("conv3", folderId); });

    const convs = result.current.getFolderConversations(folderId);
    expect(convs).toEqual(["conv1", "conv2", "conv3"]);
  });

  test("autoCategorize categorizes by keywords", () => {
    const { result } = renderHook(() => useConversationFolders());

    const conversations = [
      { id: "c1", title: "帮我画一张海报" },
      { id: "c2", title: "视频特效制作" },
      { id: "c3", title: "写一段代码" },
      { id: "c4", title: "写一份文档报告" },
      { id: "c5", title: "今天天气不错" },
    ];

    let categorized: number;
    act(() => {
      categorized = result.current.autoCategorize(conversations);
    });

    expect(categorized!).toBe(4);
    expect(result.current.folders.length).toBeGreaterThanOrEqual(4);
  });

  test("persists folders to localStorage", () => {
    const { result } = renderHook(() => useConversationFolders());

    act(() => { result.current.createFolder("Test"); });

    expect(localStorageMock.setItem).toHaveBeenCalled();
    const folderCalls = localStorageMock.setItem.mock.calls.filter(
      (call: [string, string]) => call[0] === STORAGE_KEY
    );
    expect(folderCalls.length).toBeGreaterThan(0);
  });

  test("folderColors has 6 colors", () => {
    const { result } = renderHook(() => useConversationFolders());
    expect(result.current.folderColors).toHaveLength(6);
  });
});
