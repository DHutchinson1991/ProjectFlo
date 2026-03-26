import React from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Button,
    Chip,
    Breadcrumbs,
    Link
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Apartment as SpaceIcon,
    Home as HomeIcon,
    Business as BusinessIcon,
    People as CapacityIcon,
} from '@mui/icons-material';
import { LocationsLibrary, LocationSpace } from '@/features/workflow/locations/types';

interface SpaceHeaderProps {
    location: LocationsLibrary;
    space: LocationSpace;
    isEditing: boolean;
    onStartEdit: () => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
}

export const SpaceHeader: React.FC<SpaceHeaderProps> = ({
    location,
    space,
    isEditing,
    onStartEdit,
    onSaveEdit,
    onCancelEdit
}) => {
    const router = useRouter();

    // Navigation handlers
    const handleBack = () => {
        router.push(`/resources/locations/${location.id}`);
    };

    const handleLocationClick = () => {
        router.push(`/resources/locations/${location.id}`);
    };

    const handleSpacesClick = () => {
        router.push(`/resources/locations/${location.id}#spaces`);
    };

    // Space type configuration
    const getSpaceTypeConfig = (type: string) => {
        const configs = {
            'reception': { icon: <BusinessIcon />, color: 'primary' as const, label: 'Reception Area' },
            'ballroom': { icon: <SpaceIcon />, color: 'secondary' as const, label: 'Ballroom' },
            'ceremony': { icon: <HomeIcon />, color: 'success' as const, label: 'Ceremony Space' },
            'cocktail': { icon: <BusinessIcon />, color: 'warning' as const, label: 'Cocktail Area' },
            'dining': { icon: <BusinessIcon />, color: 'info' as const, label: 'Dining Room' },
            'outdoor': { icon: <HomeIcon />, color: 'success' as const, label: 'Outdoor Space' },
            'other': { icon: <SpaceIcon />, color: 'default' as const, label: 'Other Space' }
        };
        return configs[type as keyof typeof configs] || configs.other;
    };

    const spaceTypeConfig = getSpaceTypeConfig(space.space_type);

    // Format capacity display
    const formatCapacity = (capacity: number | null) => {
        if (!capacity) return 'Not specified';
        return `${capacity} ${capacity === 1 ? 'person' : 'people'}`;
    };

    return (
        <Box sx={{ mb: 3 }}>
            {/* Breadcrumbs */}
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link
                    color="inherit"
                    href="/resources/locations"
                    sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                >
                    <HomeIcon sx={{ mr: 0.5, fontSize: 16 }} />
                    Locations
                </Link>
                <Link
                    color="inherit"
                    onClick={handleLocationClick}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                    }}
                >
                    <BusinessIcon sx={{ mr: 0.5, fontSize: 16 }} />
                    {location.name}
                </Link>
                <Link
                    color="inherit"
                    onClick={handleSpacesClick}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                    }}
                >
                    <SpaceIcon sx={{ mr: 0.5, fontSize: 16 }} />
                    Spaces
                </Link>
                <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
                    {spaceTypeConfig.icon}
                    <Box component="span" sx={{ ml: 0.5 }}>
                        {space.space_name}
                    </Box>
                </Typography>
            </Breadcrumbs>

            {/* Header with actions */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={handleBack}
                        variant="outlined"
                        size="small"
                        sx={{ mr: 2, flexShrink: 0 }}
                    >
                        Back
                    </Button>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{
                                fontWeight: 600,
                                mb: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {space.name}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                                icon={spaceTypeConfig.icon}
                                label={spaceTypeConfig.label}
                                color={spaceTypeConfig.color}
                                size="small"
                                variant="outlined"
                            />
                            <Chip
                                icon={<CapacityIcon />}
                                label={formatCapacity(space.capacity ?? null)}
                                size="small"
                                variant="outlined"
                            />
                        </Box>
                    </Box>
                </Box>

                {/* Action buttons */}
                <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                    {isEditing ? (
                        <>
                            <Button
                                startIcon={<SaveIcon />}
                                onClick={onSaveEdit}
                                variant="contained"
                                color="primary"
                            >
                                Save Changes
                            </Button>
                            <Button
                                startIcon={<CancelIcon />}
                                onClick={onCancelEdit}
                                variant="outlined"
                            >
                                Cancel
                            </Button>
                        </>
                    ) : (
                        <Button
                            startIcon={<EditIcon />}
                            onClick={onStartEdit}
                            variant="contained"
                        >
                            Edit Space
                        </Button>
                    )}
                </Box>
            </Box>
        </Box>
    );
};
