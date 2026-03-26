"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Typography, CircularProgress } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { CheckCircle as CheckCircleIcon } from "@mui/icons-material";
import { useBrand } from "@/app/providers/BrandProvider";
import { C, REQUIRED } from '../constants/wizard-config';
import { shimmer, scaleIn, subtleFloat } from '../constants/animations';
import { computeScreens, getCurrencySymbol } from '../selectors/wizard-navigation';
import type { AnyRecord, ScreenId, Direction } from '../types';
import type { InquiryWizardSubmissionPayload } from "../types";
import { inquiryWizardSubmissionsApi } from "../api";
import { useWizardStudioData } from "../hooks/useWizardStudioData";
import { useWizardComputed } from "../hooks/useWizardComputed";
import { useBuilderPackage } from "../hooks/useBuilderPackage";
import {
    WizardLayout, WelcomeScreen, EventTypeScreen, DateScreen, GuestsScreen,
    PartnerScreen, BirthdayContactScreen, VenueScreen, ForkScreen, BudgetScreen,
    PackagesScreen, BuilderScreen, PaymentTermsScreen, SpecialScreen, SourceScreen,
    CallOfferScreen, CallDetailsScreen, ContactScreen, SummaryScreen,
} from "../components";

export default function InquiryWizardStudioScreen() {
    const { currentBrand } = useBrand();
    const searchParams = useSearchParams();
    const linkedInquiryId = searchParams.get("inquiry") ? Number(searchParams.get("inquiry")) : null;

    const [currentScreenId, setCurrentScreenId] = useState<ScreenId>("welcome");
    const [direction, setDirection] = useState<Direction>("forward");
    const [responses, setResponses] = useState<AnyRecord>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createInquiry, setCreateInquiry] = useState(true);
    const [validationShake, setValidationShake] = useState(false);
    const [callSlots, setCallSlots] = useState<{ time: string; available: boolean }[]>([]);
    const [callSlotsLoading, setCallSlotsLoading] = useState(false);
    const [callSlotsDuration, setCallSlotsDuration] = useState(20);
    const screensRef = useRef<ScreenId[]>([]);
    const currentRef = useRef<ScreenId>("welcome");

    const { template, allPackages, packageSets, eventTypes, maxVideographers, maxCamerasPerOp, welcomeSettings, loading, error: dataError } = useWizardStudioData();
    const { builderPackageId, priceEstimate, priceLoading, saveBuilderPackage, resolveBuilderPackageId } = useBuilderPackage(currentScreenId, eventTypes);

    const brandName = currentBrand?.display_name || currentBrand?.name || "";
    const brandInitial = brandName.charAt(0).toUpperCase();
    const currSym = getCurrencySymbol(currentBrand?.currency);

    const { eventType, eventConfig, selectedEventTypeId, eventTypeOptions, filteredPackages, slotLabels, budgetLabels, budgetMax } =
        useWizardComputed({ responses, packageSets, allPackages, eventTypes, currSym, setResponses });

    const screens = useMemo(() => computeScreens(responses, eventConfig), [responses, eventConfig]);
    const screenIdx = screens.indexOf(currentScreenId);
    const progress = screens.length > 1 ? ((screenIdx + 1) / screens.length) * 100 : 0;
    screensRef.current = screens;
    currentRef.current = currentScreenId;

    const handleChange = useCallback((key: string, value: unknown) => setResponses((p) => ({ ...p, [key]: value })), []);
    const goNext = useCallback(() => {
        const s = screensRef.current; const idx = s.indexOf(currentRef.current);
        if (idx >= 0 && idx < s.length - 1) { setDirection("forward"); setCurrentScreenId(s[idx + 1]); }
    }, []);
    const goBack = useCallback(() => {
        const s = screensRef.current; const idx = s.indexOf(currentRef.current);
        if (idx > 0) { setDirection("back"); setCurrentScreenId(s[idx - 1]); }
    }, []);
    const goTo = useCallback((id: ScreenId) => { setDirection("back"); setCurrentScreenId(id); }, []);
    const autoAdvance = useCallback(() => { setTimeout(goNext, 900); }, [goNext]);
    const singleSelect = useCallback((key: string, value: string) => setResponses((p) => ({ ...p, [key]: value })), []);
    const multiToggle = useCallback((key: string, value: string) => setResponses((p) => {
        const cur: string[] = Array.isArray(p[key]) ? p[key] : [];
        return { ...p, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
    }), []);

    const fetchCallSlots = useCallback(async (date: string) => {
        if (!currentBrand?.id || !date) { setCallSlots([]); return; }
        setCallSlotsLoading(true);
        try {
            const { wizardStudioDataApi } = await import("../api");
            const res = await wizardStudioDataApi.getDiscoveryCallSlots(date);
            setCallSlots(res.slots || []);
            if (res.duration_minutes) setCallSlotsDuration(res.duration_minutes);
        } catch { setCallSlots([]); } finally { setCallSlotsLoading(false); }
    }, [currentBrand?.id]);

    const handleContinue = useCallback(() => {
        if (REQUIRED.has(currentScreenId)) {
            let valid = true;
            if (currentScreenId === "event_type" && !responses.event_type) valid = false;
            if (currentScreenId === "date" && !responses.wedding_date) valid = false;
            if (currentScreenId === "fork" && !responses.package_path) valid = false;
            if (currentScreenId === "contact" && (!responses.contact_first_name || !responses.contact_email)) valid = false;
            if (!valid) { setValidationShake(true); setTimeout(() => setValidationShake(false), 600); return; }
        }
        if (currentScreenId === "builder" && (responses.builder_step || 1) < 3) {
            handleChange("builder_step", (responses.builder_step || 1) + 1); return;
        }
        if (currentScreenId === "builder" && currentBrand?.id && !builderPackageId) {
            saveBuilderPackage(responses);
        }
        goNext();
    }, [currentScreenId, responses, goNext, handleChange, currentBrand, builderPackageId, saveBuilderPackage]);

    const handleSubmit = async () => {
        if (!template || !responses.contact_first_name || !responses.contact_email) { goTo("contact"); return; }
        try {
            setSubmitting(true); setError(null);
            const selectedPkgId = responses.selected_package ? Number(responses.selected_package) : null;
            const payload: InquiryWizardSubmissionPayload = {
                template_id: template.id,
                responses: { ...responses, selected_package: selectedPkgId ? String(selectedPkgId) : undefined },
                selected_package_id: selectedPkgId,
                contact: { first_name: responses.contact_first_name, last_name: responses.contact_last_name, email: responses.contact_email, phone_number: responses.contact_phone },
                inquiry: { wedding_date: responses.wedding_date, guest_count: responses.guest_count, notes: responses.special_requests, lead_source: responses.lead_source, lead_source_details: responses.lead_source_details, selected_package_id: selectedPkgId, preferred_payment_schedule_template_id: responses.payment_schedule_template_id ? Number(responses.payment_schedule_template_id) : undefined, event_type_id: selectedEventTypeId ?? undefined },
                preferred_payment_schedule_template_id: responses.payment_schedule_template_id ? Number(responses.payment_schedule_template_id) : undefined,
            };
            if (linkedInquiryId) payload.inquiry_id = linkedInquiryId; else payload.create_inquiry = createInquiry;
            if (responses.package_path === "build" && currentBrand?.id) {
                const pkgId = await resolveBuilderPackageId(responses);
                if (pkgId) { payload.selected_package_id = pkgId; if (payload.inquiry) payload.inquiry.selected_package_id = pkgId; payload.responses.selected_package = String(pkgId); }
            }
            await inquiryWizardSubmissionsApi.create(payload);
            setSubmitted(true);
            setTimeout(() => { window.location.href = linkedInquiryId ? `/sales/inquiries/${linkedInquiryId}` : "/studio/sales"; }, 2800);
        } catch { setError("Failed to submit. Please try again."); } finally { setSubmitting(false); }
    };

    const ctx = {
        responses, handleChange, singleSelect, multiToggle, autoAdvance, handleContinue, goNext, goTo,
        eventType, eventConfig, eventTypeOptions, filteredPackages, slotLabels, budgetLabels, budgetMax,
        currSym, currentBrand, brandName, brandInitial, linkedInquiryId, template,
        createInquiry, setCreateInquiry, eventTypes, maxVideographers, maxCamerasPerOp,
        priceEstimate, priceLoading, welcomeSettings, callSlots, callSlotsLoading, callSlotsDuration, fetchCallSlots,
    };

    const isOptional = !REQUIRED.has(currentScreenId) && currentScreenId !== "welcome" && currentScreenId !== "summary";

    const renderScreen = () => {
        switch (currentScreenId) {
            case "welcome": return <WelcomeScreen ctx={ctx} />;
            case "event_type": return <EventTypeScreen ctx={ctx} />;
            case "date": return <DateScreen ctx={ctx} />;
            case "guests": return <GuestsScreen ctx={ctx} />;
            case "partner": return <PartnerScreen ctx={ctx} />;
            case "birthday_contact": return <BirthdayContactScreen ctx={ctx} />;
            case "venue": return <VenueScreen ctx={ctx} />;
            case "fork": return <ForkScreen ctx={ctx} />;
            case "budget": return <BudgetScreen ctx={ctx} />;
            case "packages": return <PackagesScreen ctx={ctx} />;
            case "builder": return <BuilderScreen ctx={ctx} />;
            case "payment_terms": return <PaymentTermsScreen ctx={ctx} />;
            case "special": return <SpecialScreen ctx={ctx} />;
            case "source": return <SourceScreen ctx={ctx} />;
            case "call_offer": return <CallOfferScreen ctx={ctx} />;
            case "call_details": return <CallDetailsScreen ctx={ctx} />;
            case "contact": return <ContactScreen ctx={ctx} />;
            case "summary": return <SummaryScreen ctx={ctx} />;
            default: return null;
        }
    };

    const skeletonBg = "linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%)";
    if (!currentBrand) return (
        <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", bgcolor: C.bg, gap: 3 }}>
            {[180, 120, 240].map((w, i) => <Box key={i} sx={{ width: w, height: 10, borderRadius: 5, background: skeletonBg, backgroundSize: "200% 100%", animation: `${shimmer} 1.6s ease-in-out ${i * 0.15}s infinite` }} />)}
            <Typography sx={{ color: C.muted, fontSize: "0.85rem" }}>Loading brand context...</Typography>
        </Box>
    );
    if (loading || dataError) return (
        <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", bgcolor: C.bg, gap: 3 }}>
            {dataError
                ? <Box sx={{ p: 5, maxWidth: 500, textAlign: "center", bgcolor: "hsl(240,4%,16%)", border: `1px solid hsl(240,4%,22%)`, borderRadius: 3, animation: `${scaleIn} 0.5s ease both` }}>
                    <Typography variant="h6" sx={{ color: C.text, mb: 1, fontWeight: 600 }}>Unable to load</Typography>
                    <Typography variant="body2" sx={{ color: C.muted, mb: 3 }}>{dataError}</Typography>
                </Box>
                : [180, 120, 240].map((w, i) => <Box key={i} sx={{ width: w, height: 10, borderRadius: 5, background: skeletonBg, backgroundSize: "200% 100%", animation: `${shimmer} 1.6s ease-in-out ${i * 0.15}s infinite` }} />)}
        </Box>
    );
    if (!template) return (
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: C.bg }}>
            <Box sx={{ p: 5, maxWidth: 420, textAlign: "center", bgcolor: "hsl(240,4%,16%)", border: `1px solid hsl(240,4%,22%)`, borderRadius: 3, animation: `${scaleIn} 0.5s ease both` }}>
                <Typography variant="h6" sx={{ color: C.text, mb: 1, fontWeight: 600 }}>No questionnaire available</Typography>
                <Typography variant="body2" sx={{ color: C.muted }}>{"There's no active questionnaire at the moment."}</Typography>
            </Box>
        </Box>
    );
    if (submitted) return (
        <Box sx={{ minHeight: "100vh", bgcolor: C.bg, color: C.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Box sx={{ textAlign: "center", maxWidth: 500, p: 4, animation: `${scaleIn} 0.6s ease both` }}>
                <Box sx={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg, ${alpha(C.success, 0.15)}, ${alpha(C.success, 0.05)})`, border: `2px solid ${alpha(C.success, 0.3)}`, display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 4, animation: `${subtleFloat} 4s ease-in-out infinite` }}>
                    <CheckCircleIcon sx={{ color: C.success, fontSize: 40 }} />
                </Box>
                <Typography sx={{ fontSize: "1.75rem", fontWeight: 200, letterSpacing: "-0.02em", mb: 1.5 }}>All done!</Typography>
                <Typography sx={{ color: C.muted, fontSize: "0.95rem", lineHeight: 1.7 }}>{"Your questionnaire has been submitted. We'll be in touch soon."}</Typography>
                <CircularProgress size={18} thickness={3} sx={{ color: C.muted, mt: 3 }} />
                <Typography sx={{ color: alpha(C.muted, 0.5), fontSize: "0.72rem", mt: 1.5 }}>Redirecting&hellip;</Typography>
            </Box>
        </Box>
    );

    return (
        <WizardLayout
            currentScreenId={currentScreenId} screenIdx={screenIdx} progress={progress} direction={direction}
            validationShake={validationShake} error={error} onClearError={() => setError(null)}
            submitting={submitting} goBack={goBack} handleContinue={handleContinue} handleSubmit={handleSubmit}
            goNext={goNext} responses={responses} handleChange={handleChange} isOptional={isOptional}
            currentBrand={currentBrand} brandName={brandName} brandInitial={brandInitial}
            renderScreen={renderScreen}
        />
    );
}
