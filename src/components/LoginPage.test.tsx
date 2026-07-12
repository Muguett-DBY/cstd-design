import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { LoginPage } from "./LoginPage";

afterEach(cleanup);

describe("LoginPage", () => {
  test("renders a labelled password field with password-manager semantics", () => {
    render(<LoginPage onLogin={vi.fn()} />);

    const input = screen.getByLabelText("访问密码");
    expect(input.id).toBe("login-password");
    expect(input.getAttribute("name")).toBe("password");
    expect(input.getAttribute("type")).toBe("password");
    expect(input.getAttribute("autocomplete")).toBe("current-password");
    expect(input.hasAttribute("required")).toBe(true);
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(input.hasAttribute("aria-describedby")).toBe(false);
  });

  test("announces login failures and clears stale errors when the user edits", async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn().mockRejectedValue(new Error("密码错误"));
    render(<LoginPage onLogin={onLogin} />);

    const input = screen.getByLabelText("访问密码");
    await user.type(input, "bad-password");
    await user.click(screen.getByRole("button", { name: "进入" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("密码错误");
    expect(alert.id).toBe("login-error");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("login-error");

    await user.type(input, "2");

    expect(screen.queryByRole("alert")).toBeNull();
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(input.hasAttribute("aria-describedby")).toBe(false);
  });

  test("ignores a failed attempt after the user changes the submitted password", async () => {
    const user = userEvent.setup();
    let rejectLogin!: (error: Error) => void;
    const loginAttempt = new Promise<void>((_, reject) => {
      rejectLogin = reject;
    });
    const onLogin = vi.fn(() => loginAttempt);
    render(<LoginPage onLogin={onLogin} />);

    const input = screen.getByLabelText("访问密码");
    await user.type(input, "old-password");
    await user.click(screen.getByRole("button", { name: "进入" }));
    await user.type(input, "2");

    await act(async () => {
      rejectLogin(new Error("密码错误"));
    });

    expect(input.getAttribute("value")).toBe("old-password2");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(input.hasAttribute("aria-describedby")).toBe(false);
  });
});
