import { useState, useEffect, useCallback, useRef } from "react";
import { TimelineScene, PlaybackState } from '@/features/content/content-builder/types/timeline';
import { calculateTimelineDuration } from "@/features/content/content-builder/utils/timelineUtils";

export const usePlaybackControls = (scenes: TimelineScene[] = []) => {
    const [playbackState, setPlaybackState] = useState<PlaybackState>({
        isPlaying: false,
        currentTime: 0,
        totalDuration: calculateTimelineDuration(scenes),
        playbackSpeed: 1,
    });

    const isPlayingRef = useRef(false);
    const rafIdRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef<number>(0);
    const timelineScrollRef = useRef<{ scrollLeft: number }>({ scrollLeft: 0 });

    // Keep ref in sync with state
    useEffect(() => {
        isPlayingRef.current = playbackState.isPlaying;
    }, [playbackState.isPlaying]);

    // Update timeline duration when scenes change
    useEffect(() => {
        const newDuration = calculateTimelineDuration(scenes);
        setPlaybackState((prev) => ({
            ...prev,
            totalDuration: newDuration,
            currentTime: prev.currentTime > newDuration ? 0 : prev.currentTime,
        }));
    }, [scenes]);

    // rAF-based playback loop
    const tick = useCallback((timestamp: number) => {
        if (!isPlayingRef.current) return;

        if (lastFrameTimeRef.current === 0) {
            lastFrameTimeRef.current = timestamp;
        }

        const deltaMs = timestamp - lastFrameTimeRef.current;
        lastFrameTimeRef.current = timestamp;

        setPlaybackState((prev) => {
            if (!prev.isPlaying) return prev;
            const deltaSeconds = (deltaMs / 1000) * prev.playbackSpeed;
            const newTime = prev.currentTime + deltaSeconds;
            if (newTime >= prev.totalDuration) {
                isPlayingRef.current = false;
                return { ...prev, isPlaying: false, currentTime: prev.totalDuration };
            }
            return { ...prev, currentTime: newTime };
        });

        if (isPlayingRef.current) {
            rafIdRef.current = requestAnimationFrame(tick);
        }
    }, []);

    const stopAnimation = useCallback(() => {
        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
        lastFrameTimeRef.current = 0;
    }, []);

    const handlePlay = useCallback(() => {
        if (isPlayingRef.current) {
            // Stop
            isPlayingRef.current = false;
            stopAnimation();
            setPlaybackState((prev) => ({ ...prev, isPlaying: false }));
        } else {
            // Start — if at the end, reset to beginning
            setPlaybackState((prev) => {
                const resetTime = prev.currentTime >= prev.totalDuration ? 0 : prev.currentTime;
                return { ...prev, isPlaying: true, currentTime: resetTime };
            });
            isPlayingRef.current = true;
            lastFrameTimeRef.current = 0;
            rafIdRef.current = requestAnimationFrame(tick);
        }
    }, [tick, stopAnimation]);

    const handleStop = useCallback(() => {
        isPlayingRef.current = false;
        stopAnimation();
        setPlaybackState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
    }, [stopAnimation]);

    const handleSpeedChange = useCallback((newSpeed: number) => {
        setPlaybackState((prev) => ({ ...prev, playbackSpeed: newSpeed }));
    }, []);

    const handleTimelineClick = useCallback((time: number) => {
        setPlaybackState((prev) => ({
            ...prev,
            currentTime: Math.max(0, Math.min(time, prev.totalDuration)),
        }));
    }, []);

    // Timeline viewport management for navigation without scroll bars
    const updateTimelineViewport = useCallback(
        (viewportWidth: number, zoomLevel: number) => {
            const playheadPosition = playbackState.currentTime * zoomLevel;
            const viewportCenter = viewportWidth / 2;

            let targetScrollLeft = playheadPosition - viewportCenter;
            targetScrollLeft = Math.max(0, targetScrollLeft);

            timelineScrollRef.current.scrollLeft = targetScrollLeft;

            return targetScrollLeft;
        },
        [playbackState.currentTime],
    );

    const jumpToTime = useCallback(
        (time: number) => {
            setPlaybackState((prev) => ({
                ...prev,
                currentTime: Math.max(0, Math.min(time, prev.totalDuration)),
            }));
        },
        [],
    );

    const jumpToPercentage = useCallback(
        (percentage: number) => {
            setPlaybackState((prev) => {
                const time = (percentage / 100) * prev.totalDuration;
                return { ...prev, currentTime: Math.max(0, Math.min(time, prev.totalDuration)) };
            });
        },
        [],
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAnimation();
        };
    }, [stopAnimation]);

    return {
        playbackState,
        setPlaybackState,
        handlePlay,
        handleStop,
        handleSpeedChange,
        handleTimelineClick,
        updateTimelineViewport,
        jumpToTime,
        jumpToPercentage,
        timelineScrollRef,
    };
};
