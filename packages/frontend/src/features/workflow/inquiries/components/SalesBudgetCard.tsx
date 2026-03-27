'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    CardContent,
    Stack,
    Grid,
    TextField,
    IconButton,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    AttachMoney,
    Edit,
    CheckCircle,
    Schedule,
} from '@mui/icons-material';
import { Inquiry, NeedsAssessmentSubmission } from '@/features/workflow/inquiries/types';
import { inquiriesApi } from '@/features/workflow/inquiries';

interface SalesBudgetCardProps {
    inquiry: Inquiry & { activity_logs?: unknown[] };
    onRefresh?: () => Promise<void>;
    isActive?: boolean;
    activeColor?: string;
    submission?: NeedsAssessmentSubmission | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    WorkflowCard: React.ComponentType<any>;
}

const SalesBudgetCard: React.FC<SalesBudgetCardProps> = ({
    inquiry,
    onRefresh,
    isActive,
    activeColor,
    submission,
    WorkflowCard,
}) => {
    const [isEditing, setIsEditing] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responses = (submission?.responses ?? {}) as Record<string, any>;

    const [formData, setFormData] = useState({
        budget_range: inquiry.budget_range || responses.budget_range || '',
        priority_level: responses.priority_level || '',
        decision_timeline: responses.decision_timeline || '',
    });

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = (submission?.responses ?? {}) as Record<string, any>;
        setFormData({
            budget_range: inquiry.budget_range || r.budget_range || '',
            priority_level: r.priority_level || '',
            decision_timeline: r.decision_timeline || '',
        });
    }, [inquiry, submission]);

    const handleSave = async () => {
        try {
            await inquiriesApi.update(inquiry.id, { notes: inquiry.notes ?? undefined });
            setIsEditing(false);
            if (onRefresh) await onRefresh();
        } catch (error) {
            console.error('Failed to update budget:', error);
            alert('Failed to update budget');
        }
    };

    const priorityColor = (level: string) => {
        switch (level) {
            case 'High':   return 'error';
            case 'Medium': return 'warning';
            default:       return 'default';
        }
    };

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachMoney /> Budget
                    </Typography>
                    <IconButton size="small" onClick={() => (isEditing ? handleSave() : setIsEditing(true))}>
                        {isEditing ? <CheckCircle color="primary" /> : <Edit />}
                    </IconButton>
                </Box>

                {isEditing ? (
                    <Stack spacing={2}>
                        <TextField
                            label="Budget Range"
                            fullWidth size="small"
                            value={formData.budget_range}
                            onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>Priority Level</InputLabel>
                            <Select
                                value={formData.priority_level}
                                label="Priority Level"
                                onChange={(e) => setFormData({ ...formData, priority_level: e.target.value })}
                            >
                                <MenuItem value="">None</MenuItem>
                                <MenuItem value="Low">Low</MenuItem>
                                <MenuItem value="Medium">Medium</MenuItem>
                                <MenuItem value="High">High</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="Decision Timeline"
                            fullWidth size="small"
                            value={formData.decision_timeline}
                            onChange={(e) => setFormData({ ...formData, decision_timeline: e.target.value })}
                        />
                    </Stack>
                ) : (
                    <Stack spacing={2}>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                    PRIORITY
                                </Typography>
                                <Chip
                                    label={formData.priority_level || 'Not set'}
                                    size="small"
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    color={priorityColor(formData.priority_level) as any}
                                    variant={formData.priority_level ? 'filled' : 'outlined'}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                    BUDGET
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {formData.budget_range || '-'}
                                </Typography>
                            </Grid>
                        </Grid>

                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                DECISION TIMELINE
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Schedule fontSize="small" color="action" sx={{ fontSize: '0.9rem' }} />
                                <Typography variant="body2">{formData.decision_timeline || '-'}</Typography>
                            </Box>
                        </Box>
                    </Stack>
                )}
            </CardContent>
        </WorkflowCard>
    );
};

export default SalesBudgetCard;
