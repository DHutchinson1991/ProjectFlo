"use client";

import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    Switch,
    Box,
} from "@mui/material";
import {
    Timer as TimerIcon,
    AttachMoney as MoneyIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    DragIndicator as DragIndicatorIcon,
} from "@mui/icons-material";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskLibrary, PricingType } from "@/lib/types";
import { SortableTaskRow } from "./SortableTaskRow";
import { useRouter } from "next/navigation";

interface TaskTableProps {
    tasks: TaskLibrary[];
    phase: string;
    inlineEditingTask: number | null;
    inlineEditData: Partial<TaskLibrary>;
    updateInlineEditData: (field: keyof TaskLibrary, value: unknown) => void;
    startInlineEdit: (task: TaskLibrary) => void;
    cancelInlineEdit: () => void;
    saveInlineEdit: () => void;
    setTaskToDelete: (task: TaskLibrary) => void;
    setDeleteConfirmOpen: (open: boolean) => void;
    isDragging: boolean;
    quickAddPhase: string | null;
    quickAddData: Partial<TaskLibrary>;
    cancelQuickAdd: () => void;
    saveQuickAdd: () => void;
    updateQuickAddData: (field: keyof TaskLibrary, value: unknown) => void;
}

export function TaskTable({
    tasks,
    phase,
    inlineEditingTask,
    inlineEditData,
    updateInlineEditData,
    startInlineEdit,
    cancelInlineEdit,
    saveInlineEdit,
    setTaskToDelete,
    setDeleteConfirmOpen,
    isDragging,
    quickAddPhase,
    quickAddData,
    cancelQuickAdd,
    saveQuickAdd,
    updateQuickAddData,
}: TaskTableProps) {
    const router = useRouter();

    return (
        <TableContainer
            component={Paper}
            elevation={0}
            sx={{
                borderRadius: 0,
                border: '1px solid',
                borderColor: 'divider'
            }}
        >
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ width: 40 }}></TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Task Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                            <TimerIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 1 }} />
                            Hours
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                            <MoneyIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 1 }} />
                            Pricing
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <SortableContext
                        items={tasks.map(task => task.id.toString())}
                        strategy={verticalListSortingStrategy}
                    >
                        {tasks.map((task) => (
                            <SortableTaskRow
                                key={task.id}
                                task={task}
                                phase={phase}
                                inlineEditingTask={inlineEditingTask}
                                inlineEditData={inlineEditData}
                                updateInlineEditData={updateInlineEditData}
                                startInlineEdit={startInlineEdit}
                                cancelInlineEdit={cancelInlineEdit}
                                saveInlineEdit={saveInlineEdit}
                                setTaskToDelete={setTaskToDelete}
                                setDeleteConfirmOpen={setDeleteConfirmOpen}
                                router={router}
                                isDragging={isDragging}
                            />
                        ))}
                    </SortableContext>

                    {/* Quick Add Row */}
                    {quickAddPhase === phase && (
                        <TableRow sx={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: 2,
                            mb: 1,
                            transition: 'all 0.3s ease',
                            '& td': {
                                borderBottom: 'none',
                                color: 'white',
                                py: 1.5, // Reduced from 2 to match existing rows better
                                px: 2
                            }
                        }}>
                            {/* Drag handle cell with greyed-out icon */}
                            <TableCell sx={{ width: 40, padding: 1 }}>
                                <IconButton
                                    size="small"
                                    disabled
                                    sx={{
                                        cursor: 'not-allowed',
                                        color: 'rgba(255, 255, 255, 0.3)',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: 2,
                                        backdropFilter: 'blur(10px)',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                        opacity: 0.5,
                                        '&.Mui-disabled': {
                                            color: 'rgba(255, 255, 255, 0.3)',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                        }
                                    }}
                                >
                                    <DragIndicatorIcon fontSize="small" />
                                </IconButton>
                            </TableCell>

                            {/* Task Name */}
                            <TableCell>
                                <TextField
                                    fullWidth
                                    placeholder="Task name"
                                    value={quickAddData.name || ''}
                                    onChange={(e) => updateQuickAddData('name', e.target.value)}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        maxWidth: '300px', // Constrain the width
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                            borderRadius: 2,
                                            fontSize: '0.875rem', // Match existing row font size
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: 'primary.main',
                                            },
                                        },
                                        '& .MuiInputBase-input': {
                                            color: 'white',
                                            fontSize: '0.875rem',
                                        },
                                    }}
                                />
                            </TableCell>

                            {/* Description */}
                            <TableCell>
                                <TextField
                                    fullWidth
                                    placeholder="Description"
                                    value={quickAddData.description || ''}
                                    onChange={(e) => updateQuickAddData('description', e.target.value)}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                            borderRadius: 2,
                                            fontSize: '0.875rem',
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: 'primary.main',
                                            },
                                        },
                                        '& .MuiInputBase-input': {
                                            color: 'white',
                                            fontSize: '0.875rem',
                                        },
                                    }}
                                />
                            </TableCell>

                            {/* Hours */}
                            <TableCell align="center">
                                <TextField
                                    type="number"
                                    placeholder="Hours"
                                    value={quickAddData.effort_hours || ''}
                                    onChange={(e) => updateQuickAddData('effort_hours', parseFloat(e.target.value) || 0)}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        width: '80px',
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                            borderRadius: 2,
                                            fontSize: '0.875rem',
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: 'primary.main',
                                            },
                                        },
                                        '& .MuiInputBase-input': {
                                            color: 'white',
                                            textAlign: 'center',
                                            fontSize: '0.875rem',
                                        },
                                    }}
                                />
                            </TableCell>

                            {/* Pricing */}
                            <TableCell align="center">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                                    <TextField
                                        type="number"
                                        placeholder={quickAddData.pricing_type === PricingType.FIXED ? "Price" : "Rate"}
                                        value={quickAddData.pricing_type === PricingType.FIXED ? quickAddData.fixed_price || '' : quickAddData.hourly_rate || ''}
                                        onChange={(e) => updateQuickAddData(
                                            quickAddData.pricing_type === PricingType.FIXED ? 'fixed_price' : 'hourly_rate',
                                            parseFloat(e.target.value) || 0
                                        )}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            width: '70px',
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                                borderRadius: 2,
                                                fontSize: '0.875rem',
                                                '& fieldset': {
                                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: 'primary.main',
                                                },
                                            },
                                            '& .MuiInputBase-input': {
                                                color: 'white',
                                                textAlign: 'center',
                                                fontSize: '0.875rem',
                                            },
                                        }}
                                    />
                                    <FormControl size="small" sx={{ minWidth: 70 }}>
                                        <Select
                                            value={quickAddData.pricing_type || PricingType.HOURLY}
                                            onChange={(e) => updateQuickAddData('pricing_type', e.target.value)}
                                            sx={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                                borderRadius: 2,
                                                fontSize: '0.875rem',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'primary.main',
                                                },
                                                '& .MuiSelect-select': {
                                                    color: 'white',
                                                    fontSize: '0.875rem',
                                                },
                                                '& .MuiSvgIcon-root': {
                                                    color: 'rgba(255, 255, 255, 0.7)',
                                                },
                                            }}
                                        >
                                            <MenuItem value={PricingType.HOURLY}>Hourly</MenuItem>
                                            <MenuItem value={PricingType.FIXED}>Fixed</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            </TableCell>

                            {/* Status */}
                            <TableCell align="center">
                                <Switch
                                    checked={quickAddData.is_active ?? true}
                                    onChange={(e) => updateQuickAddData('is_active', e.target.checked)}
                                    sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': {
                                            color: 'primary.main',
                                        },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                            backgroundColor: 'primary.main',
                                        },
                                    }}
                                />
                            </TableCell>

                            {/* Actions */}
                            <TableCell align="center">
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                    <IconButton
                                        onClick={saveQuickAdd}
                                        disabled={!quickAddData.name}
                                        size="small"
                                        sx={{
                                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                            border: '1px solid rgba(76, 175, 80, 0.3)',
                                            borderRadius: 2,
                                            color: '#4caf50',
                                            '&:hover': {
                                                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                                            },
                                            '&:disabled': {
                                                opacity: 0.5,
                                            },
                                        }}
                                    >
                                        <SaveIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        onClick={cancelQuickAdd}
                                        size="small"
                                        sx={{
                                            backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                            border: '1px solid rgba(244, 67, 54, 0.3)',
                                            borderRadius: 2,
                                            color: '#f44336',
                                            '&:hover': {
                                                backgroundColor: 'rgba(244, 67, 54, 0.2)',
                                            },
                                        }}
                                    >
                                        <CancelIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
