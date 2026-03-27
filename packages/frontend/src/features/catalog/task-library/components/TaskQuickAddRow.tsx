"use client";

import React from "react";
import {
    TextField,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    Switch,
    Box,
    Typography,
} from "@mui/material";
import {
    Save as SaveIcon,
    Cancel as CancelIcon,
} from "@mui/icons-material";
import { TIER_LABELS, TIER_COLORS, resolveHighestBracket } from "@/shared/utils/tierRate";
import { TaskLibrary, JobRole, SkillRoleMapping, TriggerType, TRIGGER_TYPE_LABELS } from "@/features/catalog/task-library/types";
import { DEFAULT_CURRENCY, formatCurrency } from "@projectflo/shared";
import { GRID_COLS } from "../constants";

interface StageOption {
    id: number;
    name: string;
}

interface TaskQuickAddRowProps {
    quickAddData: Partial<TaskLibrary>;
    updateQuickAddData: (field: keyof TaskLibrary, value: unknown) => void;
    saveQuickAdd: () => void;
    cancelQuickAdd: () => void;
    jobRoles: JobRole[];
    allMappings: SkillRoleMapping[];
    stages: StageOption[];
}

const inputSx = {
    '& .MuiOutlinedInput-root': {
        bgcolor: 'rgba(255,255,255,0.06)',
        borderRadius: 1,
        '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
        '&.Mui-focused fieldset': { borderColor: 'primary.main' },
    },
    '& .MuiInputBase-input': { color: '#fff', fontSize: '0.75rem', py: 0.75, px: 1 },
} as const;

const selectSx = {
    bgcolor: 'rgba(255,255,255,0.06)',
    borderRadius: 1,
    fontSize: '0.72rem',
    height: 30,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
    '& .MuiSelect-select': { color: '#fff', fontSize: '0.72rem', py: 0.5 },
    '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.3)', fontSize: 14 },
} as const;

const dash = <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', fontStyle: 'italic' }}>—</Typography>;

