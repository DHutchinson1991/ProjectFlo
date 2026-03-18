import { useState, useRef, useEffect, useCallback } from 'react';
import { ZOOM_LIMITS } from '../constants/dimensions';

export const useZoomPan = () => {
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

    // Refs to store current state values for event handlers
    const zoomLevelRef = useRef(zoomLevel);
    const panOffsetRef = useRef(panOffset);
    const isPanningRef = useRef(isPanning);

    // Update refs when zoom/pan state changes
    useEffect(() => {
        zoomLevelRef.current = zoomLevel;
    }, [zoomLevel]);

    useEffect(() => {
        panOffsetRef.current = panOffset;
    }, [panOffset]);

    useEffect(() => {
        isPanningRef.current = isPanning;
    }, [isPanning]);

    const handleZoomIn = useCallback(() => {
        setZoomLevel(prev => Math.min(prev + ZOOM_LIMITS.step, ZOOM_LIMITS.max));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoomLevel(prev => Math.max(prev - ZOOM_LIMITS.step, ZOOM_LIMITS.min));
    }, []);

    const handleZoomReset = useCallback(() => {
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
    }, []);

    const handlePanStart = useCallback((point: { x: number; y: number }) => {
        setIsPanning(true);
        setLastPanPoint(point);
    }, []);

    const handlePanMove = useCallback((point: { x: number; y: number }) => {
        if (!isPanningRef.current) return;

        const deltaX = point.x - lastPanPoint.x;
        const deltaY = point.y - lastPanPoint.y;

        setPanOffset(prev => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY
        }));

        setLastPanPoint(point);
    }, [lastPanPoint]);

    const handlePanEnd = useCallback(() => {
        setIsPanning(false);
    }, []);

    return {
        // State
        zoomLevel,
        panOffset,
        isPanning,
        lastPanPoint,

        // Refs
        zoomLevelRef,
        panOffsetRef,
        isPanningRef,

        // Actions
        setZoomLevel,
        setPanOffset,
        setIsPanning,
        setLastPanPoint,
        handleZoomIn,
        handleZoomOut,
        handleZoomReset,
        handlePanStart,
        handlePanMove,
        handlePanEnd,
    };
};
