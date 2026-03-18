/**
 * ContentBuilder Theme Configuration
 * 
 * Centralized theme and styling configuration for consistent UI appearance.
 * This includes Material-UI theme overrides and custom styling patterns.
 */

import { createTheme } from "@mui/material/styles";
import { COLORS, ANIMATION_CONFIG } from "./constants";

// Custom theme properties interface
declare module '@mui/material/styles' {
    interface Theme {
        contentBuilder: {
            timeline: {
                trackHeight: number;
                sceneMinWidth: number;
                playheadWidth: number;
            };
            controls: {
                panelHeight: number;
                buttonSize: number;
            };
            library: {
                cardWidth: number;
                cardHeight: number;
                gridGap: number;
            };
        };
    }

    interface ThemeOptions {
        contentBuilder?: {
            timeline?: {
                trackHeight?: number;
                sceneMinWidth?: number;
                playheadWidth?: number;
            };
            controls?: {
                panelHeight?: number;
                buttonSize?: number;
            };
            library?: {
                cardWidth?: number;
                cardHeight?: number;
                gridGap?: number;
            };
        };
    }
}

// Base theme configuration
export const contentBuilderTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: COLORS.PRIMARY_ACCENT.replace('0.9', '1'),
            light: COLORS.PRIMARY_ACCENT_BG,
            dark: COLORS.PRIMARY_ACCENT,
        },
        background: {
            default: 'rgba(15, 15, 20, 1)',
            paper: COLORS.CONTROL_PANEL_BG,
        },
        text: {
            primary: COLORS.PRIMARY_TEXT,
            secondary: COLORS.SECONDARY_TEXT,
        },
        divider: COLORS.CONTROL_PANEL_BORDER,
    },

    // Custom ContentBuilder-specific theme properties
    contentBuilder: {
        timeline: {
            trackHeight: 60,
            sceneMinWidth: 20,
            playheadWidth: 2,
        },
        controls: {
            panelHeight: 64,
            buttonSize: 40,
        },
        library: {
            cardWidth: 160,
            cardHeight: 120,
            gridGap: 12,
        },
    },

    components: {
        // Button component overrides
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 500,
                    transition: `all ${ANIMATION_CONFIG.FAST}ms ${ANIMATION_CONFIG.EASE_OUT}`,
                    '&:hover': {
                        backgroundColor: COLORS.HOVER_BG,
                    },
                },
                outlined: {
                    borderColor: COLORS.BUTTON_BORDER,
                    color: COLORS.SECONDARY_TEXT,
                    '&:hover': {
                        borderColor: COLORS.PRIMARY_ACCENT,
                        backgroundColor: COLORS.PRIMARY_ACCENT_BG,
                        color: COLORS.PRIMARY_ACCENT,
                    },
                },
                contained: {
                    backgroundColor: COLORS.PRIMARY_ACCENT,
                    color: COLORS.PRIMARY_TEXT,
                    '&:hover': {
                        backgroundColor: COLORS.PRIMARY_ACCENT.replace('0.9', '1'),
                    },
                },
            },
        },

        // IconButton component overrides
        MuiIconButton: {
            styleOverrides: {
                root: {
                    color: COLORS.SECONDARY_TEXT,
                    transition: `all ${ANIMATION_CONFIG.FAST}ms ${ANIMATION_CONFIG.EASE_OUT}`,
                    '&:hover': {
                        backgroundColor: COLORS.HOVER_BG,
                        color: COLORS.PRIMARY_TEXT,
                    },
                },
            },
        },

        // Slider component overrides
        MuiSlider: {
            styleOverrides: {
                root: {
                    color: COLORS.PRIMARY_ACCENT,
                },
                thumb: {
                    backgroundColor: COLORS.PRIMARY_ACCENT,
                    '&:hover': {
                        boxShadow: `0 0 0 8px ${COLORS.PRIMARY_ACCENT_BG}`,
                    },
                },
                track: {
                    backgroundColor: COLORS.PRIMARY_ACCENT,
                },
                rail: {
                    backgroundColor: COLORS.BUTTON_BORDER,
                },
            },
        },

        // Chip component overrides
        MuiChip: {
            styleOverrides: {
                root: {
                    backgroundColor: COLORS.PRIMARY_ACCENT_BG,
                    color: COLORS.PRIMARY_ACCENT,
                    border: `1px solid ${COLORS.PRIMARY_ACCENT_BORDER}`,
                    fontSize: '0.75rem',
                    height: 24,
                },
                outlined: {
                    borderColor: COLORS.BUTTON_BORDER,
                    color: COLORS.SECONDARY_TEXT,
                    '&:hover': {
                        backgroundColor: COLORS.HOVER_BG,
                    },
                },
            },
        },

        // TextField component overrides
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        color: COLORS.PRIMARY_TEXT,
                        '& fieldset': {
                            borderColor: COLORS.BUTTON_BORDER,
                        },
                        '&:hover fieldset': {
                            borderColor: COLORS.PRIMARY_ACCENT,
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: COLORS.PRIMARY_ACCENT,
                        },
                    },
                    '& .MuiInputLabel-root': {
                        color: COLORS.MUTED_TEXT,
                        '&.Mui-focused': {
                            color: COLORS.PRIMARY_ACCENT,
                        },
                    },
                },
            },
        },

        // Paper component overrides
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundColor: COLORS.CONTROL_PANEL_BG,
                    border: `1px solid ${COLORS.CONTROL_PANEL_BORDER}`,
                    backdropFilter: 'blur(8px)',
                },
            },
        },

        // Typography component overrides
        MuiTypography: {
            styleOverrides: {
                root: {
                    color: COLORS.PRIMARY_TEXT,
                },
                body2: {
                    color: COLORS.SECONDARY_TEXT,
                },
                caption: {
                    color: COLORS.MUTED_TEXT,
                },
            },
        },
    },

    transitions: {
        duration: {
            shortest: ANIMATION_CONFIG.FAST,
            shorter: ANIMATION_CONFIG.MEDIUM,
            short: ANIMATION_CONFIG.MEDIUM,
            standard: ANIMATION_CONFIG.SLOW,
            complex: ANIMATION_CONFIG.SLOW,
            enteringScreen: ANIMATION_CONFIG.MEDIUM,
            leavingScreen: ANIMATION_CONFIG.FAST,
        },
        easing: {
            easeInOut: ANIMATION_CONFIG.EASE_IN_OUT,
            easeOut: ANIMATION_CONFIG.EASE_OUT,
            easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
            sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
        },
    },
});

