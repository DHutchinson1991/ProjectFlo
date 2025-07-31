import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    FormControlLabel,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    Stack,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Work as WorkIcon,
    Delete as DeleteIcon,
    Star as StarIcon,
    StarBorder as StarBorderIcon,
} from '@mui/icons-material';

// Types
interface JobRole {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    category?: string;
    is_active: boolean;
}

interface ContributorJobRole {
    id: number;
    contributor_id: number;
    job_role_id: number;
    is_primary: boolean;
    assigned_at: string;
    job_role: JobRole;
}

interface JobRolesManagerProps {
    contributorId: number;
    onUpdate?: () => void;
}

const JobRolesManager: React.FC<JobRolesManagerProps> = ({ contributorId, onUpdate }) => {
    const [availableJobRoles, setAvailableJobRoles] = useState<JobRole[]>([]);
    const [contributorJobRoles, setContributorJobRoles] = useState<ContributorJobRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedJobRoleId, setSelectedJobRoleId] = useState<number | ''>('');
    const [isPrimary, setIsPrimary] = useState(false);

    // Load data
    useEffect(() => {
        loadData();
    }, [contributorId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load all available job roles
            const jobRolesResponse = await fetch('http://localhost:3002/job-roles');
            if (!jobRolesResponse.ok) throw new Error('Failed to load job roles');
            const jobRoles = await jobRolesResponse.json();

            // Load contributor's current job roles
            const contributorRolesResponse = await fetch(`http://localhost:3002/job-roles/contributor/${contributorId}/assignments`);
            if (!contributorRolesResponse.ok) throw new Error('Failed to load contributor job roles');
            const contributorRoles = await contributorRolesResponse.json();

            setAvailableJobRoles(jobRoles);
            setContributorJobRoles(contributorRoles);
        } catch (err) {
            console.error('Error loading job roles:', err);
            setError('Failed to load job roles');
        } finally {
            setLoading(false);
        }
    };

    const handleAddJobRole = async () => {
        if (!selectedJobRoleId) return;

        try {
            setSaving(true);
            const response = await fetch('http://localhost:3002/job-roles/assignments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contributor_id: contributorId,
                    job_role_id: selectedJobRoleId,
                    is_primary: isPrimary,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to assign job role');
            }

            await loadData();
            setSuccess('Job role assigned successfully');
            setDialogOpen(false);
            setSelectedJobRoleId('');
            setIsPrimary(false);

            if (onUpdate) onUpdate();
        } catch (err: unknown) {
            console.error('Error assigning job role:', err);
            setError(err instanceof Error ? err.message : 'Failed to assign job role');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveJobRole = async (jobRoleId: number) => {
        if (!confirm('Are you sure you want to remove this job role?')) return;

        try {
            setSaving(true);
            const response = await fetch(`http://localhost:3002/job-roles/contributor/${contributorId}/job-role/${jobRoleId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to remove job role');

            await loadData();
            setSuccess('Job role removed successfully');

            if (onUpdate) onUpdate();
        } catch (err) {
            console.error('Error removing job role:', err);
            setError('Failed to remove job role');
        } finally {
            setSaving(false);
        }
    };

    const handleTogglePrimary = async (jobRoleId: number, currentIsPrimary: boolean) => {
        try {
            setSaving(true);
            const response = await fetch(`http://localhost:3002/job-roles/contributor/${contributorId}/job-role/${jobRoleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    is_primary: !currentIsPrimary,
                }),
            });

            if (!response.ok) throw new Error('Failed to update job role');

            await loadData();
            setSuccess(currentIsPrimary ? 'Primary role removed' : 'Primary role set');

            if (onUpdate) onUpdate();
        } catch (err) {
            console.error('Error updating job role:', err);
            setError('Failed to update job role');
        } finally {
            setSaving(false);
        }
    };

    // Get available job roles that aren't already assigned
    const getAvailableJobRoles = () => {
        const assignedJobRoleIds = contributorJobRoles.map(cjr => cjr.job_role_id);
        return availableJobRoles.filter(jr => !assignedJobRoleIds.includes(jr.id));
    };

    // Group job roles by category for display
    const getJobRolesByCategory = () => {
        const grouped: Record<string, ContributorJobRole[]> = {};
        contributorJobRoles.forEach(cjr => {
            const category = cjr.job_role.category || 'uncategorized';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(cjr);
        });
        return grouped;
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            'production': 'primary',
            'creative': 'secondary',
            'technical': 'info',
            'post-production': 'success',
            'uncategorized': 'default',
        };
        return colors[category] || 'default';
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WorkIcon color="primary" />
                    Jobs & Skills
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setDialogOpen(true)}
                    disabled={saving || getAvailableJobRoles().length === 0}
                >
                    Add Job Role
                </Button>
            </Box>

            {/* Alerts */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {/* Job Roles Display */}
            {contributorJobRoles.length === 0 ? (
                <Card>
                    <CardContent>
                        <Box textAlign="center" py={4}>
                            <WorkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No Job Roles Assigned
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={3}>
                                Add job roles to define what this contributor can do
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setDialogOpen(true)}
                                disabled={getAvailableJobRoles().length === 0}
                            >
                                Add First Job Role
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            ) : (
                <Grid container spacing={2}>
                    {Object.entries(getJobRolesByCategory()).map(([category, roles]) => (
                        <Grid item xs={12} key={category}>
                            <Card>
                                <CardContent>
                                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                                        {category.replace('-', ' ')} ({roles.length})
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                                        {roles.map((contributorJobRole) => (
                                            <Box key={contributorJobRole.id} position="relative">
                                                <Chip
                                                    label={contributorJobRole.job_role.display_name}
                                                    color={getCategoryColor(category) as 'primary' | 'secondary' | 'info' | 'success' | 'default'}
                                                    variant={contributorJobRole.is_primary ? "filled" : "outlined"}
                                                    icon={contributorJobRole.is_primary ? <StarIcon /> : undefined}
                                                    onDelete={saving ? undefined : () => handleRemoveJobRole(contributorJobRole.job_role_id)}
                                                    deleteIcon={<DeleteIcon />}
                                                    sx={{
                                                        mr: 1,
                                                        mb: 1,
                                                        '& .MuiChip-label': {
                                                            fontWeight: contributorJobRole.is_primary ? 600 : 400
                                                        }
                                                    }}
                                                />
                                                <Tooltip
                                                    title={contributorJobRole.is_primary ? "Remove as primary role" : "Set as primary role"}
                                                    arrow
                                                >
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleTogglePrimary(contributorJobRole.job_role_id, contributorJobRole.is_primary)}
                                                        disabled={saving}
                                                        sx={{
                                                            position: 'absolute',
                                                            top: -8,
                                                            right: 24,
                                                            backgroundColor: 'background.paper',
                                                            border: 1,
                                                            borderColor: 'divider',
                                                            width: 20,
                                                            height: 20,
                                                            '&:hover': {
                                                                backgroundColor: 'action.hover',
                                                            }
                                                        }}
                                                    >
                                                        {contributorJobRole.is_primary ?
                                                            <StarIcon sx={{ fontSize: 12, color: 'warning.main' }} /> :
                                                            <StarBorderIcon sx={{ fontSize: 12 }} />
                                                        }
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        ))}
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Add Job Role Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Add Job Role</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Select Job Role</InputLabel>
                                <Select
                                    value={selectedJobRoleId}
                                    label="Select Job Role"
                                    onChange={(e) => setSelectedJobRoleId(e.target.value as number)}
                                >
                                    {getAvailableJobRoles().map((jobRole) => (
                                        <MenuItem key={jobRole.id} value={jobRole.id}>
                                            <Box>
                                                <Typography variant="body1">
                                                    {jobRole.display_name}
                                                </Typography>
                                                {jobRole.description && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {jobRole.description}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={isPrimary}
                                        onChange={(e) => setIsPrimary(e.target.checked)}
                                    />
                                }
                                label="Set as primary role"
                            />
                            <Typography variant="caption" color="text.secondary" display="block">
                                The primary role will be prominently displayed and used for default assignments
                            </Typography>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleAddJobRole}
                        disabled={saving || !selectedJobRoleId}
                        startIcon={saving ? <CircularProgress size={16} /> : <AddIcon />}
                    >
                        {saving ? 'Adding...' : 'Add Job Role'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default JobRolesManager;
