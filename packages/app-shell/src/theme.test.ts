import { describe, expect, it } from "vitest";
import { readStoredTheme, writeStoredTheme, resolveThemeAttribute, nextTheme } from "./theme";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
    _data: data,
  };
}

describe("readStoredTheme", () => {
  it("defaults to system when nothing is stored", () => {
    expect(readStoredTheme(fakeStorage())).toBe("system");
  });

  it("returns a validly-stored theme", () => {
    expect(readStoredTheme(fakeStorage({ "manyouscript-theme": "dark" }))).toBe("dark");
  });

  it("falls back to system for a garbage stored value", () => {
    expect(readStoredTheme(fakeStorage({ "manyouscript-theme": "solarized" }))).toBe("system");
  });
});

describe("writeStoredTheme", () => {
  it("persists the theme under the expected key", () => {
    const storage = fakeStorage();
    writeStoredTheme(storage, "dark");
    expect(storage._data["manyouscript-theme"]).toBe("dark");
  });
});

describe("resolveThemeAttribute", () => {
  it("passes light/dark through unchanged", () => {
    expect(resolveThemeAttribute("light")).toBe("light");
    expect(resolveThemeAttribute("dark")).toBe("dark");
  });

  it("returns null for system so the prefers-color-scheme media query decides", () => {
    expect(resolveThemeAttribute("system")).toBeNull();
  });
});

describe("nextTheme", () => {
  it("cycles system -> light -> dark -> system", () => {
    expect(nextTheme("system")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("system");
  });
});