// Common styling utilities
export const commonStyles = {
    // Glass morphism effect
    glassMorphism: {
        backgroundColor: COLORS.CONTROL_PANEL_BG,
        border: `1px solid ${COLORS.CONTROL_PANEL_BORDER}`,
        backdropFilter: 'blur(8px)',
        borderRadius: 8,
    },

    // Hover effects
    hoverEffect: {
        transition: `all ${ANIMATION_CONFIG.FAST}ms ${ANIMATION_CONFIG.EASE_OUT}`,
        '&:hover': {
            backgroundColor: COLORS.HOVER_BG,
            transform: 'translateY(-1px)',
        },
    },

    // Focus ring
    focusRing: {
        '&:focus': {
            outline: `2px solid ${COLORS.PRIMARY_ACCENT}`,
            outlineOffset: 2,
        },
    },

    // Scroll bar styling
    customScrollbar: {
        '&::-webkit-scrollbar': {
            width: 8,
            height: 8,
        },
        '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 4,
        },
        '&::-webkit-scrollbar-thumb': {
            backgroundColor: COLORS.BUTTON_BORDER,
            borderRadius: 4,
            '&:hover': {
                backgroundColor: COLORS.SECONDARY_TEXT,
            },
        },
    },

    // Scene type specific styles
    sceneTypeStyles: {
        video: {
            backgroundColor: COLORS.SCENE_TYPES.video,
            color: '#ffffff',
        },
        audio: {
            backgroundColor: COLORS.SCENE_TYPES.audio,
            color: '#ffffff',
        },
        graphics: {
            backgroundColor: COLORS.SCENE_TYPES.graphics,
            color: '#ffffff',
        },
        music: {
            backgroundColor: COLORS.SCENE_TYPES.music,
            color: '#000000',
        },
        transition: {
            backgroundColor: COLORS.SCENE_TYPES.transition,
            color: '#ffffff',
        },
        default: {
            backgroundColor: COLORS.SCENE_TYPES.default,
            color: '#ffffff',
        },
    },

    // Animation keyframes
    keyframes: {
        fadeIn: {
            '@keyframes fadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
            },
        },
        slideInUp: {
            '@keyframes slideInUp': {
                from: {
                    opacity: 0,
                    transform: 'translateY(20px)',
                },
                to: {
                    opacity: 1,
                    transform: 'translateY(0)',
                },
            },
        },
        pulse: {
            '@keyframes pulse': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.05)' },
                '100%': { transform: 'scale(1)' },
            },
        },
    },
};

export default contentBuilderTheme;
