"use client";

import React from "react";
import {
    Box, Stack, Typography, FormGroup, FormControlLabel, Checkbox,
    FormControl, InputLabel, Select, MenuItem, Switch, TextField,
} from "@mui/material";
import { ListItemText } from "@mui/material";
import type { ShotType } from "@/features/content/coverage/types";
import type { TimelineTrack } from "@/features/content/content-builder/types/timeline";

interface MomentRecordingSetupSectionProps {
    videoTracks: TimelineTrack[];
    audioTracks: TimelineTrack[];
    graphicsTracks: TimelineTrack[];
    selectedCameraTrackIds: number[];
    selectedAudioTrackIds: number[];
    cameraSubjectSelections: Record<number, number[]>;
    cameraShotSelections: Record<number, ShotType | "">;
    graphicsEnabled: boolean;
    graphicsTitle: string;
    inheritedSubjects: Array<{ id: number; name: string; [key: string]: unknown }>;
    shotTypes: ShotType[];
    formatShotLabel: (value: string) => string;
    getTrackEquipmentLabel: (name: string, type?: string) => string | null;
    onSetDirty: () => void;
    onCameraTrackToggle: (id: number) => void;
    onAudioTrackToggle: (id: number) => void;
    onSubjectChange: (trackId: number, value: number[]) => void;
    onShotChange: (trackId: number, value: ShotType | "") => void;
    onGraphicsToggle: (enabled: boolean) => void;
    onGraphicsTitleChange: (value: string) => void;
}

