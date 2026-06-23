import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test } from "vitest";
import { BACKUP_KEYS, ONBOARDING_STORAGE_KEY } from "../storage-keys";
import { OnboardingTour } from "./OnboardingTour";

describe("OnboardingTour", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => { store.set(key, value); },
        removeItem: (key: string) => { store.delete(key); },
        clear: () => { store.clear(); },
      },
      configurable: true,
    });
  });

  test("uses the same storage key for completion and backup", async () => {
    render(<OnboardingTour />);

    await userEvent.click(screen.getByRole("button", { name: "跳过引导" }));

    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe("true");
    expect(BACKUP_KEYS).toContain(ONBOARDING_STORAGE_KEY);
    expect(BACKUP_KEYS).not.toContain("cstd-design:onboarding-completed");
  });
});
