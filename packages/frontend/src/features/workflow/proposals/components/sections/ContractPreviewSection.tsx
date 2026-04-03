"use client";

import { Box, Typography, Chip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Gavel as GavelIcon, Visibility as VisibilityIcon } from "@mui/icons-material";
import type { SectionBaseProps, PublicProposalContractPreview } from "@/features/workflow/proposals/types";
import RevealBox from "./RevealBox";

interface ContractPreviewSectionProps extends SectionBaseProps {
    contract: PublicProposalContractPreview;
}

const STATUS_COLOR: Record<string, string> = {
    Signed: "#22c55e",
    Sent: "#a78bfa",
    Draft: "#64748b",
    Cancelled: "#ef4444",
};

export default function ContractPreviewSection({ contract, colors, isDark }: ContractPreviewSectionProps) {
    const statusColor = STATUS_COLOR[contract.status] ?? "#94a3b8";

    return (
        <RevealBox>
            <Box sx={{
                borderRadius: 3,
                border: `1px solid ${alpha(colors.muted, 0.15)}`,
                overflow: "hidden",
                bgcolor: isDark ? "rgba(15,15,20,0.7)" : "rgba(255,255,255,0.7)",
            }}>
                {/* Header bar */}
                <Box sx={{
                    px: { xs: 2.5, md: 3 }, py: 2,
                    borderBottom: `1px solid ${alpha(colors.muted, 0.12)}`,
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1,
                    bgcolor: isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.02)",
                }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{
                            width: 32, height: 32, borderRadius: "50%",
                            bgcolor: alpha(colors.accent, 0.12),
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <GavelIcon sx={{ fontSize: 16, color: colors.accent }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                Contract
                            </Typography>
                            <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: colors.text, lineHeight: 1.2 }}>
                                {contract.title}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip
                            label={contract.status}
                            size="small"
                            sx={{
                                height: 22, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.04em",
                                bgcolor: alpha(statusColor, 0.12), color: statusColor, border: `1px solid ${alpha(statusColor, 0.25)}`,
                            }}
                        />
                        <Chip
                            icon={<VisibilityIcon sx={{ fontSize: "12px !important" }} />}
                            label="Read Only"
                            size="small"
                            sx={{
                                height: 22, fontSize: "0.62rem", fontWeight: 600,
                                bgcolor: alpha(colors.muted, 0.08), color: colors.muted,
                            }}
                        />
                    </Box>
                </Box>

                {/* Contract body */}
                {contract.rendered_html ? (
                    <Box sx={{
                        maxHeight: 600,
                        overflowY: "auto",
                        px: { xs: 2.5, md: 4 },
                        py: 3,
                        "&::-webkit-scrollbar": { width: 4 },
                        "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
                        "&::-webkit-scrollbar-thumb": { bgcolor: alpha(colors.muted, 0.2), borderRadius: 2 },
                    }}>
                        <Box
                            sx={{
                                color: isDark ? "#cbd5e1" : "#1e293b",
                                fontSize: "0.82rem",
                                lineHeight: 1.8,
                                "& h1, & h2, & h3": { color: colors.text, fontWeight: 700, mt: 2, mb: 1 },
                                "& h1": { fontSize: "1.1rem" },
                                "& h2": { fontSize: "0.95rem" },
                                "& h3": { fontSize: "0.85rem" },
                                "& p": { mb: 1 },
                                "& ul, & ol": { pl: 2.5, mb: 1 },
                                "& li": { mb: 0.4 },
                                "& strong": { color: colors.text },
                                "& hr": { borderColor: alpha(colors.muted, 0.15), my: 2 },
                                "& table": { width: "100%", borderCollapse: "collapse", mb: 1.5, fontSize: "0.78rem" },
                                "& th, & td": { p: "6px 10px", border: `1px solid ${alpha(colors.muted, 0.15)}`, textAlign: "left" },
                                "& th": { bgcolor: alpha(colors.muted, 0.06), fontWeight: 700, color: colors.text },
                            }}
                            dangerouslySetInnerHTML={{ __html: contract.rendered_html }}
                        />
                    </Box>
                ) : (
                    <Box sx={{ px: { xs: 2.5, md: 3 }, py: 4, textAlign: "center" }}>
                        <Typography sx={{ fontSize: "0.82rem", color: colors.muted }}>
                            Contract content is not yet available for preview.
                        </Typography>
                    </Box>
                )}

                {/* Signers summary */}
                {contract.signers.length > 0 && (
                    <Box sx={{
                        px: { xs: 2.5, md: 3 }, py: 1.5,
                        borderTop: `1px solid ${alpha(colors.muted, 0.1)}`,
                        bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)",
                        display: "flex", flexWrap: "wrap", gap: 2,
                    }}>
                        {contract.signers.map((signer) => (
                            <Box key={signer.id} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                <Box sx={{
                                    width: 7, height: 7, borderRadius: "50%",
                                    bgcolor: signer.status === "signed" ? "#22c55e" : signer.status === "viewed" ? colors.accent : alpha(colors.muted, 0.4),
                                }} />
                                <Typography sx={{ fontSize: "0.72rem", color: colors.muted }}>
                                    {signer.name}
                                    {signer.role && signer.role !== "client" && (
                                        <Typography component="span" sx={{ fontSize: "0.65rem", color: alpha(colors.muted, 0.6), ml: 0.5 }}>
                                            ({signer.role})
                                        </Typography>
                                    )}
                                    {" · "}
                                    <Typography component="span" sx={{ fontSize: "0.65rem", color: signer.status === "signed" ? "#22c55e" : colors.muted }}>
                                        {signer.status === "signed" ? "Signed" : signer.status === "viewed" ? "Viewed" : "Pending"}
                                    </Typography>
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        </RevealBox>
    );
}
