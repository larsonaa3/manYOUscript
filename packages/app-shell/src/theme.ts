export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "manyouscript-theme";

const VALID_THEMES: Theme[] = ["light", "dark", "system"];

export function readStoredTheme(storage: Pick<Storage, "getItem">): Theme {
  const value = storage.getItem(THEME_STORAGE_KEY);
  return VALID_THEMES.includes(value as Theme) ? (value as Theme) : "system";
}

export function writeStoredTheme(storage: Pick<Storage, "setItem">, theme: Theme): void {
  storage.setItem(THEME_STORAGE_KEY, theme);
}

/** "system" resolves to the OS-level preference, passed in so this stays a pure, testable function. */
export function resolveThemeAttribute(theme: Theme, systemPrefersDark: boolean): "light" | "dark" {
  if (theme === "system") {
    return systemPrefersDark ? "dark" : "light";
  }
  return theme;
}

export function nextTheme(current: Theme): Theme {
  const order: Theme[] = ["system", "light", "dark"];
  return order[(order.indexOf(current) + 1) % order.length]!;
}
