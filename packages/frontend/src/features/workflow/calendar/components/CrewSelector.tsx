import React from 'react';
import {
    Avatar,
    Box,
    Chip,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    type SelectChangeEvent,
    Typography,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { type CrewOption } from '@/features/workflow/calendar/hooks/use-crew-members';

interface CrewSelectorProps {
    selectedCrew: CrewOption | null;
    onCrewChange: (crew: CrewOption | null) => void;
    crew: CrewOption[];
    currentUserCrew: CrewOption | null;
    loading?: boolean;
    error?: string | null;
    label?: string;
    required?: boolean;
    disabled?: boolean;
}

export function CrewSelector({
    selectedCrew,
    onCrewChange,
    crew,
    currentUserCrew,
    loading = false,
    error = null,
    label = 'Assignee',
    required = false,
    disabled = false,
}: CrewSelectorProps) {
    const handleChange = (event: SelectChangeEvent<string>) => {
        const value = event.target.value;
        if (value === '') {
            onCrewChange(null);
            return;
        }

        const selectedOption = crew.find((member) => member.id === value);
        onCrewChange(selectedOption ?? null);
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
                    <MenuItem value="">Loading crew...</MenuItem>
                </Select>
            </FormControl>
        );
    }

    if (error) {
        return (
            <FormControl fullWidth error>
                <InputLabel>{label}</InputLabel>
                <Select value="" label={label} disabled>
                    <MenuItem value="">Error loading crew</MenuItem>
                </Select>
            </FormControl>
        );
    }

    return (
        <FormControl fullWidth required={required} disabled={disabled}>
            <InputLabel>{label}</InputLabel>
            <Select
                value={selectedCrew?.id || ''}
                onChange={handleChange}
                label={label}
                renderValue={(value) => {
                    if (!value) return '';

                    const selectedOption = crew.find((member) => member.id === value);
                    if (!selectedOption) return '';

                    return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                                {selectedOption.initials}
                            </Avatar>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2">{selectedOption.name}</Typography>
                                {selectedOption.isCurrentUser && (
                                    <Chip label="You" size="small" color="primary" sx={{ height: 18, fontSize: 10 }} />
                                )}
                            </Box>
                        </Box>
                    );
                }}
            >
                <MenuItem value="">
                    <em>No assignee</em>
                </MenuItem>

                {currentUserCrew && (
                    <MenuItem value={currentUserCrew.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                            <Avatar sx={{ width: 32, height: 32 }}>{currentUserCrew.initials}</Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" fontWeight="medium">
                                        {currentUserCrew.name}
                                    </Typography>
                                    <Chip label="You" size="small" color="primary" sx={{ height: 18, fontSize: 10 }} />
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                    {currentUserCrew.email}
                                </Typography>
                            </Box>
                        </Box>
                    </MenuItem>
                )}

                {crew
                    .filter((member) => !member.isCurrentUser)
                    .map((member) => (
                        <MenuItem key={member.id} value={member.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                <Avatar sx={{ width: 32, height: 32 }}>{member.initials}</Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" fontWeight="medium">
                                        {member.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {member.email}
                                    </Typography>
                                </Box>
                            </Box>
                        </MenuItem>
                    ))}

                {crew.length === 0 && (
                    <MenuItem disabled>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <PersonIcon color="disabled" />
                            <Typography variant="body2" color="text.secondary">
                                No crew available
                            </Typography>
                        </Box>
                    </MenuItem>
                )}
            </Select>
        </FormControl>
    );
}
