"use client";

import React from "react";
import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Chip,
} from "@mui/material";
import {
    ExpandMore as ExpandMoreIcon,
    Add as AddIcon,
} from "@mui/icons-material";
import { Equipment, EquipmentCategoryGroup } from "@/features/workflow/equipment/types/equipment.types";
import type { Crew } from "@/shared/types/users";
import { EquipmentTable } from "./EquipmentTable";
import { EmptyEquipmentType } from "./EmptyEquipmentType";
import { EquipmentCategoryIcon } from "./EquipmentCategoryIcon";
import { getCategoryColor, getCategoryColorWithAlpha } from "../constants/categoryConfig";

interface EquipmentAccordionProps {
    group: EquipmentCategoryGroup;
    onTypeToggle: (type: string) => void;
    crew: Crew[];
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
    startQuickAdd: (type: string) => void;
    cancelQuickAdd: () => void;
    saveQuickAdd: () => void;
    updateQuickAddData: (field: keyof Equipment, value: unknown) => void;
}

export function EquipmentAccordion({
    group,
    onTypeToggle,
    crew,
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
    startQuickAdd,
    cancelQuickAdd,
    saveQuickAdd,
    updateQuickAddData,
}: EquipmentAccordionProps) {
    const categoryColor = getCategoryColor(group.category);
    const typeColor = getCategoryColorWithAlpha(group.category, 0.3);
    const typeHoverColor = getCategoryColorWithAlpha(group.category, 0.15);

    return (
        <Accordion
            expanded={group.expanded}
            onChange={() => onTypeToggle(group.category)}
            sx={{
                mb: 2,
                borderRadius: 3,
                background: typeColor,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                transition: 'all 0.3s ease',
                overflow: 'hidden',
                '&:hover': {
                    background: typeHoverColor,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 8px 32px ${categoryColor}20`,
                    border: `1px solid ${categoryColor}40`,
                },
                '&:before': {
                    display: 'none',
                },
                '&.Mui-expanded': {
                    margin: '0 0 16px 0',
                    boxShadow: `0 12px 40px ${categoryColor}25`,
                    border: `1px solid ${categoryColor}30`,
                },
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: 'white', fontSize: 28 }} />}
                sx={{
                    minHeight: 72,
                    borderRadius: 3,
                    '& .MuiAccordionSummary-content': {
                        alignItems: 'center',
                        margin: '16px 0',
                    },
                    '& .MuiAccordionSummary-expandIconWrapper': {
                        transition: 'transform 0.3s ease',
                    },
                }}
            >
                <Box display="flex" alignItems="center" width="100%">
                    <EquipmentCategoryIcon category={group.category} expanded={group.expanded ?? false} />
                    <Box flex={1}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 600,
                                color: 'white',
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                            }}
                        >
                            {group.label}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                mt: 0.5,
                            }}
                        >
                            {group.count} item{group.count !== 1 ? 's' : ''}
                        </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                            label={group.count}
                            size="small"
                            sx={{
                                background: 'rgba(255, 255, 255, 0.25)',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                            }}
                        />
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                startQuickAdd(group.category);
                            }}
                            sx={{
                                color: 'white',
                                background: 'rgba(255, 255, 255, 0.15)',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                borderRadius: 2,
                                backdropFilter: 'blur(10px)',
                                '&:hover': {
                                    background: 'rgba(255, 255, 255, 0.25)',
                                    transform: 'scale(1.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.4)',
                                },
                            }}
                        >
                            <AddIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
                {group.equipment.length > 0 ? (
                    <EquipmentTable
                        equipment={group.equipment}
                        type={group.category}
                        crew={crew}
                        inlineEditingEquipment={inlineEditingEquipment}
                        inlineEditData={inlineEditData}
                        updateInlineEditData={updateInlineEditData}
                        startInlineEdit={startInlineEdit}
                        cancelInlineEdit={cancelInlineEdit}
                        saveInlineEdit={saveInlineEdit}
                        setEquipmentToDelete={setEquipmentToDelete}
                        setDeleteConfirmOpen={setDeleteConfirmOpen}
                        quickAddType={quickAddType}
                        quickAddData={quickAddData}
                        cancelQuickAdd={cancelQuickAdd}
                        saveQuickAdd={saveQuickAdd}
                        updateQuickAddData={updateQuickAddData}
                    />
                ) : (
                    <EmptyEquipmentType
                        type={group.category}
                        onAddClick={() => startQuickAdd(group.category)}
                    />
                )}
            </AccordionDetails>
        </Accordion>
    );
}
