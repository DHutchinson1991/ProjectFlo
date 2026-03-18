export default function MomentsManagement() {
    return null;
}

/*
"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    Paper,
    CircularProgress,
    Tooltip,
    FormControlLabel,
    Checkbox,
    Grid,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    AccessTime as TimeIcon,
    PlaylistAdd as PlaylistAddIcon,
    Refresh as RefreshIcon,
    MusicNote as MusicIcon,
    Face as SubjectsIcon,
} from '@mui/icons-material';
import { momentsApi } from '@/lib/api/moments';
import { musicApi, MusicLibraryItem } from '@/lib/api/music';
import { SubjectsLibrary } from '@/lib/types/subjects';
import {
    SceneMoment,
    SceneType,
    SCENE_TYPE_OPTIONS,
    formatDuration,
    CreateSceneMomentDto,
    UpdateSceneMomentDto,
} from '@/lib/types/moments';

// Drag and Drop
import {
    useSensor,
    useSensors,
    DragEndEvent,
    PointerSensor,
    KeyboardSensor,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS as DndCSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';

interface SortableMomentCardProps {
    moment: SceneMoment;
    availableSubjects: SubjectsLibrary[];
    onEdit: (moment: SceneMoment) => void;
    onDelete: (momentId: number) => void;
    onMusicDropped?: (momentId: number, musicId: number) => void;
}

const SortableMomentCard: React.FC<SortableMomentCardProps> = ({
    moment,
    availableSubjects,
    onEdit,
    onDelete,
    onMusicDropped,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef: setSortableNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ 
        id: moment.id,
        data: {
            type: 'moment',
            moment: moment
        }
    });

    const {
        setNodeRef: setDroppableNodeRef,
        isOver,
        active,
    } = useDroppable({
        id: `moment-drop-${moment.id}`,
        data: { type: 'moment', momentId: moment.id },
    });

    const style = {
        transform: DndCSS.Transform.toString(transform),
        transition
    };

    const isReceivingMusic = isOver && active?.data.current?.type === 'music';
    
    // Debug logging for drop detection
    React.useEffect(() => {
        if (isOver) {
            console.log('🎯 Moment card hover detected:', {
                momentId: moment.id,
                momentName: moment.name,
                activeData: active?.data,
                activeType: active?.data.current?.type,
                isReceivingMusic
            });
        }
    }, [isOver, active, moment.id]);

    const handleCardClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isDragging) {
            onEdit(moment);
        }
    };

    return (
        <Paper
            ref={(node) => {
                setSortableNodeRef(node);
                setDroppableNodeRef(node);
            }}
            style={style}
            {...attributes}
            {...listeners}
            onClick={handleCardClick}
            sx={{
                flex: 1,
                minWidth: 0,
                minHeight: 200,
                p: 3,
                cursor: isDragging ? 'grabbing' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                borderRadius: 4,
                background: isReceivingMusic 
                    ? 'linear-gradient(145deg, #1a0a2e 0%, #2a1a4e 50%, #1f0f3f 100%)'
                    : 'linear-gradient(145deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
                border: isReceivingMusic
                    ? '2px dashed #9c27b0'
                    : '1px solid rgba(255,255,255,0.08)',
                boxShadow: isDragging
                    ? '0 20px 64px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.1)'
                    : isReceivingMusic
                    ? '0 8px 32px rgba(156, 39, 176, 0.4), inset 0 1px 0 rgba(156, 39, 176, 0.2)'
                    : '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
                transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(20px)',
                opacity: isDragging ? 0.8 : 1,
                '&:hover': !isDragging ? {
                    boxShadow: '0 16px 48px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)',
                    transform: 'translateY(-6px) scale(1.03)',
                    borderColor: 'rgba(100, 149, 237, 0.4)',
                    background: 'linear-gradient(145deg, #151515 0%, #252525 50%, #1a1a1a 100%)',
                } : {},
            }}
        >
            {/* Main Content */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.8, pt: 0.5 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle2" sx={{
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        lineHeight: 1.1,
                        flex: 1,
                        pr: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        color: 'white'
                    }}>
                        {moment.name}
                    </Typography>
                </Box>

                {/* Description */}
                {moment.description && (
                    <Typography variant="caption" sx={{
                        fontSize: '0.7rem',
                        lineHeight: 1.2,
                        color: 'rgba(255,255,255,0.7)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        mb: 0.5
                    }}>
                        {moment.description}
                    </Typography>
                )}

                {/* Duration */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <TimeIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>
                        {formatDuration(moment.duration || 0)}
                    </Typography>
                </Box>

                {/* Music - Purple section */}
                {moment.music && moment.music.music_type !== 'NONE' && (
                    <Tooltip 
                        title={
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'white' }}>
                                    🎵 {moment.music.music_name || 'Unnamed Track'}
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Artist:</Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                            {moment.music.artist || 'Unknown Artist'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Type:</Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                            {moment.music.music_type}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Duration:</Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                            {moment.music.duration ? `${moment.music.duration}s` : 'Unknown'}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography variant="caption" sx={{ 
                                    color: 'rgba(255,255,255,0.6)', 
                                    fontStyle: 'italic', 
                                    mt: 1, 
                                    display: 'block',
                                    borderTop: '1px solid rgba(255,255,255,0.2)',
                                    pt: 1
                                }}>
                                    Click to edit or change music
                                </Typography>
                            </Box>
                        }
                        arrow
                        placement="top"
                        enterDelay={300}
                        leaveDelay={200}
                        sx={{
                            '& .MuiTooltip-tooltip': {
                                backgroundColor: 'rgba(30, 30, 30, 0.98)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(156, 39, 176, 0.3)',
                                borderRadius: '12px',
                                padding: '16px 20px',
                                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(156, 39, 176, 0.1)',
                                maxWidth: '320px',
                                minWidth: '250px',
                            },
                            '& .MuiTooltip-arrow': {
                                color: 'rgba(30, 30, 30, 0.98)',
                                '&::before': {
                                    border: '1px solid rgba(156, 39, 176, 0.3)',
                                }
                            }
                        }}
                    >
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mb: 0.5,
                            p: 0.5,
                            bgcolor: 'rgba(156, 39, 176, 0.15)',
                            borderRadius: 1,
                            border: '1px solid rgba(156, 39, 176, 0.4)',
                            '&:hover': {
                                bgcolor: 'rgba(156, 39, 176, 0.25)',
                                transform: 'scale(1.02)',
                                transition: 'all 0.2s ease-in-out',
                            }
                        }}>
                            <MusicIcon sx={{ fontSize: 14, color: '#ba68c8' }} />
                            <Typography variant="caption" sx={{
                                fontSize: '0.7rem',
                                color: '#ce93d8',
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1
                            }}>
                                {moment.music.music_name || moment.music.music_type}
                            </Typography>
                        </Box>
                    </Tooltip>
                )}

                {/* Subjects - Yellow section between music and coverage */}
                {(() => {
                    const subjectIds = new Set<number>();
                    if (moment.coverage_items) {
                        moment.coverage_items.forEach(item => {
                            const coverage = item.coverage as { subject?: string }; 
                            if (coverage.subject && typeof coverage.subject === 'string') {
                                const ids = coverage.subject.split(',')
                                    .map(id => parseInt(id.trim()))
                                    .filter(id => !isNaN(id));
                                ids.forEach(id => subjectIds.add(id));
                            }
                        });
                    }

                    const subjects = Array.from(subjectIds)
                        .map(id => availableSubjects.find(s => s.id === id))
                        .filter(Boolean);

                    if (subjects.length === 0) return null;

                    return (
                        <Tooltip 
                            title={
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'white' }}>
                                        👥 Subjects in this moment
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {subjects.map((subject) => (
                                            <Box key={subject!.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                                                    {subject!.first_name} {subject!.last_name || ''}
                                                </Typography>
                                                {subject!.context_role && (
                                                    <Typography variant="body2" sx={{ color: 'rgba(255,235,59,0.8)', fontStyle: 'italic' }}>
                                                        {subject!.context_role}
                                                    </Typography>
                                                )}
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            }
                            arrow
                            placement="top"
                        >
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                mb: 0.5,
                                '&:hover': {
                                    transform: 'scale(1.02)',
                                    transition: 'all 0.2s ease-in-out',
                                }
                            }}>
                                <SubjectsIcon sx={{ fontSize: 14, color: '#fff59d' }} />
                                <Typography variant="caption" sx={{
                                    fontSize: '0.7rem',
                                    color: '#fff59d',
                                    fontWeight: 500,
                                }}>
                                    {subjects.length}
                                </Typography>
                            </Box>
                        </Tooltip>
                    );
                })()}

                <Box sx={{ flex: 1 }} />

                {/* Coverage Assignments */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3, mt: 'auto' }}>
                    {moment.coverage_items && moment.coverage_items.length > 0 ? (
                        moment.coverage_items
                            .slice() // Create a shallow copy to avoid mutating original array
                            .sort((a: any, b: any) => {
                                // Get assignment numbers (V1, V2, A1, A2, etc.)
                                const aAssignment = a.coverage?.assignment_number || a.assignment || '';
                                const bAssignment = b.coverage?.assignment_number || b.assignment || '';
                                
                                // Extract type (V or A) and number
                                const aType = aAssignment.charAt(0); // 'V' or 'A'
                                const bType = bAssignment.charAt(0);
                                const aNum = parseInt(aAssignment.slice(1)) || 0; // Extract number
                                const bNum = parseInt(bAssignment.slice(1)) || 0;
                                
                                // Sort: V first, then A; within each type, sort by number
                                if (aType !== bType) {
                                    return aType === 'V' ? -1 : 1; // V comes before A
                                }
                                return aNum - bNum; // Numerical order within same type
                            })
                            .map((item: any, index: number) => {
                            const isVideo = item.coverage?.coverage_type === 'VIDEO';
                            const isAudio = item.coverage?.coverage_type === 'AUDIO';
                            // Prioritize coverage.assignment_number (V1, A1) over the linkage assignment
                            const assignment = item.coverage?.assignment_number || item.assignment || (isVideo ? 'V?' : 'A?');
                            
                            return (
                                <Tooltip
                                    key={item.id || index}
                                    title={`${isVideo ? '📹' : '🎤'} ${item.coverage?.name || 'Unknown'}`}
                                    arrow
                                    placement="top"
                                >
                                    <Chip
                                        label={assignment}
                                        size="small"
                                        variant="filled"
                                        sx={{
                                            fontSize: '0.6rem',
                                            height: 18,
                                            backgroundColor: isVideo ? 'rgba(25, 118, 210, 0.2)' : isAudio ? 'rgba(46, 125, 50, 0.2)' : 'rgba(158, 158, 158, 0.2)',
                                            color: isVideo ? '#1976d2' : isAudio ? '#2e7d32' : '#9e9e9e',
                                            border: isVideo ? '1px solid rgba(25, 118, 210, 0.3)' : isAudio ? '1px solid rgba(46, 125, 50, 0.3)' : '1px solid rgba(158, 158, 158, 0.3)',
                                        }}
                                    />
                                </Tooltip>
                            );
                        })
                    ) : (
                         <Box sx={{ mt: 'auto' }}>
                             <Chip
                                label="No coverage"
                                size="small"
                                variant="outlined"
                                color="warning"
                                sx={{
                                    fontSize: '0.6rem',
                                    height: 18,
                                }}
                            />
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Delete Button */}
            <IconButton
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(moment.id);
                }}
                sx={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    p: 0.2,
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    width: 16,
                    height: 16,
                    opacity: 0.7,
                    '&:hover': {
                        backgroundColor: 'rgba(255,0,0,0.3)',
                        opacity: 1,
                    }
                }}
            >
                <DeleteIcon sx={{ fontSize: 12 }} />
            </IconButton>
        </Paper>
    );
};

