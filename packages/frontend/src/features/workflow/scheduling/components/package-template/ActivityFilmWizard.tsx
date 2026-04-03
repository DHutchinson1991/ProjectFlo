'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Button,
    Box,
    TextField,
    Checkbox,
    CircularProgress,
    Stack,
    Chip,
    Alert,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MovieIcon from '@mui/icons-material/Movie';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { servicePackagesApi } from '@/features/catalog/packages/api';
import { instanceFilmsApi } from '@/features/content/films/api/instance-films.api';
import { filmsApi } from '@/features/content/films/api';
import { momentsApi } from '@/features/content/moments/api';
import { crewSlotsApi, scheduleApi } from '@/features/workflow/scheduling/api';
import { useBrand } from '@/features/platform/brand';

// ─── Types ───────────────────────────────────────────────────────────

interface PackageActivityRecord {
    id: number;
    name: string;
    start_time?: string | null;
    end_time?: string | null;
    duration_minutes?: number | null;
    package_event_day_id: number;
    moments?: Array<{ id: number; name: string; duration_seconds?: number }>;
    package_event_day?: { event_day?: { name?: string } };
}

interface CreatedFilmResult {
    filmId: number;
    filmName: string;
    packageFilmId: number;
    scenesCreated: number;
    momentsPopulated: number;
    /** IDs of the activities this film was created from */
    activityIds: number[];
}

/** Owner descriptor for instance mode (project or inquiry). */
interface InstanceOwner {
    type: 'project' | 'inquiry';
    id: number;
}

interface ActivityFilmWizardProps {
    open: boolean;
    onClose: () => void;
    /** Package ID — required for package mode, null/undefined in instance mode. */
    packageId: number | null;
    activities: PackageActivityRecord[];
    packageName?: string;
    onFilmCreated: (result: CreatedFilmResult) => void;
    /** When provided, the wizard operates in instance mode. */
    instanceOwner?: InstanceOwner;
    /** Pre-loaded crew slot records for equipment counting in instance mode. */
    externalCrewSlots?: any[];
}

// ─── Component ───────────────────────────────────────────────────────

