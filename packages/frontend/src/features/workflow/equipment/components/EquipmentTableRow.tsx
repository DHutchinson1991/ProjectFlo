"use client";

import React from "react";
import {
    TableRow,
    TableCell,
    TextField,
    Select,
    MenuItem,
    FormControl,
    Chip,
    Box,
    Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import {
    Equipment,
    EquipmentAvailability,
    EquipmentCondition,
    EQUIPMENT_AVAILABILITY_COLORS,
    EQUIPMENT_CONDITION_COLORS,
} from "../types/equipment.types";
import type { Contributor } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/formatUtils";
import { EquipmentTableRowActions } from "./EquipmentTableRowActions";

interface EquipmentTableRowProps {
    item: Equipment;
    isEditing: boolean;
    inlineEditData: Partial<Equipment>;
    updateInlineEditData: (field: keyof Equipment, value: unknown) => void;
    startInlineEdit: (equipment: Equipment) => void;
    cancelInlineEdit: () => void;
    saveInlineEdit: () => void;
    setEquipmentToDelete: (equipment: Equipment) => void;
    setDeleteConfirmOpen: (open: boolean) => void;
    contributors: Contributor[];
    currencyCode: string;
    currencySymbol: string;
}

export function EquipmentTableRow({
    item,
    isEditing,
    inlineEditData,
    updateInlineEditData,
    startInlineEdit,
    cancelInlineEdit,
    saveInlineEdit,
    setEquipmentToDelete,
    setDeleteConfirmOpen,
    contributors,
    currencyCode,
    currencySymbol,
}: EquipmentTableRowProps) {
    const router = useRouter();
    const displayData = isEditing ? inlineEditData : item;

    return (
        <TableRow
            onClick={() => !isEditing && router.push(`/resources/equipment/${item.id}`)}
            sx={{
                cursor: isEditing ? "default" : "pointer",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.08)", transform: !isEditing ? "translateY(-1px)" : "none", transition: "all 0.2s ease-in-out" },
                ...(isEditing && { backgroundColor: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.3)" }),
                transition: "all 0.2s ease-in-out",
            }}
        >
            {/* Name */}
            <TableCell onClick={(e) => isEditing && e.stopPropagation()}>
                {isEditing ? (
                    <TextField value={displayData.item_name || ""} onChange={(e) => updateInlineEditData("item_name", e.target.value)} size="small" fullWidth variant="outlined" />
                ) : (
                    <Box>
                        <Typography variant="body2" fontWeight={600}>{item.item_name}</Typography>
                        {item.description && <Typography variant="caption" color="text.secondary">{item.description}</Typography>}
                    </Box>
                )}
            </TableCell>

            {/* Model */}
            <TableCell onClick={(e) => isEditing && e.stopPropagation()}>
                {isEditing ? (
                    <TextField value={displayData.model || ""} onChange={(e) => updateInlineEditData("model", e.target.value)} size="small" fullWidth variant="outlined" />
                ) : (
                    <Box>
                        <Typography variant="body2">{item.brand_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.model}</Typography>
                    </Box>
                )}
            </TableCell>

            {/* Status */}
            <TableCell onClick={(e) => isEditing && e.stopPropagation()}>
                {isEditing ? (
                    <FormControl fullWidth size="small">
                        <Select value={displayData.availability_status || EquipmentAvailability.AVAILABLE} onChange={(e) => updateInlineEditData("availability_status", e.target.value)}>
                            {Object.values(EquipmentAvailability).map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                    </FormControl>
                ) : (
                    <Chip label={item.availability_status} size="small" sx={{ backgroundColor: EQUIPMENT_AVAILABILITY_COLORS[item.availability_status], color: "white", fontWeight: 600 }} />
                )}
            </TableCell>

            {/* Condition */}
            <TableCell onClick={(e) => isEditing && e.stopPropagation()}>
                {isEditing ? (
                    <FormControl fullWidth size="small">
                        <Select value={displayData.condition || EquipmentCondition.GOOD} onChange={(e) => updateInlineEditData("condition", e.target.value)}>
                            {Object.values(EquipmentCondition).map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                    </FormControl>
                ) : (
                    <Chip label={item.condition} size="small" variant="outlined" sx={{ borderColor: EQUIPMENT_CONDITION_COLORS[item.condition], color: EQUIPMENT_CONDITION_COLORS[item.condition], fontWeight: 600 }} />
                )}
            </TableCell>

            {/* Daily Rate */}
            <TableCell align="center" onClick={(e) => isEditing && e.stopPropagation()}>
                {isEditing ? (
                    <TextField type="number" value={displayData.rental_price_per_day || 0} onChange={(e) => updateInlineEditData("rental_price_per_day", parseFloat(e.target.value) || 0)} size="small" fullWidth variant="outlined" InputProps={{ startAdornment: currencySymbol }} />
                ) : (
                    <Typography variant="body2" fontWeight={600}>{formatCurrency(parseFloat(String(item.rental_price_per_day || 0)), currencyCode)}</Typography>
                )}
            </TableCell>

            {/* Purchase Price */}
            <TableCell align="center" onClick={(e) => isEditing && e.stopPropagation()}>
                {isEditing ? (
                    <TextField type="number" value={displayData.purchase_price || 0} onChange={(e) => updateInlineEditData("purchase_price", parseFloat(e.target.value) || 0)} size="small" fullWidth variant="outlined" InputProps={{ startAdornment: currencySymbol }} />
                ) : (
                    <Typography variant="body2" fontWeight={600}>{formatCurrency(parseFloat(String(item.purchase_price || 0)), currencyCode)}</Typography>
                )}
            </TableCell>

            {/* Location */}
            <TableCell onClick={(e) => isEditing && e.stopPropagation()}>
                {isEditing ? (
                    <TextField value={displayData.location || ""} onChange={(e) => updateInlineEditData("location", e.target.value)} size="small" fullWidth variant="outlined" />
                ) : (
                    <Typography variant="body2">{item.location || "Not specified"}</Typography>
                )}
            </TableCell>

            {/* Owner */}
            <TableCell onClick={(e) => isEditing && e.stopPropagation()}>
                {isEditing ? (
                    <FormControl fullWidth size="small">
                        <Select value={displayData.owner_id ?? ""} onChange={(e) => updateInlineEditData("owner_id", e.target.value === "" ? null : Number(e.target.value))} displayEmpty>
                            <MenuItem value=""><em>None</em></MenuItem>
                            {contributors.map((c) => <MenuItem key={c.id} value={c.id}>{c.full_name}</MenuItem>)}
                        </Select>
                    </FormControl>
                ) : (
                    <Typography variant="body2">
                        {item.owner ? `${item.owner.contact?.first_name ?? ""} ${item.owner.contact?.last_name ?? ""}`.trim() || "Unknown" : "—"}
                    </Typography>
                )}
            </TableCell>

            {/* Actions */}
            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                <EquipmentTableRowActions
                    isEditing={isEditing}
                    onStartEdit={() => startInlineEdit(item)}
                    onSaveEdit={saveInlineEdit}
                    onCancelEdit={cancelInlineEdit}
                    onDelete={() => { setEquipmentToDelete(item); setDeleteConfirmOpen(true); }}
                />
            </TableCell>
        </TableRow>
    );
}
