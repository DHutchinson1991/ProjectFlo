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
import { SubjectsLibrary } from '@/lib/types/subjects'; // Add subjects type import
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
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableMomentCardProps {
    moment: SceneMoment;
    availableSubjects: SubjectsLibrary[]; // Add subjects for display
    onEdit: (moment: SceneMoment) => void;
    onDelete: (momentId: number) => void;
}

const SortableMomentCard: React.FC<SortableMomentCardProps> = ({
    moment,
    availableSubjects,
    onEdit,
    onDelete,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: moment.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleCardClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isDragging) {
            onEdit(moment);
        }
    };

    return (
        <Paper
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
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
                background: 'linear-gradient(145deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: isDragging
                    ? '0 20px 64px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.1)'
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
            onClick={handleCardClick}
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
                    // Extract subject IDs from coverage items
                    const subjectIds = new Set<number>();
                    
                    if (moment.coverage_items) {
                        moment.coverage_items.forEach(item => {
                            // Check if coverage has subject information
                            const coverage = item.coverage as { subject?: string }; // Type assertion to access subject field
                            if (coverage.subject && typeof coverage.subject === 'string') {
                                // Parse subject string (comma-separated IDs)
                                const ids = coverage.subject.split(',')
                                    .map(id => parseInt(id.trim()))
                                    .filter(id => !isNaN(id));
                                ids.forEach(id => subjectIds.add(id));
                            }
                        });
                    }

                    // Get subject objects from availableSubjects
                    const subjects = Array.from(subjectIds)
                        .map(id => availableSubjects.find(s => s.id === id))
                        .filter(Boolean);

                    if (subjects.length === 0) return null;

                    return (
                        <Tooltip 
                            title={
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'white' }}>
                                        � Subjects in this moment
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
                                    <Typography variant="caption" sx={{ 
                                        color: 'rgba(255,255,255,0.6)', 
                                        fontStyle: 'italic', 
                                        mt: 1, 
                                        display: 'block',
                                        borderTop: '1px solid rgba(255,255,255,0.2)',
                                        pt: 1
                                    }}>
                                        Subjects appear in coverage for this moment
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
                                    border: '1px solid rgba(255, 235, 59, 0.3)',
                                    borderRadius: '12px',
                                    padding: '16px 20px',
                                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 235, 59, 0.1)',
                                    maxWidth: '320px',
                                    minWidth: '250px',
                                },
                                '& .MuiTooltip-arrow': {
                                    color: 'rgba(30, 30, 30, 0.98)',
                                    '&::before': {
                                        border: '1px solid rgba(255, 235, 59, 0.3)',
                                    }
                                }
                            }}
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

                {/* Spacer to push coverage to bottom */}
                <Box sx={{ flex: 1 }} />

                {/* Coverage Assignments */}
                {moment.coverage_assignments && moment.coverage_assignments.trim() ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3, mt: 'auto' }}>
                        {(() => {
                            const assignments = moment.coverage_assignments.split(',').map(a => a.trim());
                            const videoAssignments = assignments.filter(a => a.startsWith('V'));
                            const audioAssignments = assignments.filter(a => a.startsWith('A'));
                            const otherAssignments = assignments.filter(a => !a.startsWith('V') && !a.startsWith('A'));
                            
                            const allAssignments = [...videoAssignments, ...audioAssignments, ...otherAssignments];
                            
                            return allAssignments.map((assignment: string, index: number) => {
                                const isVideo = assignment.startsWith('V');
                                const isAudio = assignment.startsWith('A');

                                // Generate tooltip content based on assignment type and actual data
                                const getTooltipContent = (assignment: string) => {
                                    // Find the actual coverage item that matches this assignment
                                    const coverageItem = moment.coverage_items?.find(item => 
                                        item.assignment === assignment
                                    );
                                    
                                    if (coverageItem) {
                                        const coverage = coverageItem.coverage;
                                        const icon = isVideo ? '📹' : isAudio ? '🎤' : '📋';
                                        const title = `${icon} ${coverage.name}`;
                                        
                                        return (
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'white' }}>
                                                    {title}
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Assignment:</Typography>
                                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                                            {assignment}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Type:</Typography>
                                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                                            {coverage.coverage_type}
                                                        </Typography>
                                                    </Box>
                                                    {coverage.description && (
                                                        <Box sx={{ mt: 1 }}>
                                                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500, mb: 0.5 }}>Description:</Typography>
                                                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                                                                {coverage.description}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>
                                        );
                                    } else {
                                        // Fallback to assignment-based info if no coverage item found
                                        const icon = isVideo ? '📹' : isAudio ? '🎤' : '📋';
                                        const title = isVideo ? `Video Camera ${assignment.replace('V', '')}` 
                                                    : isAudio ? `Audio Channel ${assignment.replace('A', '')}` 
                                                    : `Coverage Assignment: ${assignment}`;
                                        
                                        return (
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'white' }}>
                                                    {icon} {title}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                                                    No detailed coverage assigned
                                                </Typography>
                                                <Typography variant="caption" sx={{ 
                                                    color: 'rgba(255,255,255,0.6)', 
                                                    display: 'block',
                                                    borderTop: '1px solid rgba(255,255,255,0.2)',
                                                    pt: 1,
                                                    mt: 1
                                                }}>
                                                    Click to edit and assign specific coverage
                                                </Typography>
                                            </Box>
                                        );
                                    }
                                };

                                return (
                                    <Tooltip 
                                        key={index}
                                        title={getTooltipContent(assignment)}
                                        arrow
                                        placement="top"
                                        enterDelay={300}
                                        leaveDelay={200}
                                        sx={{
                                            '& .MuiTooltip-tooltip': {
                                                backgroundColor: 'rgba(30, 30, 30, 0.98)',
                                                backdropFilter: 'blur(20px)',
                                                border: isVideo ? '1px solid rgba(25, 118, 210, 0.3)' : isAudio ? '1px solid rgba(46, 125, 50, 0.3)' : '1px solid rgba(97, 97, 97, 0.3)',
                                                borderRadius: '12px',
                                                padding: '16px 20px',
                                                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                                                maxWidth: '320px',
                                                minWidth: '250px',
                                            },
                                            '& .MuiTooltip-arrow': {
                                                color: 'rgba(30, 30, 30, 0.98)',
                                                '&::before': {
                                                    border: isVideo ? '1px solid rgba(25, 118, 210, 0.3)' : isAudio ? '1px solid rgba(46, 125, 50, 0.3)' : '1px solid rgba(97, 97, 97, 0.3)',
                                                }
                                            }
                                        }}
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
                                                '&:hover': {
                                                    backgroundColor: isVideo ? 'rgba(25, 118, 210, 0.3)' : isAudio ? 'rgba(46, 125, 50, 0.3)' : 'rgba(158, 158, 158, 0.3)',
                                                    transform: 'scale(1.05)',
                                                    transition: 'all 0.2s ease-in-out',
                                                }
                                            }}
                                        />
                                    </Tooltip>
                                );
                            });
                        })()}
                    </Box>
                ) : (
                    <Box sx={{ mt: 'auto' }}>
                        <Tooltip 
                            title={
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'rgba(0, 0, 0, 0.87)' }}>
                                        ⚠️ No Coverage Assigned
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.7)', mb: 1 }}>
                                        This moment needs video and audio coverage assignments.
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
                                        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)', fontWeight: 500 }}>
                                            Suggestions:
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)', ml: 1 }}>
                                            • Add V1, V2 for video coverage
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)', ml: 1 }}>
                                            • Add A1, A2 for audio coverage
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ 
                                        color: 'rgba(0, 0, 0, 0.5)', 
                                        fontStyle: 'italic',
                                        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                                        pt: 1,
                                        display: 'block'
                                    }}>
                                        Click to edit this moment and assign coverage
                                    </Typography>
                                </Box>
                            }
                            arrow
                            placement="top"
                            enterDelay={300}
                            leaveDelay={200}
                            sx={{
                                '& .MuiTooltip-tooltip': {
                                    backgroundColor: 'rgba(255, 248, 225, 0.98)',
                                    backdropFilter: 'blur(20px)',
                                    border: '1px solid rgba(255, 193, 7, 0.3)',
                                    borderRadius: '12px',
                                    padding: '16px 20px',
                                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 193, 7, 0.1)',
                                    maxWidth: '320px',
                                    minWidth: '250px',
                                },
                                '& .MuiTooltip-arrow': {
                                    color: 'rgba(255, 248, 225, 0.98)',
                                    '&::before': {
                                        border: '1px solid rgba(255, 193, 7, 0.3)',
                                    }
                                }
                            }}
                        >
                            <Chip
                                label="No coverage"
                                size="small"
                                variant="outlined"
                                color="warning"
                                sx={{
                                    fontSize: '0.6rem',
                                    height: 18,
                                    color: 'rgba(255, 193, 7, 1)',
                                    borderColor: 'rgba(255, 193, 7, 0.3)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                                        borderColor: 'rgba(255, 193, 7, 0.5)',
                                        transform: 'scale(1.05)',
                                        transition: 'all 0.2s ease-in-out',
                                    }
                                }}
                            />
                        </Tooltip>
                    </Box>
                )}
            </Box>

            {/* Delete Button - Bottom Right */}
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
    availableSubjects: SubjectsLibrary[]; // Add subjects for display in moments
    onMomentsChange?: (moments: SceneMoment[]) => void;
}