export function ActivityFilmWizard({
    open,
    onClose,
    packageId,
    activities,
    packageName,
    onFilmCreated,
    instanceOwner,
    externalCrewSlots,
}: ActivityFilmWizardProps) {
    const { currentBrand } = useBrand();

    // State
    const [filmName, setFilmName] = useState('');
    const [selectedActivityIds, setSelectedActivityIds] = useState<Set<number>>(new Set());
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<CreatedFilmResult | null>(null);

    // ─── Derived ─────────────────────────────────────────────────────

    const sortedActivities = [...activities].sort((a, b) => {
        // Sort by event day, then by start time, then by name
        if (a.package_event_day_id !== b.package_event_day_id) {
            return a.package_event_day_id - b.package_event_day_id;
        }
        if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
        return a.name.localeCompare(b.name);
    });

    const allSelected = selectedActivityIds.size === activities.length && activities.length > 0;
    const someSelected = selectedActivityIds.size > 0;

    const totalMoments = activities
        .filter(a => selectedActivityIds.has(a.id))
        .reduce((sum, a) => sum + (a.moments?.length || 0), 0);

    // ─── Handlers ────────────────────────────────────────────────────

    const handleToggleActivity = (activityId: number) => {
        setSelectedActivityIds(prev => {
            const next = new Set(prev);
            if (next.has(activityId)) {
                next.delete(activityId);
            } else {
                next.add(activityId);
            }
            return next;
        });
    };

    const handleToggleAll = () => {
        if (allSelected) {
            setSelectedActivityIds(new Set());
        } else {
            setSelectedActivityIds(new Set(activities.map(a => a.id)));
        }
    };

    const handleCreate = async () => {
        if (!currentBrand?.id || selectedActivityIds.size === 0) return;

        setIsCreating(true);
        setError(null);

        try {
            const name = filmName.trim() || `${packageName || 'Package'} Film`;

            // Count cameras + audio so the film is created with correct track counts.
            let numCameras = 0;
            let numAudio = 0;
            try {
                const seenCameraIds = new Set<number>();
                const seenAudioIds = new Set<number>();

                // Get crew slots — from props (instance mode) or API (package mode)
                const crewSlots = externalCrewSlots ?? (packageId ? await crewSlotsApi.packageDay.getAll(packageId) : []);

                // 1. Count cameras and audio assigned to crew slots
                (crewSlots || []).forEach((op: any) => {
                    (op.equipment || []).forEach((eq: any) => {
                        const cat = (eq.equipment?.category || '').toUpperCase();
                        const eqId = eq.equipment_id ?? eq.equipment?.id;
                        if (cat === 'CAMERA' && eqId && !seenCameraIds.has(eqId)) {
                            seenCameraIds.add(eqId);
                            numCameras++;
                        } else if (cat === 'AUDIO' && eqId && !seenAudioIds.has(eqId)) {
                            seenAudioIds.add(eqId);
                            numAudio++;
                        }
                    });
                });

                // 2. Count unmanned cameras/audio from day_equipment (package mode only)
                if (packageId) {
                    try {
                        const pkgData = await servicePackagesApi.getById(packageId);
                        const dayEquipMap = (pkgData?.contents as any)?.day_equipment || {};
                        Object.values(dayEquipMap).forEach((items: any) => {
                            (items || []).forEach((item: any) => {
                                const eqId = item.equipment_id;
                                if (item.slot_type === 'CAMERA' && eqId && !seenCameraIds.has(eqId)) {
                                    seenCameraIds.add(eqId);
                                    numCameras++;
                                } else if (item.slot_type === 'AUDIO' && eqId && !seenAudioIds.has(eqId)) {
                                    seenAudioIds.add(eqId);
                                    numAudio++;
                                }
                            });
                        });
                    } catch { /* skip day_equipment count */ }
                }
            } catch (err) {
                console.warn('Could not count equipment:', err);
            }

            // 1. Create the film with correct camera + audio count
            const newFilm = await filmsApi.films.create({
                name,
                brand_id: currentBrand.id,
                num_cameras: numCameras,
                num_audio: numAudio,
            } as any);

            // 2. Create a film record linking film to owner (package or instance)
            let ownerFilmId: number;
            if (instanceOwner) {
                const linkApi = instanceOwner.type === 'project'
                    ? scheduleApi.projectFilms
                    : scheduleApi.inquiryFilms;
                const linked = await linkApi.create(instanceOwner.id, {
                    film_id: newFilm.id,
                    order_index: 0,
                });
                ownerFilmId = (linked as { id: number }).id;
            } else {
                const packageFilm = await scheduleApi.packageFilms.create(packageId!, {
                    film_id: newFilm.id,
                    order_index: 0,
                });
                ownerFilmId = (packageFilm as { id: number }).id;
            }

            // 3. Create a scene for each selected activity and link them
            const selectedActivities = sortedActivities.filter(a => selectedActivityIds.has(a.id));
            let totalMomentsPopulated = 0;

            // Inquiry and project instance films use the same underlying instance-film scene schedule routes.
            const upsertScene = instanceOwner
                ? (instanceOwner.type === 'project'
                    ? scheduleApi.projectFilms.upsertSceneSchedule
                    : scheduleApi.inquiryFilms.upsertSceneSchedule)
                : scheduleApi.packageFilms.upsertSceneSchedule;
            const shouldCreateMomentsManually = Boolean(instanceOwner);

            // Activity FK field name differs between package and instance
            const activityFkField = instanceOwner ? 'project_activity_id' : 'package_activity_id';

            for (let i = 0; i < selectedActivities.length; i++) {
                const activity = selectedActivities[i];

                // Create scene in the film
                const scene = await filmsApi.localScenes.create(newFilm.id, {
                    name: activity.name,
                    order_index: i,
                    mode: 'MOMENTS',
                    duration_seconds: activity.duration_minutes ? activity.duration_minutes * 60 : undefined,
                });

                // Link scene to activity via scene schedule
                await upsertScene(ownerFilmId, {
                    scene_id: scene.id,
                    [activityFkField]: activity.id,
                    order_index: i,
                    scheduled_start_time: activity.start_time || undefined,
                    scheduled_duration_minutes: activity.duration_minutes || undefined,
                });

                if (shouldCreateMomentsManually) {
                    for (const [momentIndex, moment] of (activity.moments || []).entries()) {
                        await momentsApi.create(scene.id, {
                            name: moment.name,
                            duration: moment.duration_seconds || 60,
                            order_index: momentIndex,
                        });
                    }
                }

                totalMomentsPopulated += activity.moments?.length || 0;
            }

            if (instanceOwner) {
                await instanceFilmsApi.cloneFromLibrary(ownerFilmId);
            }

            const createdResult: CreatedFilmResult = {
                filmId: newFilm.id,
                filmName: name,
                packageFilmId: ownerFilmId,
                scenesCreated: selectedActivities.length,
                momentsPopulated: totalMomentsPopulated,
                activityIds: selectedActivities.map(a => a.id),
            };

            setResult(createdResult);
            onFilmCreated(createdResult);
        } catch (err) {
            console.error('Failed to create film from activities:', err);
            setError(err instanceof Error ? err.message : 'Failed to create film. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        // Reset state
        setFilmName('');
        setSelectedActivityIds(new Set());
        setError(null);
        setResult(null);
        setIsCreating(false);
        onClose();
    };

    // ─── Render ──────────────────────────────────────────────────────

    return (
        <Dialog
            open={open}
            onClose={isCreating ? undefined : handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    background: 'rgba(16, 18, 22, 0.95)',
                    border: '1px solid rgba(52, 58, 68, 0.4)',
                    borderRadius: 3,
                    backdropFilter: 'blur(20px)',
                },
            }}
        >
            <DialogTitle sx={{ pb: 1 }} component="div">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesomeIcon sx={{ fontSize: 20, color: '#a78bfa' }} />
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
                            Create Film from Activities
                        </Typography>
                        <Typography variant="caption" component="span" sx={{ color: '#64748b', display: 'block' }}>
                            Select activities to create scenes with auto-populated moments
                        </Typography>
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ pb: 1 }}>
                {/* ─── Success State ─── */}
                {result && (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <CheckCircleIcon sx={{ fontSize: 48, color: '#10b981', mb: 1.5 }} />
                        <Typography variant="h6" sx={{ color: '#f1f5f9', fontWeight: 700, mb: 0.5 }}>
                            Film Created!
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                            &ldquo;{result.filmName}&rdquo;
                        </Typography>
                        <Stack direction="row" spacing={1.5} justifyContent="center">
                            <Chip
                                icon={<MovieIcon sx={{ fontSize: '14px !important' }} />}
                                label={`${result.scenesCreated} scene${result.scenesCreated !== 1 ? 's' : ''}`}
                                size="small"
                                sx={{ bgcolor: 'rgba(100, 140, 255, 0.12)', color: '#648CFF', fontWeight: 600, fontSize: '0.75rem' }}
                            />
                            <Chip
                                label={`${result.momentsPopulated} moment${result.momentsPopulated !== 1 ? 's' : ''}`}
                                size="small"
                                sx={{ bgcolor: 'rgba(167, 139, 250, 0.12)', color: '#a78bfa', fontWeight: 600, fontSize: '0.75rem' }}
                            />
                        </Stack>
                    </Box>
                )}

                {/* ─── Creation Form ─── */}
                {!result && (
                    <Stack spacing={2.5}>
                        {/* Error */}
                        {error && (
                            <Alert severity="error" sx={{ bgcolor: 'rgba(239, 68, 68, 0.08)', color: '#fca5a5' }}>
                                {error}
                            </Alert>
                        )}

                        {/* Film Name */}
                        <Box>
                            <Typography
                                variant="caption"
                                sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem', mb: 0.5, display: 'block' }}
                            >
                                Film Name
                            </Typography>
                            <TextField
                                size="small"
                                fullWidth
                                autoFocus
                                value={filmName}
                                onChange={(e) => setFilmName(e.target.value)}
                                placeholder={`${packageName || 'Package'} Film`}
                                disabled={isCreating}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: 'rgba(255,255,255,0.03)',
                                        '& fieldset': { borderColor: 'rgba(52, 58, 68, 0.4)' },
                                        '&:hover fieldset': { borderColor: 'rgba(100, 140, 255, 0.3)' },
                                        '&.Mui-focused fieldset': { borderColor: '#648CFF' },
                                    },
                                    '& .MuiInputBase-input': { color: '#f1f5f9', fontSize: '0.85rem' },
                                    '& .MuiInputBase-input::placeholder': { color: '#475569' },
                                }}
                            />
                        </Box>

                        {/* Activity Selection */}
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography
                                    variant="caption"
                                    sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}
                                >
                                    Select Activities
                                </Typography>
                                <Button
                                    size="small"
                                    onClick={handleToggleAll}
                                    disabled={isCreating || activities.length === 0}
                                    sx={{ color: '#648CFF', textTransform: 'none', fontSize: '0.7rem', fontWeight: 600, minWidth: 0, px: 1 }}
                                >
                                    {allSelected ? 'Deselect All' : 'Select All'}
                                </Button>
                            </Box>

                            {activities.length === 0 ? (
                                <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px dashed rgba(52, 58, 68, 0.4)' }}>
                                    <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem' }}>
                                        No activities found. Add activities to the schedule first.
                                    </Typography>
                                </Box>
                            ) : (
                                <Stack spacing={0.5} sx={{ maxHeight: 320, overflowY: 'auto', pr: 0.5 }}>
                                    {sortedActivities.map((activity) => {
                                        const isSelected = selectedActivityIds.has(activity.id);
                                        const momentCount = activity.moments?.length || 0;
                                        return (
                                            <Box
                                                key={activity.id}
                                                onClick={() => !isCreating && handleToggleActivity(activity.id)}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    p: 1,
                                                    borderRadius: 1.5,
                                                    cursor: isCreating ? 'default' : 'pointer',
                                                    bgcolor: isSelected ? 'rgba(100, 140, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                                                    border: `1px solid ${isSelected ? 'rgba(100, 140, 255, 0.25)' : 'rgba(52, 58, 68, 0.2)'}`,
                                                    transition: 'all 0.15s ease',
                                                    opacity: isCreating ? 0.6 : 1,
                                                    '&:hover': {
                                                        bgcolor: isCreating
                                                            ? undefined
                                                            : isSelected
                                                                ? 'rgba(100, 140, 255, 0.12)'
                                                                : 'rgba(255,255,255,0.04)',
                                                    },
                                                }}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    disabled={isCreating}
                                                    size="small"
                                                    sx={{
                                                        p: 0.25,
                                                        color: 'rgba(100, 116, 139, 0.5)',
                                                        '&.Mui-checked': { color: '#648CFF' },
                                                    }}
                                                />
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 600,
                                                            fontSize: '0.82rem',
                                                            color: isSelected ? '#f1f5f9' : '#94a3b8',
                                                            lineHeight: 1.3,
                                                        }}
                                                    >
                                                        {activity.name}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                                                        {activity.start_time && (
                                                            <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                                                <AccessTimeIcon sx={{ fontSize: 10 }} />
                                                                {activity.start_time}{activity.end_time ? `–${activity.end_time}` : ''}
                                                            </Typography>
                                                        )}
                                                        {momentCount > 0 && (
                                                            <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.68rem' }}>
                                                                {momentCount} moment{momentCount !== 1 ? 's' : ''}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Box>

                        {/* Summary */}
                        {someSelected && (
                            <Box sx={{
                                p: 1.5, borderRadius: 2,
                                bgcolor: 'rgba(100, 140, 255, 0.06)',
                                border: '1px solid rgba(100, 140, 255, 0.15)',
                            }}>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                                    Will create <strong style={{ color: '#f1f5f9' }}>{selectedActivityIds.size}</strong> scene{selectedActivityIds.size !== 1 ? 's' : ''}
                                    {totalMoments > 0 && (
                                        <> with <strong style={{ color: '#f1f5f9' }}>{totalMoments}</strong> moment{totalMoments !== 1 ? 's' : ''} auto-populated</>
                                    )}
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
                {result ? (
                    <Button
                        variant="contained"
                        onClick={handleClose}
                        sx={{ bgcolor: '#648CFF', '&:hover': { bgcolor: '#5A7BF0' }, borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3 }}
                    >
                        Done
                    </Button>
                ) : (
                    <>
                        <Button
                            onClick={handleClose}
                            disabled={isCreating}
                            sx={{ color: '#64748b', textTransform: 'none' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleCreate}
                            disabled={selectedActivityIds.size === 0 || isCreating}
                            startIcon={isCreating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon sx={{ fontSize: 16 }} />}
                            sx={{
                                bgcolor: '#a78bfa',
                                '&:hover': { bgcolor: '#8b5cf6' },
                                '&.Mui-disabled': { bgcolor: 'rgba(167, 139, 250, 0.2)', color: 'rgba(255,255,255,0.3)' },
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 700,
                                px: 3,
                            }}
                        >
                            {isCreating ? 'Creating...' : 'Create Film'}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
}