export function MomentRecordingSetupSection({
    videoTracks, audioTracks, graphicsTracks,
    selectedCameraTrackIds, selectedAudioTrackIds,
    cameraSubjectSelections, cameraShotSelections,
    graphicsEnabled, graphicsTitle,
    inheritedSubjects,
    shotTypes, formatShotLabel, getTrackEquipmentLabel,
    onSetDirty, onCameraTrackToggle, onAudioTrackToggle,
    onSubjectChange, onShotChange, onGraphicsToggle, onGraphicsTitleChange,
}: MomentRecordingSetupSectionProps) {
    return (
        <Stack spacing={2}>
            <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700 }}>
                Recording Setup
            </Typography>
            <Stack spacing={2}>
                {/* ─── Video Tracks ─── */}
                <Box>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                        Video Tracks
                    </Typography>
                    {videoTracks.length === 0 ? (
                        <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>No video tracks available.</Typography>
                    ) : (
                        <FormGroup>
                            {videoTracks.map(track => (
                                <Box
                                    key={`moment-video-${track.id}`}
                                    sx={{ display: "grid", gridTemplateColumns: "auto 180px 1fr", gap: 1, alignItems: "center", mb: 1 }}
                                >
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={selectedCameraTrackIds.includes(track.id)}
                                                onChange={() => { onSetDirty(); onCameraTrackToggle(track.id); }}
                                                sx={{ color: "rgba(255,255,255,0.5)", "&.Mui-checked": { color: "#7B61FF" } }}
                                            />
                                        }
                                        label={
                                            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                                                <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>{track.name}</Typography>
                                                {getTrackEquipmentLabel(track.name, track.track_type) && (
                                                    <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                                                        {getTrackEquipmentLabel(track.name, track.track_type)}
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                    />
                                    <FormControl size="small" fullWidth>
                                        <InputLabel shrink sx={{ color: "rgba(255,255,255,0.5)" }}>Shot size</InputLabel>
                                        <Select
                                            label="Shot size"
                                            value={cameraShotSelections[track.id] || ""}
                                            onChange={(e) => { onSetDirty(); onShotChange(track.id, e.target.value as ShotType | ""); }}
                                            displayEmpty
                                            renderValue={(selected) => selected ? formatShotLabel(selected as string) : "Shot size"}
                                            disabled={!selectedCameraTrackIds.includes(track.id)}
                                            sx={{ color: "white" }}
                                        >
                                            <MenuItem value=""><em>Not set</em></MenuItem>
                                            {shotTypes.map((type) => (
                                                <MenuItem key={`shot-${track.id}-${type}`} value={type}>{formatShotLabel(type)}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <FormControl size="small" fullWidth>
                                        <InputLabel shrink sx={{ color: "rgba(255,255,255,0.5)" }}>Subjects</InputLabel>
                                        <Select
                                            multiple
                                            label="Subjects"
                                            value={cameraSubjectSelections[track.id] || []}
                                            onChange={(e) => { onSetDirty(); onSubjectChange(track.id, e.target.value as number[]); }}
                                            renderValue={(selected) => {
                                                const names = (selected as number[]).map(id => inheritedSubjects.find(s => s.id === id)?.name).filter(Boolean);
                                                return names.length ? names.join(", ") : "Subjects";
                                            }}
                                            disabled={!selectedCameraTrackIds.includes(track.id) || inheritedSubjects.length === 0}
                                            sx={{ color: "white" }}
                                        >
                                            {inheritedSubjects.map(s => (
                                                <MenuItem key={`moment-subject-${track.id}-${s.id}`} value={s.id}>
                                                    <Checkbox checked={(cameraSubjectSelections[track.id] || []).includes(s.id)} />
                                                    <ListItemText primary={s.name} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            ))}
                        </FormGroup>
                    )}
                </Box>

                {/* ─── Audio Tracks ─── */}
                <Box>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                        Audio Tracks
                    </Typography>
                    {audioTracks.length === 0 ? (
                        <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>No audio tracks available.</Typography>
                    ) : (
                        <FormGroup>
                            {audioTracks.map(track => (
                                <Box
                                    key={`moment-audio-${track.id}`}
                                    sx={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 1, alignItems: "center", mb: 1 }}
                                >
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={selectedAudioTrackIds.includes(track.id)}
                                                onChange={() => { onSetDirty(); onAudioTrackToggle(track.id); }}
                                                sx={{ color: "rgba(255,255,255,0.5)", "&.Mui-checked": { color: "#7B61FF" } }}
                                            />
                                        }
                                        label={
                                            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                                                <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>{track.name}</Typography>
                                                {getTrackEquipmentLabel(track.name, track.track_type) && (
                                                    <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                                                        {getTrackEquipmentLabel(track.name, track.track_type)}
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                    />
                                    <FormControl size="small" fullWidth>
                                        <InputLabel shrink sx={{ color: "rgba(255,255,255,0.5)" }}>Subjects</InputLabel>
                                        <Select
                                            multiple
                                            label="Subjects"
                                            value={cameraSubjectSelections[track.id] || []}
                                            onChange={(e) => { onSetDirty(); onSubjectChange(track.id, e.target.value as number[]); }}
                                            renderValue={(selected) => {
                                                const names = (selected as number[]).map(id => inheritedSubjects.find(s => s.id === id)?.name).filter(Boolean);
                                                return names.length ? names.join(", ") : "Subjects";
                                            }}
                                            disabled={!selectedAudioTrackIds.includes(track.id) || inheritedSubjects.length === 0}
                                            sx={{ color: "white" }}
                                        >
                                            {inheritedSubjects.map(s => (
                                                <MenuItem key={`moment-audio-subject-${track.id}-${s.id}`} value={s.id}>
                                                    <Checkbox checked={(cameraSubjectSelections[track.id] || []).includes(s.id)} />
                                                    <ListItemText primary={s.name} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            ))}
                        </FormGroup>
                    )}
                </Box>

                {/* ─── Graphics ─── */}
                <Box>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                        Graphics
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Switch
                            checked={graphicsEnabled}
                            onChange={(e) => { onSetDirty(); onGraphicsToggle(e.target.checked); }}
                            sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#7B61FF" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#7B61FF" } }}
                        />
                        <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>Enable graphics overlays</Typography>
                        {graphicsTracks.length === 0 && (
                            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>(No graphics track configured)</Typography>
                        )}
                    </Stack>
                    {graphicsEnabled && (
                        <TextField
                            size="small"
                            label="Graphics title"
                            value={graphicsTitle}
                            onChange={(e) => { onSetDirty(); onGraphicsTitleChange(e.target.value); }}
                            placeholder="Lower third, title card, logo, etc."
                            fullWidth
                            sx={{ mt: 1 }}
                            InputLabelProps={{ sx: { color: "rgba(255,255,255,0.5)" } }}
                            InputProps={{ sx: { color: "white" } }}
                        />
                    )}
                </Box>
            </Stack>
        </Stack>
    );
}
