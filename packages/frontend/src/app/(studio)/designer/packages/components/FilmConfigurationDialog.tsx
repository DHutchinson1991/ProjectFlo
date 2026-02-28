import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Tabs,
    Tab,
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    CircularProgress,
    Alert
} from "@mui/material";
import ContentBuilder from "../../components/ContentBuilder";
import { FilmSchedulePanel } from '@/components/films';
import { TimelineScene } from '@/lib/types/timeline';

// Types matching the backend/frontend common interfaces
interface FilmLocalSceneMediaComponent {
    id: number;
    film_local_scene_id: number;
    media_type: "VIDEO" | "AUDIO" | "MUSIC";
    duration_seconds: number;
    is_primary: boolean;
    music_type?: string;
    notes?: string;
}

interface FilmLocalScene {
    id: number;
    film_id: number;
    original_scene_id?: number;
    name: string;
    description?: string;
    media_components: FilmLocalSceneMediaComponent[];
}

interface SceneOverride {
    original_scene_id: number;
    operator_count?: number;
    notes?: string;
    // We can store other overrides here
}

interface FilmConfigurationDialogProps {
    open: boolean;
    onClose: () => void;
    filmId: number;
    filmName: string;
    brandId?: number;
    /** PackageFilm join table ID for schedule mode */
    packageFilmId?: number | null;
    /** Package ID for event day filtering */
    packageId?: number | null;
    initialConfig: {
        operator_count?: number; // Global override?
        scenes?: TimelineScene[]; // Structure override
        scene_overrides?: Record<number, SceneOverride>; // Per-scene config
    };
    onSave: (config: any) => void;
}

