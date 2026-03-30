import React from 'react';
import { Box, Button, Card, CardContent, Chip, Grid, IconButton, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, VideoCall as ProductionIcon, Schedule as ScheduleIcon, Camera as CameraIcon, Videocam as FilmIcon } from '@mui/icons-material';
import { Project } from '@/features/workflow/projects/types/project.types';
import { InstanceScheduleEditor } from '@/features/workflow/scheduling/instance';
import { useProjectProduction } from '../../hooks/useProjectProduction';

interface ProductionTabProps { project: Project; onRefresh?: () => void; }

const SHOT_TYPES = [
    { label: 'Ceremony', color: '#8b5cf6', icon: <CameraIcon /> },
    { label: 'Reception', color: '#06b6d4', icon: <ProductionIcon /> },
    { label: 'Preparation', color: '#10b981', icon: <ScheduleIcon /> },
    { label: 'Portraits', color: '#f59e0b', icon: <CameraIcon /> },
    { label: 'B-Roll', color: '#ef4444', icon: <CameraIcon /> },
    { label: 'Other', color: '#6b7280', icon: <ProductionIcon /> },
];

export default function ProductionTab({ project, onRefresh }: ProductionTabProps) {
    const { eventDays, projectFilms, loading, error, syncing, handleSyncFromPackage, deleteProjectFilm } = useProjectProduction(project);

    return <Box>{error && <Box sx={{ mb: 3 }}><Typography color="error">{error}</Typography></Box>}<Card sx={{ mb: 3, borderRadius: 3, background: 'rgba(16, 18, 22, 0.95)', border: '1px solid rgba(52, 58, 68, 0.3)' }}><CardContent sx={{ p: 3 }}><Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}><Typography variant="h5" sx={{ fontWeight: 700, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: 1 }}><ProductionIcon sx={{ color: '#9ca3af' }} />Production</Typography><Button startIcon={<AddIcon />} variant="contained" onClick={handleSyncFromPackage} disabled={syncing || !project.source_package_id}>{syncing ? 'Syncing...' : 'Sync From Package'}</Button></Box><Box sx={{ mb: 2 }}><Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography variant="body2" sx={{ color: '#9ca3af' }}>Project Films</Typography><Typography variant="body2" sx={{ color: '#9ca3af' }}>{projectFilms.length}</Typography></Box><LinearProgress variant="determinate" value={projectFilms.length === 0 ? 0 : 100} sx={{ height: 8, borderRadius: 4 }} /></Box><Grid container spacing={2}>{SHOT_TYPES.map((type) => <Grid item xs={6} sm={2} key={type.label}><Card variant="outlined" sx={{ background: 'rgba(30, 41, 59, 0.5)' }}><CardContent sx={{ py: 2, textAlign: 'center' }}><Box sx={{ color: type.color, display: 'flex', justifyContent: 'center', mb: 1 }}>{type.icon}</Box><Typography variant="body2" sx={{ color: '#9ca3af' }}>{type.label}</Typography></CardContent></Card></Grid>)}</Grid></CardContent></Card><Card sx={{ mb: 3, borderRadius: 3, background: 'rgba(16, 18, 22, 0.95)', border: '1px solid rgba(52, 58, 68, 0.3)' }}><CardContent sx={{ p: 3 }}><Typography variant="h6" sx={{ mb: 2, color: '#f3f4f6' }}>Schedule</Typography><InstanceScheduleEditor key={`schedule-${project.id}`} owner={{ type: 'project', id: project.id }} sourcePackageId={project.source_package_id} onSyncFromPackage={handleSyncFromPackage} syncing={syncing} /></CardContent></Card><Card sx={{ borderRadius: 3, background: 'rgba(16, 18, 22, 0.95)', border: '1px solid rgba(52, 58, 68, 0.3)' }}><CardContent sx={{ p: 3 }}><TableContainer><Table size="small"><TableHead><TableRow><TableCell>Film</TableCell><TableCell>Event Days</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{loading ? <TableRow><TableCell colSpan={3}><Typography color="text.secondary">Loading production data...</Typography></TableCell></TableRow> : projectFilms.length === 0 ? <TableRow><TableCell colSpan={3}><Typography color="text.secondary">No project films found.</Typography></TableCell></TableRow> : projectFilms.map((film) => <TableRow key={film.id} hover><TableCell><Typography fontWeight={600}>{film.film?.name || `Film ${film.film_id}`}</Typography></TableCell><TableCell>{eventDays.length}</TableCell><TableCell align="right"><IconButton color="error" onClick={() => deleteProjectFilm(film.id)}><DeleteIcon /></IconButton></TableCell></TableRow>)}</TableBody></Table></TableContainer></CardContent></Card></Box>;
}
