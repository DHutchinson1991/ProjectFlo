export const SIDEBAR_WIDTH = 280;

export const CANVAS_DIMENSIONS = {
    width: 1200,
    height: 800,
} as const;

export const GRID_SIZES = {
    '1m': 20,   // 20 pixels = 1 meter
    '5m': 100,  // 100 pixels = 5 meters  
    '10m': 200, // 200 pixels = 10 meters
} as const;

export const WALL_THICKNESS = {
    interior: 4.5,  // inches
    exterior: 8,    // inches
} as const;

export const ZOOM_LIMITS = {
    min: 0.1,
    max: 5.0,
    step: 0.1,
} as const;
