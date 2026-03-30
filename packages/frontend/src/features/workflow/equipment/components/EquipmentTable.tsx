"use client";

import React from "react";
import {
    Box,
    Typography,
    Chip,
    TextField,
    Select,
    MenuItem,
    FormControl,
} from "@mui/material";
import { StudioTable, type StudioColumn } from "@/shared/ui";
import {
    Equipment,
    EquipmentAvailability,
    EquipmentCondition,
    EquipmentCategory,
    EQUIPMENT_AVAILABILITY_COLORS,
    EQUIPMENT_CONDITION_COLORS,
} from "@/features/workflow/equipment/types/equipment.types";
import type { Crew } from "@/shared/types/users";
import { useBrand } from "@/features/platform/brand";
import { formatCurrency, DEFAULT_CURRENCY } from "@projectflo/shared";
import { getCategoryColor } from "../constants/categoryConfig";
import { EquipmentTableRowActions } from "./EquipmentTableRowActions";
import { EquipmentQuickAddRow } from "./EquipmentQuickAddRow";

interface EquipmentTableProps {
    equipment: Equipment[];
    crew: Crew[];
    selectedEquipmentId: number | null;
    inlineEditingEquipment: number | null;
    inlineEditData: Partial<Equipment>;
    updateInlineEditData: (field: keyof Equipment, value: unknown) => void;
    startInlineEdit: (equipment: Equipment) => void;
    cancelInlineEdit: () => void;
    saveInlineEdit: () => void;
    quickAddCategory: string | null;
    quickAddData: Partial<Equipment>;
    cancelQuickAdd: () => void;
    saveQuickAdd: () => void;
    updateQuickAddData: (field: keyof Equipment, value: unknown) => void;
    onSelectEquipment: (equipment: Equipment) => void;
    onHoverEquipment: (equipment: Equipment | null) => void;
}

