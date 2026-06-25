import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { useFormValidation } from "./useFormValidation";

describe("useFormValidation", () => {
  test("initializes with default values", () => {
    const { result } = renderHook(() =>
      useFormValidation({ name: "", email: "" }, {})
    );
    expect(result.current.values.name).toBe("");
    expect(result.current.values.email).toBe("");
    expect(result.current.isValid).toBe(true);
  });

  test("setValue updates values", () => {
    const { result } = renderHook(() =>
      useFormValidation({ name: "" }, {})
    );
    act(() => result.current.setValue("name", "John"));
    expect(result.current.values.name).toBe("John");
  });

  test("validate returns null for valid value", () => {
    const { result } = renderHook(() =>
      useFormValidation({ name: "" }, {
        name: [{ validate: (v) => (v as string).length > 0, message: "Required" }],
      })
    );
    const error = result.current.validate("name", "John");
    expect(error).toBeNull();
  });

  test("validate returns error for invalid value", () => {
    const { result } = renderHook(() =>
      useFormValidation({ name: "" }, {
        name: [{ validate: (v) => (v as string).length > 0, message: "Required" }],
      })
    );
    const error = result.current.validate("name", "");
    expect(error).toBe("Required");
  });

  test("validateAll returns false when any field is invalid", () => {
    const { result } = renderHook(() =>
      useFormValidation({ name: "", email: "" }, {
        name: [{ validate: (v) => (v as string).length > 0, message: "Name required" }],
        email: [{ validate: (v) => (v as string).includes("@"), message: "Email invalid" }],
      })
    );
    let valid: boolean;
    act(() => { valid = result.current.validateAll(); });
    expect(valid!).toBe(false);
    expect(result.current.errors.name).toBe("Name required");
    expect(result.current.errors.email).toBe("Email invalid");
  });

  test("validateAll returns true when all fields are valid", () => {
    const { result } = renderHook(() =>
      useFormValidation({ name: "John", email: "john@test.com" }, {
        name: [{ validate: (v) => (v as string).length > 0, message: "Required" }],
        email: [{ validate: (v) => (v as string).includes("@"), message: "Invalid" }],
      })
    );
    const valid = result.current.validateAll();
    expect(valid).toBe(true);
    expect(Object.keys(result.current.errors)).toHaveLength(0);
  });

  test("setValue validates touched fields", () => {
    const { result } = renderHook(() =>
      useFormValidation({ name: "" }, {
        name: [{ validate: (v) => (v as string).length > 0, message: "Required" }],
      })
    );
    act(() => result.current.setFieldTouched("name"));
    act(() => result.current.setValue("name", ""));
    expect(result.current.errors.name).toBe("Required");
  });

  test("setValue clears error when value becomes valid", () => {
    const { result } = renderHook(() =>
      useFormValidation({ name: "" }, {
        name: [{ validate: (v) => (v as string).length > 0, message: "Required" }],
      })
    );
    act(() => result.current.setFieldTouched("name"));
    act(() => result.current.setValue("name", ""));
    expect(result.current.errors.name).toBe("Required");
    act(() => result.current.setValue("name", "John"));
    expect(result.current.errors.name).toBeUndefined();
  });

  test("reset restores initial values", () => {
    const { result } = renderHook(() =>
      useFormValidation({ name: "Initial" }, {
        name: [{ validate: (v) => (v as string).length > 0, message: "Required" }],
      })
    );
    act(() => result.current.setValue("name", "Changed"));
    act(() => result.current.setFieldTouched("name"));
    expect(result.current.values.name).toBe("Changed");
    act(() => result.current.reset());
    expect(result.current.values.name).toBe("Initial");
    expect(result.current.errors).toEqual({});
  });

  test("multiple rules validate in order", () => {
    const { result } = renderHook(() =>
      useFormValidation({ password: "" }, {
        password: [
          { validate: (v) => (v as string).length >= 8, message: "Too short" },
          { validate: (v) => /[A-Z]/.test(v as string), message: "Need uppercase" },
        ],
      })
    );
    expect(result.current.validate("password", "abc")).toBe("Too short");
    expect(result.current.validate("password", "abcdefgh")).toBe("Need uppercase");
    expect(result.current.validate("password", "Abcdefgh")).toBeNull();
  });
});
