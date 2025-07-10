"use client";

import React from "react";
import { Box, Chip } from "@mui/material";

interface Category {
    id: string;
    name: string;
    count: number;
}

interface SceneCategoriesProps {
    categories: Category[];
    selectedCategory: string;
    onCategorySelect: (categoryId: string) => void;
}

const SceneCategories: React.FC<SceneCategoriesProps> = ({
    categories,
    selectedCategory,
    onCategorySelect,
}) => {
    return (
        <Box
            sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                mb: 2,
            }}
        >
            {categories.map((category) => (
                <Chip
                    key={category.id}
                    label={`${category.name} (${category.count})`}
                    variant={selectedCategory === category.id ? "filled" : "outlined"}
                    size="small"
                    onClick={() => onCategorySelect(category.id)}
                    sx={{
                        fontSize: "0.75rem",
                        height: 24,
                        cursor: "pointer",
                        transition: "all 0.2s ease-in-out",
                        ...(selectedCategory === category.id
                            ? {
                                bgcolor: "rgba(123, 97, 255, 0.8)",
                                color: "white",
                                border: "1px solid rgba(123, 97, 255, 0.8)",
                                "&:hover": {
                                    bgcolor: "rgba(123, 97, 255, 0.9)",
                                },
                            }
                            : {
                                bgcolor: "transparent",
                                color: "rgba(255, 255, 255, 0.7)",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                "&:hover": {
                                    bgcolor: "rgba(123, 97, 255, 0.1)",
                                    border: "1px solid rgba(123, 97, 255, 0.3)",
                                    color: "rgba(255, 255, 255, 0.9)",
                                },
                            }),
                    }}
                />
            ))}
        </Box>
    );
};

export default SceneCategories;
