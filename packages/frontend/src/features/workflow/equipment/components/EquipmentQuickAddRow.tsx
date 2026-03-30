"use client";

import React from "react";
import {
    TableRow,
    TableCell,
    TextField,
    Select,
    MenuItem,
    FormControl,
    Box,
    IconButton,
} from "@mui/material";
import {
    Save as SaveIcon,
    Cancel as CancelIcon,
} from "@mui/icons-material";
import {
    Equipment,
    EquipmentAvailability,
    EquipmentCondition,
} from "../types/equipment.types";
import type { Crew } from "@/shared/types/users";

interface EquipmentQuickAddRowProps {
    quickAddData: Partial<Equipment>;
    updateQuickAddData: (field: keyof Equipment, value: unknown) => void;
    cancelQuickAdd: () => void;
    saveQuickAdd: () => void;
    crew: Crew[];
    currencyCode: string;
}

export function EquipmentQuickAddRow({
    quickAddData,
    updateQuickAddData,
    cancelQuickAdd,
    saveQuickAdd,
    crew,
}: EquipmentQuickAddRowProps) {
    return (
        <TableRow
            sx={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: 2,
                transition: "all 0.3s ease",
                "& td": { borderBottom: "none", color: "white", py: 1.5, px: 2 },
            }}
        >
            {/* Name */}
            <TableCell>
                <TextField
                    placeholder="Equipment name"
                    value={quickAddData.item_name || ""}
                    onChange={(e) => updateQuickAddData("item_name", e.target.value)}
                    size="small"
                    fullWidth
                    variant="outlined"
                />
            </TableCell>

            {/* Model */}
            <TableCell>
                <TextField
                    placeholder="Model"
                    value={quickAddData.model || ""}
                    onChange={(e) => updateQuickAddData("model", e.target.value)}
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
                        onChange={(e) => updateQuickAddData("availability_status", e.target.value)}
                    >
                        {Object.values(EquipmentAvailability).map((s) => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </TableCell>

            {/* Condition */}
            <TableCell>
                <FormControl fullWidth size="small">
                    <Select
                        value={quickAddData.condition || EquipmentCondition.GOOD}
                        onChange={(e) => updateQuickAddData("condition", e.target.value)}
                    >
                        {Object.values(EquipmentCondition).map((c) => (
                            <MenuItem key={c} value={c}>{c}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </TableCell>

            {/* Daily Rate */}
            <TableCell>
                <TextField
                    type="number"
                    placeholder="0.00"
                    value={quickAddData.rental_price_per_day || ""}
                    onChange={(e) => updateQuickAddData("rental_price_per_day", parseFloat(e.target.value) || 0)}
                    size="small"
                    fullWidth
                    variant="outlined"
                />
            </TableCell>

            {/* Purchase Price */}
            <TableCell>
                <TextField
                    type="number"
                    placeholder="0.00"
                    value={quickAddData.purchase_price || ""}
                    onChange={(e) => updateQuickAddData("purchase_price", parseFloat(e.target.value) || 0)}
                    size="small"
                    fullWidth
                    variant="outlined"
                />
            </TableCell>

            {/* Location */}
            <TableCell>
                <TextField
                    placeholder="Location"
                    value={quickAddData.location || ""}
                    onChange={(e) => updateQuickAddData("location", e.target.value)}
                    size="small"
                    fullWidth
                    variant="outlined"
                />
            </TableCell>

            {/* Owner */}
            <TableCell>
                <FormControl fullWidth size="small">
                    <Select
                        value={quickAddData.owner_id ?? ""}
                        onChange={(e) => updateQuickAddData("owner_id", e.target.value === "" ? null : Number(e.target.value))}
                        displayEmpty
                    >
                        <MenuItem value=""><em>None</em></MenuItem>
                        {crew.map((c) => (
                            <MenuItem key={c.id} value={c.id}>{c.full_name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
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
    );
}
