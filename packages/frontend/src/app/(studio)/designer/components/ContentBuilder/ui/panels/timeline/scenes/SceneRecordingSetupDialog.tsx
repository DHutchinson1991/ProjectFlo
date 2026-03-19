"use client";

import React from "react";
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    FormGroup,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import { MusicType, MUSIC_TYPE_LABELS } from "@/lib/types/domains/music";
import type { TimelineTrack } from "@/lib/types/timeline";
import { useContentBuilder } from "../../../../context/ContentBuilderContext";
import { getEquipmentLabelForTrackName } from "@/lib/utils/equipmentAssignments";

interface SceneRecordingSetupDialogProps {
    open: boolean;
    sceneName?: string | null;
    isSaving: boolean;
    videoTracks: TimelineTrack[];
    audioTracks: TimelineTrack[];
    graphicsTracks: TimelineTrack[];
    selectedCameraTrackIds: number[];
    selectedAudioTrackIds: number[];
    graphicsEnabled: boolean;
    sceneMusicEnabled: boolean;
    sceneMusicForm: {
        music_name: string;
        artist: string;
        music_type: MusicType;
    };
    musicError: string | null;
    onClose: () => void;
    onSave: () => void;
    onClear: () => void;
    onToggleCameraTrack: (trackId: number) => void;
    onToggleAudioTrack: (trackId: number) => void;
    onGraphicsEnabledChange: (enabled: boolean) => void;
    onSceneMusicEnabledChange: (enabled: boolean) => void;
    onSceneMusicFormChange: (next: { music_name: string; artist: string; music_type: MusicType }) => void;
}

