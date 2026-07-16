import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { readStoredTheme, writeStoredTheme, resolveThemeAttribute, nextTheme, type Theme } from "./theme";

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Applies the resolved theme attribute at the document root regardless of
 * auth state - must wrap LoginGate, not sit inside App(), since the login
 * screen itself needs a theme before the user is authenticated and App()
 * ever mounts.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme(window.localStorage));
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolveThemeAttribute(theme, systemPrefersDark);
    writeStoredTheme(window.localStorage, theme);
  }, [theme, systemPrefersDark]);

  const toggleTheme = () => setTheme((current) => nextTheme(current));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme() must be used within a <ThemeProvider>");
  }
  return ctx;
}
