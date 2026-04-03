"use client";

import React, { useState } from "react";
import { Box, Typography, TextField, Button, CircularProgress } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    CheckCircle as CheckCircleIcon,
    Send as SendIcon,
    ChatBubbleOutline as NoteIcon,
} from "@mui/icons-material";
import { clientPortalApi } from "@/features/workflow/client-portal/api";
import type { PortalDashboardColors } from "@/features/workflow/proposals/utils/portal/themes";

export function AddNoteSection({ token, colors }: { token: string; colors: PortalDashboardColors }) {
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSend = async () => {
        if (!message.trim()) return;
        setSending(true);
        try {
            await clientPortalApi.submitPackageRequest(token, { notes: message.trim() });
            setSent(true);
            setMessage("");
        } catch {
            // silent — can improve later
        } finally {
            setSending(false);
        }
    };

    if (sent) {
        return (
            <Box sx={{
                mb: 4, p: 3, borderRadius: "16px", textAlign: "center",
                bgcolor: alpha(colors.green, 0.04),
                border: `1px solid ${alpha(colors.green, 0.12)}`,
            }}>
                <CheckCircleIcon sx={{ fontSize: 28, color: colors.green, mb: 0.5 }} />
                <Typography sx={{ color: colors.text, fontSize: "0.88rem", fontWeight: 600 }}>Message sent!</Typography>
                <Typography sx={{ color: colors.muted, fontSize: "0.75rem", mt: 0.25 }}>We&apos;ll get back to you shortly.</Typography>
                <Button size="small" onClick={() => setSent(false)}
                    sx={{ color: colors.muted, fontSize: "0.72rem", textTransform: "none", mt: 1 }}>
                    Send another
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{
            mb: 4, p: 3, borderRadius: "16px",
            bgcolor: alpha(colors.card, 0.5),
            border: `1px solid ${alpha(colors.border, 0.15)}`,
        }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <NoteIcon sx={{ fontSize: 18, color: colors.muted }} />
                <Typography sx={{
                    color: colors.muted, fontSize: "0.62rem", fontWeight: 700,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                }}>
                    Have a question?
                </Typography>
            </Box>
            <TextField
                multiline rows={3}
                placeholder="Type a message about your payments, billing, or anything else..."
                value={message} onChange={(e) => setMessage(e.target.value)} fullWidth
                sx={{
                    mb: 1.5,
                    "& .MuiOutlinedInput-root": {
                        borderRadius: "12px", bgcolor: alpha(colors.bg, 0.5),
                        color: colors.text, fontSize: "0.82rem",
                        "& fieldset": { borderColor: alpha(colors.border, 0.15) },
                        "&:hover fieldset": { borderColor: alpha(colors.border, 0.3) },
                        "&.Mui-focused fieldset": { borderColor: alpha("#ec4899", 0.4) },
                    },
                    "& .MuiInputBase-input::placeholder": { color: colors.muted, opacity: 0.7 },
                }}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                    size="small" variant="contained"
                    disabled={!message.trim() || sending}
                    startIcon={sending ? <CircularProgress size={14} sx={{ color: "inherit" }} /> : <SendIcon sx={{ fontSize: 14 }} />}
                    onClick={handleSend}
                    sx={{
                        textTransform: "none", fontWeight: 600, fontSize: "0.75rem",
                        borderRadius: "10px", px: 2.5,
                        background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
                        "&.Mui-disabled": { opacity: 0.4 },
                    }}
                >
                    {sending ? "Sending..." : "Send Message"}
                </Button>
            </Box>
        </Box>
    );
}
