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
import { Equipment, EquipmentCategoryGroup } from "@/lib/types";
import { EquipmentTable } from "./EquipmentTable";
import { EmptyEquipmentType } from "./EmptyEquipmentType";
import { getCategoryIcon, getCategoryColor, getCategoryColorWithAlpha } from "../utils/categoryConfig";

interface EquipmentAccordionProps {
    group: EquipmentCategoryGroup;
    onTypeToggle: (type: string) => void;
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
    const IconComponent = getCategoryIcon(group.category);
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
                    {/* Amazing Icon with Stunning Effects */}
                    <Box
                        sx={{
                            position: 'relative',
                            mr: 2,
                            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                transform: 'scale(1.1) rotate(5deg)',
                            },
                        }}
                    >
                        {/* Outer glow effect */}
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: '-4px',
                                borderRadius: '16px',
                                background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}80)`,
                                opacity: 0.4,
                                filter: 'blur(8px)',
                                transition: 'all 0.5s ease',
                                animation: group.expanded ? 'pulse 2s infinite' : 'none',
                                '@keyframes pulse': {
                                    '0%, 100%': { opacity: 0.4, transform: 'scale(1)' },
                                    '50%': { opacity: 0.6, transform: 'scale(1.05)' },
                                },
                            }}
                        />

                        {/* Main icon container */}
                        <Box
                            sx={{
                                position: 'relative',
                                width: 48,
                                height: 48,
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}CC)`,
                                boxShadow: `
                                    0 8px 32px ${categoryColor}40,
                                    0 4px 16px ${categoryColor}30,
                                    inset 0 1px 2px rgba(255,255,255,0.3),
                                    inset 0 -1px 2px rgba(0,0,0,0.2)
                                `,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: `
                                        0 12px 40px ${categoryColor}50,
                                        0 6px 20px ${categoryColor}40,
                                        inset 0 1px 3px rgba(255,255,255,0.4),
                                        inset 0 -1px 3px rgba(0,0,0,0.3)
                                    `,
                                },
                            }}
                        >
                            {/* Inner highlight */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: '2px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.4), transparent 60%)',
                                    opacity: 0.3,
                                }}
                            />

                            {/* The actual icon */}
                            <IconComponent
                                sx={{
                                    position: 'relative',
                                    fontSize: 24,
                                    color: '#ffffff',
                                    filter: `
                                        drop-shadow(0 2px 4px rgba(0,0,0,0.4))
                                        drop-shadow(0 0 8px ${categoryColor}80)
                                    `,
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'scale(1.1)',
                                        filter: `
                                            drop-shadow(0 3px 6px rgba(0,0,0,0.5))
                                            drop-shadow(0 0 12px ${categoryColor}90)
                                        `,
                                    },
                                }}
                            />

                            {/* Subtle inner glow when expanded */}
                            {group.expanded && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        inset: '1px',
                                        borderRadius: '13px',
                                        background: `radial-gradient(circle at center, ${categoryColor}20, transparent 70%)`,
                                        animation: 'innerGlow 4s ease-in-out infinite alternate',
                                        '@keyframes innerGlow': {
                                            '0%': { opacity: 0.3 },
                                            '100%': { opacity: 0.6 },
                                        },
                                    }}
                                />
                            )}
                        </Box>

                        {/* Elegant floating orbs when expanded */}
                        {group.expanded && (
                            <>
                                {[...Array(3)].map((_, i) => (
                                    <Box
                                        key={i}
                                        sx={{
                                            position: 'absolute',
                                            width: i === 1 ? '2px' : '1.5px',
                                            height: i === 1 ? '2px' : '1.5px',
                                            borderRadius: '50%',
                                            background: `radial-gradient(circle, ${categoryColor}, ${categoryColor}80)`,
                                            left: `${25 + i * 20}%`,
                                            top: `${20 + i * 15}%`,
                                            boxShadow: `0 0 6px ${categoryColor}60`,
                                            animation: `elegantFloat ${2 + i * 0.5}s ease-in-out infinite`,
                                            animationDelay: `${i * 0.4}s`,
                                            '@keyframes elegantFloat': {
                                                '0%, 100%': {
                                                    transform: 'translateY(0px) translateX(0px)',
                                                    opacity: 0.4,
                                                },
                                                '25%': {
                                                    transform: 'translateY(-6px) translateX(2px)',
                                                    opacity: 0.8,
                                                },
                                                '50%': {
                                                    transform: 'translateY(-4px) translateX(-2px)',
                                                    opacity: 1,
                                                },
                                                '75%': {
                                                    transform: 'translateY(-8px) translateX(1px)',
                                                    opacity: 0.6,
                                                },
                                            },
                                        }}
                                    />
                                ))}

                                {/* Subtle energy rings */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '60px',
                                        height: '60px',
                                        border: `1px solid ${categoryColor}30`,
                                        borderRadius: '50%',
                                        animation: 'energyRing 3s ease-in-out infinite',
                                        '@keyframes energyRing': {
                                            '0%': {
                                                opacity: 0,
                                                transform: 'translate(-50%, -50%) scale(0.8)',
                                            },
                                            '50%': {
                                                opacity: 0.3,
                                                transform: 'translate(-50%, -50%) scale(1)',
                                            },
                                            '100%': {
                                                opacity: 0,
                                                transform: 'translate(-50%, -50%) scale(1.2)',
                                            },
                                        },
                                    }}
                                />
                            </>
                        )}
                    </Box>
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
