"use client";

import { useState, useEffect, useMemo } from "react";

export interface Moment {
    id?: number;
    name: string;
    duration: number;
    duration_seconds?: number;
    coverage?: {
        [trackName: string]: boolean | undefined;
    };
    [key: string]: any;
}

interface UseMomentFormProps {
    moment: Moment | null;
    open: boolean;
    onSave: (moment: Moment) => void;
    onClose: () => void;
    onDelete?: (momentId?: number) => void;
    mode?: "full" | "track";
    trackKey?: string;
    trackLabel?: string;
    onRemoveTrack?: (momentId?: number, trackKey?: string) => void;
}

export const useMomentForm = ({
    moment,
    open,
    onSave,
    onClose,
    onDelete,
    mode = "full",
    trackKey,
    trackLabel,
    onRemoveTrack
}: UseMomentFormProps) => {
    const [editName, setEditName] = useState("");
    const [editDuration, setEditDuration] = useState(0);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const isTrackMode = mode === "track";
    const effectiveTrackKey = trackKey || trackLabel;
    const effectiveTrackLabel = trackLabel || trackKey || "Selected Track";
    const trackIsAssigned = useMemo(() => {
        if (!effectiveTrackKey || !moment) return true;

        const recordingSetup = (moment as any).recording_setup;
        if (!recordingSetup) return true;

        const cameraAssignments = recordingSetup.camera_assignments || [];
        const audioTrackIds = recordingSetup.audio_track_ids || [];
        const graphicsEnabled = !!recordingSetup.graphics_enabled;

        const key = effectiveTrackKey.toString().toLowerCase();
        const matchesAssignment = cameraAssignments.some((assignment: any) => {
            const trackName = (assignment.track_name || "").toString().toLowerCase();
            const trackType = (assignment.track_type || "").toString().toLowerCase();
            return trackName === key || trackType === key;
        });

        if (key.includes("audio")) {
            return audioTrackIds.length > 0;
        }

        if (key.includes("graphics")) {
            return graphicsEnabled;
        }

        return matchesAssignment;
    }, [effectiveTrackKey, moment]);


    // Initialize form when moment changes
    useEffect(() => {
        if (!moment || !open) {
            return;
        }

        const nextName = moment.name || "";
        setEditName(prev => (prev === nextName ? prev : nextName));

        const nextDuration = moment.duration || moment.duration_seconds || 0;
        setEditDuration(prev => (prev === nextDuration ? prev : nextDuration));

        setErrors(prev => (Object.keys(prev).length === 0 ? prev : {}));
    }, [moment, open]);

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!editName.trim()) {
            newErrors.name = "Moment name is required";
        }

        if (editDuration <= 0) {
            newErrors.duration = "Duration must be greater than 0";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateForm() || !moment) return;

        const updatedMoment: Moment = {
            ...moment,
            name: editName.trim(),
            duration: editDuration,
            duration_seconds: editDuration,
        };

        onSave(updatedMoment);
        onClose();
    };

    const handleDelete = () => {
        if (typeof window !== 'undefined' && window.confirm(`Delete moment "${editName}"?`)) {
            onDelete?.(moment?.id);
            onClose();
        }
    };

    const handleRemoveTrackClick = () => {
        if (!moment || !onRemoveTrack || !effectiveTrackKey) return;

        Promise.resolve(onRemoveTrack(moment.id, effectiveTrackKey))
            .then(() => {
                onClose();
            })
            .catch(() => {
                onClose();
            });
    };

    return {
        editName,
        setEditName,
        editDuration,
        setEditDuration,
        errors,
        setErrors,
        handleSave,
        handleDelete,
        handleRemoveTrackClick,
        isTrackMode,
        effectiveTrackKey,
        effectiveTrackLabel,
        trackIsAssigned
    };
};
