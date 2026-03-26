"use client";

import React from "react";
import { Box } from "@mui/material";
import { Check as CheckIcon } from "@mui/icons-material";
import { C } from '../constants/wizard-config';
import { checkPop } from '../constants/animations';

export const Suc = ({ show }: { show: boolean }) => show ? (
    <Box sx={{ display: "inline-flex", animation: `${checkPop} 0.3s ease-out both`, ml: 1 }}>
        <CheckIcon sx={{ fontSize: 18, color: C.success }} />
    </Box>
) : null;
