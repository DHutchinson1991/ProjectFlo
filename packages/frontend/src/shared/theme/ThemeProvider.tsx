"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
    ReactNode,
} from "react";
import { ThemeProvider as MUIThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { PaletteMode } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { colors } from "./tokens";

// Define theme settings
const getDesignTokens = (mode: PaletteMode) => ({
    palette: {
        mode,
        ...(mode === "light"
            ? {
                primary: { main: "#1976d2" },
                secondary: { main: "#9c27b0" },
                background: { default: "#f5f5f5", paper: "#ffffff" },
                text: { primary: "#333333", secondary: "#555555" },
            }
            : {
                primary: { main: "#90caf9" },
                secondary: { main: "#ce93d8" },
                background: { default: "#121212", paper: "#1e1e1e" },
                text: { primary: "#ffffff", secondary: "#b0b0b0" },
            }),
    },
    components: {
        MuiAppBar: {
            defaultProps: { elevation: 0 as const },
            styleOverrides: {
                root: {
                    backgroundColor: mode === "light" ? "#ffffff" : "#272727",
                    color: mode === "light" ? "#333333" : "#ffffff",
                },
            },
        },
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: mode === "light" ? "#f5f5f5" : "#121212",
                    color: mode === "light" ? "#333333" : "#ffffff",
                },
            },
        },
        MuiCard: {
            variants: [
                {
                    props: { variant: "glass" as const },
                    style: {
                        backgroundColor: alpha(colors.card, 0.55),
                        backdropFilter: "blur(24px) saturate(1.8)",
                        border: `1px solid ${alpha(colors.border, 0.6)}`,
                        borderRadius: 16,
                        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    },
                },
            ],
        },
        MuiChip: {
            variants: [
                {
                    props: { variant: "status" as const },
                    style: {
                        height: 20,
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        border: "none",
                        "& .MuiChip-label": { px: 1 },
                    },
                },
            ],
        },
    },
});

// Create context for theme mode
type ThemeContextType = {
    mode: PaletteMode;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
    mode: "dark",
    toggleTheme: () => { },
});

// Hook to use theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export function ThemeProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<PaletteMode>("dark");
    const [mounted, setMounted] = useState(false);

    // On mount, check localStorage for saved preference
    useEffect(() => {
        try {
            const savedMode = localStorage.getItem("themeMode");
            if (savedMode === "light" || savedMode === "dark") {
                setMode(savedMode);
            }
        } catch (e) {
            // localStorage might not be available
        }
        setMounted(true);
    }, []);

    // Sync data-theme attribute on html element
    useEffect(() => {
        if (mounted) {
            document.documentElement.setAttribute('data-theme', mode);
            document.documentElement.style.colorScheme = mode;
        }
    }, [mode, mounted]);

    const toggleTheme = () => {
        const newMode = mode === "light" ? "dark" : "light";
        setMode(newMode);
        localStorage.setItem("themeMode", newMode);
    };

    const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme }}>
            <MUIThemeProvider theme={theme}>
                <CssBaseline enableColorScheme />
                {children}
            </MUIThemeProvider>
        </ThemeContext.Provider>
    );
}
