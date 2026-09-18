import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn utility function", () => {
  it("merges simple string class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes (booleans, null, undefined)", () => {
    expect(cn("foo", false && "bar", null, undefined, "baz")).toBe("foo baz");
    expect(cn("foo", true && "bar")).toBe("foo bar");
  });

  it("handles object inputs from clsx", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("handles array inputs from clsx", () => {
    expect(cn(["foo", "bar"], ["baz"])).toBe("foo bar baz");
  });

  it("resolves conflicting Tailwind CSS classes correctly", () => {
    expect(cn("px-2 px-4")).toBe("px-4");
    expect(cn("text-red-500 text-blue-500")).toBe("text-blue-500");
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    expect(cn("p-4 px-2")).toBe("p-4 px-2");
  });

  it("handles empty or falsy inputs gracefully", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
    expect(cn("", null, undefined, false)).toBe("");
  });
});
