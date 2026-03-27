"use client";

import React from "react";
import { Box, Typography, Stack, Switch, IconButton, CircularProgress, Divider } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Edit as EditIcon } from "@mui/icons-material";
import { C, glassSx } from '../../constants/wizard-config';
import { NACtx, ScreenId } from '../../types';
import { formatNiceDate } from '../../selectors/wizard-navigation';
import { Q } from '../QuestionWrapper';
import type { ServicePackage, ServicePackageItem } from '@/features/catalog/packages/types/service-package.types';
import type { EventType, EventTypeDay, EventDayActivity } from '@/features/catalog/event-types/types';
import { formatCurrency } from '@projectflo/shared';

type EnrichedPackage = ServicePackage & {
    _tax?: { rate: number; amount: number; totalWithTax: number } | null;
    _totalCost?: number;
};

export default function SummaryScreen({ ctx }: { ctx: NACtx }) {
    const {
        responses, eventConfig, eventType, filteredPackages, currency,
        linkedInquiryId, createInquiry, setCreateInquiry, goTo,
        priceEstimate, priceLoading,
    } = ctx;

    const selectedPkg = filteredPackages.find((p) => String(p.id) === responses.selected_package);

    const Section = ({
        icon, label, editTo, children,
    }: { icon: string; label: string; editTo: ScreenId; children: React.ReactNode }) => (
        <Box sx={{ ...glassSx, p: 3, position: "relative" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ fontSize: "1.1rem" }}>{icon}</Typography>
                    <Typography sx={{ color: C.accent, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</Typography>
                </Box>
                <IconButton size="small" onClick={() => goTo(editTo)} sx={{ color: C.muted, "&:hover": { color: C.text } }}>
                    <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
            </Box>
            {children}
        </Box>
    );

    const Val = ({ label, value }: { label: string; value: string | undefined | null }) => {
        if (!value) return null;
        return (
            <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                <Typography sx={{ color: C.muted, fontSize: "0.8rem" }}>{label}</Typography>
                <Typography sx={{ color: C.text, fontSize: "0.8rem", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{value}</Typography>
            </Box>
        );
    };

    /* helpers for custom package summary */
    const getActivitiesLabel = (): string | undefined => {
        const ids: number[] = responses.builder_activities || [];
        const etName = (responses.event_type || "").toLowerCase();
        const et = ctx.eventTypes.find((e: EventType) => e.name?.toLowerCase() === etName);
        if (!et?.event_days?.length) return ids.length ? `${ids.length} selected` : undefined;
        const day = et.event_days.sort((a: EventTypeDay, b: EventTypeDay) => (a.order_index ?? 0) - (b.order_index ?? 0))[0];
        const presets: EventDayActivity[] = day?.event_day_template?.activity_presets || [];
        return presets.filter((p: EventDayActivity) => ids.includes(p.id)).map((p: EventDayActivity) => p.name).join(", ") || undefined;
    };

    const getCoverageLabel = (): string | undefined => {
        const ids: number[] = responses.builder_activities || [];
        const etName = (responses.event_type || "").toLowerCase();
        const et = ctx.eventTypes.find((e: EventType) => e.name?.toLowerCase() === etName);
        if (!et?.event_days?.length) return undefined;
        const day = et.event_days.sort((a: EventTypeDay, b: EventTypeDay) => (a.order_index ?? 0) - (b.order_index ?? 0))[0];
        const presets: EventDayActivity[] = day?.event_day_template?.activity_presets || [];
        const mins = presets.filter((p: EventDayActivity) => ids.includes(p.id)).reduce((s: number, p: EventDayActivity) => s + (p.default_duration_minutes || 60), 0);
        const hrs = Math.round((mins / 60) * 2) / 2;
        return hrs > 0 ? `~${hrs} hours` : undefined;
    };

    const getFilmsLabel = (): string | undefined => {
        const films: Array<{ type: string; activityPresetId?: number; activityName?: string }> = responses.builder_films || [];
        if (!films.length) return undefined;
        return films.map((f) =>
            f.type === "ACTIVITY" ? `${f.activityName} Film` : f.type === "FEATURE" ? "Feature Film" : "Highlight Reel"
        ).join(", ");
    };

    const pkgPrice = (): number => {
        if (!selectedPkg) return 0;
        const epkg = selectedPkg as EnrichedPackage;
        const backendTax = epkg._tax;
        const t = backendTax?.totalWithTax ?? Number(epkg._totalCost ?? 0);
        const it = (selectedPkg.contents?.items ?? []).reduce((s: number, i: ServicePackageItem) => s + (i.price ?? 0), 0);
        return t > 0 ? t : (Number(selectedPkg.base_price) || it || 0);
    };

    return (
        <Q title="Review your answers" subtitle="Make sure everything looks right before you submit">
            <Stack spacing={2} sx={{ width: "100%" }}>
                {/* Event */}
                <Section icon="🎉" label="Your Event" editTo="event_type">
                    <Val label="Event" value={responses.event_type} />
                    <Val label="Date" value={responses.wedding_date_approx ? `${responses.wedding_date_approx} (approx)` : formatNiceDate(responses.wedding_date)} />
                    <Val label="Guests" value={responses.guest_count} />
                    {eventConfig.showPartner && <Val label="Partner" value={responses.partner_name} />}
                    {eventType === "birthday" && responses.is_birthday_person === "no" && (
                        <>
                            <Val label="Birthday person" value={responses.birthday_person_name} />
                            <Val label="Relation" value={responses.birthday_relation} />
                        </>
                    )}
                    <Val label="Venue" value={responses.venue_details} />
                </Section>

                {/* Package or Custom */}
                {responses.package_path === "pick" ? (
                    <Section icon="📦" label="Your Package" editTo="packages">
                        <Val label="Budget" value={responses.budget_range} />
                        <Val label="Package" value={
                            selectedPkg
                                ? `${selectedPkg.name} \u2014 ${formatCurrency(pkgPrice(), currency, 0)}`
                                : responses.selected_package === "none" ? "Decide later" : undefined
                        } />
                    </Section>
                ) : (
                    <Section icon="🎨" label="Your Custom Package" editTo="builder">
                        <Val label="Activities" value={getActivitiesLabel()} />
                        <Val label="Coverage" value={getCoverageLabel()} />
                        <Val label="Films" value={getFilmsLabel()} />
                        <Val label="Videographers" value={responses.operator_count ? String(responses.operator_count) : undefined} />
                        <Val label="Cameras" value={responses.camera_count ? String(responses.camera_count) : undefined} />

                        {/* Price estimate */}
                        {priceLoading && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5 }}>
                                <CircularProgress size={14} sx={{ color: C.accent }} />
                                <Typography sx={{ color: C.muted, fontSize: "0.75rem" }}>Calculating estimate…</Typography>
                            </Box>
                        )}
                        {priceEstimate && !priceLoading && (
                            <Box sx={{ mt: 1.5 }}>
                                <Divider sx={{ borderColor: alpha(C.border, 0.4), mb: 1.5 }} />
                                <Typography sx={{ color: C.accent, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", mb: 1 }}>
                                    Estimated Investment
                                </Typography>
                                {priceEstimate.summary.equipmentCost > 0 && (
                                    <Val label="Equipment" value={formatCurrency(priceEstimate.summary.equipmentCost, currency, 0)} />
                                )}
                                {priceEstimate.summary.crewCost > 0 && (
                                    <Val label="Crew" value={formatCurrency(priceEstimate.summary.crewCost, currency, 0)} />
                                )}

                                <Box sx={{ display: "flex", justifyContent: "space-between", pt: 1, mt: 0.5, borderTop: `1px solid ${alpha(C.accent, 0.2)}` }}>
                                    <Typography sx={{ color: C.text, fontSize: "0.85rem", fontWeight: 700 }}>Estimated Total</Typography>
                                    <Typography sx={{ color: C.accent, fontSize: "0.85rem", fontWeight: 700 }}>
                                        {formatCurrency(priceEstimate.summary.subtotal, currency, 0)}
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </Section>
                )}

                {/* Additional */}
                <Section icon="📝" label="Additional" editTo="special">
                    <Val label="Special requests" value={responses.special_requests} />
                    <Val label="Found via" value={[responses.lead_source, responses.lead_source_details].filter(Boolean).join(" — ")} />
                </Section>

                {/* Call */}
                {responses.discovery_call_interest === "yes" && (
                    <Section icon="📞" label="Discovery Call" editTo="call_details">
                        <Val label="Method" value={responses.discovery_call_method} />
                        <Val label="Date" value={formatNiceDate(responses.discovery_call_date)} />
                        <Val label="Time" value={responses.discovery_call_time} />
                    </Section>
                )}

                {/* Contact */}
                <Section icon="👤" label="Your Details" editTo="contact">
                    <Val label="Name" value={[responses.contact_first_name, responses.contact_last_name].filter(Boolean).join(" ")} />
                    <Val label="Email" value={responses.contact_email} />
                    <Val label="Phone" value={responses.contact_phone} />
                </Section>

                {/* Create inquiry toggle */}
                {!linkedInquiryId && (
                    <Box sx={{ ...glassSx, p: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box>
                            <Typography sx={{ color: C.text, fontSize: "0.85rem", fontWeight: 600 }}>Create Inquiry</Typography>
                            <Typography sx={{ color: C.muted, fontSize: "0.72rem", mt: 0.2 }}>Auto-create a sales inquiry from this</Typography>
                        </Box>
                        <Switch
                            checked={createInquiry}
                            onChange={(e) => setCreateInquiry(e.target.checked)}
                            size="small"
                            sx={{
                                "& .MuiSwitch-switchBase.Mui-checked": { color: C.accent },
                                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: C.accent },
                                "& .MuiSwitch-track": { bgcolor: alpha(C.border, 0.8) },
                            }}
                        />
                    </Box>
                )}
                {linkedInquiryId && (
                    <Box sx={{ ...glassSx, p: 3, bgcolor: alpha(C.success, 0.06), borderColor: alpha(C.success, 0.25) }}>
                        <Typography sx={{ color: C.success, fontSize: "0.85rem", fontWeight: 600 }}>Linked to Inquiry #{linkedInquiryId}</Typography>
                    </Box>
                )}
            </Stack>
        </Q>
    );
}
