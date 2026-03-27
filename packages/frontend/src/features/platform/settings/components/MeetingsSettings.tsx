"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    Stack,
    Grid,
    TextField,
    Card,
    CardContent,
    Chip,
    Snackbar,
} from "@mui/material";
import {
    Save as SaveIcon,
    Schedule as ScheduleIcon,
    CalendarMonth as CalendarIcon,
} from "@mui/icons-material";
import { settingsApi } from "@/features/platform/settings/api";
import { useBrand } from "@/features/platform/brand";
import { SectionHeader } from "./SettingsHelpers";

export function MeetingsSettings() {
    const { currentBrand } = useBrand();
    const [saving, setSaving] = useState(false);
    const [snack, setSnack] = useState('');
    const [settings, setSettings] = useState({
        duration_minutes: 20,
        description: '',
        available_days: [1, 2, 3, 4, 5] as number[],
        available_from: '09:00',
        available_to: '17:00',
        google_meet_link: '',
    });
    const [loaded, setLoaded] = useState(false);

    const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    useEffect(() => {
        if (!currentBrand?.id || loaded) return;
        settingsApi.getMeetingSettings(currentBrand.id)
            .then((s) => { setSettings(prev => ({ ...prev, ...s })); setLoaded(true); })
            .catch(() => setLoaded(true));
    }, [currentBrand?.id, loaded]);

    const toggleDay = (day: number) => {
        setSettings(prev => ({
            ...prev,
            available_days: prev.available_days.includes(day)
                ? prev.available_days.filter(d => d !== day)
                : [...prev.available_days, day].sort(),
        }));
    };

    const handleSave = async () => {
        if (!currentBrand?.id) return;
        setSaving(true);
        try {
            await settingsApi.saveMeetingSettings(currentBrand.id, settings);
            setSnack('Meeting settings saved');
        } catch {
            setSnack('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <SectionHeader
                title="Meetings"
                description="Configure default settings for discovery calls and other meetings."
            />

            <Stack spacing={3}>
                {/* Discovery Call Settings */}
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                            <ScheduleIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                            <Typography variant="subtitle1" fontWeight={600}>Discovery Call Defaults</Typography>
                        </Box>

                        <Stack spacing={2.5}>
                            <TextField
                                label="Default Duration (minutes)"
                                type="number"
                                value={settings.duration_minutes}
                                onChange={e => setSettings(prev => ({ ...prev, duration_minutes: Math.max(5, parseInt(e.target.value) || 20) }))}
                                inputProps={{ min: 5, max: 120, step: 5 }}
                                size="small"
                                sx={{ maxWidth: 240 }}
                                helperText="Used when scheduling a new discovery call"
                            />

                            <TextField
                                label="Google Meet Link"
                                value={settings.google_meet_link}
                                onChange={e => setSettings(prev => ({ ...prev, google_meet_link: e.target.value }))}
                                placeholder="https://meet.google.com/abc-defg-hij"
                                size="small"
                                fullWidth
                                helperText="Pre-populated as the meeting URL when scheduling"
                            />

                            <TextField
                                label="Default Description"
                                multiline
                                minRows={3}
                                value={settings.description}
                                onChange={e => setSettings(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Hi {name}, looking forward to chatting about your big day! Here's the link to join…"
                                fullWidth
                                helperText="Pre-populated in the description field when scheduling a call"
                            />
                        </Stack>
                    </CardContent>
                </Card>

                {/* Availability */}
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                            <CalendarIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                            <Typography variant="subtitle1" fontWeight={600}>Availability</Typography>
                        </Box>

                        <Stack spacing={2.5}>
                            <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                    Available Days
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {DAY_LABELS.map((label, idx) => (
                                        <Chip
                                            key={idx}
                                            label={label}
                                            onClick={() => toggleDay(idx)}
                                            color={settings.available_days.includes(idx) ? 'primary' : 'default'}
                                            variant={settings.available_days.includes(idx) ? 'filled' : 'outlined'}
                                            sx={{ fontWeight: 600, minWidth: 56 }}
                                        />
                                    ))}
                                </Stack>
                            </Box>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Available From"
                                        type="time"
                                        value={settings.available_from}
                                        onChange={e => setSettings(prev => ({ ...prev, available_from: e.target.value }))}
                                        size="small"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Available Until"
                                        type="time"
                                        value={settings.available_to}
                                        onChange={e => setSettings(prev => ({ ...prev, available_to: e.target.value }))}
                                        size="small"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                            </Grid>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Save */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving…' : 'Save Meeting Settings'}
                    </Button>
                </Box>
            </Stack>

            <Snackbar open={!!snack} autoHideDuration={3500} onClose={() => setSnack('')}
                message={snack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
        </>
    );
}

export default MeetingsSettings;
