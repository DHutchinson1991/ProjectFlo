"use client";

import React, { useReducer, useEffect } from 'react';
import { Box, Alert, CircularProgress, Typography } from '@mui/material';
import MusicTable from './MusicTable';
import CreateMusicDialog from './CreateMusicDialog';
import AttachMusicToMomentDialog from './AttachMusicToMomentDialog';
import { musicApi } from '@/features/content/music/api/music';
import { momentsApi } from '@/features/content/music/api/moments';
import type { CreateMusicLibraryItemDto, MusicLibraryItem, MusicType, UpdateMusicLibraryItemDto } from '@/features/content/music/types';
import type { SceneMoment } from '@/features/content/moments/types/moments-legacy';

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
    scene_name?: string;
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

// ── Reducer ────────────────────────────────────────────────────────────────────

type State = {
    libraryItems: MusicItem[];
    moments: SceneMoment[];
    loading: boolean;
    saving: boolean;
    error: string | null;
    createDialogOpen: boolean;
    attachDialogOpen: boolean;
    editingMusicItem: MusicItem | null;
    attachingMusicItem: MusicItem | null;
};

type Action =
    | { type: 'FETCH_START' }
    | { type: 'FETCH_DONE'; libraryItems: MusicItem[] }
    | { type: 'FETCH_ERROR'; error: string }
    | { type: 'MOMENTS_LOADED'; moments: SceneMoment[] }
    | { type: 'SAVE_START' }
    | { type: 'SAVE_DONE' }
    | { type: 'SAVE_ERROR'; error: string }
    | { type: 'OPEN_CREATE'; item?: MusicItem | null }
    | { type: 'CLOSE_CREATE' }
    | { type: 'OPEN_ATTACH'; item: MusicItem }
    | { type: 'CLOSE_ATTACH' }
    | { type: 'CLEAR_ERROR' };

const initialState: State = {
    libraryItems: [],
    moments: [],
    loading: true,
    saving: false,
    error: null,
    createDialogOpen: false,
    attachDialogOpen: false,
    editingMusicItem: null,
    attachingMusicItem: null,
};

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'FETCH_START':  return { ...state, loading: true };
        case 'FETCH_DONE':   return { ...state, loading: false, libraryItems: action.libraryItems };
        case 'FETCH_ERROR':  return { ...state, loading: false, error: action.error };
        case 'MOMENTS_LOADED': return { ...state, moments: action.moments };
        case 'SAVE_START':   return { ...state, saving: true };
        case 'SAVE_DONE':    return { ...state, saving: false, error: null };
        case 'SAVE_ERROR':   return { ...state, saving: false, error: action.error };
        case 'OPEN_CREATE':  return { ...state, createDialogOpen: true, editingMusicItem: action.item ?? null };
        case 'CLOSE_CREATE': return { ...state, createDialogOpen: false, editingMusicItem: null };
        case 'OPEN_ATTACH':  return { ...state, attachDialogOpen: true, attachingMusicItem: action.item };
        case 'CLOSE_ATTACH': return { ...state, attachDialogOpen: false, attachingMusicItem: null };
        case 'CLEAR_ERROR':  return { ...state, error: null };
        default: return state;
    }
}

// ── Component ──────────────────────────────────────────────────────────────────