interface MomentsManagementProps {
    sceneId: number;
    projectId?: number;
    availableSubjects: SubjectsLibrary[];
    coverageItems: any[];
    onMomentsChange?: (moments: SceneMoment[]) => void;
    onMusicUpdated?: () => void;
    initialMoments?: SceneMoment[];
}

const MomentsManagement: React.FC<MomentsManagementProps> = ({
    sceneId,
    projectId,
    availableSubjects,
    coverageItems = [],
    onMomentsChange,
    onMusicUpdated,
    initialMoments,
}) => {
    const [moments, setMoments] = useState<SceneMoment[]>(initialMoments || []);
    
    useEffect(() => {
        if (initialMoments) {
            setMoments(initialMoments);
            setLoading(false);
        }
    }, [initialMoments]);

    const [musicLibrary, setMusicLibrary] = useState<MusicLibraryItem[]>([]);
    const [loading, setLoading] = useState(!initialMoments);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dialog states
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
    const [editingMoment, setEditingMoment] = useState<SceneMoment | null>(null);

    // Form states
    const [newMomentForm, setNewMomentForm] = useState({
        name: '',
        description: '',
        duration: 60,
    });
    const [selectedSceneType, setSelectedSceneType] = useState<SceneType>('MOMENTS');
    const [selectedMusicId, setSelectedMusicId] = useState<number | ''>('');

    const fetchMoments = async () => {
        try {
            setLoading(true);
            const data = await momentsApi.getSceneMoments(sceneId, projectId);
            setMoments(data);
            if (onMomentsChange) onMomentsChange(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching moments:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch moments');
        } finally {
            setLoading(false);
        }
    };

    const fetchMusicLibrary = async () => {
        try {
            const data = await musicApi.getMusicLibrary(projectId);
            setMusicLibrary(data);
        } catch (err) {
            console.warn('Failed to fetch music library:', err);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            if (!initialMoments) {
                await fetchMoments();
            }
            await fetchMusicLibrary();
        };
        loadInitialData();
    }, [sceneId, projectId]);

    const handleCreateFromTemplate = async (sceneType: SceneType) => {
        try {
            setSaving(true);
            await momentsApi.createMomentsFromTemplate(sceneId, sceneType, projectId);
            await fetchMoments();
            setTemplateDialogOpen(false);
            setError(null);
        } catch (err) {
            console.error('Error creating moments from template:', err);
            setError(err instanceof Error ? err.message : 'Failed to create moments from template');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateMoment = async () => {
        try {
            setSaving(true);
            const data: Omit<CreateSceneMomentDto, 'scene_id'> = {
                name: newMomentForm.name,
                description: newMomentForm.description || undefined,
                duration: newMomentForm.duration,
                order_index: moments.length + 1,
                project_id: projectId,
            };

            // Optimistically update UI
            const newMoment: SceneMoment = {
                id: Math.random(), // Temporary ID
                scene_id: sceneId,
                project_id: projectId,
                name: newMomentForm.name,
                description: newMomentForm.description,
                order_index: moments.length + 1,
                duration: newMomentForm.duration,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            setMoments([...moments, newMoment]);
            setCreateDialogOpen(false);
            setNewMomentForm({ name: '', description: '', duration: 60 });
            setError(null);

            // Sync with server in background
            await momentsApi.createSceneMoment(sceneId, data);
            await fetchMoments(); // Refresh to get real IDs and data
        } catch (err) {
            console.error('Error creating moment:', err);
            setError(err instanceof Error ? err.message : 'Failed to create moment');
            await fetchMoments(); // Revert to server state on error
        } finally {
            setSaving(false);
        }
    };

    const handleEditMoment = (moment: SceneMoment) => {
        setEditingMoment(moment);
        setNewMomentForm({
            name: moment.name,
            description: moment.description || '',
            duration: moment.duration || 60,
        });

        if (moment.music && moment.music.music_type !== 'NONE') {
            // If music_library_item_id is available, use it; otherwise try to find by name/artist
            if (moment.music.music_library_item_id) {
                setSelectedMusicId(moment.music.music_library_item_id);
            } else {
                const musicItem = musicLibrary.find(item =>
                    item.music_name === moment.music?.music_name &&
                    item.artist === moment.music?.artist
                );
                setSelectedMusicId(musicItem?.id || '');
            }
        } else {
            setSelectedMusicId('');
        }

        setEditDialogOpen(true);
    };

    const handleUpdateMoment = async () => {
        if (!editingMoment) return;

        try {
            setSaving(true);
            const data: UpdateSceneMomentDto = {
                name: newMomentForm.name,
                description: newMomentForm.description || undefined,
                duration: newMomentForm.duration,
            };

            await momentsApi.updateSceneMoment(sceneId, editingMoment.id, data);
            await fetchMoments();
            setEditDialogOpen(false);
            setEditingMoment(null);
            setNewMomentForm({ name: '', description: '', duration: 60 });
            setSelectedMusicId('');
            setError(null);
        } catch (err) {
            console.error('Error updating moment:', err);
            setError(err instanceof Error ? err.message : 'Failed to update moment');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteMoment = async (momentId: number) => {
        if (!confirm('Are you sure you want to delete this moment?')) return;

        try {
            setSaving(true);
            // Optimistically remove from UI
            setMoments(moments.filter(m => m.id !== momentId));
            setError(null);

            // Sync with server in background
            await momentsApi.deleteSceneMoment(sceneId, momentId);
        } catch (err) {
            console.error('Error deleting moment:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete moment');
            await fetchMoments(); // Revert to server state on error
        } finally {
            setSaving(false);
        }
    };

    const handleMusicDroppedOnMoment = async (momentId: number, musicId: number) => {
        try {
            const moment = moments.find(m => m.id === momentId);
            if (!moment) return;

            console.log('Music dropped on moment:', musicId, 'to moment:', momentId);
            const selectedMusic = musicLibrary.find(m => m.id === musicId);
            
            // Optimistically update UI
            setMoments(moments.map(m => 
                m.id === momentId ? {
                    ...m,
                    music: selectedMusic ? {
                        id: -1,
                        moment_id: m.id,
                        music_library_item_id: selectedMusic.id,
                        music_name: selectedMusic.music_name,
                        artist: selectedMusic.artist,
                        duration: selectedMusic.duration,
                        music_type: selectedMusic.music_type as any,
                        file_path: selectedMusic.file_path,
                        notes: selectedMusic.notes,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    } : undefined
                } : m
            ));

            // Attach to server
            await musicApi.attachMusicToMoment(momentId, musicId);
            if (onMusicUpdated) {
                onMusicUpdated();
            }
        } catch (err) {
            console.error('Error dropping music on moment:', err);
            setError(err instanceof Error ? err.message : 'Failed to attach music');
            await fetchMoments(); // Revert on error
        }
    };

    const handleUpdateMusicInModal = async () => {
        console.log('🎚️ handleUpdateMusicInModal called');
        if (!editingMoment) {
            console.log('❌ No editingMoment set, returning early');
            return;
        }

        try {
            console.log('🎚️ Update Music clicked:', {
                selectedMusicId,
                selectedMusicIdType: typeof selectedMusicId,
                editingMomentId: editingMoment.id,
                hasExistingMusic: !!editingMoment.music,
                existingMusic: editingMoment.music
            });

            // Attach when a track is selected (number); detach when 'None' is selected
            if (selectedMusicId && typeof selectedMusicId === 'number') {
                console.log('🎵 Attaching music:', selectedMusicId, 'to moment:', editingMoment.id);
                const selectedMusic = musicLibrary.find(m => m.id === selectedMusicId);
                console.log('🎵 Selected music details:', selectedMusic);
                // Optimistically update UI
                setMoments(moments.map(m => 
                    m.id === editingMoment.id ? {
                        ...m,
                        music: selectedMusic ? {
                            id: -1,
                            moment_id: m.id,
                            music_library_item_id: selectedMusic.id,
                            music_name: selectedMusic.music_name,
                            artist: selectedMusic.artist,
                            duration: selectedMusic.duration,
                            music_type: selectedMusic.music_type as any,
                            file_path: selectedMusic.file_path,
                            notes: selectedMusic.notes,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        } : undefined
                    } : m
                ));
                await musicApi.attachMusicToMoment(editingMoment.id, selectedMusicId);
                console.log('✅ Attach completed');
            } else if (selectedMusicId === '') {
                console.log('🧹 Detaching music from moment:', editingMoment.id, {
                    selectedMusicId,
                    hasExistingMusic: !!editingMoment.music,
                    currentMusic: editingMoment.music
                });
                // Optimistically remove music from UI
                setMoments(moments.map(m =>
                    m.id === editingMoment.id ? { ...m, music: undefined } : m
                ));
                await musicApi.detachMusicFromMoment(editingMoment.id);
                console.log('✅ Detach completed');
            } else {
                console.log('No music selected or attached');
                setEditDialogOpen(false);
                return;
            }

            console.log('🎉 Music operation completed');
            if (onMusicUpdated) {
                console.log('📢 Calling onMusicUpdated callback');
                onMusicUpdated();
            }
            setEditDialogOpen(false);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error('❌ Error updating music:', errorMsg, { err });
            setError('Failed to update music: ' + errorMsg);
            await fetchMoments(); // Revert on error
        }
    };

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                        <Typography variant="h6">Scene Moments</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage the moments within this scene
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <IconButton onClick={fetchMoments} size="small" disabled={loading}>
                            <RefreshIcon />
                        </IconButton>
                        <Button
                            variant="outlined"
                            startIcon={<PlaylistAddIcon />}
                            onClick={() => setTemplateDialogOpen(true)}
                            size="small"
                        >
                            From Template
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setCreateDialogOpen(true)}
                            size="small"
                        >
                            Add Moment
                        </Button>
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : moments.length === 0 ? (
                    <Alert severity="info" sx={{ textAlign: 'center' }}>
                        No moments defined for this scene yet. Create moments manually or use a template to get started.
                    </Alert>
                ) : (
                    <SortableContext items={moments.map(m => m.id)} strategy={horizontalListSortingStrategy}>
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1.5,
                                width: '100%',
                                minHeight: 220,
                            }}
                        >
                            {moments.map((moment) => (
                                <SortableMomentCard
                                    key={moment.id}
                                    moment={moment}
                                    availableSubjects={availableSubjects}
                                    onEdit={handleEditMoment}
                                    onDelete={handleDeleteMoment}
                                    onMusicDropped={handleMusicDroppedOnMoment}
                                />
                            ))}
                        </Box>
                    </SortableContext>
                )}

                {/* Dialogs */}
                <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Create Moments from Template</DialogTitle>
                    <DialogContent>
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Scene Type</InputLabel>
                            <Select
                                value={selectedSceneType}
                                onChange={(e) => setSelectedSceneType(e.target.value as SceneType)}
                                label="Scene Type"
                            >
                                {SCENE_TYPE_OPTIONS.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={() => handleCreateFromTemplate(selectedSceneType)} variant="contained" disabled={saving}>
                            Create
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Create New Moment</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <TextField
                                label="Moment Name"
                                value={newMomentForm.name}
                                onChange={(e) => setNewMomentForm({ ...newMomentForm, name: e.target.value })}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Duration (seconds)"
                                type="number"
                                value={newMomentForm.duration}
                                onChange={(e) => setNewMomentForm({ ...newMomentForm, duration: parseInt(e.target.value) || 60 })}
                                fullWidth
                            />
                            <TextField
                                label="Description"
                                value={newMomentForm.description}
                                onChange={(e) => setNewMomentForm({ ...newMomentForm, description: e.target.value })}
                                fullWidth
                                multiline
                                rows={3}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateMoment} variant="contained" disabled={saving || !newMomentForm.name.trim()}>
                            Create
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Edit Moment</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold">Basic Information</Typography>
                                <TextField
                                    label="Moment Name"
                                    value={newMomentForm.name}
                                    onChange={(e) => setNewMomentForm({ ...newMomentForm, name: e.target.value })}
                                    fullWidth
                                    required
                                />
                                <TextField
                                    label="Duration (seconds)"
                                    type="number"
                                    value={newMomentForm.duration}
                                    onChange={(e) => setNewMomentForm({ ...newMomentForm, duration: parseInt(e.target.value) || 60 })}
                                    fullWidth
                                />
                                <TextField
                                    label="Description"
                                    value={newMomentForm.description}
                                    onChange={(e) => setNewMomentForm({ ...newMomentForm, description: e.target.value })}
                                    fullWidth
                                    multiline
                                    rows={3}
                                />
                            </Box>

                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Music</Typography>
                                <FormControl fullWidth>
                                    <InputLabel>Select Music Track</InputLabel>
                                    <Select
                                        value={selectedMusicId}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const parsed = val === '' ? '' : Number(val);
                                            console.log('🎛️ Music select change:', { raw: val, parsed, type: typeof parsed });
                                            setSelectedMusicId(parsed as number | '');
                                        }}
                                        label="Select Music Track"
                                    >
                                        <MenuItem value=""><em>None</em></MenuItem>
                                        {musicLibrary.map((music) => (
                                            <MenuItem key={music.id} value={music.id}>
                                                {music.music_name || 'Untitled'} {music.artist ? `- ${music.artist}` : ''}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Button 
                                    variant="outlined" 
                                    sx={{ mt: 1 }}
                                    onClick={handleUpdateMusicInModal}
                                >
                                    Update Music
                                </Button>
                            </Box>

                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Coverage Assignments</Typography>
                                {coverageItems && coverageItems.length > 0 ? (
                                    <Grid container spacing={1}>
                                        {/* Filter to show only the definitions (moment_id is null) to avoid duplicates from existing assignments */}
                                        {coverageItems
                                            .filter(item => item.moment_id == null)
                                            .map((item) => {
                                            const isAssigned = editingMoment?.coverage_items?.some(
                                                (ci: any) => ci.assignment === item.assignment_number
                                            );
                                            const label = `${item.assignment_number || ''} ${item.name}`;
                                            return (
                                                <Grid item xs={6} key={item.id}>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={!!isAssigned}
                                                                onChange={async (e) => {
                                                                    if (!editingMoment) return;
                                                                    try {
                                                                        if (e.target.checked) {
                                                                            // item.id is now the SceneCoverage ID (instance)
                                                                            await momentsApi.assignCoverageToMoment(editingMoment.id, item.id);
                                                                        } else {
                                                                            await momentsApi.removeCoverageFromMoment(editingMoment.id, item.id);
                                                                        }
                                                                        const updatedMoments = await momentsApi.getSceneMoments(sceneId, projectId);
                                                                         if (onMomentsChange) onMomentsChange(updatedMoments);
                                                                         const updatedMoment = updatedMoments.find(m => m.id === editingMoment.id);
                                                                         if (updatedMoment) setEditingMoment(updatedMoment);
                                                                    } catch (err) {
                                                                        console.error(err);
                                                                    }
                                                                }}
                                                            />
                                                        }
                                                        label={label}
                                                    />
                                                </Grid>
                                            )
                                        })}
                                    </Grid>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">No coverage items available.</Typography>
                                )}
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateMoment} variant="contained">Update</Button>
                    </DialogActions>
                </Dialog>
            </CardContent>
        </Card>
    );
};

export default MomentsManagement;

*/