const MomentsManagement: React.FC<MomentsManagementProps> = ({
    sceneId,
    projectId,
    availableSubjects,
    onMomentsChange,
}) => {
    const [moments, setMoments] = useState<SceneMoment[]>([]);
    const [musicLibrary, setMusicLibrary] = useState<MusicLibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
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
    const [selectedSceneType, setSelectedSceneType] = useState<SceneType>('CEREMONY');

    // Music selection state
    const [selectedMusicId, setSelectedMusicId] = useState<number | ''>('');

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px of movement before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchMoments = async () => {
        try {
            setLoading(true);

            // First ensure coverage assignments are up to date
            try {
                await momentsApi.updateSceneCoverageAssignments(sceneId);
            } catch (assignmentError) {
                console.warn('Failed to update coverage assignments:', assignmentError);
                // Continue with fetching moments even if assignment update fails
            }

            const data = await momentsApi.getSceneMoments(sceneId, projectId);
            setMoments(data);

            // Notify parent of moments change
            if (onMomentsChange) {
                onMomentsChange(data);
            }

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
            // Don't show error for music library as it's not critical
        }
    };

    useEffect(() => {
        fetchMoments();
        fetchMusicLibrary();
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

            await momentsApi.createSceneMoment(sceneId, data);
            await fetchMoments();
            setCreateDialogOpen(false);
            setNewMomentForm({ name: '', description: '', duration: 60 });
            setError(null);
        } catch (err) {
            console.error('Error creating moment:', err);
            setError(err instanceof Error ? err.message : 'Failed to create moment');
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

        // Set selected music based on attached music
        if (moment.music && moment.music.music_type !== 'NONE') {
            // Find the music library item that matches this moment's music
            const musicItem = musicLibrary.find(item =>
                item.music_name === moment.music?.music_name &&
                item.artist === moment.music?.artist
            );
            setSelectedMusicId(musicItem?.id || '');
        } else {
            setSelectedMusicId('');
        }

        setEditDialogOpen(true);
    };

    const handleUpdateMoment = async () => {
        if (!editingMoment) return;

        try {
            setSaving(true);

            // Update moment details
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
            await momentsApi.deleteSceneMoment(sceneId, momentId);
            await fetchMoments();
            setError(null);
        } catch (err) {
            console.error('Error deleting moment:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete moment');
        } finally {
            setSaving(false);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = moments.findIndex((moment) => moment.id === active.id);
            const newIndex = moments.findIndex((moment) => moment.id === over?.id);

            const newMoments = arrayMove(moments, oldIndex, newIndex);
            setMoments(newMoments);

            try {
                const momentIds = newMoments.map((moment) => moment.id);
                await momentsApi.reorderSceneMoments(sceneId, momentIds);
                setError(null);
            } catch (err) {
                console.error('Error reordering moments:', err);
                setError(err instanceof Error ? err.message : 'Failed to reorder moments');
                // Revert the change
                await fetchMoments();
            }
        }
    };

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                {/* Header */}
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

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Loading State */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : moments.length === 0 ? (
                    /* Empty State */
                    <Alert severity="info" sx={{ textAlign: 'center' }}>
                        No moments defined for this scene yet. Create moments manually or use a template to get started.
                    </Alert>
                ) : (
                    /* Moments Grid */
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
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
                                    />
                                ))}
                            </Box>
                        </SortableContext>
                    </DndContext>
                )}

                {/* Create From Template Dialog */}
                <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PlaylistAddIcon />
                            Create Moments from Template
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 2,
                                    border: 1,
                                    borderColor: "divider",
                                    background: (theme) => theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff'
                                }}
                            >
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                                    Template Selection
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Select a scene type to automatically create moments based on predefined templates.
                                    This will generate common moments for the selected scene type.
                                </Typography>
                                <FormControl fullWidth variant="outlined">
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
                            </Paper>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
                        <Button
                            onClick={() => setTemplateDialogOpen(false)}
                            variant="outlined"
                            sx={{ mr: 1 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => handleCreateFromTemplate(selectedSceneType)}
                            variant="contained"
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={16} /> : <PlaylistAddIcon />}
                        >
                            {saving ? 'Creating...' : 'Create Moments'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Create Moment Dialog */}
                <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AddIcon />
                            Create New Moment
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 2,
                                    border: 1,
                                    borderColor: "divider",
                                    background: (theme) => theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff'
                                }}
                            >
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                                    Moment Details
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                    <TextField
                                        label="Moment Name"
                                        value={newMomentForm.name}
                                        onChange={(e) => setNewMomentForm({ ...newMomentForm, name: e.target.value })}
                                        fullWidth
                                        required
                                        variant="outlined"
                                        placeholder="e.g., First Dance"
                                    />
                                    <TextField
                                        label="Duration (seconds)"
                                        type="number"
                                        value={newMomentForm.duration}
                                        onChange={(e) => setNewMomentForm({ ...newMomentForm, duration: parseInt(e.target.value) || 60 })}
                                        fullWidth
                                        variant="outlined"
                                        inputProps={{ min: 1, max: 3600 }}
                                    />
                                </Box>
                                <TextField
                                    label="Description"
                                    value={newMomentForm.description}
                                    onChange={(e) => setNewMomentForm({ ...newMomentForm, description: e.target.value })}
                                    fullWidth
                                    multiline
                                    rows={2}
                                    variant="outlined"
                                    sx={{ mt: 2 }}
                                    placeholder="Describe what happens in this moment..."
                                />
                            </Paper>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
                        <Button
                            onClick={() => setCreateDialogOpen(false)}
                            variant="outlined"
                            sx={{ mr: 1 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateMoment}
                            variant="contained"
                            disabled={saving || !newMomentForm.name.trim()}
                            startIcon={saving ? <CircularProgress size={16} /> : <AddIcon />}
                        >
                            {saving ? 'Creating...' : 'Create Moment'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Edit Moment Dialog */}
                <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TimeIcon />
                            Edit Moment
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2 }}>
                            {/* Basic Information Section */}
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    mb: 3,
                                    borderRadius: 2,
                                    border: 1,
                                    borderColor: "divider",
                                    background: (theme) => theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff'
                                }}
                            >
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                                    Basic Information
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                    <TextField
                                        label="Moment Name"
                                        value={newMomentForm.name}
                                        onChange={(e) => setNewMomentForm({ ...newMomentForm, name: e.target.value })}
                                        fullWidth
                                        required
                                        variant="outlined"
                                    />
                                    <TextField
                                        label="Duration (seconds)"
                                        type="number"
                                        value={newMomentForm.duration}
                                        onChange={(e) => setNewMomentForm({ ...newMomentForm, duration: parseInt(e.target.value) || 60 })}
                                        fullWidth
                                        variant="outlined"
                                        inputProps={{ min: 1, max: 3600 }}
                                    />
                                </Box>
                                <TextField
                                    label="Description"
                                    value={newMomentForm.description}
                                    onChange={(e) => setNewMomentForm({ ...newMomentForm, description: e.target.value })}
                                    fullWidth
                                    multiline
                                    rows={2}
                                    variant="outlined"
                                    sx={{ mt: 2 }}
                                    placeholder="Describe what happens in this moment..."
                                />
                            </Paper>

                            {/* Music Selection Section */}
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 2,
                                    border: 1,
                                    borderColor: "divider",
                                    background: (theme) => theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff'
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <MusicIcon sx={{ color: '#9c27b0' }} />
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                        Music
                                    </Typography>
                                </Box>

                                {/* Current Music Display */}
                                {editingMoment?.music && editingMoment.music.music_type !== 'NONE' ? (
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        p: 2,
                                        mb: 2,
                                        bgcolor: 'rgba(156, 39, 176, 0.05)',
                                        borderRadius: 1,
                                        border: '1px solid rgba(156, 39, 176, 0.2)'
                                    }}>
                                        <MusicIcon sx={{ color: '#9c27b0', fontSize: 20 }} />
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {editingMoment.music.music_name || 'Untitled'}
                                            </Typography>
                                            {editingMoment.music.artist && (
                                                <Typography variant="caption" color="text.secondary">
                                                    by {editingMoment.music.artist}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            onClick={async () => {
                                                if (!confirm('Are you sure you want to detach this music from the moment?')) return;
                                                try {
                                                    setSaving(true);
                                                    await musicApi.detachMusicFromMoment(editingMoment.id);
                                                    await fetchMoments();
                                                    // Update the editing moment to reflect the change
                                                    setEditingMoment({ ...editingMoment, music: null });
                                                    setError(null);
                                                } catch (err) {
                                                    console.error('Error detaching music:', err);
                                                    setError(err instanceof Error ? err.message : 'Failed to detach music');
                                                } finally {
                                                    setSaving(false);
                                                }
                                            }}
                                            disabled={saving}
                                            startIcon={<DeleteIcon />}
                                        >
                                            Detach Music
                                        </Button>
                                    </Box>
                                ) : (
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        No music attached to this moment.
                                    </Alert>
                                )}

                                {/* Add Music Section */}
                                {(!editingMoment?.music || editingMoment.music.music_type === 'NONE') && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            Select a music track from your library to attach to this moment.
                                        </Typography>

                                        <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                                            <InputLabel>Select Music Track</InputLabel>
                                            <Select
                                                value={selectedMusicId}
                                                onChange={(e) => setSelectedMusicId(e.target.value as number | '')}
                                                label="Select Music Track"
                                            >
                                                <MenuItem value="">
                                                    <em>Choose a track...</em>
                                                </MenuItem>
                                                {musicLibrary.map((music) => (
                                                    <MenuItem key={music.id} value={music.id}>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                {music.music_name || 'Untitled'}
                                                            </Typography>
                                                            {music.artist && (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    by {music.artist}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <Button
                                            variant="contained"
                                            startIcon={<MusicIcon />}
                                            onClick={async () => {
                                                if (!selectedMusicId) return;
                                                try {
                                                    setSaving(true);
                                                    await musicApi.attachMusicToMoment(editingMoment!.id, selectedMusicId as number);
                                                    await fetchMoments();
                                                    // Update the editing moment to reflect the change
                                                    const selectedMusic = musicLibrary.find(m => m.id === selectedMusicId);
                                                    if (selectedMusic) {
                                                        setEditingMoment({
                                                            ...editingMoment!,
                                                            music: {
                                                                music_name: selectedMusic.music_name,
                                                                artist: selectedMusic.artist,
                                                                music_type: selectedMusic.music_type
                                                            }
                                                        });
                                                    }
                                                    setSelectedMusicId('');
                                                    setError(null);
                                                } catch (err) {
                                                    console.error('Error attaching music:', err);
                                                    setError(err instanceof Error ? err.message : 'Failed to attach music');
                                                } finally {
                                                    setSaving(false);
                                                }
                                            }}
                                            disabled={!selectedMusicId || saving}
                                            sx={{ bgcolor: '#9c27b0', '&:hover': { bgcolor: '#7b1fa2' } }}
                                        >
                                            {saving ? 'Attaching...' : 'Add Music'}
                                        </Button>

                                        {musicLibrary.length === 0 && (
                                            <Alert severity="warning" sx={{ mt: 2 }}>
                                                No music tracks found in your library. Add music tracks first to assign them to moments.
                                            </Alert>
                                        )}
                                    </Box>
                                )}
                            </Paper>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
                        <Button
                            onClick={() => setEditDialogOpen(false)}
                            variant="outlined"
                            sx={{ mr: 1 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateMoment}
                            variant="contained"
                            disabled={saving || !newMomentForm.name.trim()}
                            startIcon={saving ? <CircularProgress size={16} /> : null}
                        >
                            {saving ? 'Updating...' : 'Update Moment'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </CardContent>
        </Card>
    );
};

export default MomentsManagement;
