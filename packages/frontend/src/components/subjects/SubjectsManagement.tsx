import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    CircularProgress,
    Alert,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Person as PersonIcon,
    Delete as DeleteIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { api } from '@/lib/api';
import { SubjectsLibrary, SceneSubjects, SubjectPriority, AssignSubjectToSceneDto } from '@/lib/types';
import { useBrand } from '@/app/providers/BrandProvider';

interface SubjectsManagementProps {
    sceneId: number;
    onSubjectsChange?: (subjects: SceneSubjects[]) => void;
}

const SubjectsManagement: React.FC<SubjectsManagementProps> = ({
    sceneId,
    onSubjectsChange
}) => {
    const { currentBrand } = useBrand();
    const [subjectsLibrary, setSubjectsLibrary] = useState<SubjectsLibrary[]>([]);
    const [sceneSubjects, setSceneSubjects] = useState<SceneSubjects[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
    const [selectedPriority, setSelectedPriority] = useState<SubjectPriority>(SubjectPriority.PRIMARY);
    const [adding, setAdding] = useState(false);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('🔍 Loading subjects data for scene:', sceneId);
                console.log('🏢 Current Brand:', currentBrand?.name || 'No brand selected');
                console.log('🆔 Brand ID:', currentBrand?.id || 'No brand ID');

                // Check if we have brand context
                if (!currentBrand?.id) {
                    console.warn('⚠️ No brand context available - this may cause API issues');
                    setError('No brand context available. Please select a brand.');
                    setLoading(false);
                    return;
                }

                // Load subjects library and scene subjects in parallel
                const [libraryResponse, sceneResponse] = await Promise.all([
                    api.subjects.getAll(),
                    api.subjects.getByScene(sceneId)
                ]);

                console.log('📊 Subjects Library loaded:', libraryResponse.length, 'subjects');
                console.log('📊 Scene Subjects loaded:', sceneResponse.length, 'subjects');
                console.log('📋 Library subjects:', libraryResponse.map(s => `${s.first_name} ${s.last_name} (${s.context_role})`));

                setSubjectsLibrary(libraryResponse);
                setSceneSubjects(sceneResponse);
            } catch (err) {
                console.error('❌ Error loading subjects data:', err);
                setError('Failed to load subjects data');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [sceneId, currentBrand?.id]); // Depend on both sceneId and brand ID

    // Notify parent when scene subjects change
    useEffect(() => {
        if (onSubjectsChange) {
            onSubjectsChange(sceneSubjects);
        }
    }, [sceneSubjects, onSubjectsChange]);

    // Get available subjects (not already assigned to scene)
    const getAvailableSubjects = () => {
        const assignedSubjectIds = sceneSubjects.map(ss => ss.subject_id);
        const available = subjectsLibrary.filter(subject => !assignedSubjectIds.includes(subject.id));

        console.log('🎯 Available subjects calculation:');
        console.log('   📚 Total library subjects:', subjectsLibrary.length);
        console.log('   🎬 Assigned to scene:', assignedSubjectIds.length);
        console.log('   ✅ Available for assignment:', available.length);

        return available;
    };

    // Handle adding subject to scene
    const handleAddSubject = async () => {
        if (!selectedSubject) return;

        try {
            setAdding(true);
            const assignmentData: AssignSubjectToSceneDto = {
                subject_id: selectedSubject,
                priority: selectedPriority,
                notes: undefined
            };

            const newSceneSubject = await api.subjects.assignToScene(sceneId, assignmentData);

            // Update local state - useEffect will notify parent
            setSceneSubjects(prev => [...prev, newSceneSubject]);

            // Reset form and close dialog
            setSelectedSubject(null);
            setSelectedPriority(SubjectPriority.PRIMARY);
            setAddDialogOpen(false);
        } catch (err) {
            console.error('Error adding subject to scene:', err);
            setError('Failed to add subject to scene');
        } finally {
            setAdding(false);
        }
    };

    // Handle removing subject from scene
    const handleRemoveSubject = async (subjectId: number) => {
        try {
            await api.subjects.removeFromScene(sceneId, subjectId);

            // Update local state - useEffect will notify parent
            setSceneSubjects(prev => prev.filter(ss => ss.subject_id !== subjectId));
        } catch (err) {
            console.error('Error removing subject from scene:', err);
            setError('Failed to remove subject from scene');
        }
    };

    // Get subject display name
    const getSubjectDisplayName = (subject: SubjectsLibrary) => {
        const fullName = `${subject.first_name}${subject.last_name ? ` ${subject.last_name}` : ''}`;
        return `${fullName} (${subject.context_role})`;
    };

    // Get priority color
    const getPriorityColor = (priority: SubjectPriority) => {
        switch (priority) {
            case SubjectPriority.PRIMARY:
                return 'primary';
            case SubjectPriority.SECONDARY:
                return 'secondary';
            case SubjectPriority.BACKGROUND:
                return 'default';
            default:
                return 'default';
        }
    };

    // Get subject initials for avatar
    const getSubjectInitials = (subject: SubjectsLibrary) => {
        const firstInitial = subject.first_name?.charAt(0) || '';
        const lastInitial = subject.last_name?.charAt(0) || '';
        return `${firstInitial}${lastInitial}`.toUpperCase();
    };

    if (loading) {
        return (
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <PersonIcon sx={{ color: 'warning.main', mr: 1 }} />
                        <Typography variant="h6">Scene Subjects</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress />
                    </Box>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon sx={{ color: 'warning.main', mr: 1 }} />
                            <Typography variant="h6">Scene Subjects</Typography>
                            <Chip
                                label={sceneSubjects.length}
                                size="small"
                                color="warning"
                                sx={{ ml: 1 }}
                            />
                        </Box>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                console.log('🔘 Add Subject button clicked!');
                                console.log('📊 Available subjects:', getAvailableSubjects().length);
                                setAddDialogOpen(true);
                            }}
                            disabled={getAvailableSubjects().length === 0}
                        >
                            Add Subject
                        </Button>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {sceneSubjects.length === 0 ? (
                        <Box
                            sx={{
                                textAlign: 'center',
                                py: 3,
                                border: '1px dashed',
                                borderColor: 'grey.300',
                                borderRadius: 1,
                                bgcolor: 'grey.50'
                            }}
                        >
                            <PersonIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                                No subjects assigned to this scene
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Add subjects to track who appears in this scene
                            </Typography>
                        </Box>
                    ) : (
                        <List dense>
                            {sceneSubjects.map((sceneSubject) => (
                                <ListItem
                                    key={sceneSubject.id}
                                    sx={{
                                        border: '1px solid',
                                        borderColor: 'grey.200',
                                        borderRadius: 1,
                                        mb: 1,
                                        bgcolor: 'background.paper'
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            mr: 2,
                                            bgcolor: `${getPriorityColor(sceneSubject.priority)}.main`,
                                            fontSize: '0.75rem'
                                        }}
                                    >
                                        {getSubjectInitials(sceneSubject.subject)}
                                    </Avatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {getSubjectDisplayName(sceneSubject.subject)}
                                                </Typography>
                                                <Chip
                                                    label={sceneSubject.priority}
                                                    size="small"
                                                    color={getPriorityColor(sceneSubject.priority)}
                                                    variant="outlined"
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Typography variant="caption" color="text.secondary">
                                                {sceneSubject.subject.appearance_notes || 'No appearance notes'}
                                            </Typography>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Tooltip title="Remove from scene">
                                            <IconButton
                                                edge="end"
                                                size="small"
                                                onClick={() => handleRemoveSubject(sceneSubject.subject_id)}
                                                color="error"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </CardContent>
            </Card>

            {/* Add Subject Dialog */}
            <Dialog
                open={addDialogOpen}
                onClose={() => {
                    console.log('🔘 Dialog closing');
                    setAddDialogOpen(false);
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        Add Subject to Scene
                        <IconButton onClick={() => {
                            console.log('🔘 Close button clicked');
                            setAddDialogOpen(false);
                        }} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Select Subject</InputLabel>
                            <Select
                                value={selectedSubject || ''}
                                onChange={(e) => setSelectedSubject(e.target.value as number)}
                                label="Select Subject"
                            >
                                {getAvailableSubjects().map((subject) => (
                                    <MenuItem key={subject.id} value={subject.id}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                                                {getSubjectInitials(subject)}
                                            </Avatar>
                                            {getSubjectDisplayName(subject)}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Priority Level</InputLabel>
                            <Select
                                value={selectedPriority}
                                onChange={(e) => setSelectedPriority(e.target.value as SubjectPriority)}
                                label="Priority Level"
                            >
                                <MenuItem value={SubjectPriority.PRIMARY}>
                                    <Chip label="Primary" color="primary" size="small" sx={{ mr: 1 }} />
                                    Main focus of the scene
                                </MenuItem>
                                <MenuItem value={SubjectPriority.SECONDARY}>
                                    <Chip label="Secondary" color="secondary" size="small" sx={{ mr: 1 }} />
                                    Important but not main focus
                                </MenuItem>
                                <MenuItem value={SubjectPriority.BACKGROUND}>
                                    <Chip label="Background" color="default" size="small" sx={{ mr: 1 }} />
                                    Appears in background
                                </MenuItem>
                            </Select>
                        </FormControl>

                        {getAvailableSubjects().length === 0 && (
                            <Alert severity="info">
                                All subjects from the library are already assigned to this scene.
                            </Alert>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleAddSubject}
                        variant="contained"
                        disabled={!selectedSubject || adding}
                        startIcon={adding ? <CircularProgress size={16} /> : <AddIcon />}
                    >
                        {adding ? 'Adding...' : 'Add Subject'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default SubjectsManagement;