const SceneRecordingSetupDialog: React.FC<SceneRecordingSetupDialogProps> = ({
    open,
    sceneName,
    isSaving,
    videoTracks,
    audioTracks,
    graphicsTracks,
    selectedCameraTrackIds,
    selectedAudioTrackIds,
    graphicsEnabled,
    sceneMusicEnabled,
    sceneMusicForm,
    musicError,
    onClose,
    onSave,
    onClear,
    onToggleCameraTrack,
    onToggleAudioTrack,
    onGraphicsEnabledChange,
    onSceneMusicEnabledChange,
    onSceneMusicFormChange,
}) => {
    const { equipmentAssignmentsBySlot } = useContentBuilder();

    const getTrackDisplayName = (track: TimelineTrack) => {
        const normalized = track.track_type?.toString().toLowerCase();
        const shouldShow = normalized === "video" || normalized === "audio";
        if (!shouldShow) return track.name;
        const equipmentLabel = getEquipmentLabelForTrackName(track.name, equipmentAssignmentsBySlot);
        return equipmentLabel ? `${trackNumberOnly(track.name)} · ${equipmentLabel}` : track.name;
    };

    const trackNumberOnly = (name: string) => {
        const match = name.match(/^(Camera|Audio)\s+(\d+)$/i);
        return match ? match[0] : name;
    };

    return (
        <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
            sx: {
                bgcolor: "#1a1a1a",
                backgroundImage: "none",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 2,
                p: 1,
            },
        }}
    >
        <DialogTitle sx={{ color: "white", fontWeight: 600 }}>
            Recording Setup{sceneName ? ` • ${sceneName}` : ""}
        </DialogTitle>
        <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                    Video Tracks
                </Typography>
                {videoTracks.length === 0 ? (
                    <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                        No video tracks available.
                    </Typography>
                ) : (
                    <FormGroup>
                        {videoTracks.map((track) => (
                            <FormControlLabel
                                key={`video-track-${track.id}`}
                                control={
                                    <Checkbox
                                        checked={selectedCameraTrackIds.includes(track.id)}
                                        onChange={() => onToggleCameraTrack(track.id)}
                                        sx={{ color: "rgba(255,255,255,0.5)", '&.Mui-checked': { color: '#7B61FF' } }}
                                    />
                                }
                                label={<Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{getTrackDisplayName(track)}</Typography>}
                            />
                        ))}
                    </FormGroup>
                )}

                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                    Audio Tracks
                </Typography>
                {audioTracks.length === 0 ? (
                    <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                        No audio tracks available.
                    </Typography>
                ) : (
                    <FormGroup>
                        {audioTracks.map((track) => (
                            <FormControlLabel
                                key={`audio-track-${track.id}`}
                                control={
                                    <Checkbox
                                        checked={selectedAudioTrackIds.includes(track.id)}
                                        onChange={() => onToggleAudioTrack(track.id)}
                                        sx={{ color: "rgba(255,255,255,0.5)", '&.Mui-checked': { color: '#7B61FF' } }}
                                    />
                                }
                                label={<Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{getTrackDisplayName(track)}</Typography>}
                            />
                        ))}
                    </FormGroup>
                )}

                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                    Graphics
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Switch
                        checked={graphicsEnabled}
                        onChange={(e) => onGraphicsEnabledChange(e.target.checked)}
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#7B61FF' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#7B61FF' } }}
                    />
                    <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
                        Enable graphics overlays
                    </Typography>
                    {graphicsTracks.length === 0 && (
                        <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                            (No graphics track configured)
                        </Typography>
                    )}
                </Stack>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                    Music
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Switch
                        checked={sceneMusicEnabled}
                        onChange={(e) => onSceneMusicEnabledChange(e.target.checked)}
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#7B61FF' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#7B61FF' } }}
                    />
                    <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
                        Enable scene music (spans entire scene)
                    </Typography>
                </Stack>
                <Stack spacing={1.5} sx={{ opacity: sceneMusicEnabled ? 1 : 0.5 }}>
                    <TextField
                        size="small"
                        label="Scene music name"
                        value={sceneMusicForm.music_name}
                        onChange={(e) => onSceneMusicFormChange({ ...sceneMusicForm, music_name: e.target.value })}
                        disabled={!sceneMusicEnabled}
                        fullWidth
                        InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.5)' } }}
                        sx={{ input: { color: 'white' } }}
                    />
                    <TextField
                        size="small"
                        label="Artist"
                        value={sceneMusicForm.artist}
                        onChange={(e) => onSceneMusicFormChange({ ...sceneMusicForm, artist: e.target.value })}
                        disabled={!sceneMusicEnabled}
                        fullWidth
                        InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.5)' } }}
                        sx={{ input: { color: 'white' } }}
                    />
                    <FormControl size="small" fullWidth disabled={!sceneMusicEnabled}>
                        <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Music Type</InputLabel>
                        <Select
                            label="Music Type"
                            value={sceneMusicForm.music_type}
                            onChange={(e) => onSceneMusicFormChange({ ...sceneMusicForm, music_type: e.target.value as MusicType })}
                            sx={{ color: 'white' }}
                        >
                            {Object.values(MusicType).map((type) => (
                                <MenuItem key={`scene-music-${type}`} value={type}>
                                    {MUSIC_TYPE_LABELS[type]}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
                {musicError && (
                    <Typography sx={{ color: "#FF6B6B", fontSize: 12 }}>
                        {musicError}
                    </Typography>
                )}
            </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
            <Button onClick={onClear} disabled={isSaving} sx={{ color: "#FF6B9D" }}>
                Clear Setup
            </Button>
            <Box sx={{ display: "flex", gap: 1 }}>
                <Button onClick={onClose} sx={{ color: "rgba(255,255,255,0.7)" }}>
                    Cancel
                </Button>
                <Button
                    onClick={onSave}
                    variant="contained"
                    disabled={isSaving}
                    sx={{ bgcolor: "#7B61FF", '&:hover': { bgcolor: '#6b55e0' } }}
                >
                    Save Setup
                </Button>
            </Box>
        </DialogActions>
        </Dialog>
    );
};

export default SceneRecordingSetupDialog;
