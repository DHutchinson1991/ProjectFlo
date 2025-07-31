"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CircularProgress,
    Paper,
    Chip,
    Snackbar,
    Alert,
} from '@mui/material';
import { inquiriesService } from '@/lib/api';
import { Inquiry, InquiryStatus } from '@/lib/types';
import { useBrand } from '../../../providers/BrandProvider';
import { useRouter } from 'next/navigation';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    useDroppable,
    useDraggable,
} from '@dnd-kit/core';

// Define the order and titles for your pipeline columns
const pipelineColumns: { status: string; title: string; color: string }[] = [
    { status: 'New', title: 'New Leads', color: '#2196F3' },
    { status: 'Contacted', title: 'Contacted', color: '#9C27B0' },
    { status: 'Proposal_Sent', title: 'Proposal Sent', color: '#FF9800' },
    { status: 'Booked', title: 'Won', color: '#4CAF50' },
    { status: 'Closed_Lost', title: 'Lost', color: '#F44336' },
];

export default function LeadPipelinePage() {
    // Brand context
    const { currentBrand } = useBrand();

    // Router for navigation
    const router = useRouter();

    // Data states
    const [inquiriesByStatus, setInquiriesByStatus] = useState<Record<string, Inquiry[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Dialog states - removed edit dialog as we navigate to detail page instead

    // Drag and drop states
    const [activeInquiry, setActiveInquiry] = useState<Inquiry | null>(null);

    // DND Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px of movement required to start drag
            },
        })
    );

    // Notification states
    const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

    const showNotification = (message: string, severity: 'success' | 'error') => {
        setNotification({ message, severity });
    };

    // Drag and drop handlers
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const inquiry = findInquiryById(active.id as number);
        setActiveInquiry(inquiry);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveInquiry(null);

        if (!over) return;

        const inquiryId = active.id as number;
        const newStatus = over.id as string;

        console.log('Drag end debug:', {
            inquiryId,
            newStatus,
            overId: over.id,
            activeId: active.id,
            overData: over.data,
            pipelineColumns: pipelineColumns.map(col => col.status)
        });

        // Find the inquiry
        const inquiry = findInquiryById(inquiryId);
        if (!inquiry || inquiry.status === newStatus) return;

        console.log('Updating inquiry:', inquiryId, 'from', inquiry.status, 'to', newStatus);

        try {
            // Update the inquiry status
            await inquiriesService.update(inquiryId, {
                first_name: inquiry.contact.first_name || '',
                last_name: inquiry.contact.last_name || '',
                email: inquiry.contact.email,
                phone_number: inquiry.contact.phone_number || '',
                wedding_date: inquiry.event_date ? inquiry.event_date.toISOString().split('T')[0] : '',
                status: newStatus as InquiryStatus,
                notes: inquiry.notes || '',
                venue_details: '',
                lead_source: inquiry.source,
                lead_source_details: '',
            });

            showNotification(`Inquiry moved to ${getStatusDisplayName(newStatus)}`, 'success');
            // Refresh the inquiries to reflect the change
            await loadInquiries();
        } catch (error) {
            console.error('Failed to update inquiry status:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to update inquiry status';
            showNotification(`Failed to update inquiry: ${errorMessage}`, 'error');
            // Refresh the inquiries to revert any optimistic updates
            await loadInquiries();
        }
    };

    const findInquiryById = (id: number): Inquiry | null => {
        for (const statusInquiries of Object.values(inquiriesByStatus)) {
            const inquiry = statusInquiries.find(inq => inq.id === id);
            if (inquiry) return inquiry;
        }
        return null;
    };

    const getStatusDisplayName = (status: string): string => {
        const column = pipelineColumns.find(col => col.status === status);
        return column ? column.title : status;
    };

    // Draggable Inquiry Card Component
    const DraggableInquiryCard = ({ inquiry, color }: { inquiry: Inquiry; color: string }) => {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            isDragging,
        } = useDraggable({
            id: inquiry.id,
        });

        const style = transform ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            opacity: isDragging ? 0.5 : 1,
        } : {
            opacity: isDragging ? 0.5 : 1,
        };

        return (
            <Card
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                elevation={1}
                sx={{
                    mb: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    transition: 'all 0.2s ease-in-out',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    '&:hover': {
                        borderColor: color,
                        boxShadow: `0 2px 8px ${color}33`,
                        transform: isDragging ? undefined : 'translateY(-1px)',
                    }
                }}
                onClick={() => {
                    // Only navigate if not dragging
                    if (!isDragging) {
                        router.push(`/sales/inquiries/${inquiry.id}`);
                    }
                }}
            >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1, fontSize: '0.85rem', lineHeight: 1.2 }}>
                            {inquiry.contact.full_name}
                        </Typography>
                        {inquiry.source && (
                            <Chip
                                label={inquiry.source}
                                size="small"
                                variant="outlined"
                                sx={{
                                    borderColor: color,
                                    color: color,
                                    fontSize: '0.65rem',
                                    height: '20px',
                                    '& .MuiChip-label': { px: 0.5 }
                                }}
                            />
                        )}
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                        📅 {inquiry.event_date ? new Date(inquiry.event_date).toLocaleDateString() : 'TBD'}
                    </Typography>
                </CardContent>
            </Card>
        );
    };

    // Droppable Column Component
    const DroppableColumn = ({ status, title, color, inquiries }: {
        status: string;
        title: string;
        color: string;
        inquiries: Inquiry[]
    }) => {
        const { setNodeRef, isOver } = useDroppable({
            id: status,
        });

        return (
            <Paper
                ref={setNodeRef}
                sx={{
                    p: 1.5,
                    flex: '1 1 0',
                    minWidth: 0,
                    bgcolor: isOver ? `${color}08` : 'background.paper',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: isOver ? color : 'divider',
                    boxShadow: isOver ? `0 4px 16px ${color}33` : '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease-in-out',
                }}
            >
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 1.5,
                    pb: 1,
                    borderBottom: `2px solid ${color}`,
                }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1, fontSize: '0.9rem' }}>
                        {title}
                    </Typography>
                    <Chip
                        label={inquiries.length}
                        size="small"
                        sx={{
                            bgcolor: color,
                            color: 'white',
                            fontWeight: 600,
                            minWidth: '32px',
                            height: '24px',
                            fontSize: '0.75rem',
                        }}
                    />
                </Box>

                <Box sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    pr: 0.5,
                    minHeight: '200px', // Minimum height for drop zone
                    '&::-webkit-scrollbar': {
                        width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: `${color}10`,
                        borderRadius: '3px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: `${color}60`,
                        borderRadius: '3px',
                        '&:hover': {
                            background: `${color}80`,
                        },
                    },
                }}>
                    {inquiries.length > 0 ? (
                        inquiries.map((inquiry) => (
                            <DraggableInquiryCard
                                key={inquiry.id}
                                inquiry={inquiry}
                                color={color}
                            />
                        ))
                    ) : (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '120px',
                            border: '2px dashed',
                            borderColor: `${color}50`,
                            borderRadius: 1.5,
                            color: 'text.disabled',
                            bgcolor: `${color}05`,
                        }}>
                            <Typography variant="caption" sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                                No {title.toLowerCase()} yet
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', textAlign: 'center' }}>
                                Drop inquiries here
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Paper>
        );
    };

    // Load inquiries
    const loadInquiries = async () => {
        try {
            setIsLoading(true);
            const allInquiries = await inquiriesService.getAll();

            console.log('Loaded inquiries:', allInquiries.map(i => ({ id: i.id, name: i.contact.full_name, status: i.status })));

            const grouped = allInquiries.reduce((acc, inquiry) => {
                (acc[inquiry.status] = acc[inquiry.status] || []).push(inquiry);
                return acc;
            }, {} as Record<string, Inquiry[]>);

            setInquiriesByStatus(grouped);
        } catch (error) {
            console.error("Failed to load inquiries:", error);
            showNotification('Failed to load inquiries', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentBrand) {
            loadInquiries();
        }
    }, [currentBrand]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default', overflow: 'hidden' }}>
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                        <Box>
                            <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 0.5, color: 'primary.main' }}>
                                Lead Pipeline
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Drag and drop to update status • Click cards to edit
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {pipelineColumns.map(({ status, color }) => {
                                const count = inquiriesByStatus[status]?.length || 0;
                                return (
                                    <Chip
                                        key={status}
                                        label={`${count}`}
                                        size="small"
                                        sx={{
                                            bgcolor: `${color}20`,
                                            color: color,
                                            fontWeight: 600,
                                            border: `1px solid ${color}50`,
                                            minWidth: '28px',
                                        }}
                                    />
                                );
                            })}
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flex: 1, minHeight: 0, overflow: 'hidden' }}>
                        {pipelineColumns.map(({ status, title, color }) => {
                            const statusInquiries = inquiriesByStatus[status] || [];
                            return (
                                <DroppableColumn
                                    key={status}
                                    status={status}
                                    title={title}
                                    color={color}
                                    inquiries={statusInquiries}
                                />
                            );
                        })}
                    </Box>

                    <DragOverlay>
                        {activeInquiry ? (
                            <Card
                                elevation={8}
                                sx={{
                                    width: '200px',
                                    border: '2px solid',
                                    borderColor: 'primary.main',
                                    borderRadius: 1.5,
                                    transform: 'rotate(5deg)',
                                    opacity: 0.9,
                                }}
                            >
                                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem', mb: 0.5 }}>
                                        {activeInquiry.contact.full_name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                        📅 {activeInquiry.event_date ? new Date(activeInquiry.event_date).toLocaleDateString() : 'TBD'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        ) : null}
                    </DragOverlay>
                </Box>
            </DndContext>

            {/* Notification Snackbar */}

            {/* Notification Snackbar */}
            <Snackbar
                open={!!notification}
                autoHideDuration={6000}
                onClose={() => setNotification(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setNotification(null)}
                    severity={notification?.severity}
                    sx={{ width: '100%' }}
                >
                    {notification?.message}
                </Alert>
            </Snackbar>
        </>
    );
}
