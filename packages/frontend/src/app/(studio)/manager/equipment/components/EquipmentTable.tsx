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
    Chip,
    Box,
    Typography,
} from "@mui/material";
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Delete as DeleteIcon,
    AttachMoney as MoneyIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import {
    Equipment,
    EquipmentAvailability,
    EquipmentCondition,
    EQUIPMENT_AVAILABILITY_COLORS,
    EQUIPMENT_CONDITION_COLORS,
} from "@/lib/types";

interface EquipmentTableProps {
    equipment: Equipment[];
    type: string;
    inlineEditingEquipment: number | null;
    inlineEditData: Partial<Equipment>;
    updateInlineEditData: (field: keyof Equipment, value: unknown) => void;
    startInlineEdit: (equipment: Equipment) => void;
    cancelInlineEdit: () => void;
    saveInlineEdit: () => void;
    setEquipmentToDelete: (equipment: Equipment) => void;
    setDeleteConfirmOpen: (open: boolean) => void;
    quickAddType: string | null;
    quickAddData: Partial<Equipment>;
    cancelQuickAdd: () => void;
    saveQuickAdd: () => void;
    updateQuickAddData: (field: keyof Equipment, value: unknown) => void;
}

export function EquipmentTable({
    equipment,
    type,
    inlineEditingEquipment,
    inlineEditData,
    updateInlineEditData,
    startInlineEdit,
    cancelInlineEdit,
    saveInlineEdit,
    setEquipmentToDelete,
    setDeleteConfirmOpen,
    quickAddType,
    quickAddData,
    cancelQuickAdd,
    saveQuickAdd,
    updateQuickAddData,
}: EquipmentTableProps) {
    const router = useRouter();

    const handleViewEquipment = (id: number) => {
        router.push(`/manager/equipment/${id}`);
    };

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
                        <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Equipment Name</TableCell>
                        <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Model</TableCell>
                        <TableCell sx={{ fontWeight: 600, minWidth: 100 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, minWidth: 100 }}>Condition</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, minWidth: 120 }}>
                            <MoneyIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 1 }} />
                            Daily Rate
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Location</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, minWidth: 150 }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {equipment.map((item) => {
                        const isEditing = inlineEditingEquipment === item.id;
                        const displayData = isEditing ? inlineEditData : item;

                        return (
                            <TableRow
                                key={item.id}
                                onClick={() => !isEditing && handleViewEquipment(item.id)}
                                sx={{
                                    cursor: isEditing ? 'default' : 'pointer',
                                    '&:hover': {
                                        backgroundColor: isEditing
                                            ? 'rgba(255, 255, 255, 0.08)'
                                            : 'rgba(255, 255, 255, 0.08)',
                                        transform: !isEditing ? 'translateY(-1px)' : 'none',
                                        transition: 'all 0.2s ease-in-out',
                                    },
                                    ...(isEditing && {
                                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                        border: '2px solid rgba(255, 255, 255, 0.3)',
                                    }),
                                    transition: 'all 0.2s ease-in-out',
                                }}
                            >
                                {/* Equipment Name */}
                                <TableCell onClick={(e) => isEditing && e.stopPropagation()}>
                                    {isEditing ? (
                                        <TextField
                                            value={displayData.item_name || ''}
                                            onChange={(e) => updateInlineEditData('item_name', e.target.value)}
                                            size="small"
                                            fullWidth
                                            variant="outlined"
                                        />
                                    ) : (
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                {item.item_name}
                                            </Typography>
                                            {item.description && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.description}
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                </TableCell>

                                {/* Model */}
                                <TableCell onClick={(e) => isEditing && e.stopPropagation()}>
                                    {isEditing ? (
                                        <TextField
                                            value={displayData.model || ''}
                                            onChange={(e) => updateInlineEditData('model', e.target.value)}
                                            size="small"
                                            fullWidth
                                            variant="outlined"
                                        />
                                    ) : (
                                        <Box>
                                            <Typography variant="body2">
                                                {item.brand_name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {item.model}
                                            </Typography>
                                        </Box>
                                    )}
                                </TableCell>

                                {/* Status */}
                                <TableCell onClick={(e) => isEditing && e.stopPropagation()}>
                                    {isEditing ? (
                                        <FormControl fullWidth size="small">
                                            <Select
                                                value={displayData.availability_status || EquipmentAvailability.AVAILABLE}
                                                onChange={(e) => updateInlineEditData('availability_status', e.target.value)}
                                            >
                                                {Object.values(EquipmentAvailability).map((status) => (
                                                    <MenuItem key={status} value={status}>
                                                        {status}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    ) : (
                                        <Chip
                                            label={item.availability_status}
                                            size="small"
                                            sx={{
                                                backgroundColor: EQUIPMENT_AVAILABILITY_COLORS[item.availability_status],
                                                color: 'white',
                                                fontWeight: 600,
                                            }}
                                        />
                                    )}
                                </TableCell>

                                {/* Condition */}
                                <TableCell onClick={(e) => isEditing && e.stopPropagation()}>
                                    {isEditing ? (
                                        <FormControl fullWidth size="small">
                                            <Select
                                                value={displayData.condition || EquipmentCondition.GOOD}
                                                onChange={(e) => updateInlineEditData('condition', e.target.value)}
                                            >
                                                {Object.values(EquipmentCondition).map((condition) => (
                                                    <MenuItem key={condition} value={condition}>
                                                        {condition}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    ) : (
                                        <Chip
                                            label={item.condition}
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                borderColor: EQUIPMENT_CONDITION_COLORS[item.condition],
                                                color: EQUIPMENT_CONDITION_COLORS[item.condition],
                                                fontWeight: 600,
                                            }}
                                        />
                                    )}
                                </TableCell>

                                {/* Daily Rate */}
                                <TableCell align="center" onClick={(e) => isEditing && e.stopPropagation()}>
                                    {isEditing ? (
                                        <TextField
                                            type="number"
                                            value={displayData.rental_price_per_day || 0}
                                            onChange={(e) => updateInlineEditData('rental_price_per_day', parseFloat(e.target.value) || 0)}
                                            size="small"
                                            fullWidth
                                            variant="outlined"
                                            InputProps={{
                                                startAdornment: '$',
                                            }}
                                        />) : (
                                        <Typography variant="body2" fontWeight={600}>
                                            ${parseFloat(String(item.rental_price_per_day || 0)).toFixed(2)}
                                        </Typography>
                                    )}
                                </TableCell>

                                {/* Location */}
                                <TableCell onClick={(e) => isEditing && e.stopPropagation()}>
                                    {isEditing ? (
                                        <TextField
                                            value={displayData.location || ''}
                                            onChange={(e) => updateInlineEditData('location', e.target.value)}
                                            size="small"
                                            fullWidth
                                            variant="outlined"
                                        />
                                    ) : (
                                        <Typography variant="body2">
                                            {item.location || 'Not specified'}
                                        </Typography>
                                    )}
                                </TableCell>

                                {/* Actions */}
                                <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                    <Box display="flex" gap={1} justifyContent="center">
                                        {isEditing ? (
                                            <>
                                                <IconButton
                                                    size="small"
                                                    onClick={saveInlineEdit}
                                                    color="primary"
                                                    title="Save changes"
                                                >
                                                    <SaveIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={cancelInlineEdit}
                                                    color="secondary"
                                                    title="Cancel editing"
                                                >
                                                    <CancelIcon fontSize="small" />
                                                </IconButton>
                                            </>
                                        ) : (
                                            <>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => startInlineEdit(item)}
                                                    color="secondary"
                                                    title="Edit equipment"
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setEquipmentToDelete(item);
                                                        setDeleteConfirmOpen(true);
                                                    }}
                                                    color="error"
                                                    title="Delete equipment"
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </>
                                        )}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        );
                    })}

                    {/* Quick Add Row */}
                    {quickAddType === type && (
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
                                py: 1.5,
                                px: 2
                            }
                        }}>
                            {/* Equipment Name */}
                            <TableCell>
                                <TextField
                                    placeholder="Equipment name"
                                    value={quickAddData.item_name || ''}
                                    onChange={(e) => updateQuickAddData('item_name', e.target.value)}
                                    size="small"
                                    fullWidth
                                    variant="outlined"
                                />
                            </TableCell>

                            {/* Model */}
                            <TableCell>
                                <TextField
                                    placeholder="Model"
                                    value={quickAddData.model || ''}
                                    onChange={(e) => updateQuickAddData('model', e.target.value)}
                                    size="small"
                                    fullWidth
                                    variant="outlined"
                                />
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={quickAddData.availability_status || EquipmentAvailability.AVAILABLE}
                                        onChange={(e) => updateQuickAddData('availability_status', e.target.value)}
                                    >
                                        {Object.values(EquipmentAvailability).map((status) => (
                                            <MenuItem key={status} value={status}>
                                                {status}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </TableCell>

                            {/* Condition */}
                            <TableCell>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={quickAddData.condition || EquipmentCondition.GOOD}
                                        onChange={(e) => updateQuickAddData('condition', e.target.value)}
                                    >
                                        {Object.values(EquipmentCondition).map((condition) => (
                                            <MenuItem key={condition} value={condition}>
                                                {condition}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </TableCell>

                            {/* Daily Rate */}
                            <TableCell>
                                <TextField
                                    type="number"
                                    placeholder="0.00"
                                    value={quickAddData.rental_price_per_day || ''}
                                    onChange={(e) => updateQuickAddData('rental_price_per_day', parseFloat(e.target.value) || 0)}
                                    size="small"
                                    fullWidth
                                    variant="outlined"
                                    InputProps={{
                                        startAdornment: '$',
                                    }}
                                />
                            </TableCell>

                            {/* Location */}
                            <TableCell>
                                <TextField
                                    placeholder="Location"
                                    value={quickAddData.location || ''}
                                    onChange={(e) => updateQuickAddData('location', e.target.value)}
                                    size="small"
                                    fullWidth
                                    variant="outlined"
                                />
                            </TableCell>

                            {/* Actions */}
                            <TableCell align="center">
                                <Box display="flex" gap={1} justifyContent="center">
                                    <IconButton
                                        size="small"
                                        onClick={saveQuickAdd}
                                        color="primary"
                                        title="Save new equipment"
                                        disabled={!quickAddData.item_name}
                                    >
                                        <SaveIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={cancelQuickAdd}
                                        color="secondary"
                                        title="Cancel adding"
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
