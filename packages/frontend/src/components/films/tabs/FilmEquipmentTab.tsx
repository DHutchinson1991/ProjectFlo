/**
 * Film Equipment Tab - Equipment configuration for film timeline
 * When linked to a package, shows package-inherited equipment (read-only).
 * Otherwise, shows the editable FilmEquipmentPanel.
 */
import React, { useEffect, useState } from "react";
import { Box, Typography, Stack, CircularProgress } from "@mui/material";
import { Videocam, Mic, LinkRounded } from "@mui/icons-material";
import { FilmEquipmentPanel } from "@/components/films";
import { api } from "@/lib/api";

interface FilmEquipmentTabProps {
    filmId: number;
    packageId?: number | null;
    onEquipmentChange?: (summary?: any) => void;
    onEquipmentAssignmentsChange?: (assignments: any) => void;
}

export const FilmEquipmentTab: React.FC<FilmEquipmentTabProps> = ({
    filmId,
    packageId,
    onEquipmentChange,
    onEquipmentAssignmentsChange,
}) => {
    // If linked to a package, show read-only equipment inherited from package operators
    if (packageId) {
        return (
            <PackageEquipmentView packageId={packageId} filmId={filmId} />
        );
    }

    return (
        <FilmEquipmentPanel
            filmId={filmId}
            onEquipmentChange={onEquipmentChange}
            onEquipmentAssignmentsChange={onEquipmentAssignmentsChange}
        />
    );
};

/**
 * Derive camera and audio counts from package operators.
 * Cameras = number of unique camera equipment items across all operators (one track per camera).
 * Audio = number of unique audio devices across all operators.
 */
function countPackageEquipment(operators: any[]): { cameras: number; audio: number; cameraOperators: { name: string; equipment: any }[]; audioItems: any[] } {
    const audioMap = new Map<number, any>();
    const cameraOps: { name: string; equipment: any }[] = [];
    const seenCameraIds = new Set<number>();

    (operators || []).forEach((op: any) => {
        const equipment = op.equipment?.length > 0
            ? op.equipment
            : [];
        const opName = op.position_name || op.name || 'Crew';

        equipment.forEach((eq: any) => {
            const cat = (eq.equipment?.category || '').toUpperCase();
            const eqId = eq.equipment_id ?? eq.equipment?.id;
            if (cat === 'CAMERA' && eqId && !seenCameraIds.has(eqId)) {
                seenCameraIds.add(eqId);
                cameraOps.push({
                    name: opName,
                    equipment: eq.equipment,
                });
            } else if (cat === 'AUDIO' && eqId) {
                audioMap.set(eqId, eq.equipment);
            }
        });
    });

    return {
        cameras: cameraOps.length,
        audio: audioMap.size,
        cameraOperators: cameraOps,
        audioItems: Array.from(audioMap.values()),
    };
}

/** Deduplicate operators by contributor_id, merging equipment across days */
function deduplicateOperators(operators: any[]): any[] {
    const map = new Map<number, any>();
    operators.forEach((op: any) => {
        const crewId = op.contributor_id;
        if (!crewId) { map.set(op.id, op); return; }
        if (!map.has(crewId)) {
            map.set(crewId, { ...op });
        }
        // equipment is already on the slot – no merge needed since it's the same crew member
    });
    return Array.from(map.values());
}

