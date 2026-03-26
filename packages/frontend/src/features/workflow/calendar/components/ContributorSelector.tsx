// Contributor selector component for event assignee selection
import React from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Avatar,
    Box,
    Typography,
    Chip,
    CircularProgress,
    SelectChangeEvent
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { ContributorOption } from '@/features/workflow/calendar/hooks/use-contributors';

interface ContributorSelectorProps {
    selectedContributor: ContributorOption | null;
    onContributorChange: (contributor: ContributorOption | null) => void;
    contributors: ContributorOption[];
    currentUserContributor: ContributorOption | null;
    loading?: boolean;
    error?: string | null;
    label?: string;
    required?: boolean;
    disabled?: boolean;
}

export function ContributorSelector({
    selectedContributor,
    onContributorChange,
    contributors,
    currentUserContributor,
    loading = false,
    error = null,
    label = "Assignee",
    required = false,
    disabled = false
}: ContributorSelectorProps) {
    const handleChange = (event: SelectChangeEvent<string>) => {
        const value = event.target.value;
        if (value === '') {
            onContributorChange(null);
        } else {
            const contributor = contributors.find(c => c.id === value);
            onContributorChange(contributor || null);
        }
    };

    if (loading) {
        return (
            <FormControl fullWidth disabled>
                <InputLabel>{label}</InputLabel>
                <Select
                    value=""
                    label={label}
                    disabled
                    startAdornment={<CircularProgress size={20} sx={{ mr: 1 }} />}
                >
                    <MenuItem value="">Loading contributors...</MenuItem>
                </Select>
            </FormControl>
        );
    }

    if (error) {
        return (
            <FormControl fullWidth error>
                <InputLabel>{label}</InputLabel>
                <Select
                    value=""
                    label={label}
                    disabled
                >
                    <MenuItem value="">Error loading contributors</MenuItem>
                </Select>
            </FormControl>
        );
    }

    return (
        <FormControl fullWidth required={required} disabled={disabled}>
            <InputLabel>{label}</InputLabel>
            <Select
                value={selectedContributor?.id || ''}
                onChange={handleChange}
                label={label}
                renderValue={(value) => {
                    if (!value) return '';
                    const contributor = contributors.find(c => c.id === value);
                    if (!contributor) return '';

                    return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                                {contributor.initials}
                            </Avatar>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2">
                                    {contributor.name}
                                </Typography>
                                {contributor.isCurrentUser && (
                                    <Chip
                                        label="You"
                                        size="small"
                                        color="primary"
                                        sx={{ height: 18, fontSize: 10 }}
                                    />
                                )}
                            </Box>
                        </Box>
                    );
                }}
            >
                <MenuItem value="">
                    <em>No assignee</em>
                </MenuItem>

                {/* Current user first if available */}
                {currentUserContributor && (
                    <MenuItem value={currentUserContributor.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                            <Avatar sx={{ width: 32, height: 32 }}>
                                {currentUserContributor.initials}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" fontWeight="medium">
                                        {currentUserContributor.name}
                                    </Typography>
                                    <Chip
                                        label="You"
                                        size="small"
                                        color="primary"
                                        sx={{ height: 18, fontSize: 10 }}
                                    />
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                    {currentUserContributor.email}
                                </Typography>
                            </Box>
                        </Box>
                    </MenuItem>
                )}

                {/* Other contributors */}
                {contributors
                    .filter(c => !c.isCurrentUser)
                    .map((contributor) => (
                        <MenuItem key={contributor.id} value={contributor.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                <Avatar sx={{ width: 32, height: 32 }}>
                                    {contributor.initials}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" fontWeight="medium">
                                        {contributor.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {contributor.email}
                                    </Typography>
                                </Box>
                            </Box>
                        </MenuItem>
                    ))}

                {contributors.length === 0 && (
                    <MenuItem disabled>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <PersonIcon color="disabled" />
                            <Typography variant="body2" color="text.secondary">
                                No contributors available
                            </Typography>
                        </Box>
                    </MenuItem>
                )}
            </Select>
        </FormControl>
    );
}
