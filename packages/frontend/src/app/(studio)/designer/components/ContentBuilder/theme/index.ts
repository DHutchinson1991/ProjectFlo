/**
 * Theme utilities for ContentBuilder components
 * 
 * Provides consistent styling functions and theme-aware utilities
 * for building cohesive UI components.
 */

import { COLORS, ANIMATION_CONFIG } from '../config/constants';

/**
 * Get standard background styles for control panels
 */
export const getControlPanelStyles = () => ({
    bgcolor: COLORS.CONTROL_PANEL_BG,
    backdropFilter: "blur(8px)",
    border: `1px solid ${COLORS.CONTROL_PANEL_BORDER}`,
    borderRadius: 2,
});

/**
 * Get standard background styles for view controls
 */
export const getViewControlStyles = () => ({
    bgcolor: COLORS.VIEW_CONTROL_BG,
    backdropFilter: "blur(10px)",
    border: `1px solid ${COLORS.CONTROL_PANEL_BORDER}`,
    borderRadius: 1,
});

/**
 * Get button styles with consistent theming
 */
export const getButtonStyles = (variant: 'primary' | 'secondary' | 'accent' = 'secondary') => {
    const baseStyles = {
        color: COLORS.SECONDARY_TEXT,
        border: `1px solid ${COLORS.BUTTON_BORDER}`,
        borderRadius: 1,
        transition: `all ${ANIMATION_CONFIG.FAST}ms ${ANIMATION_CONFIG.EASE_OUT}`,
        '&:hover': {
            bgcolor: COLORS.HOVER_BG,
        },
    };

    if (variant === 'primary') {
        return {
            ...baseStyles,
            color: COLORS.PRIMARY_TEXT,
            fontWeight: 600,
        };
    }

    if (variant === 'accent') {
        return {
            ...baseStyles,
            bgcolor: COLORS.PRIMARY_ACCENT_BG,
            color: COLORS.PRIMARY_ACCENT,
            border: `1px solid ${COLORS.PRIMARY_ACCENT_BORDER}`,
            '&:hover': {
                bgcolor: COLORS.PRIMARY_ACCENT_BG,
                borderColor: COLORS.PRIMARY_ACCENT,
            },
        };
    }

    return baseStyles;
};

/**
 * Get text styles for different hierarchy levels
 */
export const getTextStyles = (variant: 'primary' | 'secondary' | 'muted' = 'primary') => {
    const colorMap = {
        primary: COLORS.PRIMARY_TEXT,
        secondary: COLORS.SECONDARY_TEXT,
        muted: COLORS.MUTED_TEXT,
    };

    return {
        color: colorMap[variant],
    };
};

/**
 * Get transition styles for smooth animations
 */
export const getTransitionStyles = (duration: 'fast' | 'medium' | 'slow' = 'medium') => {
    const durationMap = {
        fast: ANIMATION_CONFIG.FAST,
        medium: ANIMATION_CONFIG.MEDIUM,
        slow: ANIMATION_CONFIG.SLOW,
    };

    return {
        transition: `all ${durationMap[duration]}ms ${ANIMATION_CONFIG.EASE_OUT}`,
    };
};

/**
 * Get box shadow styles for elevation
 */
export const getElevationStyles = (level: 1 | 2 | 3 = 1) => {
    const shadows = {
        1: "0 2px 8px rgba(0, 0, 0, 0.15)",
        2: "0 4px 16px rgba(0, 0, 0, 0.2)",
        3: "0 8px 32px rgba(0, 0, 0, 0.25)",
    };

    return {
        boxShadow: shadows[level],
    };
};

/**
 * Get focus styles for accessibility
 */
export const getFocusStyles = () => ({
    '&:focus-visible': {
        outline: `2px solid ${COLORS.PRIMARY_ACCENT}`,
        outlineOffset: 2,
    },
});

/**
 * Get loading shimmer animation styles
 */
export const getShimmerStyles = () => ({
    background: `linear-gradient(
    90deg, 
    transparent, 
    rgba(255, 255, 255, 0.1), 
    transparent
  )`,
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
    "@keyframes shimmer": {
        "0%": { backgroundPosition: "-200% 0" },
        "100%": { backgroundPosition: "200% 0" },
    },
});

/**
 * Get grid styles for consistent spacing
 */
export const getGridStyles = (gap: number = 16) => ({
    display: "grid",
    gap: `${gap}px`,
});

/**
 * Get flex styles for common layouts
 */
export const getFlexStyles = (
    direction: 'row' | 'column' = 'row',
    align: 'start' | 'center' | 'end' | 'stretch' = 'center',
    justify: 'start' | 'center' | 'end' | 'between' | 'around' = 'start'
) => ({
    display: "flex",
    flexDirection: direction,
    alignItems: align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : align,
    justifyContent: justify === 'start' ? 'flex-start' :
        justify === 'end' ? 'flex-end' :
            justify === 'between' ? 'space-between' :
                justify === 'around' ? 'space-around' :
                    justify,
});

/**
 * Get responsive styles for different screen sizes
 */
export const getResponsiveStyles = () => ({
    mobile: '@media (max-width: 768px)',
    tablet: '@media (max-width: 1024px)',
    desktop: '@media (min-width: 1025px)',
});

/**
 * Get scrollbar styles for consistent appearance
 */
export const getScrollbarStyles = () => ({
    '&::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
    },
    '&::-webkit-scrollbar-track': {
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '4px',
        '&:hover': {
            background: 'rgba(255, 255, 255, 0.3)',
        },
    },
});

/**
 * Style object type for MUI components
 */
export interface StyleObject {
    [key: string]: string | number | StyleObject;
}

/**
 * Create a styled component wrapper with common theme styles
 */
export const createStyledComponent = (baseStyles: StyleObject = {}) => (additionalStyles: StyleObject = {}) => ({
    ...baseStyles,
    ...getTransitionStyles(),
    ...getFocusStyles(),
    ...additionalStyles,
});
