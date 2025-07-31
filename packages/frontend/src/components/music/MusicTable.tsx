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
import { MusicType, formatDuration } from "@/lib/types/moments";

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
}

interface MusicTableProps {
    musicItems: MusicItem[];
    onAddMusic: () => void;
    onEditMusic: (item: MusicItem) => void;
    onRemoveMusic: (item: MusicItem) => void;
    onAttachToMoment: (item: MusicItem) => void;
    onDetachFromMoment: (item: MusicItem) => void;
}

const MusicTable: React.FC<MusicTableProps> = ({
    musicItems,
    onAddMusic,
    onEditMusic,
    onRemoveMusic,
    onAttachToMoment,
    onDetachFromMoment,
}) => {
    const getMusicTypeColor = (type: MusicType) => {
        switch (type) {
            case 'ORCHESTRAL': return '#7b1fa2';  // Purple 700
            case 'PIANO': return '#8e24aa';       // Purple 600
            case 'MODERN': return '#9c27b0';      // Purple 500
            case 'VINTAGE': return '#ab47bc';     // Purple 400
            case 'SCENE_MATCHED': return '#ba68c8'; // Purple 300
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
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MusicNoteIcon sx={{ color: '#9c27b0' }} />
                            Music Library
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
                                        backgroundColor: 'rgba(156, 39, 176, 0.04)',
                                        '& .MuiTableCell-head': {
                                            fontWeight: 600,
                                            fontSize: '0.875rem',
                                            color: 'text.primary',
                                            borderBottom: '2px solid',
                                            borderColor: 'divider'
                                        }
                                    }}
                                >
                                    <TableCell sx={{ width: '70px' }}>Label</TableCell>
                                    <TableCell sx={{ width: '150px' }}>Music Name</TableCell>
                                    <TableCell sx={{ width: '120px' }}>Artist</TableCell>
                                    <TableCell sx={{ width: '100px' }}>Type</TableCell>
                                    <TableCell sx={{ width: '80px' }}>Duration</TableCell>
                                    <TableCell sx={{ width: '120px' }}>Attached To</TableCell>
                                    <TableCell align="right" sx={{ width: '50px' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {musicItems.map((item, index) => (
                                    <TableRow
                                        key={index}
                                        onClick={() => onEditMusic(item)}
                                        hover
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': {
                                                backgroundColor: 'rgba(156, 39, 176, 0.08)',
                                                transform: 'translateY(-1px)',
                                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                            },
                                            transition: 'all 0.2s ease-in-out',
                                            '& .MuiTableCell-root': {
                                                padding: '12px 8px',
                                                borderBottom: '1px solid rgba(224, 224, 224, 0.5)'
                                            }
                                        }}
                                    >
                                        <TableCell>
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
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {item.music_name || 'Untitled'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {item.artist || 'Unknown Artist'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
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
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {item.duration ? formatDuration(item.duration) : 'N/A'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {item.moment_name ? (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
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
                                                                '&:hover': {
                                                                    backgroundColor: 'rgba(244, 67, 54, 0.08)'
                                                                }
                                                            }}
                                                        >
                                                            <ClearIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Box>
                                                    {item.scene_name && (
                                                        <Typography variant="caption" sx={{
                                                            fontSize: '0.65rem',
                                                            color: 'text.secondary',
                                                            fontStyle: 'italic'
                                                        }}>
                                                            in {item.scene_name}
                                                        </Typography>
                                                    )}
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
                                                    Attach to Moment
                                                </Button>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditMusic(item);
                                                    }}
                                                    sx={{
                                                        color: '#9c27b0',
                                                        '&:hover': { backgroundColor: 'rgba(156, 39, 176, 0.08)' }
                                                    }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRemoveMusic(item);
                                                    }}
                                                    sx={{
                                                        color: 'error.main',
                                                        '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.08)' }
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
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
