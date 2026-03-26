// Element definitions for interactive creation
export const ELEMENT_DEFINITIONS = {
    // Drawing elements
    rectangle: {
        name: 'Rectangle',
        shape: 'rect',
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
        shape: 'circle',
        attrs: {
            r: 40,
            fill: '#2ecc71',
            stroke: '#27ae60',
            'stroke-width': 2
        }
    },
    line: {
        name: 'Line',
        shape: 'line',
        attrs: {
            x1: 0,
            y1: 0,
            x2: 100,
            y2: 0,
            stroke: '#34495e',
            'stroke-width': 3
        }
    },

    // Venue Structure
    door: {
        name: 'Door',
        shape: 'rect',
        attrs: {
            width: 80,
            height: 8,
            fill: '#deb887',
            stroke: '#cd853f',
            'stroke-width': 1
        }
    },
    window: {
        name: 'Window',
        shape: 'rect',
        attrs: {
            width: 100,
            height: 6,
            fill: '#87ceeb',
            stroke: '#4682b4',
            'stroke-width': 1
        }
    },
    stage: {
        name: 'Stage',
        shape: 'rect',
        attrs: {
            width: 200,
            height: 120,
            fill: '#ffd700',
            stroke: '#ffc107',
            'stroke-width': 2
        }
    },
    elevator: {
        name: 'Elevator',
        shape: 'rect',
        attrs: {
            width: 80,
            height: 80,
            fill: '#9e9e9e',
            stroke: '#757575',
            'stroke-width': 2
        }
    },
    stairs: {
        name: 'Stairs',
        shape: 'rect',
        attrs: {
            width: 100,
            height: 60,
            fill: '#795548',
            stroke: '#5d4037',
            'stroke-width': 2
        }
    },

    // Venue Amenities
    bar: {
        name: 'Bar',
        shape: 'rect',
        attrs: {
            width: 150,
            height: 40,
            fill: '#ff9800',
            stroke: '#f57c00',
            'stroke-width': 2
        }
    },
    restroom: {
        name: 'Restroom',
        shape: 'rect',
        attrs: {
            width: 60,
            height: 60,
            fill: '#607d8b',
            stroke: '#455a64',
            'stroke-width': 2
        }
    },
    parking: {
        name: 'Parking Space',
        shape: 'rect',
        attrs: {
            width: 100,
            height: 50,
            fill: '#9c27b0',
            stroke: '#7b1fa2',
            'stroke-width': 2
        }
    },
    security: {
        name: 'Security',
        shape: 'rect',
        attrs: {
            width: 40,
            height: 40,
            fill: '#f44336',
            stroke: '#d32f2f',
            'stroke-width': 2
        }
    },
    emergency: {
        name: 'Emergency Exit',
        shape: 'rect',
        attrs: {
            width: 80,
            height: 20,
            fill: '#ff5722',
            stroke: '#d84315',
            'stroke-width': 2
        }
    },

    // Furniture & Seating
    table: {
        name: 'Round Table',
        shape: 'circle',
        attrs: {
            r: 35,
            fill: '#95a5a6',
            stroke: '#7f8c8d',
            'stroke-width': 2
        }
    },
    chair: {
        name: 'Chair',
        shape: 'rect',
        attrs: {
            width: 20,
            height: 20,
            fill: '#e74c3c',
            stroke: '#c0392b',
            'stroke-width': 1
        }
    },
    sofa: {
        name: 'Sofa',
        shape: 'rect',
        attrs: {
            width: 120,
            height: 50,
            fill: '#8e24aa',
            stroke: '#7b1fa2',
            'stroke-width': 2
        }
    },
    bartable: {
        name: 'Bar Table',
        shape: 'circle',
        attrs: {
            r: 25,
            fill: '#ff9800',
            stroke: '#f57c00',
            'stroke-width': 2
        }
    },
    couch: {
        name: 'Couch',
        shape: 'rect',
        attrs: {
            width: 140,
            height: 60,
            fill: '#795548',
            stroke: '#5d4037',
            'stroke-width': 2
        }
    },

    // Outdoor Elements
    deck: {
        name: 'Deck/Patio',
        shape: 'rect',
        attrs: {
            width: 200,
            height: 150,
            fill: '#8bc34a',
            stroke: '#689f38',
            'stroke-width': 2
        }
    },
    pool: {
        name: 'Pool',
        shape: 'rect',
        attrs: {
            width: 180,
            height: 100,
            fill: '#00bcd4',
            stroke: '#0097a7',
            'stroke-width': 2
        }
    },

    // Equipment
    djbooth: {
        name: 'DJ Booth',
        shape: 'rect',
        attrs: {
            width: 100,
            height: 80,
            fill: '#673ab7',
            stroke: '#512da8',
            'stroke-width': 2
        }
    },
    piano: {
        name: 'Piano',
        shape: 'rect',
        attrs: {
            width: 120,
            height: 60,
            fill: '#424242',
            stroke: '#212121',
            'stroke-width': 2
        }
    },
    micstand: {
        name: 'Mic Stand',
        shape: 'circle',
        attrs: {
            r: 15,
            fill: '#37474f',
            stroke: '#263238',
            'stroke-width': 2
        }
    },
} as const;
