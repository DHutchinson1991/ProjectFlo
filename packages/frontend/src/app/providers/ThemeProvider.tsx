"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ThemeProvider as MUIThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { PaletteMode } from "@mui/material";

// Define theme settings
const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === "light"
      ? {
          // Light mode palette
          primary: {
            main: "#1976d2",
          },
          secondary: {
            main: "#9c27b0",
          },
          background: {
            default: "#f5f5f5",
            paper: "#ffffff",
          },
          text: {
            primary: "#333333",
            secondary: "#555555",
          },
        }
      : {
          // Dark mode palette
          primary: {
            main: "#90caf9",
          },
          secondary: {
            main: "#ce93d8",
          },
          background: {
            default: "#121212",
            paper: "#1e1e1e",
          },
          text: {
            primary: "#ffffff",
            secondary: "#b0b0b0",
          },
        }),
  },
  components: {
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: mode === "light" ? "#ffffff" : "#272727",
          color: mode === "light" ? "#333333" : "#ffffff",
        },
      },
    },
  },
});

// Create context for theme mode
type ThemeContextType = {
  mode: PaletteMode;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  toggleTheme: () => {},
});

// Hook to use theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize theme mode from localStorage or default to 'light'
  const [mode, setMode] = useState<PaletteMode>("light");

  // Effect to load saved theme preference
  useEffect(() => {
    const savedMode = localStorage.getItem("themeMode");
    if (savedMode && (savedMode === "light" || savedMode === "dark")) {
      setMode(savedMode);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setMode(prefersDark ? "dark" : "light");
    }
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    localStorage.setItem("themeMode", newMode);
  };

  // Create theme based on current mode
  const theme = createTheme(getDesignTokens(mode));

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
}
