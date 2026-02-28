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
    mode: "dark",
    toggleTheme: () => { },
});

// Hook to use theme context
export const useTheme = () => useContext(ThemeContext);

// Get initial theme mode (runs before component mounts)
function getInitialMode(): PaletteMode {
    if (typeof window === 'undefined') return 'dark';
    
    try {
        const savedMode = localStorage.getItem("themeMode");
        if (savedMode === "light" || savedMode === "dark") {
            return savedMode;
        }
    } catch (e) {
        // localStorage might not be available
    }
    
    return 'dark'; // Default to dark mode
}

// Theme provider component
export function ThemeProvider({ children }: { children: ReactNode }) {
    // Initialize theme mode from localStorage or default to 'dark'
    const [mode, setMode] = useState<PaletteMode>(getInitialMode);

    // Effect to sync with html element
    useEffect(() => {
        document.documentElement.style.colorScheme = mode;
        document.documentElement.setAttribute('data-theme', mode);
    }, [mode]);

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