export function EquipmentTable({
    equipment,
    crew,
    selectedEquipmentId,
    inlineEditingEquipment,
    inlineEditData,
    updateInlineEditData,
    startInlineEdit,
    cancelInlineEdit,
    saveInlineEdit,
    quickAddCategory,
    quickAddData,
    cancelQuickAdd,
    saveQuickAdd,
    updateQuickAddData,
    onSelectEquipment,
    onHoverEquipment,
}: EquipmentTableProps) {
    const { currentBrand } = useBrand();
    const currencyCode = currentBrand?.currency ?? DEFAULT_CURRENCY;

    const columns: StudioColumn<Equipment>[] = [
        {
            key: "name",
            label: "Name",
            width: 330,
            render: (row) => {
                const isEditing = inlineEditingEquipment === row.id;
                if (isEditing) {
                    return (
                        <TextField
                            value={inlineEditData.item_name ?? ""}
                            onChange={(e) => updateInlineEditData("item_name", e.target.value)}
                            size="small"
                            fullWidth
                            onClick={(e) => e.stopPropagation()}
                        />
                    );
                }
                return (
                    <Typography variant="body2" fontWeight={500} noWrap sx={{ fontSize: "0.875rem", lineHeight: 1.3 }}>
                        {row.item_name}
                    </Typography>
                );
            },
        },
        {
            key: "brand_name",
            label: "Brand",
            width: 110,
            render: (row) => {
                const isEditing = inlineEditingEquipment === row.id;
                if (isEditing) {
                    return (
                        <TextField
                            value={inlineEditData.brand_name ?? ""}
                            onChange={(e) => updateInlineEditData("brand_name", e.target.value)}
                            size="small"
                            fullWidth
                            onClick={(e) => e.stopPropagation()}
                        />
                    );
                }
                return (
                    <Typography variant="body2" sx={{ fontSize: "0.8125rem", color: row.brand_name ? "text.primary" : "text.disabled" }}>
                        {row.brand_name || <span style={{ opacity: 0.35 }}>—</span>}
                    </Typography>
                );
            },
        },
        {
            key: "model",
            label: "Model",
            flex: 1,
            render: (row) => {
                const isEditing = inlineEditingEquipment === row.id;
                if (isEditing) {
                    return (
                        <TextField
                            value={inlineEditData.model ?? ""}
                            onChange={(e) => updateInlineEditData("model", e.target.value)}
                            size="small"
                            fullWidth
                            onClick={(e) => e.stopPropagation()}
                        />
                    );
                }
                return (
                    <Typography variant="body2" sx={{ fontSize: "0.8125rem", color: row.model ? "text.primary" : "text.disabled" }}>
                        {row.model || <span style={{ opacity: 0.35 }}>—</span>}
                    </Typography>
                );
            },
        },
        {
            key: "status",
            label: "Status",
            width: 120,
            render: (row) => {
                const isEditing = inlineEditingEquipment === row.id;
                if (isEditing) {
                    return (
                        <FormControl fullWidth size="small" onClick={(e) => e.stopPropagation()}>
                            <Select
                                value={inlineEditData.availability_status ?? EquipmentAvailability.AVAILABLE}
                                onChange={(e) => updateInlineEditData("availability_status", e.target.value)}
                                sx={{ fontSize: "0.8125rem" }}
                            >
                                {Object.values(EquipmentAvailability).map((s) => (
                                    <MenuItem key={s} value={s} sx={{ fontSize: "0.8125rem" }}>{s}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    );
                }
                return (
                    <Chip
                        label={row.availability_status}
                        size="small"
                        sx={{ backgroundColor: EQUIPMENT_AVAILABILITY_COLORS[row.availability_status], color: "white", fontWeight: 700, fontSize: "0.7rem" }}
                    />
                );
            },
        },
        {
            key: "condition",
            label: "Condition",
            width: 110,
            render: (row) => {
                const isEditing = inlineEditingEquipment === row.id;
                if (isEditing) {
                    return (
                        <FormControl fullWidth size="small" onClick={(e) => e.stopPropagation()}>
                            <Select
                                value={inlineEditData.condition ?? EquipmentCondition.GOOD}
                                onChange={(e) => updateInlineEditData("condition", e.target.value)}
                                sx={{ fontSize: "0.8125rem" }}
                            >
                                {Object.values(EquipmentCondition).map((c) => (
                                    <MenuItem key={c} value={c} sx={{ fontSize: "0.8125rem" }}>{c}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    );
                }
                return (
                    <Chip
                        label={row.condition}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: EQUIPMENT_CONDITION_COLORS[row.condition], color: EQUIPMENT_CONDITION_COLORS[row.condition], fontWeight: 700, fontSize: "0.7rem" }}
                    />
                );
            },
        },
        {
            key: "rental_price_per_day",
            label: "Daily Rate",
            width: 95,
            align: "right",
            render: (row) => {
                const isEditing = inlineEditingEquipment === row.id;
                if (isEditing) {
                    return (
                        <TextField
                            value={inlineEditData.rental_price_per_day ?? ""}
                            onChange={(e) => updateInlineEditData("rental_price_per_day", e.target.value)}
                            size="small"
                            fullWidth
                            onClick={(e) => e.stopPropagation()}
                            inputProps={{ style: { textAlign: "right" } }}
                        />
                    );
                }
                return (
                    <Typography variant="body2" sx={{ fontSize: "0.8125rem" }}>
                        {row.rental_price_per_day
                            ? formatCurrency(parseFloat(String(row.rental_price_per_day)), currencyCode)
                            : <span style={{ opacity: 0.35 }}>—</span>}
                    </Typography>
                );
            },
        },
        {
            key: "purchase_price",
            label: "Buy Price",
            width: 95,
            align: "right",
            render: (row) => {
                const isEditing = inlineEditingEquipment === row.id;
                if (isEditing) {
                    return (
                        <TextField
                            value={inlineEditData.purchase_price ?? ""}
                            onChange={(e) => updateInlineEditData("purchase_price", e.target.value)}
                            size="small"
                            fullWidth
                            onClick={(e) => e.stopPropagation()}
                            inputProps={{ style: { textAlign: "right" } }}
                        />
                    );
                }
                return (
                    <Typography variant="body2" sx={{ fontSize: "0.8125rem" }}>
                        {row.purchase_price
                            ? formatCurrency(parseFloat(String(row.purchase_price)), currencyCode)
                            : <span style={{ opacity: 0.35 }}>—</span>}
                    </Typography>
                );
            },
        },
        {
            key: "actions",
            label: "",
            width: 40,
            align: "center",
            render: (row) => (
                <Box onClick={(e) => e.stopPropagation()}>
                    <EquipmentTableRowActions
                        isEditing={inlineEditingEquipment === row.id}
                        onCancelEdit={cancelInlineEdit}
                    />
                </Box>
            ),
        },
    ];

    const handleRowClick = (row: Equipment) => {
        if (inlineEditingEquipment === row.id) return; // already editing, don't reset
        if (inlineEditingEquipment) void saveInlineEdit();
        startInlineEdit(row);
        onSelectEquipment(row);
    };

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        // If focus leaves the table entirely, auto-save
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            if (inlineEditingEquipment) void saveInlineEdit();
        }
    };

    return (
        <Box onBlur={handleBlur}>
            <StudioTable<Equipment>
                columns={columns}
                rows={equipment}
                getRowKey={(row) => row.id}
                onRowClick={handleRowClick}
                onRowHover={(row) => {
                    if (inlineEditingEquipment === null) onHoverEquipment(row);
                }}
                sectionColor="#1976d2"
                getRowAccentColor={(row) => getCategoryColor(row.category as EquipmentCategory)}
                emptyMessage="No equipment found"
            />
            {quickAddCategory && (
                <EquipmentQuickAddRow
                    quickAddData={quickAddData}
                    updateQuickAddData={updateQuickAddData}
                    cancelQuickAdd={cancelQuickAdd}
                    saveQuickAdd={saveQuickAdd}
                    crew={crew}
                    currencyCode={currencyCode}
                />
            )}
        </Box>
    );
}

