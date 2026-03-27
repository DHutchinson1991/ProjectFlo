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
} from "@mui/material";
import { AttachMoney as MoneyIcon } from "@mui/icons-material";
import { Equipment } from "@/features/workflow/equipment/types/equipment.types";
import type { CrewMember } from "@/shared/types/users";
import { useBrand } from "@/features/platform/brand";
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { EquipmentTableRow } from "./EquipmentTableRow";
import { EquipmentQuickAddRow } from "./EquipmentQuickAddRow";

interface EquipmentTableProps {
    equipment: Equipment[];
    type: string;
    crewMembers: CrewMember[];
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
    crewMembers,
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
    const { currentBrand } = useBrand();
    const currencyCode = currentBrand?.currency ?? DEFAULT_CURRENCY;

    return (
        <TableContainer
            component={Paper}
            elevation={0}
            sx={{ borderRadius: 0, border: "1px solid", borderColor: "divider" }}
        >
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Equipment Name</TableCell>
                        <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Model</TableCell>
                        <TableCell sx={{ fontWeight: 600, minWidth: 100 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, minWidth: 100 }}>Condition</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, minWidth: 120 }}>
                            <MoneyIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 0.75 }} />
                            Daily Rate
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, minWidth: 130 }}>Purchase Price</TableCell>
                        <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Location</TableCell>
                        <TableCell sx={{ fontWeight: 600, minWidth: 140 }}>Owner</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, minWidth: 150 }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {equipment.map((item) => (
                        <EquipmentTableRow
                            key={item.id}
                            item={item}
                            isEditing={inlineEditingEquipment === item.id}
                            inlineEditData={inlineEditData}
                            updateInlineEditData={updateInlineEditData}
                            startInlineEdit={startInlineEdit}
                            cancelInlineEdit={cancelInlineEdit}
                            saveInlineEdit={saveInlineEdit}
                            setEquipmentToDelete={setEquipmentToDelete}
                            setDeleteConfirmOpen={setDeleteConfirmOpen}
                            contributors={crewMembers}
                            currencyCode={currencyCode}
                        />
                    ))}
                    {quickAddType === type && (
                        <EquipmentQuickAddRow
                            quickAddData={quickAddData}
                            updateQuickAddData={updateQuickAddData}
                            cancelQuickAdd={cancelQuickAdd}
                            saveQuickAdd={saveQuickAdd}
                            contributors={crewMembers}
                            currencyCode={currencyCode}
                        />
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
