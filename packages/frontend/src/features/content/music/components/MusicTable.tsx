"use client";

import React from "react";
import {
    Card,
    CardContent,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Alert,
    Box,
    Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import EditIcon from '@mui/icons-material/Edit';
import ClearIcon from '@mui/icons-material/Clear';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { MusicType, formatDuration } from "@/features/content/moments/types/moments-legacy";
import {
    useSensor,
    useSensors,
    PointerSensor,
    KeyboardSensor,
} from '@dnd-kit/core';
import {
    useSortable,
} from '@dnd-kit/sortable';
import { CSS as DndCSS } from '@dnd-kit/utilities';

interface MusicItem {
    id?: number;
    assignment_number?: string;
    music_name?: string;
    artist?: string;
    duration?: number;
    music_type: MusicType;
    file_path?: string;
    notes?: string;
    moment_id?: number;
    moment_name?: string;
    scene_name?: string;
    isAttached?: boolean;
}

interface SortableMusicRowProps {
    item: MusicItem;
    index: number;
    onEdit: (item: MusicItem) => void;
    onRemove: (item: MusicItem) => void;
    onAttachToMoment: (item: MusicItem) => void;
    onDetachFromMoment: (item: MusicItem) => void;
}

const SortableMusicRow: React.FC<SortableMusicRowProps> = ({
    item,
    index,
    onEdit,
    onRemove,
    onAttachToMoment,
    onDetachFromMoment,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ 
        id: item.id || index,
        data: { type: 'music', item }
    });

    const style = {
        transform: DndCSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const getMusicTypeColor = (type: MusicType) => {
        switch (type) {
            case 'ORCHESTRAL': return '#7b1fa2';
            case 'PIANO': return '#8e24aa';
            case 'MODERN': return '#9c27b0';
            case 'VINTAGE': return '#ab47bc';
            case 'SCENE_MATCHED': return '#ba68c8';
            default: return '#757575';
        }
    };

    const getMusicTypeLabel = (type: MusicType) => {
        switch (type) {
            case 'ORCHESTRAL': return 'Orchestral';
            case 'PIANO': return 'Piano';
            case 'MODERN': return 'Modern';
            case 'VINTAGE': return 'Vintage';
            case 'SCENE_MATCHED': return 'Scene Matched';
            case 'NONE': return 'None';
            default: return type;
        }
    };

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            sx={{
                cursor: isDragging ? 'grabbing' : 'grab',
                backgroundColor: isDragging ? 'rgba(156, 39, 176, 0.12)' : 'transparent',
                opacity: item.isAttached === false ? 0.7 : 1,
                '&:hover': {
                    backgroundColor: isDragging ? 'rgba(156, 39, 176, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                },
                transition: 'all 0.2s ease-in-out',
                borderBottom: '1px solid rgba(224, 224, 224, 0.15)',
                '& .MuiTableCell-root': {
                    padding: '12px 8px',
                    color: 'text.primary',
                }
            }}
        >
            <TableCell sx={{ width: '40px', textAlign: 'center', cursor: isDragging ? 'grabbing' : 'grab' }} {...attributes} {...listeners}>
                <DragIndicatorIcon sx={{ fontSize: 18, color: '#9c27b0', opacity: 0.7 }} />
            </TableCell>
            <TableCell sx={{ width: '70px' }}>
                <Chip
                    label={item.assignment_number || `M${index + 1}`}
                    size="small"
                    sx={{
                        backgroundColor: '#9c27b0',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        minWidth: '48px'
                    }}
                />
            </TableCell>
            <TableCell sx={{ width: '150px' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, textDecoration: item.isAttached === false ? 'line-through' : 'none' }}>
                    {item.music_name || 'Untitled'}
                </Typography>
                {item.isAttached === false && (
                    <Chip label="Unattached" size="small" variant="outlined" sx={{ mt: 0.5, fontSize: '0.65rem', borderColor: '#ff9800', color: '#ff9800' }} />
                )}
            </TableCell>
            <TableCell sx={{ width: '120px' }}>
                <Typography variant="body2" color="text.secondary">
                    {item.artist || 'Unknown Artist'}
                </Typography>
            </TableCell>
            <TableCell sx={{ width: '100px' }}>
                <Chip
                    label={getMusicTypeLabel(item.music_type)}
                    size="small"
                    sx={{
                        backgroundColor: getMusicTypeColor(item.music_type),
                        color: 'white',
                        fontWeight: 500,
                        fontSize: '0.75rem'
                    }}
                />
            </TableCell>
            <TableCell sx={{ width: '80px' }}>
                <Typography variant="body2" color="text.secondary">
                    {item.duration ? formatDuration(item.duration) : 'N/A'}
                </Typography>
            </TableCell>
            <TableCell sx={{ width: '120px' }}>
                {item.moment_name ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                            label={item.moment_name}
                            size="small"
                            variant="outlined"
                            sx={{
                                fontSize: '0.75rem',
                                borderColor: '#9c27b0',
                                color: '#9c27b0',
                                fontWeight: 500
                            }}
                        />
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDetachFromMoment(item);
                            }}
                            sx={{
                                color: '#f44336',
                                padding: '4px',
                                '&:hover': {
                                    backgroundColor: 'rgba(244, 67, 54, 0.08)'
                                }
                            }}
                        >
                            <ClearIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Box>
                ) : (
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAttachToMoment(item);
                        }}
                        sx={{
                            fontSize: '0.75rem',
                            py: 0.5,
                            borderColor: '#9c27b0',
                            color: '#9c27b0',
                            '&:hover': {
                                borderColor: '#7b1fa2',
                                backgroundColor: 'rgba(156, 39, 176, 0.08)'
                            }
                        }}
                    >
                        ATTACH TO MOMENT
                    </Button>
                )}
            </TableCell>
            <TableCell align="right" sx={{ width: '80px' }}>
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(item);
                        }}
                        sx={{
                            color: '#9c27b0',
                            padding: '4px',
                            '&:hover': { backgroundColor: 'rgba(156, 39, 176, 0.08)' }
                        }}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(item);
                        }}
                        sx={{
                            color: 'error.main',
                            padding: '4px',
                            '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.08)' }
                        }}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            </TableCell>
        </TableRow>
    );
};

