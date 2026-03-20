"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Typography, Button, Alert, CircularProgress } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    CheckCircle as CheckCircleIcon,
    ArrowForward as ArrowForwardIcon,
    ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { api } from "@/lib/api";
import { NeedsAssessmentTemplate, ServicePackage } from "@/lib/types";
import { useBrand } from "@/app/providers/BrandProvider";

import {
    C, STEP_AMBIENCE, DEFAULT_AMB, REQUIRED,
    EVENT_CONFIGS, DEFAULT_CONFIG, BUDGET_RANGES,
    EVENT_EMOJIS, EVENT_DESCS, EVENT_LABELS,
} from "./constants";
import {
    fadeIn, shimmer, scaleIn, subtleFloat,
    slideInRight, slideInLeft, glowPulse,
    drift1, drift2, drift3,
} from "./animations";
import type { AnyRecord, ScreenId, Direction, EventTypeConfig, PriceEstimate } from "./types";
import type { WelcomeSettings } from "@/lib/types/brand";
import { computeScreens, getCurrencySymbol } from "./utils";

import WelcomeScreen from "./_components/screens/WelcomeScreen";
import EventTypeScreen from "./_components/screens/EventTypeScreen";
import DateScreen from "./_components/screens/DateScreen";
import GuestsScreen from "./_components/screens/GuestsScreen";
import PartnerScreen from "./_components/screens/PartnerScreen";
import BirthdayContactScreen from "./_components/screens/BirthdayContactScreen";
import VenueScreen from "./_components/screens/VenueScreen";
import ForkScreen from "./_components/screens/ForkScreen";
import BudgetScreen from "./_components/screens/BudgetScreen";
import PackagesScreen from "./_components/screens/PackagesScreen";
import BuilderScreen from "./_components/screens/BuilderScreen";
import PaymentTermsScreen from "./_components/screens/PaymentTermsScreen";
import SpecialScreen from "./_components/screens/SpecialScreen";
import SourceScreen from "./_components/screens/SourceScreen";
import CallOfferScreen from "./_components/screens/CallOfferScreen";
import CallDetailsScreen from "./_components/screens/CallDetailsScreen";
import ContactScreen from "./_components/screens/ContactScreen";
import SummaryScreen from "./_components/screens/SummaryScreen";

/* ================================================================== */
/* Main Component                                                      */
/* ================================================================== */

