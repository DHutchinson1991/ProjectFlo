"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Alert,
    CircularProgress,
    Typography
} from '@mui/material';
import MusicTable from './MusicTable';
import CreateMusicDialog from './CreateMusicDialog';
import AttachMusicToMomentDialog from './AttachMusicToMomentDialog';
import { musicApi, MusicLibraryItem, CreateMusicLibraryItemDto, UpdateMusicLibraryItemDto } from '@/lib/api/music';
import { momentsApi } from '@/lib/api/moments';
import { SceneMoment, MusicType } from '@/lib/types/moments';

interface MusicItem {
    id?: number;
    music_name?: string;
    artist?: string;
    duration?: number;
    music_type: MusicType;
    file_path?: string;
    notes?: string;
    moment_id?: number;
    moment_name?: string;
}

interface Moment {
    id: number;
    name: string;
}

interface MusicManagementProps {
    sceneId: number;
    projectId?: number;
    moments?: Moment[];
    onMusicChange?: (musicItems: MusicItem[]) => void;
}

const MusicManagement: React.FC<MusicManagementProps> = ({
    sceneId,
    projectId,
    moments: sceneMoments = [],
    onMusicChange,
}) => {
    const [musicItems, setMusicItems] = useState<MusicItem[]>([]);
    const [moments, setMoments] = useState<SceneMoment[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dialog states
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [attachDialogOpen, setAttachDialogOpen] = useState(false);
    const [editingMusicItem, setEditingMusicItem] = useState<MusicItem | null>(null);
    const [attachingMusicItem, setAttachingMusicItem] = useState<MusicItem | null>(null);

    const fetchMusicLibrary = async () => {
        try {
            setLoading(true);
            const data = await musicApi.getMusicLibrary(projectId);

            // Convert to our local format and enrich with moment information
            const enrichedMusic: MusicItem[] = await Promise.all(
                data.map(async (item: MusicLibraryItem) => {
                    // Use the moment information returned by the API
                    return {
                        id: item.id,
                        music_name: item.music_name,
                        artist: item.artist,
                        duration: item.duration,
                        music_type: item.music_type,
                        file_path: item.file_path,
                        notes: item.notes,
                        moment_id: item.moment_id,
                        moment_name: item.moment_name,
                        scene_name: item.scene_name,
                    };
                })
            );

            setMusicItems(enrichedMusic);

            if (onMusicChange) {
                onMusicChange(enrichedMusic);
            }

            setError(null);
        } catch (err) {
            console.error('Error fetching music library:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch music library');
        } finally {
            setLoading(false);
        }
    };

    const fetchMoments = async () => {
        try {
            const data = await momentsApi.getSceneMoments(sceneId, projectId);
            setMoments(data);
        } catch (err) {
            console.error('Error fetching moments:', err);
            // Non-critical error, don't set error state
        }
    };

    useEffect(() => {
        fetchMusicLibrary();
        fetchMoments();
    }, [sceneId, projectId]);

    const handleAddMusic = () => {
        setEditingMusicItem(null);
        setCreateDialogOpen(true);
    };

    const handleEditMusic = (item: MusicItem) => {
        setEditingMusicItem(item);
        setCreateDialogOpen(true);
    };

    const handleRemoveMusic = async (item: MusicItem) => {
        if (!item.id) return;

        const confirmMessage = item.moment_name
            ? `Are you sure you want to delete this music track? It will also be removed from "${item.moment_name}".`
            : 'Are you sure you want to delete this music track?';

        if (!confirm(confirmMessage)) return;

        try {
            setSaving(true);

            // If music is attached to a moment, detach it first
            if (item.moment_id) {
                await musicApi.detachMusicFromMoment(item.moment_id);
            }

            // Delete the music library item
            await musicApi.deleteMusicLibraryItem(item.id);
            await fetchMusicLibrary();
            setError(null);
        } catch (err) {
            console.error('Error deleting music item:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete music item');
        } finally {
            setSaving(false);
        }
    };

    const handleDetachFromMoment = async (item: MusicItem) => {
        if (!item.moment_id) return;

        if (!confirm(`Are you sure you want to detach "${item.music_name}" from "${item.moment_name}"?`)) return;

        try {
            setSaving(true);
            await musicApi.detachMusicFromMoment(item.moment_id);
            await fetchMusicLibrary();
            setError(null);
        } catch (err) {
            console.error('Error detaching music from moment:', err);
            setError(err instanceof Error ? err.message : 'Failed to detach music from moment');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveMusic = async (musicData: Omit<MusicItem, 'id'> & { selectedMomentId?: number }) => {
        try {
            setSaving(true);

            const { selectedMomentId, ...musicItemData } = musicData;

            const apiData: CreateMusicLibraryItemDto | UpdateMusicLibraryItemDto = {
                music_name: musicItemData.music_name,
                artist: musicItemData.artist,
                duration: musicItemData.duration,
                music_type: musicItemData.music_type,
                file_path: musicItemData.file_path,
                notes: musicItemData.notes,
                project_id: projectId,
            };

            let musicItemId: number;

            if (editingMusicItem && editingMusicItem.id) {
                await musicApi.updateMusicLibraryItem(editingMusicItem.id, apiData);
                musicItemId = editingMusicItem.id;
            } else {
                const result = await musicApi.createMusicLibraryItem(apiData as CreateMusicLibraryItemDto);
                musicItemId = result.id;
            }

            // If a moment is selected, attach the music to it
            if (selectedMomentId) {
                await musicApi.attachMusicToMoment(selectedMomentId, musicItemId);
            }

            await fetchMusicLibrary();
            setCreateDialogOpen(false);
            setEditingMusicItem(null);
            setError(null);
        } catch (err) {
            console.error('Error saving music item:', err);
            setError(err instanceof Error ? err.message : 'Failed to save music item');
        } finally {
            setSaving(false);
        }
    };

    const handleAttachToMoment = (item: MusicItem) => {
        setAttachingMusicItem(item);
        setAttachDialogOpen(true);
    };

    const handleAttachMusic = async (momentId: number) => {
        if (!attachingMusicItem || !attachingMusicItem.id) return;

        try {
            setSaving(true);
            await musicApi.attachMusicToMoment(momentId, attachingMusicItem.id);
            await fetchMusicLibrary();
            await fetchMoments();
            setAttachDialogOpen(false);
            setAttachingMusicItem(null);
            setError(null);
        } catch (err) {
            console.error('Error attaching music to moment:', err);
            setError(err instanceof Error ? err.message : 'Failed to attach music to moment');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ ml: 2 }}>
                    Loading music library...
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <MusicTable
                musicItems={musicItems}
                onAddMusic={handleAddMusic}
                onEditMusic={handleEditMusic}
                onRemoveMusic={handleRemoveMusic}
                onAttachToMoment={handleAttachToMoment}
                onDetachFromMoment={handleDetachFromMoment}
            />

            <CreateMusicDialog
                open={createDialogOpen}
                onClose={() => {
                    setCreateDialogOpen(false);
                    setEditingMusicItem(null);
                }}
                onSave={handleSaveMusic}
                editingItem={editingMusicItem}
                saving={saving}
                moments={sceneMoments}
            />

            <AttachMusicToMomentDialog
                open={attachDialogOpen}
                onClose={() => {
                    setAttachDialogOpen(false);
                    setAttachingMusicItem(null);
                }}
                onAttach={handleAttachMusic}
                musicItem={attachingMusicItem}
                moments={moments}
                saving={saving}
            />
        </Box>
    );
};

export default MusicManagement;
