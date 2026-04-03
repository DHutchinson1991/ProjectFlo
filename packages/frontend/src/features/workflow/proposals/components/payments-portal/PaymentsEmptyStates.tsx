import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import {
    Celebration as CelebrationIcon,
    Payment as PaymentIcon,
} from "@mui/icons-material";
import type { PortalDashboardColors } from "@/features/workflow/proposals/utils/portal/themes";
import { formatCurrency } from "@/features/workflow/proposals/utils/portal/formatting";

/* ── Animations ───────────────────────────────────────────── */

const confettiDrop = keyframes`
    0%   { transform: translateY(-20px) rotate(0deg) scale(0); opacity: 1; }
    50%  { opacity: 1; }
    100% { transform: translateY(60px) rotate(720deg) scale(1); opacity: 0; }
`;

const CONFETTI_COLORS = ["#ec4899", "#8b5cf6", "#22c55e", "#f59e0b", "#3b82f6", "#ef4444"];

function ConfettiBurst() {
    const pieces = useMemo(() =>
        Array.from({ length: 24 }, (_, i) => ({
            id: i,
            left: `${8 + Math.random() * 84}%`,
            delay: `${Math.random() * 0.8}s`,
            duration: `${1.2 + Math.random() * 0.8}s`,
            color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            size: 4 + Math.random() * 6,
        })),
    []);

    return (
        <Box sx={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1 }}>
            {pieces.map((p) => (
                <Box key={p.id} sx={{
                    position: "absolute",
                    top: 0, left: p.left,
                    width: p.size, height: p.size,
                    borderRadius: p.size > 7 ? "2px" : "50%",
                    bgcolor: p.color,
                    animation: `${confettiDrop} ${p.duration} ease-out ${p.delay} forwards`,
                }} />
            ))}
        </Box>
    );
}

/* ── All Paid Celebration ─────────────────────────────────── */

export function AllPaidCelebration({ colors, brandName }: { colors: PortalDashboardColors; brandName: string }) {
    return (
        <Box sx={{
            mb: 4, p: 4, borderRadius: "20px", textAlign: "center",
            position: "relative", overflow: "hidden",
            bgcolor: alpha(colors.green, 0.04),
            border: `1px solid ${alpha(colors.green, 0.15)}`,
        }}>
            <ConfettiBurst />
            <Box sx={{ position: "relative", zIndex: 2 }}>
                <CelebrationIcon sx={{ fontSize: 48, color: colors.green, mb: 1 }} />
                <Typography sx={{ color: colors.text, fontSize: "1.35rem", fontWeight: 800, mb: 0.5 }}>
                    All Paid!
                </Typography>
                <Typography sx={{ color: colors.muted, fontSize: "0.88rem", lineHeight: 1.6, maxWidth: 400, mx: "auto" }}>
                    Thank you for completing all payments. {brandName} can&apos;t wait to make your day incredible!
                </Typography>
            </Box>
        </Box>
    );
}

/* ── No Payments Yet ──────────────────────────────────────── */

export function NoPaidYetEmptyState({ colors, totalAmount, currency }: { colors: PortalDashboardColors; totalAmount: number; currency: string }) {
    return (
        <Box sx={{
            mb: 3, p: 3, borderRadius: "16px", textAlign: "center",
            bgcolor: alpha(colors.card, 0.5),
            border: `1px solid ${alpha(colors.border, 0.15)}`,
        }}>
            <PaymentIcon sx={{ fontSize: 40, color: alpha(colors.muted, 0.3), mb: 1 }} />
            <Typography sx={{ color: colors.text, fontSize: "1rem", fontWeight: 700, mb: 0.5 }}>
                No payments yet
            </Typography>
            <Typography sx={{ color: colors.muted, fontSize: "0.82rem", lineHeight: 1.6 }}>
                Your total is {formatCurrency(totalAmount, currency)}. Complete your first payment to get started!
            </Typography>
        </Box>
    );
}