export default function FilmConfigurationDialog({
    open,
    onClose,
    filmId,
    filmName,
    brandId,
    packageFilmId,
    packageId,
    initialConfig,
    onSave,
}: FilmConfigurationDialogProps) {
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State for the film structure (Timeline Scenes)
    const [timelineScenes, setTimelineScenes] = useState<TimelineScene[]>([]);
    
    // State for resource overrides (mapped by original_scene_id for now, or track ID)
    // Using track ID/Timeline ID is safer if scenes are duplicated, but for now let's assume 1:1 map to original ID for "Resource" config
    // Actually, distinct timeline items might need distinct configs. 
    // timelinesScenes[i].id is the component ID.
    const [sceneOverrides, setSceneOverrides] = useState<Record<string, SceneOverride>>({});

    // V2 Film scenes for schedule panel (from Film model, not legacy timeline scenes)
    const [v2Scenes, setV2Scenes] = useState<any[]>([]);

    useEffect(() => {
        if (open && filmId) {
            loadFilmData();
        }
    }, [open, filmId]);

    const loadFilmData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Load v2 Film scenes for the schedule panel
            try {
                const filmData = await fetch(`http://localhost:3002/films/${filmId}`);
                if (filmData.ok) {
                    const film = await filmData.json();
                    setV2Scenes(film.scenes || []);
                }
            } catch {
                // v2 scenes are optional for the schedule tab
            }

            // If we have saved structure in initialConfig, use it
            if (initialConfig.scenes && initialConfig.scenes.length > 0) {
                setTimelineScenes(initialConfig.scenes);
                setSceneOverrides(initialConfig.scene_overrides || {});
                setLoading(false);
                return;
            }

            // Otherwise fetch from Master Link
            const response = await fetch(`http://localhost:3002/films/${filmId}/scenes`);
            if (!response.ok) throw new Error("Failed to fetch film scenes");
            
            const filmWithScenes = await response.json();
            const localScenes = filmWithScenes.local_scenes || [];

            // Convert to Timeline Scenes (Logic adapted from FilmDetailPage)
            const scenes: TimelineScene[] = localScenes.flatMap((localScene: FilmLocalScene) =>
                localScene.media_components.map((component: FilmLocalSceneMediaComponent) => ({
                    id: component.id, // This is the component ID
                    name: `${localScene.name}`, // Simplified name
                    start_time: 0, // Should be calculated or ordered
                    duration: component.duration_seconds,
                    track_id: component.media_type === "VIDEO" ? 1 : 2, // Simple mapping
                    scene_type: component.media_type.toLowerCase() as any,
                    color: component.media_type === "VIDEO" ? "#2196f3" : "#4caf50",
                    original_scene_id: localScene.original_scene_id,
                    // Store the local scene ID to link back to resources if needed
                    description: localScene.description
                }))
            );

            // Re-map overrides if they exist based on ID?
            // If starting fresh, IDs match.
            setTimelineScenes(scenes);
            setSceneOverrides(initialConfig.scene_overrides || {});

        } catch (err) {
            console.error(err);
            setError("Failed to load film data.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        onSave({
            scenes: timelineScenes, // Save the structural changes
            scene_overrides: sceneOverrides, // Save the resource configs
        });
        onClose();
    };

    const handleOverrideChange = (sceneId: string | number, field: keyof SceneOverride, value: any) => {
        setSceneOverrides(prev => ({
            ...prev,
            [sceneId]: {
                ...prev[sceneId],
                original_scene_id: Number(sceneId), // fallback
                [field]: value
            }
        }));
    };

    const renderResourcesTab = () => (
        <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Scene Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell width={150}>Operator Count</TableCell>
                        <TableCell>Notes</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {timelineScenes.map((scene) => (
                        <TableRow key={scene.id}>
                            <TableCell>{scene.name}</TableCell>
                            <TableCell>{scene.scene_type}</TableCell>
                            <TableCell>
                                <TextField
                                    type="number"
                                    size="small"
                                    value={sceneOverrides[scene.id]?.operator_count || 0}
                                    onChange={(e) => handleOverrideChange(scene.id, 'operator_count', parseInt(e.target.value) || 0)}
                                    InputProps={{ inputProps: { min: 0 } }}
                                />
                            </TableCell>
                            <TableCell>
                                <TextField
                                    size="small"
                                    fullWidth
                                    value={sceneOverrides[scene.id]?.notes || ""}
                                    onChange={(e) => handleOverrideChange(scene.id, 'notes', e.target.value)}
                                    placeholder="Specific notes for this package..."
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            PaperProps={{
                sx: { height: '90vh' }
            }}
        >
            <DialogTitle>
                Configure Film: {filmName}
            </DialogTitle>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 3 }}>
                    <Tab label="Structure & Timeline" />
                    <Tab label="Resources & Operators" />
                    <Tab label="Schedule" disabled={!packageFilmId} />
                </Tabs>
            </Box>

            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
                ) : activeTab === 0 ? (
                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                        {/* 
                            ContentBuilder needs to be wrapped or adjusted to fit in dialog 
                            We pass handleSave to it, but we might want to just capture state changes
                            ContentBuilder usually maintains its own state and calls onSave when explicit save is clicked.
                            Here we want to bind it to our state? 
                            The ContentBuilder component has internal state `scenes`. 
                            But it takes `initialScenes`.
                            It calls `onSave` when the Save button in its toolbar is clicked.
                            We can hide its toolbar or use its onSave to update our local state?
                            Actually, simpler: Let's trust ContentBuilder's internal state management 
                            and only update our `timelineScenes` when the user clicks a "Sync" or we just use the onSave prop.
                        */}
                        <ContentBuilder
                            initialScenes={timelineScenes}
                            onSave={async (scenes) => {
                                setTimelineScenes(scenes);
                                // Don't close, just update state
                            }}
                        />
                    </Box>
                ) : activeTab === 1 ? (
                    <Box sx={{ p: 3, overflow: 'auto' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Define specific resource requirements for scenes in this package.
                        </Typography>
                        {renderResourcesTab()}
                    </Box>
                ) : activeTab === 2 && packageFilmId ? (
                    <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 2, pb: 0 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Set schedule overrides for this film within the package.
                                These override film-level defaults but can be further overridden at the project level.
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1, overflow: 'hidden', mx: 2, mb: 2, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}>
                            <FilmSchedulePanel
                                filmId={filmId}
                                scenes={v2Scenes}
                                brandId={brandId}
                                filmName={filmName}
                                mode="package"
                                contextId={packageFilmId}
                                packageId={packageId}
                                showEventDayManager
                            />
                        </Box>
                    </Box>
                ) : null}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" color="primary">
                    Save Configuration
                </Button>
            </DialogActions>
        </Dialog>
    );
}