export function TaskQuickAddRow({
    quickAddData,
    updateQuickAddData,
    saveQuickAdd,
    cancelQuickAdd,
    jobRoles,
    allMappings,
    stages,
}: TaskQuickAddRowProps) {
    const roleId = quickAddData.default_job_role_id;
    const highest = roleId ? resolveHighestBracket(roleId, allMappings) : null;
    const tierLevel = highest?.level ?? 0;

    return (
        <Box
            display="grid"
            gridTemplateColumns={GRID_COLS}
            sx={{
                alignItems: 'center',
                minHeight: 48,
                px: 0.5,
                py: 0.75,
                bgcolor: 'rgba(100, 255, 218, 0.04)',
                borderBottom: '1px solid rgba(100, 255, 218, 0.12)',
                borderLeft: '3px solid rgba(100, 255, 218, 0.4)',
            }}
        >
            {/* spacer */}
            <Box />
            {/* drag handle spacer */}
            <Box />

            {/* Task Name + Description + Parent Stage */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pr: 1, overflow: 'hidden' }}>
                <TextField
                    fullWidth
                    placeholder="Task name"
                    value={quickAddData.name || ''}
                    onChange={(e) => updateQuickAddData('name', e.target.value)}
                    size="small"
                    variant="outlined"
                    autoFocus
                    sx={inputSx}
                />
                <TextField
                    fullWidth
                    placeholder="Description (optional)"
                    value={quickAddData.description || ''}
                    onChange={(e) => updateQuickAddData('description', e.target.value)}
                    size="small"
                    variant="outlined"
                    sx={inputSx}
                />
                {stages.length > 0 && (
                    <FormControl size="small" fullWidth>
                        <Select
                            value={quickAddData.parent_task_id ?? ''}
                            displayEmpty
                            onChange={(e) => {
                                const val = e.target.value === '' ? null : Number(e.target.value);
                                updateQuickAddData('parent_task_id', val);
                            }}
                            sx={selectSx}
                        >
                            <MenuItem value="">
                                <em style={{ color: 'rgba(255,255,255,0.4)' }}>No parent stage</em>
                            </MenuItem>
                            {stages.map((stage) => (
                                <MenuItem key={stage.id} value={stage.id}>
                                    {stage.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            </Box>

            {/* Role */}
            <Box sx={{ overflow: 'hidden' }}>
                <FormControl size="small" fullWidth>
                    <Select
                        value={quickAddData.default_job_role_id ?? ''}
                        displayEmpty
                        onChange={(e) => {
                            const val = e.target.value === '' ? null : Number(e.target.value);
                            updateQuickAddData('default_job_role_id', val);
                        }}
                        sx={selectSx}
                    >
                        <MenuItem value="">
                            <em style={{ color: 'rgba(255,255,255,0.4)' }}>Role</em>
                        </MenuItem>
                        {jobRoles.filter((r) => r.is_active).map((role) => (
                            <MenuItem key={role.id} value={role.id}>
                                {role.display_name || role.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* Tier — read-only */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!roleId || !highest ? dash : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: TIER_COLORS[tierLevel] ?? 'rgba(255,255,255,0.4)' }} />
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: TIER_COLORS[tierLevel] ?? 'rgba(255,255,255,0.5)' }}>
                            {TIER_LABELS[tierLevel] ?? highest.name}
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Rate — read-only */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!roleId || !highest?.hourly_rate ? dash : (
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(100,255,218,0.85)' }}>
                        {formatCurrency(highest.hourly_rate, DEFAULT_CURRENCY)}
                    </Typography>
                )}
            </Box>

            {/* Contributor — auto */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', fontStyle: 'italic' }}>Auto</Typography>
            </Box>

            {/* Hours */}
            <Box>
                <TextField
                    type="number"
                    placeholder="—"
                    value={quickAddData.effort_hours || ''}
                    onChange={(e) => updateQuickAddData('effort_hours', parseFloat(e.target.value) || 0)}
                    size="small"
                    variant="outlined"
                    sx={{ ...inputSx, '& .MuiInputBase-input': { ...inputSx['& .MuiInputBase-input'], textAlign: 'center' } }}
                />
            </Box>

            {/* Due Days */}
            <Box>
                <TextField
                    type="number"
                    placeholder="—"
                    value={quickAddData.due_date_offset_days ?? ''}
                    onChange={(e) => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                        updateQuickAddData('due_date_offset_days', val);
                    }}
                    size="small"
                    variant="outlined"
                    sx={{ ...inputSx, '& .MuiInputBase-input': { ...inputSx['& .MuiInputBase-input'], textAlign: 'center' } }}
                />
            </Box>

            {/* Trigger */}
            <Box sx={{ overflow: 'hidden' }}>
                <FormControl size="small" fullWidth>
                    <Select
                        value={quickAddData.trigger_type || TriggerType.ALWAYS}
                        onChange={(e) => updateQuickAddData('trigger_type', e.target.value)}
                        sx={selectSx}
                    >
                        {Object.entries(TRIGGER_TYPE_LABELS).map(([value, label]) => (
                            <MenuItem key={value} value={value}>{label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* Status */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Switch
                    size="small"
                    checked={quickAddData.is_active ?? true}
                    onChange={(e) => updateQuickAddData('is_active', e.target.checked)}
                />
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                <IconButton
                    onClick={saveQuickAdd}
                    disabled={!quickAddData.name}
                    size="small"
                    sx={{ width: 24, height: 24, color: '#4caf50', '&:hover': { bgcolor: 'rgba(76,175,80,0.15)' }, '&:disabled': { opacity: 0.4 } }}
                >
                    <SaveIcon sx={{ fontSize: 14 }} />
                </IconButton>
                <IconButton
                    onClick={cancelQuickAdd}
                    size="small"
                    sx={{ width: 24, height: 24, color: '#f44336', '&:hover': { bgcolor: 'rgba(244,67,54,0.15)' } }}
                >
                    <CancelIcon sx={{ fontSize: 14 }} />
                </IconButton>
            </Box>
        </Box>
    );
}
