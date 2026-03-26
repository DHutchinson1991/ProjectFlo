"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { ProjectPhase, PHASE_LABELS } from "@/lib/types";

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

    const phaseColors = {
        'Lead': 'rgba(102, 126, 234, 0.15)',
        'Inquiry': 'rgba(240, 147, 251, 0.15)',
        'Booking': 'rgba(79, 172, 254, 0.15)',
        'Creative_Development': 'rgba(67, 233, 123, 0.15)',
        'Pre_Production': 'rgba(250, 112, 154, 0.15)',
        'Production': 'rgba(33, 150, 243, 0.15)',
        'Post_Production': 'rgba(156, 39, 176, 0.15)',
        'Delivery': 'rgba(255, 235, 59, 0.15)'
    };

    const phaseColor = phaseColors[phase as keyof typeof phaseColors] || phaseColors['Lead'];

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
