import { useState, useEffect, useCallback, useRef } from "react";
import { TimelineScene } from "../types/sceneTypes";
import { PlaybackState } from "../types/timelineTypes";
import { calculateTimelineDuration } from "../utils/timelineUtils";

export const usePlaybackControls = (scenes: TimelineScene[] = []) => {
    const [playbackState, setPlaybackState] = useState<PlaybackState>({
        isPlaying: false,
        currentTime: 0,
        totalDuration: calculateTimelineDuration(scenes),
        playbackSpeed: 1,
    });

    const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
    const timelineScrollRef = useRef<{ scrollLeft: number }>({ scrollLeft: 0 });

    // Update timeline duration when scenes change
    useEffect(() => {
        const newDuration = calculateTimelineDuration(scenes);
        setPlaybackState((prev) => ({
            ...prev,
            totalDuration: newDuration,
            // If current time is beyond new duration, reset to start
            currentTime: prev.currentTime > newDuration ? 0 : prev.currentTime,
        }));
    }, [scenes]);

    const handlePlay = useCallback(() => {
        setPlaybackState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));

        if (!playbackState.isPlaying) {
            playbackTimerRef.current = setInterval(() => {
                setPlaybackState((prev) => {
                    const newTime = prev.currentTime + 0.1 * prev.playbackSpeed;
                    if (newTime >= prev.totalDuration) {
                        return {
                            ...prev,
                            isPlaying: false,
                            currentTime: prev.totalDuration,
                        };
                    }
                    return { ...prev, currentTime: newTime };
                });
            }, 100);
        } else {
            if (playbackTimerRef.current) {
                clearInterval(playbackTimerRef.current);
                playbackTimerRef.current = null;
            }
        }
    }, [playbackState.isPlaying]);

    const handleStop = () => {
        setPlaybackState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
        if (playbackTimerRef.current) {
            clearInterval(playbackTimerRef.current);
            playbackTimerRef.current = null;
        }
    };

    const handleSpeedChange = (newSpeed: number) => {
        setPlaybackState((prev) => ({ ...prev, playbackSpeed: newSpeed }));
    };

    const handleTimelineClick = (time: number) => {
        setPlaybackState((prev) => ({
            ...prev,
            currentTime: Math.max(0, Math.min(time, prev.totalDuration)),
        }));
    };

    // Timeline viewport management for navigation without scroll bars
    const updateTimelineViewport = useCallback(
        (viewportWidth: number, zoomLevel: number) => {
            const playheadPosition = playbackState.currentTime * zoomLevel;
            const viewportCenter = viewportWidth / 2;

            // Calculate the optimal scroll position to center the playhead
            let targetScrollLeft = playheadPosition - viewportCenter;
            targetScrollLeft = Math.max(0, targetScrollLeft);

            timelineScrollRef.current.scrollLeft = targetScrollLeft;

            return targetScrollLeft;
        },
        [playbackState.currentTime],
    );

    const jumpToTime = useCallback(
        (time: number) => {
            const clampedTime = Math.max(
                0,
                Math.min(time, playbackState.totalDuration),
            );
            setPlaybackState((prev) => ({ ...prev, currentTime: clampedTime }));
        },
        [playbackState.totalDuration],
    );

    const jumpToPercentage = useCallback(
        (percentage: number) => {
            const time = (percentage / 100) * playbackState.totalDuration;
            jumpToTime(time);
        },
        [playbackState.totalDuration, jumpToTime],
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (playbackTimerRef.current) {
                clearInterval(playbackTimerRef.current);
            }
        };
    }, []);

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
