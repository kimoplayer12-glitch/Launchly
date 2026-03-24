import { createContext, useContext, useState, useEffect } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    if (newTheme === "light") {
      // Light mode colors
      root.style.setProperty("--background", "0 0% 100%");
      root.style.setProperty("--foreground", "240 10% 15%");
      
      root.style.setProperty("--card", "0 0% 95%");
      root.style.setProperty("--card-foreground", "240 10% 15%");
      
      root.style.setProperty("--popover", "0 0% 95%");
      root.style.setProperty("--popover-foreground", "240 10% 15%");
      
      root.style.setProperty("--muted", "240 13% 75%");
      root.style.setProperty("--muted-foreground", "240 10% 40%");
      
      root.style.setProperty("--border", "240 15% 85%");
      root.style.setProperty("--input", "240 15% 90%");
      
      document.documentElement.classList.remove("dark");
    } else {
      // Dark mode colors
      root.style.setProperty("--background", "240 10% 5%");
      root.style.setProperty("--foreground", "210 40% 98%");
      
      root.style.setProperty("--card", "240 15% 12%");
      root.style.setProperty("--card-foreground", "210 40% 98%");
      
      root.style.setProperty("--popover", "240 15% 12%");
      root.style.setProperty("--popover-foreground", "210 40% 98%");
      
      root.style.setProperty("--muted", "240 13% 25%");
      root.style.setProperty("--muted-foreground", "210 20% 60%");
      
      root.style.setProperty("--border", "240 15% 20%");
      root.style.setProperty("--input", "240 15% 15%");
      
      document.documentElement.classList.add("dark");
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
