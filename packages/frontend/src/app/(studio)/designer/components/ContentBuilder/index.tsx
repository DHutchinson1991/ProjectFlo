"use client";

import React, { useRef, useCallback } from "react";
import { DndContext, useSensors, useSensor, PointerSensor, KeyboardSensor } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

// Import types
import { ContentBuilderProps, TimelineScene } from '@/lib/types/timeline';
import { ScenesLibrary } from '@/lib/types/domains/scenes';

// Import new provider and container
import { ContentBuilderProvider } from './context/ContentBuilderContext';
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
const DEFAULT_SCENES: any[] = [];
const DEFAULT_TRACKS: any[] = [];

const ContentBuilder: React.FC<ContentBuilderProps> = ({
    filmId,
    film,
    initialScenes = DEFAULT_SCENES,
    initialTracks = DEFAULT_TRACKS,
    onSave,
    onChange,
    onSaveFilmName,
    readOnly = false,
    rightPanel,
    subjectCount = 0,
    packageId,
    equipmentConfig,
    equipmentAssignmentsBySlot,
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
                initialScenes={initialScenes}
                initialTracks={initialTracks}
                onSave={onSave}
                onChange={onChange}
                readOnly={readOnly}
                equipmentConfig={equipmentConfig}
                equipmentAssignmentsBySlot={equipmentAssignmentsBySlot}
            >
                <ContentBuilderContainer
                    timelineRef={timelineRef}
                    rightPanel={rightPanel}
                    film={film}
                    subjectCount={subjectCount}
                    onSaveFilmName={onSaveFilmName}
                    packageId={packageId}
                />
            </ContentBuilderProvider>
        </DndContext>
    );
};

export default ContentBuilder;
