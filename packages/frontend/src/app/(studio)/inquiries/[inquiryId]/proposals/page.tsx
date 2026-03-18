"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    IconButton,
    Alert,
    Snackbar,
    Chip,
    Paper,
    CircularProgress,
    Stack,
    List,
    ListItem,
    ListItemText,
    alpha,
} from "@mui/material";
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Send as SendIcon,
    OpenInNew as PreviewIcon,
    Link as LinkIcon,
    ArrowBack as BackIcon,
} from "@mui/icons-material";
import { useRouter, useParams } from "next/navigation";
import { proposalsService, inquiriesService } from "@/lib/api";
import type { Proposal, Inquiry } from "@/lib/types";
import { useBrand } from "../../../../providers/BrandProvider";

const STATUS_COLORS: Record<string, "default" | "primary" | "success" | "error" | "warning"> = {
    Draft: "default",
    Sent: "primary",
    Accepted: "success",
    Declined: "error",
};

export default function ProposalsPage() {
    const { currentBrand } = useBrand();
    const router = useRouter();
    const params = useParams();
    const inquiryId = parseInt(params.inquiryId as string);

    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [inquiry, setInquiry] = useState<Inquiry | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error" | "info" | "warning";
    }>({ open: false, message: "", severity: "success" });

    useEffect(() => {
        if (!currentBrand || isNaN(inquiryId)) return;
        loadData();
    }, [currentBrand, inquiryId]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [inquiryData, proposalsData] = await Promise.all([
                inquiriesService.getById(inquiryId),
                proposalsService.getAllByInquiry(inquiryId),
            ]);
            setInquiry(inquiryData);
            setProposals(proposalsData);
        } catch {
            showNotification("Failed to load proposals data", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const showNotification = (message: string, severity: "success" | "error" | "info" | "warning") => {
        setNotification({ open: true, message, severity });
    };

    /* -- Actions ---------------------------------------------------- */

    const handleGenerate = async () => {
        try {
            const newProposal = await proposalsService.create(inquiryId, {});
            showNotification("Proposal generated!", "success");
            await loadData();
        } catch {
            showNotification("Failed to generate proposal", "error");
        }
    };

    const handlePreview = async (proposal: Proposal) => {
        try {
            const token =
                proposal.share_token ||
                (await proposalsService.generateShareToken(inquiryId, proposal.id));
            window.open(`/proposals/${token}`, "_blank");
        } catch {
            showNotification("Failed to generate preview link", "error");
        }
    };

    const handleCopyLink = async (proposal: Proposal) => {
        try {
            const token =
                proposal.share_token ||
                (await proposalsService.generateShareToken(inquiryId, proposal.id));
            const shareUrl = `${window.location.origin}/proposals/${token}`;
            await navigator.clipboard.writeText(shareUrl);
            showNotification("Share link copied!", "success");
        } catch {
            showNotification("Failed to copy link", "error");
        }
    };

    const handleSend = async (proposalId: number) => {
        try {
            await proposalsService.sendProposal(inquiryId, proposalId);
            showNotification("Proposal sent!", "success");
            await loadData();
        } catch {
            showNotification("Failed to send proposal", "error");
        }
    };

    const handleDelete = async (proposalId: number) => {
        if (!confirm("Delete this proposal? This cannot be undone.")) return;
        try {
            await proposalsService.delete(inquiryId, proposalId);
            setProposals((prev) => prev.filter((p) => p.id !== proposalId));
            showNotification("Proposal deleted", "success");
        } catch {
            showNotification("Failed to delete proposal", "error");
        }
    };

    /* -- Render ----------------------------------------------------- */

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 780, mx: "auto", p: { xs: 2, md: 4 } }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <IconButton onClick={() => router.back()} sx={{ color: "#94a3b8" }}>
                    <BackIcon />
                </IconButton>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight={700} sx={{ color: "#f1f5f9" }}>
                        Proposals
                    </Typography>
                    {inquiry && (
                        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                            {inquiry.contact.first_name} {inquiry.contact.last_name} &bull;{" "}
                            {inquiry.contact.email}
                        </Typography>
                    )}
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleGenerate}
                    sx={{
                        textTransform: "none",
                        bgcolor: "#7c4dff",
                        fontWeight: 600,
                        "&:hover": { bgcolor: "#651fff" },
                    }}
                >
                    Generate Proposal
                </Button>
            </Stack>

            {/* Info banner */}
            <Paper
                sx={{
                    p: 2,
                    mb: 3,
                    bgcolor: alpha("#7c4dff", 0.06),
                    border: "1px solid",
                    borderColor: alpha("#7c4dff", 0.15),
                    borderRadius: 2,
                }}
            >
                <Typography variant="body2" sx={{ color: "#a78bfa" }}>
                    Proposals are auto-generated from your{" "}
                    <strong>Settings &gt; Proposal Defaults</strong> and the
                    inquiry&rsquo;s data. The hero title is tailored to the event type
                    and the intro message uses the customer&rsquo;s name.
                </Typography>
            </Paper>

            {/* Proposals list */}
            {proposals.length === 0 ? (
                <Paper
                    sx={{
                        p: 4,
                        textAlign: "center",
                        bgcolor: "#161b22",
                        border: "1px solid #1e1e1e",
                        borderRadius: 2,
                    }}
                >
                    <Typography sx={{ color: "#94a3b8", mb: 2 }}>
                        No proposals generated yet.
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={handleGenerate}
                        sx={{ textTransform: "none" }}
                    >
                        Generate First Proposal
                    </Button>
                </Paper>
            ) : (
                <Stack spacing={1.5}>
                    {proposals.map((proposal) => (
                        <Paper
                            key={proposal.id}
                            sx={{
                                p: 2,
                                bgcolor: "#161b22",
                                border: "1px solid #1e1e1e",
                                borderRadius: 2,
                                "&:hover": { borderColor: "#333" },
                            }}
                        >
                            <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                            >
                                <Box sx={{ flex: 1 }}>
                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight={600}
                                            sx={{ color: "#e0e0e0" }}
                                        >
                                            {proposal.title}
                                        </Typography>
                                        <Chip
                                            label={proposal.status}
                                            size="small"
                                            color={STATUS_COLORS[proposal.status] || "default"}
                                        />
                                    </Stack>
                                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                                        v{proposal.version} &bull; Created{" "}
                                        {proposal.created_at.toLocaleDateString()}
                                        {proposal.sent_at &&
                                            ` \u2022 Sent ${proposal.sent_at.toLocaleDateString()}`}
                                    </Typography>
                                </Box>

                                <Stack direction="row" spacing={0.5}>
                                    <IconButton
                                        size="small"
                                        title="Preview"
                                        onClick={() => handlePreview(proposal)}
                                        sx={{ color: "#7c4dff" }}
                                    >
                                        <PreviewIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        title="Copy share link"
                                        onClick={() => handleCopyLink(proposal)}
                                        sx={{ color: "#64b5f6" }}
                                    >
                                        <LinkIcon fontSize="small" />
                                    </IconButton>
                                    {proposal.status === "Draft" && (
                                        <IconButton
                                            size="small"
                                            title="Send proposal"
                                            onClick={() => handleSend(proposal.id)}
                                            sx={{ color: "#66bb6a" }}
                                        >
                                            <SendIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                    <IconButton
                                        size="small"
                                        title="Delete"
                                        onClick={() => handleDelete(proposal.id)}
                                        sx={{
                                            color: "#ef5350",
                                            "&:hover": { bgcolor: "rgba(239,68,68,0.1)" },
                                        }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Stack>
                            </Stack>
                        </Paper>
                    ))}
                </Stack>
            )}

            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification((p) => ({ ...p, open: false }))}
            >
                <Alert
                    onClose={() => setNotification((p) => ({ ...p, open: false }))}
                    severity={notification.severity}
                    sx={{ width: "100%" }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
