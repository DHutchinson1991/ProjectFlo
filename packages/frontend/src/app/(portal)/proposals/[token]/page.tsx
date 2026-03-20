"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Box, Typography } from "@mui/material";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { scaleIn, shimmer } from "@/lib/portal/animations";
import { getThemeColors } from "@/lib/portal/themes";
import type {
    PortalBrand, ProposalContent,
    PortalEstimate,
    PublicEventDay, PublicFilm,
} from "@/lib/types/domains/portal";
import ProposalRenderer from "../../_components/ProposalRenderer";
import ProposalAcceptanceBar from "../../_components/ProposalAcceptanceBar";

/* ------------------------------------------------------------------ */
/* Types for the public proposal response                             */
/* ------------------------------------------------------------------ */

interface PublicContact {
    first_name: string;
    last_name: string;
    email: string;
}

interface PackageItem {
    description: string;
    price: number;
    type?: string;
}

interface PublicPackage {
    id: number;
    name: string;
    description: string | null;
    base_price: string;
    currency: string;
    contents?: {
        items?: PackageItem[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    } | null;
}

interface PublicInquiry {
    id: number;
    wedding_date: string | null;
    venue_details: string | null;
    venue_address: string | null;
    contact: PublicContact;
    estimates: PortalEstimate[];
    selected_package: PublicPackage | null;
    schedule_event_days: PublicEventDay[];
    schedule_films: PublicFilm[];
}

interface PublicProposal {
    id: number;
    title: string;
    status: string;
    content: ProposalContent | null;
    sent_at: string | null;
    client_response: string | null;
    client_response_at: string | null;
    client_response_message: string | null;
    inquiry: PublicInquiry;
    brand: PortalBrand | null;
}

/* ================================================================== */
/* Main Component                                                      */
/* ================================================================== */

export default function PublicProposalPage() {
    const params = useParams();
    const token = params.token as string;

    const [proposal, setProposal] = useState<PublicProposal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [responding, setResponding] = useState(false);
    const [responseSuccess, setResponseSuccess] = useState<string | null>(null);

    const fetchProposal = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.publicProposals.getByShareToken(token);
            setProposal(data);
        } catch {
            setError("This proposal could not be found or may have expired.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchProposal();
    }, [token, fetchProposal]);

    const handleAccept = async () => {
        if (!proposal) return;
        try {
            setResponding(true);
            await api.publicProposals.respond(token, "Accepted");
            setResponseSuccess("accepted");
            setProposal((p) => p ? { ...p, client_response: "Accepted", status: "Accepted" } : p);
        } catch {
            setError("Failed to accept proposal. Please try again.");
        } finally {
            setResponding(false);
        }
    };

    const handleRequestChanges = async (message: string) => {
        if (!proposal) return;
        try {
            setResponding(true);
            await api.publicProposals.respond(token, "ChangesRequested", message);
            setResponseSuccess("changes");
            setProposal((p) =>
                p ? { ...p, client_response: "ChangesRequested", client_response_message: message } : p,
            );
        } catch {
            setError("Failed to send your request. Please try again.");
        } finally {
            setResponding(false);
        }
    };

    /* ── Loading ─────────────────────────────────────────── */

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "#09090b",
                    gap: 3,
                }}
            >
                {/* Animated skeleton bars */}
                {[180, 120, 240].map((w, i) => (
                    <Box
                        key={i}
                        sx={{
                            width: w,
                            height: 10,
                            borderRadius: 5,
                            background: `linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%)`,
                            backgroundSize: "200% 100%",
                            animation: `${shimmer} 1.6s ease-in-out infinite`,
                            animationDelay: `${i * 0.15}s`,
                        }}
                    />
                ))}
            </Box>
        );
    }

    if (error && !proposal) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "#09090b",
                    p: 3,
                }}
            >
                <Box
                    sx={{
                        p: 5,
                        maxWidth: 420,
                        textAlign: "center",
                        bgcolor: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: 3,
                        animation: `${scaleIn} 0.5s cubic-bezier(0.16, 1, 0.3, 1) both`,
                    }}
                >
                    <Typography variant="h6" sx={{ color: "#fafafa", mb: 1, fontWeight: 600 }}>
                        Proposal Not Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#a1a1aa", lineHeight: 1.6 }}>
                        {error}
                    </Typography>
                </Box>
            </Box>
        );
    }

    if (!proposal) return null;

    /* ── Derived data ────────────────────────────────────── */

    const content = proposal.content;
    const colors = getThemeColors(content?.theme);
    const inquiry = proposal.inquiry;
    const contact = inquiry.contact;
    const brand = proposal.brand;
    const estimate = inquiry.estimates?.[0];
    const pkg = inquiry.selected_package;
    const clientName = `${contact.first_name} ${contact.last_name}`;
    const alreadyResponded = !!proposal.client_response;
    const isDark = !content?.theme || content.theme === "cinematic-dark";
    const eventDays = inquiry.schedule_event_days || [];
    const films = inquiry.schedule_films || [];

    /* ================================================================ */
    /* Render                                                           */
    /* ================================================================ */

    return (
        <ProposalRenderer
            content={content}
            brand={brand}
            estimate={estimate}
            pkg={pkg}
            eventDays={eventDays}
            films={films}
            clientName={clientName}
            weddingDate={inquiry.wedding_date}
            venueDetails={inquiry.venue_details}
            venueAddress={inquiry.venue_address}
            colors={colors}
            ctaSlot={
                <ProposalAcceptanceBar
                    colors={colors}
                    isDark={isDark}
                    alreadyResponded={alreadyResponded}
                    clientResponse={proposal.client_response}
                    clientResponseMessage={proposal.client_response_message}
                    responding={responding}
                    responseSuccess={!!responseSuccess}
                    onAccept={handleAccept}
                    onRequestChanges={handleRequestChanges}
                />
            }
        />
    );
}