const MusicManagement: React.FC<MusicManagementProps> = ({
    sceneId,
    projectId,
    moments: sceneMoments = [],
    onMusicChange,
}) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    const fetchMusicLibrary = async () => {
        dispatch({ type: 'FETCH_START' });
        try {
            const data = await musicApi.getMusicLibrary(projectId, sceneId);
            const enrichedMusic: MusicItem[] = data.map((item: MusicLibraryItem) => ({
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
            }));
            dispatch({ type: 'FETCH_DONE', libraryItems: enrichedMusic });
            const sceneMomentIds = new Set((sceneMoments || []).map(m => m.id));
            const attached = enrichedMusic.filter(item => item.moment_id && sceneMomentIds.has(item.moment_id));
            onMusicChange?.(attached);
        } catch (err) {
            dispatch({ type: 'FETCH_ERROR', error: err instanceof Error ? err.message : 'Failed to fetch music library' });
        }
    };

    const fetchMoments = async () => {
        try {
            const data = await momentsApi.getSceneMoments(sceneId, projectId);
            dispatch({ type: 'MOMENTS_LOADED', moments: data });
        } catch {
            // Non-critical — don't surface error
        }
    };

    useEffect(() => {
        // Fetch once for this scene/project; do not refetch on moment changes to avoid flicker
        fetchMusicLibrary();
        fetchMoments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sceneId, projectId]);

    const handleRemoveMusic = async (item: MusicItem) => {
        if (!item.id) return;
        const confirmMessage = item.moment_name
            ? `Are you sure you want to delete this music track? It will also be removed from "${item.moment_name}".`
            : 'Are you sure you want to delete this music track?';
        if (!confirm(confirmMessage)) return;
        dispatch({ type: 'SAVE_START' });
        try {
            if (item.moment_id) await musicApi.detachMusicFromMoment(item.moment_id);
            await musicApi.deleteMusicLibraryItem(item.id);
            await fetchMusicLibrary();
            dispatch({ type: 'SAVE_DONE' });
        } catch (err) {
            dispatch({ type: 'SAVE_ERROR', error: err instanceof Error ? err.message : 'Failed to delete music item' });
        }
    };

    const handleDetachFromMoment = async (item: MusicItem) => {
        if (!item.moment_id) return;
        if (!confirm(`Are you sure you want to detach "${item.music_name}" from "${item.moment_name}"?`)) return;
        dispatch({ type: 'SAVE_START' });
        try {
            await musicApi.detachMusicFromMoment(item.moment_id);
            await fetchMusicLibrary();
            dispatch({ type: 'SAVE_DONE' });
        } catch (err) {
            dispatch({ type: 'SAVE_ERROR', error: err instanceof Error ? err.message : 'Failed to detach music from moment' });
        }
    };

    const handleSaveMusic = async (musicData: Omit<MusicItem, 'id'> & { selectedMomentId?: number }) => {
        dispatch({ type: 'SAVE_START' });
        try {
            const { selectedMomentId, ...musicItemData } = musicData;
            const apiData: CreateMusicLibraryItemDto | UpdateMusicLibraryItemDto = {
                music_name: musicItemData.music_name,
                artist: musicItemData.artist,
                duration: musicItemData.duration,
                music_type: musicItemData.music_type,
                file_path: musicItemData.file_path,
                notes: musicItemData.notes,
                project_id: projectId,
                scene_id: sceneId,
            };
            let musicItemId: number;
            if (state.editingMusicItem?.id) {
                await musicApi.updateMusicLibraryItem(state.editingMusicItem.id, apiData);
                musicItemId = state.editingMusicItem.id;
            } else {
                const result = await musicApi.createMusicLibraryItem(apiData as CreateMusicLibraryItemDto);
                musicItemId = result.id;
            }
            if (selectedMomentId) await musicApi.attachMusicToMoment(selectedMomentId, musicItemId);
            await fetchMusicLibrary();
            dispatch({ type: 'CLOSE_CREATE' });
            dispatch({ type: 'SAVE_DONE' });
        } catch (err) {
            dispatch({ type: 'SAVE_ERROR', error: err instanceof Error ? err.message : 'Failed to save music item' });
        }
    };

    const handleAttachMusic = async (momentId: number) => {
        if (!state.attachingMusicItem?.id) return;
        dispatch({ type: 'SAVE_START' });
        try {
            await musicApi.attachMusicToMoment(momentId, state.attachingMusicItem.id);
            await fetchMusicLibrary();
            await fetchMoments();
            dispatch({ type: 'CLOSE_ATTACH' });
            dispatch({ type: 'SAVE_DONE' });
        } catch (err) {
            dispatch({ type: 'SAVE_ERROR', error: err instanceof Error ? err.message : 'Failed to attach music to moment' });
        }
    };

    if (state.loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ ml: 2 }}>Loading music library...</Typography>
            </Box>
        );
    }

    const sceneMomentIds = new Set((sceneMoments || []).map(m => m.id));
    const displayItems = state.libraryItems.map(item => ({
        ...item,
        isAttached: !!item.moment_id && sceneMomentIds.has(item.moment_id),
    }));

    return (
        <Box>
            {state.error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch({ type: 'CLEAR_ERROR' })}>
                    {state.error}
                </Alert>
            )}
            <MusicTable
                musicItems={displayItems as any[]}
                title="Music Tracks"
                onAddMusic={() => dispatch({ type: 'OPEN_CREATE' })}
                onEditMusic={(item) => dispatch({ type: 'OPEN_CREATE', item: item as any })}
                onRemoveMusic={(item) => handleRemoveMusic(item as any)}
                onAttachToMoment={(item) => dispatch({ type: 'OPEN_ATTACH', item: item as any })}
                onDetachFromMoment={(item) => handleDetachFromMoment(item as any)}
            />
            <CreateMusicDialog
                open={state.createDialogOpen}
                onClose={() => dispatch({ type: 'CLOSE_CREATE' })}
                onSave={handleSaveMusic}
                editingItem={state.editingMusicItem}
                saving={state.saving}
                moments={sceneMoments}
                projectId={projectId}
            />
            <AttachMusicToMomentDialog
                open={state.attachDialogOpen}
                onClose={() => dispatch({ type: 'CLOSE_ATTACH' })}
                onAttach={handleAttachMusic}
                musicItem={state.attachingMusicItem}
                moments={state.moments as any[]}
                saving={state.saving}
            />
        </Box>
    );
};

export default MusicManagement;
