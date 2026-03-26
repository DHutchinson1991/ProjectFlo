'use client';

import React from 'react';

interface VenueMapProps {
    lat: number;
    lng: number;
    height?: number | string;
}

const OFFSET = 0.008;
const OFFSET_Y = 0.005;

const VenueMap: React.FC<VenueMapProps> = ({ lat, lng, height = 180 }) => {
    const bbox = `${lng - OFFSET},${lat - OFFSET_Y},${lng + OFFSET},${lat + OFFSET_Y}`;
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;

    return (
        <div
            style={{
                width: '100%',
                height,
                borderRadius: 12,
                overflow: 'hidden',
                background: '#1e2433',
            }}
        >
            <iframe
                title="Venue map"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{
                    border: 0,
                    filter: 'invert(0.92) hue-rotate(180deg) saturate(0.6) brightness(1.1)',
                }}
                src={src}
                loading="lazy"
            />
        </div>
    );
};

export default VenueMap;
