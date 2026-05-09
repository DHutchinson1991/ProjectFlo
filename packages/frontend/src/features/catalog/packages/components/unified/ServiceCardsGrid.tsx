"use client";

import React from "react";
import { Box, Card, Typography, Chip, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { hexToRgba } from "@/shared/ui/tasks";
import { formatCurrency } from "@projectflo/shared";

export interface ServiceCardStat {
    key: string;
    label: string;
    icon: string;
    color: string;
    description: string;
    activeCount: number;
    inactiveCount: number;
    totalValue?: number;
}

interface ServiceCardsGridProps {
    cards: ServiceCardStat[];
    selectedKey: string | null;
    onCardClick: (key: string) => void;
    onDisable?: (key: string) => void;
    showAddCard?: boolean;
    onAddService: () => void;
    currencyCode?: string;
    itemLabelSingular?: string;
    itemLabelPlural?: string;
    activeLabel?: string;
}

export function ServiceCardsGrid({
    cards,
    selectedKey,
    onCardClick,
    onDisable,
    showAddCard,
    onAddService,
    currencyCode = "GBP",
    itemLabelSingular = "package",
    itemLabelPlural = "packages",
    activeLabel = "active",
}: ServiceCardsGridProps) {
    const colCount = cards.length + (showAddCard ? 1 : 0);

    return (
        <Box sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            mb: 4,
            alignItems: "stretch",
        }}>
            {cards.map((card) => {
                const isSelected = selectedKey === card.key;
                const totalCount = card.activeCount + card.inactiveCount;
                const avgValue = totalCount > 0 ? (card.totalValue ?? 0) / totalCount : 0;
                const gradient = `linear-gradient(135deg, ${card.color} 0%, ${hexToRgba(card.color, 0.7)} 100%)`;
                const hoverColor = hexToRgba(card.color, 0.2);

                return (
                    <Card
                        key={card.key}
                        elevation={0}
                        onClick={() => onCardClick(card.key)}
                        sx={{
                            flex: "1 1 200px",
                            maxWidth: 320,
                            p: 2.5,
                            border: isSelected ? "2px solid rgba(255,255,255,0.6)" : "1px solid",
                            borderColor: isSelected ? "rgba(255,255,255,0.6)" : "divider",
                            borderRadius: 3,
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            minHeight: "140px",
                            position: "relative",
                            overflow: "hidden",
                            background: gradient,
                            backgroundSize: "200% 200%",
                            opacity: 0.9,
                            "&:hover": {
                                borderColor: card.color,
                                transform: "translateY(-4px)",
                                boxShadow: `0 8px 25px ${hoverColor}`,
                                opacity: 1,
                                backgroundPosition: "right center",
                            },
                        }}
                    >
                        {/* Background icon */}
                        <Box sx={{ position: "absolute", top: -10, right: -10, opacity: 0.2, zIndex: 0 }}>
                            <Typography sx={{ fontSize: 60 }}>{card.icon}</Typography>
                        </Box>

                        {/* Disable button */}
                        {onDisable && (
                            <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); onDisable(card.key); }}
                                sx={{
                                    position: "absolute",
                                    top: 6,
                                    right: 6,
                                    zIndex: 3,
                                    color: "rgba(255,255,255,0.4)",
                                    opacity: 0,
                                    transition: "opacity 0.2s",
                                    p: 0.5,
                                    ".MuiCard-root:hover &": { opacity: 1 },
                                    "&:hover": { color: "rgba(255,255,255,0.9)", bgcolor: "rgba(0,0,0,0.2)" },
                                }}
                            >
                                <CloseIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        )}

                        {/* Content */}
                        <Box sx={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column" }}>
                            <Typography variant="subtitle2" sx={{
                                fontWeight: 400,
                                color: "white",
                                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                                mb: 0.5,
                            }}>
                                {card.label}
                            </Typography>

                            <Typography variant="body2" sx={{
                                color: "rgba(255,255,255,0.5)",
                                mb: 2,
                                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                            }}>
                                {totalCount} {totalCount === 1 ? itemLabelSingular : itemLabelPlural}
                                {(card.totalValue ?? 0) > 0 && (
                                    <> · {formatCurrency(card.totalValue!, currencyCode)}</>
                                )}
                            </Typography>

                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: "auto" }}>
                                <Chip
                                    size="small"
                                    label={`${card.activeCount} ${activeLabel}`}
                                    sx={{
                                        bgcolor: "rgba(255,255,255,0.9)",
                                        color: "rgba(0,0,0,0.8)",
                                        fontWeight: 600,
                                        fontSize: "0.75rem",
                                        boxShadow: 1,
                                    }}
                                />
                                {avgValue > 0 && (
                                    <Typography variant="body2" sx={{
                                        color: "white",
                                        fontWeight: 400,
                                        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                                    }}>
                                        Avg. {formatCurrency(avgValue, currencyCode)}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Card>
                );
            })}

            {/* Add Service card */}
            {showAddCard && (
                <Card
                    elevation={0}
                    onClick={onAddService}
                    sx={{
                        flex: "0 0 auto",
                        width: 120,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px dashed rgba(255,255,255,0.12)",
                        borderRadius: 3,
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        minHeight: "140px",
                        bgcolor: "transparent",
                        "&:hover": {
                            borderColor: "rgba(255,255,255,0.25)",
                            bgcolor: "rgba(255,255,255,0.03)",
                            transform: "translateY(-4px)",
                        },
                    }}
                >
                    <Box sx={{ textAlign: "center" }}>
                        <AddIcon sx={{ fontSize: 28, color: "text.disabled", mb: 0.5 }} />
                        <Typography sx={{ fontSize: "0.75rem", color: "text.disabled", fontWeight: 600 }}>
                            Add Service
                        </Typography>
                    </Box>
                </Card>
            )}
        </Box>
    );
}