export default function NeedsAssessmentPage() {
    const { currentBrand } = useBrand();
    const searchParams = useSearchParams();
    const linkedInquiryId = searchParams.get("inquiry") ? Number(searchParams.get("inquiry")) : null;

    /* ── State ──────────────────────────────────────────── */
    const [currentScreenId, setCurrentScreenId] = useState<ScreenId>("welcome");
    const [direction, setDirection] = useState<Direction>("forward");
    const [responses, setResponses] = useState<AnyRecord>({});

    const [template, setTemplate] = useState<NeedsAssessmentTemplate | null>(null);
    const [allPackages, setAllPackages] = useState<ServicePackage[]>([]);
    const [packageSets, setPackageSets] = useState<AnyRecord[]>([]);

    const [maxVideographers, setMaxVideographers] = useState(1);
    const [maxCamerasPerOp, setMaxCamerasPerOp] = useState(3);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createInquiry, setCreateInquiry] = useState(true);
    const [validationShake, setValidationShake] = useState(false);

    const [callSlots, setCallSlots] = useState<{ time: string; available: boolean }[]>([]);
    const [callSlotsLoading, setCallSlotsLoading] = useState(false);
    const [callSlotsDuration, setCallSlotsDuration] = useState(20);

    const [priceEstimate, setPriceEstimate] = useState<PriceEstimate | null>(null);
    const [priceLoading, setPriceLoading] = useState(false);
    const [builderPackageId, setBuilderPackageId] = useState<number | null>(null);
    const [welcomeSettings, setWelcomeSettings] = useState<WelcomeSettings | null>(null);

    const screensRef = useRef<ScreenId[]>([]);
    const currentRef = useRef<ScreenId>("welcome");
    const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ── Brand + currency ───────────────────────────────── */
    const brandName = currentBrand?.display_name || currentBrand?.name || "";
    const brandInitial = brandName.charAt(0).toUpperCase();
    const currSym = getCurrencySymbol(currentBrand?.currency);

    /* ── Configs ────────────────────────────────────────── */
    const eventType = (responses.event_type || "").toLowerCase();
    const eventConfig: EventTypeConfig = EVENT_CONFIGS[eventType] || DEFAULT_CONFIG;

    /* ── Screens + navigation refs ──────────────────────── */
    const screens = useMemo(() => computeScreens(responses, eventConfig), [responses, eventConfig]);
    const screenIdx = screens.indexOf(currentScreenId);
    const progress = screens.length > 1 ? ((screenIdx + 1) / screens.length) * 100 : 0;

    useEffect(() => { screensRef.current = screens; }, [screens]);
    useEffect(() => { currentRef.current = currentScreenId; }, [currentScreenId]);

    // Reset saved package/price if user goes back to builder (they may change selections)
    useEffect(() => {
        if (currentScreenId === "builder" && builderPackageId) {
            setBuilderPackageId(null);
            setPriceEstimate(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentScreenId]);

    /* ── Data fetch ─────────────────────────────────────── */
    useEffect(() => {
        if (!currentBrand?.id) return;
        (async () => {
            try {
                setLoading(true);
                const [t, p, s, et, cr, camSetting, ws] = await Promise.all([
                    api.needsAssessmentTemplates.getActive(),
                    api.servicePackages.getAll(currentBrand.id),
                    api.packageSets.getAll(currentBrand.id),
                    api.eventTypes.getAll().catch(() => []),
                    api.crew.getByBrand(currentBrand.id).catch(() => []),
                    api.brands.getSetting(currentBrand.id, "max_cameras_per_operator").catch(() => null),
                    api.brands.getWelcomeSettings(currentBrand.id).catch(() => null),
                ]);
                setTemplate(t);
                setAllPackages(p || []);
                setPackageSets(s || []);
                const eventTypesData = et || [];
                (window as any).__pflo_eventTypes = eventTypesData;
                const crewData = cr || [];
                const videographerCount = crewData.filter((c: any) =>
                    (c.contributor_job_roles || []).some((cjr: any) =>
                        cjr.job_role?.name?.toLowerCase() === "videographer"
                    )
                ).length;
                setMaxVideographers(Math.max(1, videographerCount));
                if (camSetting?.value) setMaxCamerasPerOp(Math.max(1, parseInt(camSetting.value, 10) || 3));
                if (ws) setWelcomeSettings(ws);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Unable to load. Please try again.";
                console.error("❌ Needs Assessment Load Error:", errorMessage, err);
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        })();
    }, [currentBrand?.id]);

    /* ── Fetch discovery call slots ─────────────────────── */
    const fetchCallSlots = useCallback(async (date: string) => {
        if (!currentBrand?.id || !date) { setCallSlots([]); return; }
        setCallSlotsLoading(true);
        try {
            const res = await api.calendar.getDiscoveryCallSlots(currentBrand.id, date);
            setCallSlots(res.slots || []);
            if (res.duration_minutes) setCallSlotsDuration(res.duration_minutes);
        } catch {
            setCallSlots([]);
        } finally {
            setCallSlotsLoading(false);
        }
    }, [currentBrand?.id]);

    /* ── Derived values ─────────────────────────────────── */
    const eventTypeOptions = useMemo(() => {
        const seen = new Map<string, string>();
        for (const s of packageSets) {
            const name: string | undefined = s.category?.name;
            if (name && !seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name);
        }
        return Array.from(seen.entries()).map(([key, label]) => ({
            key, label: EVENT_LABELS[key] || label, emoji: EVENT_EMOJIS[key] || "🎬", desc: EVENT_DESCS[key] || "",
        }));
    }, [packageSets]);

    const filteredPackages = useMemo(() => {
        const activeSets = responses.event_type
            ? packageSets.filter((s: AnyRecord) => (s.category?.name ?? "").toLowerCase() === eventType)
            : packageSets;
        const ids = new Set<number>();
        for (const set of activeSets)
            for (const slot of (set.slots ?? []))
                if (slot.service_package_id != null) ids.add(slot.service_package_id);
        return allPackages.filter((p) => ids.has(p.id));
    }, [allPackages, packageSets, responses.event_type, eventType]);

    const slotLabels = useMemo(() => {
        const m = new Map<number, string>();
        for (const s of packageSets)
            for (const slot of (s.slots || []))
                if (slot.service_package_id && slot.slot_label) m.set(slot.service_package_id, slot.slot_label);
        return m;
    }, [packageSets]);

    const budgetLabels = useMemo(() =>
        BUDGET_RANGES.map(([lo, hi]) =>
            hi === null
                ? `${currSym}${lo.toLocaleString()}+`
                : `${currSym}${lo.toLocaleString()} \u2013 ${currSym}${hi.toLocaleString()}`
        ), [currSym]);

    const budgetMax = useMemo(() => {
        const label = responses.budget_range;
        if (!label) return null;
        const nums = String(label).match(/[\d,]+/g)?.map((s: string) => parseInt(s.replace(/,/g, ""))) || [];
        return nums.length > 1 ? nums[1] : null;
    }, [responses.budget_range]);

    /* ── Navigation helpers ─────────────────────────────── */
    const handleChange = useCallback((key: string, value: unknown) => {
        setResponses((prev) => ({ ...prev, [key]: value }));
    }, []);

    const goNext = useCallback(() => {
        const s = screensRef.current;
        const c = currentRef.current;
        const idx = s.indexOf(c);
        if (idx >= 0 && idx < s.length - 1) {
            setDirection("forward");
            setCurrentScreenId(s[idx + 1]);
        }
    }, []);

    const goBack = useCallback(() => {
        const s = screensRef.current;
        const c = currentRef.current;
        const idx = s.indexOf(c);
        if (idx > 0) { setDirection("back"); setCurrentScreenId(s[idx - 1]); }
    }, []);

    const goTo = useCallback((id: ScreenId) => {
        setDirection("back");
        setCurrentScreenId(id);
    }, []);

    const autoAdvance = useCallback(() => {
        if (autoTimer.current) clearTimeout(autoTimer.current);
        autoTimer.current = setTimeout(() => { goNext(); autoTimer.current = null; }, 900);
    }, [goNext]);

    const singleSelect = useCallback((key: string, value: string) => {
        setResponses((prev) => ({ ...prev, [key]: value }));
    }, []);

    // Auto-populate guest_count when a package with group subjects is selected
    useEffect(() => {
        const pkgId = responses.selected_package ? Number(responses.selected_package) : null;
        if (!pkgId || responses.guest_count) return; // already set by user — don't override
        const pkg = allPackages.find((p) => p.id === pkgId);
        if (!pkg?.typical_guest_count) return;
        const count = pkg.typical_guest_count;
        const opts = eventConfig.guestsOptions;
        if (!opts?.length) return;
        // Find the best-fit bucket: the first option whose upper bound >= count
        const parseUpper = (val: string): number => {
            const m = val.match(/(\d+)\s*[\-–]\s*(\d+)/);
            if (m) return parseInt(m[2], 10);
            const plus = val.match(/(\d+)\s*\+/);
            return plus ? Infinity : parseInt(val, 10) || 0;
        };
        const bucket = opts.find((o: { value: string }) => parseUpper(o.value) >= count) ?? opts[opts.length - 1];
        if (bucket) {
            setResponses((prev) => ({ ...prev, guest_count: bucket.value }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [responses.selected_package, allPackages]);

    const multiToggle = useCallback((key: string, value: string) => {
        setResponses((prev) => {
            const cur: string[] = Array.isArray(prev[key]) ? prev[key] : [];
            return { ...prev, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
        });
    }, []);

    const handleContinue = useCallback(() => {
        if (REQUIRED.has(currentScreenId)) {
            let valid = true;
            if (currentScreenId === "event_type" && !responses.event_type) valid = false;
            if (currentScreenId === "date" && !responses.wedding_date) valid = false;
            if (currentScreenId === "fork" && !responses.package_path) valid = false;
            if (currentScreenId === "contact" && (!responses.contact_first_name || !responses.contact_email)) valid = false;
            if (!valid) {
                setValidationShake(true);
                setTimeout(() => setValidationShake(false), 600);
                return;
            }
        }
        if (currentScreenId === "builder" && (responses.builder_step || 1) < 3) {
            handleChange("builder_step", (responses.builder_step || 1) + 1);
            return;
        }

        // When leaving builder step 3, save package + fetch price in background
        if (currentScreenId === "builder" && currentBrand?.id && !builderPackageId) {
            const builderActivities: number[] = responses.builder_activities || [];
            const builderFilms: any[] = responses.builder_films || [];
            const etCache: any[] = (window as any).__pflo_eventTypes || [];
            const etName = (responses.event_type || "").toLowerCase();
            const matchedET = etCache.find((e: any) => e.name?.toLowerCase() === etName);
            if (matchedET && builderActivities.length > 0) {
                setPriceLoading(true);
                (async () => {
                    try {
                        const customPkg = await api.servicePackages.createFromBuilder(currentBrand.id, {
                            eventTypeId: matchedET.id,
                            selectedActivityPresetIds: builderActivities,
                            operatorCount: responses.operator_count || 1,
                            cameraCount: responses.camera_count || responses.operator_count || 1,
                            filmPreferences: builderFilms,
                            clientName: responses.contact_first_name,
                        });
                        if (customPkg?.id) {
                            setBuilderPackageId(customPkg.id);
                            try {
                                const estimate = await api.servicePackages.estimatePrice(currentBrand.id, customPkg.id);
                                setPriceEstimate(estimate);
                            } catch (err) {
                                console.error("Failed to fetch price estimate:", err);
                            }
                        }
                    } catch (err) {
                        console.error("Failed to save builder package:", err);
                    } finally {
                        setPriceLoading(false);
                    }
                })();
            }
        }

        goNext();
    }, [currentScreenId, responses, goNext, handleChange, currentBrand, builderPackageId]);

    /* ── Submit ─────────────────────────────────────────── */
    const handleSubmit = async () => {
        if (!template) return;
        if (!responses.contact_first_name || !responses.contact_email) {
            goTo("contact");
            return;
        }
        try {
            setSubmitting(true);
            setError(null);
            const selectedPkgId = responses.selected_package ? Number(responses.selected_package) : null;
            const payload: AnyRecord = {
                template_id: template.id,
                responses: { ...responses, selected_package: selectedPkgId ? String(selectedPkgId) : undefined },
                selected_package_id: selectedPkgId,
                contact: {
                    first_name: responses.contact_first_name,
                    last_name: responses.contact_last_name,
                    email: responses.contact_email,
                    phone_number: responses.contact_phone,
                },
                inquiry: {
                    wedding_date: responses.wedding_date,
                    venue_details: responses.venue_details,
                    guest_count: responses.guest_count,
                    notes: responses.special_requests,
                    lead_source: responses.lead_source,
                    lead_source_details: responses.lead_source_details,
                    selected_package_id: selectedPkgId,
                    preferred_payment_schedule_template_id: responses.payment_schedule_template_id
                        ? Number(responses.payment_schedule_template_id)
                        : undefined,
                },
                preferred_payment_schedule_template_id: responses.payment_schedule_template_id
                    ? Number(responses.payment_schedule_template_id)
                    : undefined,
            };
            if (linkedInquiryId) payload.inquiry_id = linkedInquiryId;
            else payload.create_inquiry = createInquiry;

            if (responses.package_path === "build" && currentBrand?.id) {
                if (builderPackageId) {
                    // Package already saved when leaving builder
                    payload.selected_package_id = builderPackageId;
                    payload.inquiry.selected_package_id = builderPackageId;
                    payload.responses.selected_package = String(builderPackageId);
                } else {
                    try {
                        const builderActivities: number[] = responses.builder_activities || [];
                        const builderFilms: any[] = responses.builder_films || [];
                        const etCache: any[] = (window as any).__pflo_eventTypes || [];
                        const etName = (responses.event_type || "").toLowerCase();
                        const matchedET = etCache.find((e: any) => e.name?.toLowerCase() === etName);
                        if (matchedET && builderActivities.length > 0) {
                            const customPkg = await api.servicePackages.createFromBuilder(currentBrand.id, {
                                eventTypeId: matchedET.id,
                                selectedActivityPresetIds: builderActivities,
                                operatorCount: responses.operator_count || 1,
                                cameraCount: responses.camera_count || responses.operator_count || 1,
                                filmPreferences: builderFilms,
                                clientName: responses.contact_first_name,
                            });
                            if (customPkg?.id) {
                                payload.selected_package_id = customPkg.id;
                                payload.inquiry.selected_package_id = customPkg.id;
                                payload.responses.selected_package = String(customPkg.id);
                            }
                        }
                    } catch (err) {
                        console.error("Failed to create custom package:", err);
                    }
                }
            }

            await api.needsAssessmentSubmissions.create(payload);
            setSubmitted(true);
            setTimeout(() => {
                window.location.href = linkedInquiryId
                    ? `/sales/inquiries/${linkedInquiryId}` : "/studio/sales";
            }, 2800);
        } catch {
            setError("Failed to submit. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    /* ── Context object ─────────────────────────────────── */
    const ctx = {
        responses, handleChange, singleSelect, multiToggle, autoAdvance,
        handleContinue, goNext, goTo,
        eventType, eventConfig, eventTypeOptions,
        filteredPackages, slotLabels, budgetLabels, budgetMax,
        currSym, currentBrand, brandName, brandInitial,
        linkedInquiryId, template,
        createInquiry, setCreateInquiry,
        maxVideographers, maxCamerasPerOp,
        priceEstimate, priceLoading,
        welcomeSettings,
        callSlots, callSlotsLoading, callSlotsDuration, fetchCallSlots,
    };

    const isOptional = !REQUIRED.has(currentScreenId) && currentScreenId !== "welcome" && currentScreenId !== "summary";

    /* ── Screen router ──────────────────────────────────── */
    const renderScreen = () => {
        switch (currentScreenId) {
            case "welcome":          return <WelcomeScreen ctx={ctx} />;
            case "event_type":       return <EventTypeScreen ctx={ctx} />;
            case "date":             return <DateScreen ctx={ctx} />;
            case "guests":           return <GuestsScreen ctx={ctx} />;
            case "partner":          return <PartnerScreen ctx={ctx} />;
            case "birthday_contact": return <BirthdayContactScreen ctx={ctx} />;
            case "venue":            return <VenueScreen ctx={ctx} />;
            case "fork":             return <ForkScreen ctx={ctx} />;
            case "budget":           return <BudgetScreen ctx={ctx} />;
            case "packages":         return <PackagesScreen ctx={ctx} />;
            case "builder":          return <BuilderScreen ctx={ctx} />;
            case "payment_terms":    return <PaymentTermsScreen ctx={ctx} />;
            case "special":          return <SpecialScreen ctx={ctx} />;
            case "source":           return <SourceScreen ctx={ctx} />;
            case "call_offer":       return <CallOfferScreen ctx={ctx} />;
            case "call_details":     return <CallDetailsScreen ctx={ctx} />;
            case "contact":          return <ContactScreen ctx={ctx} />;
            case "summary":          return <SummaryScreen ctx={ctx} />;
            default:                 return null;
        }
    };

    /* ================================================================ */
    /* Loading state                                                    */
    /* ================================================================ */

    if (!currentBrand) {
        return (
            <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", bgcolor: C.bg, gap: 3 }}>
                {[180, 120, 240].map((w, i) => (
                    <Box key={i} sx={{
                        width: w, height: 10, borderRadius: 5,
                        background: "linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%)",
                        backgroundSize: "200% 100%",
                        animation: `${shimmer} 1.6s ease-in-out infinite`,
                        animationDelay: `${i * 0.15}s`,
                    }} />
                ))}
                <Typography sx={{ color: C.muted, fontSize: "0.85rem" }}>Loading brand context...</Typography>
            </Box>
        );
    }

    if (loading) {
        return (
            <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", bgcolor: C.bg, gap: 3 }}>
                {[180, 120, 240].map((w, i) => (
                    <Box key={i} sx={{
                        width: w, height: 10, borderRadius: 5,
                        background: "linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%)",
                        backgroundSize: "200% 100%",
                        animation: `${shimmer} 1.6s ease-in-out infinite`,
                        animationDelay: `${i * 0.15}s`,
                    }} />
                ))}
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: C.bg, p: 3 }}>
                <Box sx={{ p: 5, maxWidth: 500, textAlign: "center", bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: 3, animation: `${scaleIn} 0.5s ease both` }}>
                    <Typography variant="h6" sx={{ color: C.text, mb: 1, fontWeight: 600 }}>Unable to load questionnaire</Typography>
                    <Typography variant="body2" sx={{ color: C.muted, mb: 3 }}>{error}</Typography>
                    <Button variant="outlined" onClick={() => window.location.reload()}>Refresh Page</Button>
                </Box>
            </Box>
        );
    }

    if (!template) {
        return (
            <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: C.bg }}>
                <Box sx={{ p: 5, maxWidth: 420, textAlign: "center", bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: 3, animation: `${scaleIn} 0.5s ease both` }}>
                    <Typography variant="h6" sx={{ color: C.text, mb: 1, fontWeight: 600 }}>No questionnaire available</Typography>
                    <Typography variant="body2" sx={{ color: C.muted }}>{"There's no active questionnaire at the moment."}</Typography>
                </Box>
            </Box>
        );
    }

    /* ================================================================ */
    /* Submitted state                                                  */
    /* ================================================================ */

    if (submitted) {
        return (
            <Box sx={{ minHeight: "100vh", bgcolor: C.bg, color: C.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Box sx={{ textAlign: "center", maxWidth: 500, p: 4, animation: `${scaleIn} 0.6s ease both` }}>
                    <Box sx={{
                        width: 80, height: 80, borderRadius: "50%",
                        background: `linear-gradient(135deg, ${alpha(C.success, 0.15)}, ${alpha(C.success, 0.05)})`,
                        border: `2px solid ${alpha(C.success, 0.3)}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        mx: "auto", mb: 4, animation: `${subtleFloat} 4s ease-in-out infinite`,
                    }}>
                        <CheckCircleIcon sx={{ color: C.success, fontSize: 40 }} />
                    </Box>
                    <Typography sx={{ fontSize: "1.75rem", fontWeight: 200, letterSpacing: "-0.02em", mb: 1.5 }}>All done!</Typography>
                    <Typography sx={{ color: C.muted, fontSize: "0.95rem", lineHeight: 1.7 }}>
                        {"Your questionnaire has been submitted. We'll be in touch soon."}
                    </Typography>
                    <CircularProgress size={18} thickness={3} sx={{ color: C.muted, mt: 3 }} />
                    <Typography sx={{ color: alpha(C.muted, 0.5), fontSize: "0.72rem", mt: 1.5 }}>Redirecting\u2026</Typography>
                </Box>
            </Box>
        );
    }

    /* ================================================================ */
    /* Main render                                                      */
    /* ================================================================ */

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: C.bg, color: C.text, overflowX: "hidden", WebkitFontSmoothing: "antialiased", position: "relative", display: "flex", flexDirection: "column" }}>

            {/* ── Animated bokeh background ── */}
            {(() => {
                const amb = STEP_AMBIENCE[currentScreenId] ?? DEFAULT_AMB;
                const P = [
                    { s: 220, x: "8%",  y: "5%",  c: amb.c1, o: 0.04,  b: 110, d: 26, dl: 0,    k: drift1 },
                    { s: 160, x: "72%", y: "10%", c: amb.c2, o: 0.03,  b: 90,  d: 34, dl: -10,  k: drift2 },
                    { s: 120, x: "38%", y: "55%", c: amb.c1, o: 0.035, b: 75,  d: 22, dl: -5,   k: drift3 },
                    { s: 180, x: "82%", y: "50%", c: amb.c2, o: 0.025, b: 100, d: 30, dl: -14,  k: drift1 },
                    { s: 90,  x: "18%", y: "78%", c: amb.c2, o: 0.03,  b: 55,  d: 38, dl: -20,  k: drift2 },
                    { s: 130, x: "55%", y: "28%", c: amb.c1, o: 0.025, b: 80,  d: 20, dl: -3,   k: drift3 },
                    { s: 70,  x: "92%", y: "32%", c: amb.c1, o: 0.02,  b: 48,  d: 32, dl: -8,   k: drift2 },
                    { s: 100, x: "3%",  y: "42%", c: amb.c2, o: 0.025, b: 62,  d: 28, dl: -18,  k: drift1 },
                ];
                return (
                    <Box sx={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
                        <Box sx={{
                            position: "absolute", inset: 0,
                            background: [
                                `radial-gradient(ellipse 80% 50% at 50% 0%, ${alpha(amb.c1, 0.05)} 0%, transparent 70%)`,
                                `radial-gradient(ellipse 50% 70% at 85% 100%, ${alpha(amb.c2, 0.03)} 0%, transparent 60%)`,
                                `radial-gradient(ellipse 40% 40% at 10% 55%, ${alpha(amb.c1, 0.02)} 0%, transparent 50%)`,
                            ].join(", "),
                            transition: "background 2.5s ease",
                        }} />
                        {P.map((p, i) => (
                            <Box key={i} sx={{
                                position: "absolute", left: p.x, top: p.y,
                                width: p.s, height: p.s, borderRadius: "50%",
                                background: `radial-gradient(circle, ${alpha(p.c, p.o)} 0%, transparent 70%)`,
                                filter: `blur(${p.b}px)`,
                                animation: `${p.k} ${p.d}s ease-in-out ${p.dl}s infinite, ${glowPulse} ${p.d + 8}s ease-in-out ${p.dl}s infinite`,
                                transition: "background 2.5s ease",
                            }} />
                        ))}
                        <Box sx={{
                            position: "absolute", inset: 0, opacity: 0.02, mixBlendMode: "overlay",
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                            backgroundSize: "128px 128px",
                        }} />
                        <Box sx={{
                            position: "absolute", bottom: 0, left: 0, right: 0, height: "35%",
                            background: `linear-gradient(to top, ${alpha(C.bg, 0.7)}, transparent)`,
                        }} />
                    </Box>
                );
            })()}

            {/* ── Progress bar ── */}
            <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, bgcolor: alpha(C.border, 0.3), zIndex: 100 }}>
                <Box sx={{
                    height: "100%", width: `${progress}%`,
                    background: `linear-gradient(90deg, ${C.gradient1}, ${C.gradient2})`,
                    borderRadius: "0 2px 2px 0", transition: "width 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                }} />
            </Box>

            {/* ── Brand header ── */}
            {currentScreenId !== "welcome" && (
                <Box sx={{
                    position: "sticky", top: 3, zIndex: 50,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5,
                    py: 1.25, px: 3, backdropFilter: "blur(16px) saturate(1.8)",
                    bgcolor: alpha(C.card, 0.5), borderBottom: `1px solid ${alpha(C.border, 0.5)}`,
                    animation: `${fadeIn} 0.3s ease both`,
                }}>
                    {currentBrand?.logo_url ? (
                        <Box component="img" src={currentBrand.logo_url} alt={brandName} sx={{ height: 24, width: "auto", objectFit: "contain" }} />
                    ) : brandInitial ? (
                        <Box sx={{ width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gradient1}, ${C.gradient2})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.7rem" }}>{brandInitial}</Typography>
                        </Box>
                    ) : null}
                    <Typography sx={{ fontWeight: 600, color: C.text, letterSpacing: 1, fontSize: "0.75rem", textTransform: "uppercase" }}>{brandName}</Typography>
                </Box>
            )}

            {/* ── Screen content ── */}
            <Box sx={{
                position: "relative", zIndex: 1, maxWidth: 680, mx: "auto",
                px: { xs: 2.5, md: 0 }, flex: 1,
                display: "flex", flexDirection: "column", justifyContent: "center",
                mt: { xs: -4, md: -8 },
            }}>
                {error && (
                    <Alert severity="error" onClose={() => setError(null)} sx={{
                        mb: 2, bgcolor: alpha("#ef4444", 0.08), color: "#fca5a5",
                        border: `1px solid ${alpha("#ef4444", 0.2)}`, borderRadius: 3,
                        "& .MuiAlert-icon": { color: "#ef4444" },
                    }}>{error}</Alert>
                )}

                <Box key={currentScreenId} sx={{
                    ...(validationShake ? {
                        "@keyframes shake": {
                            "0%, 100%": { transform: "translateX(0)" },
                            "20%, 60%": { transform: "translateX(-8px)" },
                            "40%, 80%": { transform: "translateX(8px)" },
                        },
                        animation: "shake 0.4s ease-in-out",
                    } : {
                        animation: `${direction === "forward" ? slideInRight : slideInLeft} 0.4s cubic-bezier(0.16, 1, 0.3, 1) both`,
                    }),
                }}>
                    {renderScreen()}
                </Box>
            </Box>

            {/* ── Navigation ── */}
            {currentScreenId !== "welcome" && (
                <Box sx={{
                    position: "sticky", bottom: 0, zIndex: 50,
                    backdropFilter: "blur(16px) saturate(1.8)",
                    bgcolor: alpha(C.card, 0.8),
                    borderTop: `1px solid ${alpha(C.border, 0.4)}`,
                    px: 3, py: 2,
                }}>
                    <Box sx={{ maxWidth: 680, mx: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Button
                            onClick={() => {
                                if (currentScreenId === "builder" && (responses.builder_step || 1) > 1) {
                                    handleChange("builder_step", (responses.builder_step || 1) - 1);
                                } else {
                                    goBack();
                                }
                            }}
                            disabled={screenIdx <= 1 && !(currentScreenId === "builder" && (responses.builder_step || 1) > 1)}
                            startIcon={<ArrowBackIcon sx={{ fontSize: "0.85rem !important" }} />}
                            sx={{
                                color: C.muted, fontSize: "0.82rem", textTransform: "none", borderRadius: "12px",
                                "&:hover": { bgcolor: alpha(C.text, 0.04), color: C.text },
                                "&:disabled": { color: alpha(C.muted, 0.25) },
                            }}>Back</Button>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            {isOptional && (
                                <Typography onClick={goNext} sx={{
                                    color: C.muted, fontSize: "0.78rem", cursor: "pointer",
                                    "&:hover": { color: C.text }, transition: "color 0.2s",
                                }}>Skip &rarr;</Typography>
                            )}

                            {currentScreenId === "summary" ? (
                                <Button onClick={handleSubmit} disabled={submitting}
                                    endIcon={!submitting && <CheckCircleIcon sx={{ fontSize: "0.9rem !important" }} />}
                                    sx={{
                                        background: `linear-gradient(135deg, ${C.gradient1}, ${C.gradient2})`,
                                        color: "#fff", fontWeight: 600, fontSize: "0.88rem", px: 4, py: 1.25,
                                        borderRadius: "14px", textTransform: "none",
                                        boxShadow: `0 4px 20px ${alpha(C.accent, 0.3)}`,
                                        "&:hover": { transform: "translateY(-1px)", boxShadow: `0 8px 28px ${alpha(C.accent, 0.4)}` },
                                        "&:disabled": { bgcolor: alpha(C.text, 0.06), color: alpha(C.text, 0.2), boxShadow: "none" },
                                        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                                    }}>
                                    {submitting && <CircularProgress size={16} sx={{ color: "inherit", mr: 1 }} />}
                                    {submitting ? "Submitting\u2026" : "Submit"}
                                </Button>
                            ) : (
                                <Button onClick={handleContinue}
                                    endIcon={<ArrowForwardIcon sx={{ fontSize: "0.85rem !important" }} />}
                                    sx={{
                                        background: `linear-gradient(135deg, ${C.gradient1}, ${C.gradient2})`,
                                        color: "#fff", fontWeight: 600, fontSize: "0.88rem", px: 3.5, py: 1.25,
                                        borderRadius: "14px", textTransform: "none",
                                        boxShadow: `0 4px 20px ${alpha(C.accent, 0.3)}`,
                                        "&:hover": { transform: "translateY(-1px)", boxShadow: `0 8px 28px ${alpha(C.accent, 0.4)}` },
                                        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                                    }}>Continue</Button>
                            )}
                        </Box>
                    </Box>
                </Box>
            )}

            {/* ── Tiny footer on summary ── */}
            {currentScreenId === "summary" && (
                <Box sx={{ textAlign: "center", py: 3, position: "relative", zIndex: 1 }}>
                    <Typography sx={{ color: alpha(C.muted, 0.35), fontSize: "0.65rem", letterSpacing: 0.5 }}>
                        &copy; {new Date().getFullYear()} {brandName} &middot; Powered by ProjectFlo
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
