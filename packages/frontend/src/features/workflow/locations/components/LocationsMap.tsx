'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LocationsLibrary } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

const defaultPin = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const highlightPin = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

/* ── Pan to highlighted location ────────────────────────────── */
function PanToLocation({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], 14, { animate: true, duration: 0.3 });
    }, [map, lat, lng]);
    return null;
}

/* ── Fit all markers into view ──────────────────────────────── */
function FitBounds({ locations }: { locations: LocationsLibrary[] }) {
    const map = useMap();
    useEffect(() => {
        const pts = locations.filter((l) => l.lat && l.lng).map((l) => [l.lat!, l.lng!] as [number, number]);
        if (pts.length > 0) {
            map.fitBounds(pts, { padding: [30, 30], maxZoom: 12 });
        }
    }, [map, locations]);
    return null;
}

interface LocationsMapProps {
    locations: LocationsLibrary[];
    highlightedId?: number | null;
    onMarkerClick?: (location: LocationsLibrary) => void;
    height?: number | string;
}

export function LocationsMap({ locations, highlightedId, onMarkerClick, height = '100%' }: LocationsMapProps) {
    const mappable = locations.filter((l) => l.lat && l.lng);
    const highlighted = highlightedId ? mappable.find((l) => l.id === highlightedId) : null;

    const defaultCenter: [number, number] = [52.5, -2.5];

    return (
        <div style={{ height, width: '100%', borderRadius: 10, overflow: 'hidden', background: '#1a1e2a' }}>
            <style>{`
                .locations-map-dark .leaflet-tile-pane {
                    filter: brightness(0.85) saturate(0.7);
                }
                .locations-map-dark .leaflet-control-zoom a {
                    background: rgba(20,20,30,0.85);
                    color: rgba(255,255,255,0.7);
                    border-color: rgba(255,255,255,0.1);
                }
            `}</style>
            <MapContainer
                center={defaultCenter}
                zoom={7}
                style={{ height: '100%', width: '100%' }}
                className="locations-map-dark"
                zoomControl={true}
                attributionControl={false}
                scrollWheelZoom={true}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    subdomains="abcd"
                    maxZoom={19}
                />

                {!highlighted && mappable.length > 0 && <FitBounds locations={mappable} />}

                {highlighted?.lat && highlighted?.lng && (
                    <PanToLocation lat={highlighted.lat} lng={highlighted.lng} />
                )}

                {mappable.map((loc) => (
                    <Marker
                        key={loc.id}
                        position={[loc.lat!, loc.lng!]}
                        icon={loc.id === highlightedId ? highlightPin : defaultPin}
                        eventHandlers={onMarkerClick ? { click: () => onMarkerClick(loc) } : undefined}
                    >
                        <Popup>
                            <strong>{loc.name}</strong>
                            {loc.city && <br />}
                            {loc.city && <span>{loc.city}{loc.state ? `, ${loc.state}` : ''}</span>}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
