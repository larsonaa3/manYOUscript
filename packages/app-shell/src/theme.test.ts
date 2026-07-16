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
  it("passes light/dark through unchanged regardless of system preference", () => {
    expect(resolveThemeAttribute("light", true)).toBe("light");
    expect(resolveThemeAttribute("dark", false)).toBe("dark");
  });

  it("resolves system to the OS-level preference", () => {
    expect(resolveThemeAttribute("system", true)).toBe("dark");
    expect(resolveThemeAttribute("system", false)).toBe("light");
  });
});

describe("nextTheme", () => {
  it("cycles system -> light -> dark -> system", () => {
    expect(nextTheme("system")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("system");
  });
});
