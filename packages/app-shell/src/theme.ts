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

/** "system" means "let the prefers-color-scheme media query decide" - no explicit attribute. */
export function resolveThemeAttribute(theme: Theme): "light" | "dark" | null {
  return theme === "system" ? null : theme;
}

export function nextTheme(current: Theme): Theme {
  const order: Theme[] = ["system", "light", "dark"];
  return order[(order.indexOf(current) + 1) % order.length]!;
}