interface MusicTableProps {
    musicItems: MusicItem[];
    title?: string;
    onAddMusic: () => void;
    onEditMusic: (item: MusicItem) => void;
    onRemoveMusic: (item: MusicItem) => void;
    onAttachToMoment: (item: MusicItem) => void;
    onDetachFromMoment: (item: MusicItem) => void;
    onReorderMusic?: (items: MusicItem[]) => void;
}

const MusicTable: React.FC<MusicTableProps> = ({
    musicItems,
    title = 'Music Library',
    onAddMusic,
    onEditMusic,
    onRemoveMusic,
    onAttachToMoment,
    onDetachFromMoment,
    onReorderMusic,
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: (event, { currentCoordinates }) => {
                switch (event.code) {
                    case 'ArrowDown':
                    case 'ArrowUp':
                    case 'ArrowLeft':
                    case 'ArrowRight':
                    case 'Space':
                    case 'Enter':
                        event.preventDefault();
                        return { ...currentCoordinates };
                    default:
                        return undefined;
                }
            },
        })
    );

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MusicNoteIcon sx={{ color: '#9c27b0' }} />
                            {title}
                        </Typography>
                        <Chip
                            label={`${musicItems.length} ${musicItems.length === 1 ? 'track' : 'tracks'}`}
                            size="small"
                            variant="outlined"
                            sx={{
                                fontWeight: 600,
                                bgcolor: 'rgba(156, 39, 176, 0.04)',
                                borderColor: '#9c27b0',
                                color: '#9c27b0'
                            }}
                        />
                    </Box>
                    <Button
                        variant="outlined"
                        onClick={onAddMusic}
                        startIcon={<MusicNoteIcon />}
                        size="small"
                        sx={{
                            fontWeight: 600,
                            borderWidth: 2,
                            borderColor: '#9c27b0',
                            color: '#9c27b0',
                            '&:hover': {
                                borderWidth: 2,
                                borderColor: '#7b1fa2',
                                backgroundColor: 'rgba(156, 39, 176, 0.08)'
                            }
                        }}
                    >
                        Add Music
                    </Button>
                </Box>

                {musicItems.length === 0 ? (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        No music tracks added yet. Click &quot;Add Music&quot; to create your first music entry.
                    </Alert>
                ) : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead>
                                <TableRow
                                    sx={{
                                        backgroundColor: 'transparent',
                                        '& .MuiTableCell-head': {
                                            fontWeight: 600,
                                            fontSize: '0.875rem',
                                            color: 'text.primary',
                                            borderBottom: '1px solid rgba(224, 224, 224, 0.3)',
                                            padding: '12px 8px'
                                        }
                                    }}
                                >
                                    <TableCell sx={{ width: '40px' }}></TableCell>
                                    <TableCell sx={{ width: '70px' }}>Label</TableCell>
                                    <TableCell sx={{ width: '150px' }}>Music Name</TableCell>
                                    <TableCell sx={{ width: '120px' }}>Artist</TableCell>
                                    <TableCell sx={{ width: '100px' }}>Type</TableCell>
                                    <TableCell sx={{ width: '80px' }}>Duration</TableCell>
                                    <TableCell sx={{ width: '120px' }}>Attached To</TableCell>
                                    <TableCell align="right" sx={{ width: '80px' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {musicItems.map((item, index) => (
                                    <SortableMusicRow
                                        key={item.id || index}
                                        item={item}
                                        index={index}
                                        onEdit={onEditMusic}
                                        onRemove={onRemoveMusic}
                                        onAttachToMoment={onAttachToMoment}
                                        onDetachFromMoment={onDetachFromMoment}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </CardContent>
        </Card>
    );
};

export default MusicTable;
