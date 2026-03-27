"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { ProjectPhase, PHASE_LABELS } from "@/features/catalog/task-library/types";
import { getPhaseConfig, hexToRgba } from "@/shared/ui/tasks";

interface DroppableZoneProps {
    id: string;
    children: React.ReactNode;
    phase: ProjectPhase;
}

export function DroppableZone({ id, children, phase }: DroppableZoneProps) {
    const { isOver, setNodeRef } = useDroppable({
        id,
        data: { phase },
    });

    const phaseColor = hexToRgba(getPhaseConfig(phase).color, 0.15);

    return (
        <div
            ref={setNodeRef}
            style={{
                backgroundColor: isOver ? phaseColor : 'transparent',
                transition: 'all 0.3s ease',
                borderRadius: '12px',
                minHeight: '100px',
                border: isOver ? `2px dashed ${phaseColor.replace('0.15', '0.5')}` : 'none',
                position: 'relative',
            }}
        >
            {isOver && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: phaseColor.replace('0.15', '0.9'),
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 600,
                    zIndex: 1000,
                    pointerEvents: 'none',
                }}>
                    Drop to move to {PHASE_LABELS[phase]}
                </div>
            )}
            {children}
        </div>
    );
}
