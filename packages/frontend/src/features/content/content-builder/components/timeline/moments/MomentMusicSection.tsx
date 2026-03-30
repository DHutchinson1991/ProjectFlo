"use client";

import React from "react";
import {
    Box, Stack, Typography, Divider, Switch, TextField,
    FormControl, InputLabel, Select, MenuItem, Button,
} from "@mui/material";
import { MusicType, MUSIC_TYPE_LABELS } from "@/features/content/music/types";

interface MusicFormState {
    music_name: string;
    artist: string;
    music_type: MusicType;
}

interface MomentMusicSectionProps {
    isMusicTrack: boolean;
    sceneMusicEnabled: boolean;
    momentMusicEnabled: boolean;
    sceneMusicForm: MusicFormState;
    momentMusicForm: MusicFormState;
    musicError: string | null;
    isMusicLoading: boolean;
    isSavingMusic: boolean;
    onSceneMusicToggle: (enabled: boolean) => void;
    onMomentMusicToggle: (enabled: boolean) => void;
    onSceneMusicFormChange: (patch: Partial<MusicFormState>) => void;
    onMomentMusicFormChange: (patch: Partial<MusicFormState>) => void;
    onSaveSceneMusic: () => void;
    onSaveMomentMusic: () => void;
}

const switchSx = {
    "& .MuiSwitch-switchBase.Mui-checked": { color: "#7B61FF" },
    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#7B61FF" },
};

export function MomentMusicSection({
    isMusicTrack,
    sceneMusicEnabled, momentMusicEnabled,
    sceneMusicForm, momentMusicForm,
    musicError, isMusicLoading, isSavingMusic,
    onSceneMusicToggle, onMomentMusicToggle,
    onSceneMusicFormChange, onMomentMusicFormChange,
    onSaveSceneMusic, onSaveMomentMusic,
}: MomentMusicSectionProps) {
    const sectionHeader = (
        <>
            <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700 }}>
                Music
            </Typography>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
        </>
    );

    // ─── Simple moment music (non-music-track moments) ────────────────────────
    if (!isMusicTrack) {
        return (
            <Stack spacing={1.5}>
                {sectionHeader}
                <Stack direction="row" spacing={1} alignItems="center">
                    <Switch checked={momentMusicEnabled} onChange={(e) => onMomentMusicToggle(e.target.checked)} sx={switchSx} />
                    <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>Add moment music</Typography>
                </Stack>
                {momentMusicEnabled && (
                    <TextField
                        size="small"
                        label="Music name"
                        value={momentMusicForm.music_name}
                        onChange={(e) => onMomentMusicFormChange({ music_name: e.target.value })}
                        fullWidth
                        placeholder="Song or track name"
                        InputLabelProps={{ sx: { color: "rgba(255,255,255,0.5)" } }}
                        sx={{ input: { color: "white" } }}
                    />
                )}
                {musicError && momentMusicEnabled && (
                    <Typography sx={{ color: "#FF6B6B", fontSize: "0.75rem" }}>{musicError}</Typography>
                )}
            </Stack>
        );
    }

    // ─── Full music track editor ──────────────────────────────────────────────
    return (
        <Stack spacing={2}>
            {sectionHeader}

            {/* Scene music */}
            <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Switch checked={sceneMusicEnabled} onChange={(e) => onSceneMusicToggle(e.target.checked)} sx={switchSx} />
                    <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>Use scene music (spans entire scene)</Typography>
                </Stack>
                <Stack spacing={1.5} sx={{ mt: 1.5, opacity: sceneMusicEnabled ? 1 : 0.5 }}>
                    <TextField
                        size="small" label="Scene music name"
                        value={sceneMusicForm.music_name}
                        onChange={(e) => onSceneMusicFormChange({ music_name: e.target.value })}
                        disabled={!sceneMusicEnabled} fullWidth
                        InputLabelProps={{ sx: { color: "rgba(255,255,255,0.5)" } }} sx={{ input: { color: "white" } }}
                    />
                    <TextField
                        size="small" label="Artist"
                        value={sceneMusicForm.artist}
                        onChange={(e) => onSceneMusicFormChange({ artist: e.target.value })}
                        disabled={!sceneMusicEnabled} fullWidth
                        InputLabelProps={{ sx: { color: "rgba(255,255,255,0.5)" } }} sx={{ input: { color: "white" } }}
                    />
                    <FormControl size="small" fullWidth disabled={!sceneMusicEnabled}>
                        <InputLabel sx={{ color: "rgba(255,255,255,0.5)" }}>Music Type</InputLabel>
                        <Select
                            label="Music Type" value={sceneMusicForm.music_type}
                            onChange={(e) => onSceneMusicFormChange({ music_type: e.target.value as MusicType })}
                            sx={{ color: "white" }}
                        >
                            {Object.values(MusicType).map(type => (
                                <MenuItem key={`scene-music-${type}`} value={type}>{MUSIC_TYPE_LABELS[type]}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
                <Button
                    onClick={onSaveSceneMusic} variant="outlined" size="small"
                    disabled={isMusicLoading || isSavingMusic}
                    sx={{ mt: 1.5, color: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.2)" }}
                >
                    Apply Scene Music
                </Button>
            </Box>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

            {/* Moment music override */}
            <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Switch checked={momentMusicEnabled} onChange={(e) => onMomentMusicToggle(e.target.checked)} sx={switchSx} />
                    <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>Override with moment music</Typography>
                </Stack>
                <Stack spacing={1.5} sx={{ mt: 1.5, opacity: momentMusicEnabled ? 1 : 0.5 }}>
                    <TextField
                        size="small" label="Moment music name"
                        value={momentMusicForm.music_name}
                        onChange={(e) => onMomentMusicFormChange({ music_name: e.target.value })}
                        disabled={!momentMusicEnabled} fullWidth
                        InputLabelProps={{ sx: { color: "rgba(255,255,255,0.5)" } }} sx={{ input: { color: "white" } }}
                    />
                    <TextField
                        size="small" label="Artist"
                        value={momentMusicForm.artist}
                        onChange={(e) => onMomentMusicFormChange({ artist: e.target.value })}
                        disabled={!momentMusicEnabled} fullWidth
                        InputLabelProps={{ sx: { color: "rgba(255,255,255,0.5)" } }} sx={{ input: { color: "white" } }}
                    />
                    <FormControl size="small" fullWidth disabled={!momentMusicEnabled}>
                        <InputLabel sx={{ color: "rgba(255,255,255,0.5)" }}>Music Type</InputLabel>
                        <Select
                            label="Music Type" value={momentMusicForm.music_type}
                            onChange={(e) => onMomentMusicFormChange({ music_type: e.target.value as MusicType })}
                            sx={{ color: "white" }}
                        >
                            {Object.values(MusicType).map(type => (
                                <MenuItem key={`moment-music-${type}`} value={type}>{MUSIC_TYPE_LABELS[type]}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
                <Button
                    onClick={onSaveMomentMusic} variant="outlined" size="small"
                    disabled={isMusicLoading || isSavingMusic}
                    sx={{ mt: 1.5, color: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.2)" }}
                >
                    Apply Moment Override
                </Button>
            </Box>

            {musicError && (
                <Typography sx={{ color: "#FF6B6B", fontSize: "0.75rem" }}>{musicError}</Typography>
            )}
        </Stack>
    );
}
