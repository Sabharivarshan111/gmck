
import { createContext, useContext, useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

export type Theme = "light" | "dark" | "blackpink" | "retro";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
  toggleTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useLocalStorage<Theme>(storageKey, defaultTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove all theme classes first
    root.classList.remove("light", "dark", "blackpink", "retro");
    
    // Add the current theme class
    root.classList.add(theme);
    
    // Also add dark class for dark and blackpink themes for better compatibility
    if (theme === "dark" || theme === "blackpink" || theme === "retro") {
      root.classList.add("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    // We now have 4 themes to cycle through: light -> dark -> blackpink -> retro -> light
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("blackpink");
    else if (theme === "blackpink") setTheme("retro"); 
    else setTheme("light");
  };

  return (
    <ThemeProviderContext.Provider
      {...props}
      value={{
        theme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
