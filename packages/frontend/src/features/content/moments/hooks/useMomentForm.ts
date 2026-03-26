"use client";

import { useState, useEffect, useMemo } from 'react';
import type { MomentFormData } from '../types';

interface UseMomentFormProps {
  moment: MomentFormData | null;
  open: boolean;
  onSave: (moment: MomentFormData) => void;
  onClose: () => void;
  onDelete?: (momentId?: number) => void;
  mode?: 'full' | 'track';
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
  mode = 'full',
  trackKey,
  trackLabel,
  onRemoveTrack,
}: UseMomentFormProps) => {
  const [editName, setEditName] = useState('');
  const [editDuration, setEditDuration] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isTrackMode = mode === 'track';
  const effectiveTrackKey = trackKey || trackLabel;
  const effectiveTrackLabel = trackLabel || trackKey || 'Selected Track';

  const trackIsAssigned = useMemo(() => {
    if (!effectiveTrackKey || !moment) return true;

    const recordingSetup = (moment as MomentFormData & { recording_setup?: Record<string, unknown> })
      .recording_setup as
      | {
          camera_assignments?: Array<{ track_name?: string; track_type?: string }>;
          audio_track_ids?: number[];
          graphics_enabled?: boolean;
        }
      | undefined;
    if (!recordingSetup) return true;

    const cameraAssignments = recordingSetup.camera_assignments || [];
    const audioTrackIds = recordingSetup.audio_track_ids || [];
    const graphicsEnabled = !!recordingSetup.graphics_enabled;

    const key = effectiveTrackKey.toString().toLowerCase();
    const matchesAssignment = cameraAssignments.some((assignment) => {
      const trackName = (assignment.track_name || '').toString().toLowerCase();
      const trackType = (assignment.track_type || '').toString().toLowerCase();
      return trackName === key || trackType === key;
    });

    if (key.includes('audio')) return audioTrackIds.length > 0;
    if (key.includes('graphics')) return graphicsEnabled;
    return matchesAssignment;
  }, [effectiveTrackKey, moment]);

  useEffect(() => {
    if (!moment || !open) return;

    const nextName = moment.name || '';
    setEditName((prev) => (prev === nextName ? prev : nextName));

    const nextDuration = moment.duration || moment.duration_seconds || 0;
    setEditDuration((prev) => (prev === nextDuration ? prev : nextDuration));

    setErrors((prev) => (Object.keys(prev).length === 0 ? prev : {}));
  }, [moment, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!editName.trim()) newErrors.name = 'Moment name is required';
    if (editDuration <= 0) newErrors.duration = 'Duration must be greater than 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm() || !moment) return;
    const updatedMoment: MomentFormData = {
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
      .then(() => onClose())
      .catch(() => onClose());
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
    trackIsAssigned,
  };
};
