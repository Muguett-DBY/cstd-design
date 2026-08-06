import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { OfflineIndicator } from "./OfflineIndicator";

const serviceWorkerState = vi.hoisted(() => ({
  isOfflineReady: true,
  isOnline: false,
}));

vi.mock("../hooks/useServiceWorker", () => ({
  useServiceWorker: () => serviceWorkerState,
}));

describe("OfflineIndicator", () => {
  beforeEach(() => {
    serviceWorkerState.isOfflineReady = true;
    serviceWorkerState.isOnline = false;
  });

  test("explains that cached UI does not make private data available offline", () => {
    render(<OfflineIndicator />);

    const status = screen.getByRole("status");
    expect(status.textContent).toContain("应用界面已缓存，私人数据需联网");
    expect(status.textContent).not.toContain("可继续使用");
  });
});