/** Read-only view showing equipment inherited from the package's operators */
function PackageEquipmentView({ packageId, filmId }: { packageId: number; filmId: number }) {
    const [operators, setOperators] = useState<any[]>([]);
    const [tracks, setTracks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        Promise.all([
            api.operators.packageDay.getAll(packageId),
            api.films.tracks.getAll(filmId),
        ]).then(([ops, trks]) => {
            if (!mounted) return;
            setOperators(ops || []);
            setTracks(trks || []);
        }).catch(() => {}).finally(() => {
            if (mounted) setLoading(false);
        });
        return () => { mounted = false; };
    }, [packageId, filmId]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} sx={{ color: 'rgba(255,255,255,0.4)' }} />
            </Box>
        );
    }

    const uniqueOps = deduplicateOperators(operators);
    const { cameras: pkgCameras, audio: pkgAudio, cameraOperators, audioItems } = countPackageEquipment(operators);
    const trackCameras = tracks.filter((t: any) => t.type === 'VIDEO').length;
    const trackAudio = tracks.filter((t: any) => t.type === 'AUDIO').length;

    return (
        <Box sx={{ px: 2, py: 1.5 }}>
            {/* Header */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
                bgcolor: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderLeft: '3px solid rgba(99,102,241,0.6)',
                borderRadius: 1,
                px: 1.5,
                py: 1,
            }}>
                <LinkRounded sx={{ fontSize: 16, color: 'rgba(99,102,241,0.7)' }} />
                <Box>
                    <Typography sx={{ fontSize: 11, color: 'rgba(99,102,241,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Inherited from Package
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                        Equipment is managed at the package level via operators.
                    </Typography>
                </Box>
            </Box>

            {/* Track summary derived from package equipment */}
            <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', mb: 1 }}>
                Timeline Tracks
            </Typography>
            <Stack spacing={0.75} sx={{ mb: 2 }}>
                <Box sx={{ px: 1.5, py: 0.75, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: cameraOperators.length > 0 ? 0.5 : 0 }}>
                        <Videocam sx={{ fontSize: 15, color: 'rgba(59,130,246,0.7)' }} />
                        <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', flex: 1 }}>
                            {pkgCameras} Camera{pkgCameras !== 1 && 's'}
                        </Typography>
                    </Box>
                    {cameraOperators.map((cam: any, idx: number) => (
                        <Box key={idx} sx={{ pl: 3.5, mb: 0.25 }}>
                            <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
                                {cam.equipment?.item_name || 'Camera'}{cam.equipment?.model ? ` · ${cam.equipment.model}` : ''}
                            </Typography>
                            <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                                {cam.name}
                            </Typography>
                        </Box>
                    ))}
                </Box>
                <Box sx={{ px: 1.5, py: 0.75, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: audioItems.length > 0 ? 0.5 : 0 }}>
                        <Mic sx={{ fontSize: 15, color: 'rgba(34,197,94,0.7)' }} />
                        <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', flex: 1 }}>
                            {pkgAudio} Audio
                        </Typography>
                    </Box>
                    {audioItems.map((aud: any) => (
                        <Typography key={aud.id} sx={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', pl: 3.5, fontWeight: 500 }}>
                            {aud.item_name}{aud.model ? ` · ${aud.model}` : ''}
                        </Typography>
                    ))}
                </Box>
            </Stack>

            {/* Deduplicated operators */}
            <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', mb: 1 }}>
                Package Operators
            </Typography>
            {uniqueOps.length === 0 ? (
                <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                    No operators assigned to this package yet.
                </Typography>
            ) : (
                <Stack spacing={0.75}>
                    {uniqueOps.map((op: any) => {
                        const name = op.position_name || op.name || 'Crew';
                        const role = op.job_role?.display_name || op.job_role?.name;
                        const color = op.position_color || op.contributor?.crew_color;
                        const equipment = op.equipment?.length > 0
                            ? op.equipment
                            : [];
                        return (
                            <Box key={op.id} sx={{
                                bgcolor: 'rgba(236,72,153,0.06)',
                                border: '1px solid rgba(236,72,153,0.12)',
                                borderRadius: 1,
                                px: 1.5,
                                py: 0.75,
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: equipment.length > 0 ? 0.5 : 0 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color || 'rgba(236,72,153,0.5)', flexShrink: 0 }} />
                                    <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500, flex: 1 }}>
                                        {name}
                                    </Typography>
                                    {role && (
                                        <Box sx={{ bgcolor: 'rgba(236,72,153,0.15)', color: '#f9a8d4', px: 0.75, py: 0.15, borderRadius: 0.5, fontSize: '0.65rem', fontWeight: 600 }}>
                                            {role}
                                        </Box>
                                    )}
                                </Box>
                                {equipment.length > 0 && (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, pl: 2 }}>
                                        {equipment.map((eq: any, idx: number) => (
                                            <Typography key={idx} sx={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                                                {eq.equipment?.item_name || eq.name || 'Equipment'}
                                                {eq.equipment?.model && ` · ${eq.equipment.model}`}
                                            </Typography>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Stack>
            )}
        </Box>
    );
}
