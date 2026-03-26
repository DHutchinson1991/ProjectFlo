"use client";

import React from "react";
import { Box, TextField, InputAdornment } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";

interface ScenesSearchProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    placeholder?: string;
}

const ScenesSearch: React.FC<ScenesSearchProps> = ({
    searchTerm,
    onSearchChange,
    placeholder = "Search scenes...",
}) => {
    return (
        <Box sx={{ mb: 2 }}>
            <TextField
                fullWidth
                size="small"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={placeholder}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon sx={{ color: "rgba(255, 255, 255, 0.5)" }} />
                        </InputAdornment>
                    ),
                }}
                sx={{
                    "& .MuiOutlinedInput-root": {
                        bgcolor: "rgba(8, 8, 12, 0.9)",
                        borderRadius: 2,
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        color: "white",
                        fontSize: "0.875rem",
                        "&:hover": {
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                        },
                        "&.Mui-focused": {
                            border: "1px solid rgba(123, 97, 255, 0.5)",
                            boxShadow: "0 0 0 2px rgba(123, 97, 255, 0.1)",
                        },
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                    },
                    "& .MuiInputBase-input": {
                        color: "white",
                        "&::placeholder": {
                            color: "rgba(255, 255, 255, 0.5)",
                            opacity: 1,
                        },
                    },
                }}
            />
        </Box>
    );
};

export { ScenesSearch };
