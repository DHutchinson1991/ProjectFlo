'use client';

import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Box,
    Typography,
    Button,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Architecture as FloorPlanIcon,
    Edit as EditIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { FloorPlanEditor as FloorPlanEditorModal } from '../Editor/FloorPlanEditor';
import { FloorPlanPreview } from './FloorPlanPreview';
import { api } from '@/lib/api';

// Type definitions
interface VenueFloorPlan {
    venue_floor_plan_data: Record<string, unknown> | null;
    venue_floor_plan_version: number;
    venue_floor_plan_updated_at: string | null;
    venue_floor_plan_updated_by: number | null;
}

interface FloorPlanCardProps {
    locationId: number;
    initialData?: VenueFloorPlan;
    onSave: (data: VenueFloorPlan | null) => void; // Allow null for deletion
}

export const FloorPlanCard: React.FC<FloorPlanCardProps> = ({
    locationId,
    initialData,
    onSave
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const hasFloorPlan = initialData?.venue_floor_plan_data !== null && initialData?.venue_floor_plan_data !== undefined;
    const buttonText = hasFloorPlan ? "Edit Floor Plan" : "Create Floor Plan";

    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    const handleSaveComplete = (data: VenueFloorPlan) => {
        console.log('🎨 FloorPlanCard received save data:', {
            venue_floor_plan_version: data.venue_floor_plan_version,
            venue_floor_plan_updated_at: data.venue_floor_plan_updated_at,
            venue_floor_plan_data_exists: !!data.venue_floor_plan_data,
            venue_floor_plan_data_keys: data.venue_floor_plan_data ? Object.keys(data.venue_floor_plan_data) : []
        });
        onSave(data);
        setIsModalOpen(false);
    };

    return (
        <>
            <Card sx={{ height: 500 }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Box display="flex" alignItems="center">
                            <FloorPlanIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Box>
                                <Typography variant="h6">Venue Floor Plan</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Overall building and grounds layout
                                </Typography>
                            </Box>
                        </Box>
                        {hasFloorPlan && initialData && (
                            <Typography variant="caption" color="text.secondary">
                                v{initialData.venue_floor_plan_version} •
                                {initialData.venue_floor_plan_updated_at &&
                                    ` Updated ${new Date(initialData.venue_floor_plan_updated_at).toLocaleDateString()}`
                                }
                            </Typography>
                        )}
                    </Box>

                    {/* Main Content Area */}
                    <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {hasFloorPlan ? (
                            // Existing floor plan preview
                            <Box
                                sx={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    border: '1px solid',
                                    borderColor: 'grey.300',
                                    borderRadius: 1,
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Preview area with FloorPlanPreview component */}
                                <Box
                                    sx={{
                                        flex: 1,
                                        position: 'relative'
                                    }}
                                >
                                    <FloorPlanPreview
                                        data={initialData || {
                                            venue_floor_plan_data: null,
                                            venue_floor_plan_version: 1,
                                            venue_floor_plan_updated_at: null,
                                            venue_floor_plan_updated_by: null
                                        }}
                                        width="100%"
                                        height="100%"
                                    />

                                    {/* Edit overlay button */}
                                    <Tooltip title="Edit Floor Plan">
                                        <IconButton
                                            onClick={() => setIsModalOpen(true)}
                                            sx={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8,
                                                backgroundColor: 'background.paper',
                                                boxShadow: 1,
                                                '&:hover': {
                                                    backgroundColor: 'background.paper',
                                                    boxShadow: 2
                                                }
                                            }}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>

                                {/* Action bar */}
                                <Box
                                    sx={{
                                        p: 1,
                                        backgroundColor: 'background.paper',
                                        borderTop: '1px solid',
                                        borderColor: 'grey.200',
                                        display: 'flex',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<EditIcon />}
                                        onClick={() => setIsModalOpen(true)}
                                    >
                                        {buttonText}
                                    </Button>
                                </Box>
                            </Box>
                        ) : (
                            // No floor plan state
                            <Box
                                sx={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                    backgroundColor: 'grey.50',
                                    borderRadius: 1,
                                    border: '1px dashed',
                                    borderColor: 'grey.300',
                                    p: 3
                                }}
                            >
                                <FloorPlanIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    No floor plan created
                                </Typography>
                                <Typography color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
                                    Create an interactive floor plan to visualize the venue layout
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => setIsModalOpen(true)}
                                >
                                    {buttonText}
                                </Button>
                            </Box>
                        )}
                    </Box>
                </CardContent>
            </Card>

            {/* Floor Plan Editor Modal */}
            <FloorPlanEditorModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSave={handleSaveComplete}
                onDelete={async () => {
                    try {
                        console.log('Deleting venue floor plan for location:', locationId);
                        await api.locations.resetVenueFloorPlan(locationId);
                        console.log('✅ Venue floor plan deleted successfully');
                        setIsModalOpen(false);
                        // Trigger a refresh by calling onSave with null (no floor plan)
                        onSave(null); // This will signal to parent that floor plan was deleted
                    } catch (error) {
                        console.error('❌ Error deleting venue floor plan:', error);
                        // You might want to show a toast notification here
                        alert('Failed to delete floor plan. Please try again.');
                    }
                }}
                locationId={locationId}
                initialData={initialData}
                allVersions={initialData?.venue_floor_plan_data ? [initialData] : []} // Only include if has data
            />
        </>
    );
};
