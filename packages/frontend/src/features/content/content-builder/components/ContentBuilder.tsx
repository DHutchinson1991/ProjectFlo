"use client";

import React, { useRef } from "react";
import { DndContext, useSensors, useSensor, PointerSensor, KeyboardSensor } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

// Import types
import { ContentBuilderProps, TimelineScene, TimelineTrack } from '@/features/content/content-builder/types/timeline';

// Import new provider and container
import { ContentBuilderProvider } from '../context/ContentBuilderContext';
import { ContentBuilderContainer } from './ContentBuilderContainer';

/**
 * Main ContentBuilder component - refactored with feature-based architecture
 * 
 * New structure:
 * 1. ContentBuilder (this file) - Handles DndContext and wraps provider
 * 2. ContentBuilderProvider - Instantiates all hooks once, provides shared state
 * 3. ContentBuilderContainer - Layout orchestration
 * 4. Feature containers - TimelineFeature, PlaybackFeature, etc.
 * 5. Presentational components - Timeline tracks, playback screen, etc.
 * 
 * Benefits:
 * - Clear separation of concerns
 * - Shared state via context (no duplicate hook instances)
 * - Features are self-contained and testable
 * - Easier to understand and maintain
 */
const DEFAULT_SCENES: TimelineScene[] = [];
const DEFAULT_TRACKS: TimelineTrack[] = [];

const ContentBuilder: React.FC<ContentBuilderProps> = ({
    filmId,
    film,
    initialScenes = DEFAULT_SCENES,
    initialTracks = DEFAULT_TRACKS,
    onSave,
    onChange,
    onSaveFilmName,
    readOnly = false,
    packageId,
    linkedActivityId,
    instanceOwnerType,
    instanceOwnerId,
    equipmentConfig,
    equipmentAssignmentsBySlot,
    filmApi,
}) => {
    // Timeline ref for drag and drop
    const timelineRef = useRef<HTMLDivElement>(null);

    // Configure drag sensors for dnd-kit
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    return (
        <DndContext
            sensors={sensors}
        >
            <ContentBuilderProvider
                filmId={filmId}
                packageId={packageId}
                linkedActivityId={linkedActivityId}
                instanceOwnerType={instanceOwnerType}
                instanceOwnerId={instanceOwnerId}
                initialScenes={initialScenes}
                initialTracks={initialTracks}
                onSave={onSave}
                onChange={onChange}
                readOnly={readOnly}
                equipmentConfig={equipmentConfig}
                equipmentAssignmentsBySlot={equipmentAssignmentsBySlot}
                filmApi={filmApi}
            >
                <ContentBuilderContainer
                    timelineRef={timelineRef}
                    film={film}
                    onSaveFilmName={onSaveFilmName}
                    packageId={packageId}
                />
            </ContentBuilderProvider>
        </DndContext>
    );
};

export default ContentBuilder;
