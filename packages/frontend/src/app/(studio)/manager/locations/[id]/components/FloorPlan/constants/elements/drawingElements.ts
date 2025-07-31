// Basic drawing elements for geometric shapes
export const DRAWING_ELEMENTS = {
    rectangle: {
        name: 'Rectangle',
        shape: 'rect' as const,
        category: 'drawing',
        description: 'Basic rectangular shape',
        attrs: {
            width: 100,
            height: 60,
            fill: '#3498db',
            stroke: '#2980b9',
            'stroke-width': 2
        }
    },
    circle: {
        name: 'Circle',
        shape: 'circle' as const,
        category: 'drawing',
        description: 'Basic circular shape',
        attrs: {
            r: 40,
            fill: '#2ecc71',
            stroke: '#27ae60',
            'stroke-width': 2
        }
    },
    line: {
        name: 'Line',
        shape: 'line' as const,
        category: 'drawing',
        description: 'Straight line for measurements and boundaries',
        attrs: {
            x1: 0,
            y1: 0,
            x2: 100,
            y2: 0,
            stroke: '#34495e',
            'stroke-width': 3
        }
    }
} as const;

// Helper functions for drawing elements
export const getDrawingElementById = (id: keyof typeof DRAWING_ELEMENTS) => {
    return DRAWING_ELEMENTS[id];
};

export const getAllDrawingElements = () => {
    return Object.entries(DRAWING_ELEMENTS).map(([id, element]) => ({
        id,
        ...element
    }));
};

export const getDrawingElementsByShape = (shape: 'rect' | 'circle' | 'line') => {
    return Object.entries(DRAWING_ELEMENTS)
        .filter(([_, element]) => element.shape === shape)
        .map(([id, element]) => ({ id, ...element }));
};
