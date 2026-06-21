'use client';

import React from 'react';
import {
    DndContext,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Box, Tooltip } from '@mui/material';

export interface DraggableTabItem<T extends string> {
    id: T;
    label: string;
}

interface DraggableTabBarProps<T extends string> {
    tabs: DraggableTabItem<T>[];
    activeTab: T;
    onTabChange: (tab: T) => void;
    onReorder: (nextOrder: T[]) => void;
}

function SortableTabButton<T extends string>({
    tab,
    isActive,
    onSelect,
}: {
    tab: DraggableTabItem<T>;
    isActive: boolean;
    onSelect: (tab: T) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: tab.id });

    return (
        <Box
            ref={setNodeRef}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(tab.id)}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.35,
                minHeight: 32,
                py: 0.5,
                px: 1.25,
                borderRadius: 1,
                flexShrink: 0,
                cursor: isDragging ? 'grabbing' : 'pointer',
                color: isActive ? '#e2e8f0' : '#64748b',
                bgcolor: isActive ? 'rgba(168, 85, 247, 0.12)' : 'transparent',
                fontSize: '0.72rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                opacity: isDragging ? 0.72 : 1,
                boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.28)' : 'none',
                userSelect: 'none',
                '&:hover': {
                    color: isActive ? '#f8fafc' : '#94a3b8',
                    bgcolor: isActive ? 'rgba(168, 85, 247, 0.16)' : 'rgba(255,255,255,0.04)',
                },
            }}
        >
            <Tooltip title="Drag to reorder" arrow placement="top">
                <Box
                    component="span"
                    {...attributes}
                    {...listeners}
                    onClick={(event) => event.stopPropagation()}
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        color: '#64748b',
                        cursor: 'grab',
                        '&:active': { cursor: 'grabbing' },
                        '&:hover': { color: '#a78bfa' },
                    }}
                >
                    <DragIndicatorIcon sx={{ fontSize: 14 }} />
                </Box>
            </Tooltip>
            {tab.label}
        </Box>
    );
}

export function DraggableTabBar<T extends string>({
    tabs,
    activeTab,
    onTabChange,
    onReorder,
}: DraggableTabBarProps<T>) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = tabs.findIndex((tab) => tab.id === active.id);
        const newIndex = tabs.findIndex((tab) => tab.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;

        onReorder(arrayMove(
            tabs.map((tab) => tab.id),
            oldIndex,
            newIndex,
        ));
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={tabs.map((tab) => tab.id)}
                strategy={horizontalListSortingStrategy}
            >
                <Box
                    role="tablist"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        overflowX: 'auto',
                        pb: 0.25,
                        scrollbarWidth: 'thin',
                    }}
                >
                    {tabs.map((tab) => (
                        <SortableTabButton
                            key={tab.id}
                            tab={tab}
                            isActive={activeTab === tab.id}
                            onSelect={onTabChange}
                        />
                    ))}
                </Box>
            </SortableContext>
        </DndContext>
    );
}
