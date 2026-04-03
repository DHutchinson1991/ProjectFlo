'use client';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { C, REQUIRED } from '../constants/wizard-config';
import { shimmer, scaleIn, subtleFloat } from '../constants/animations';
import { computePublicScreens } from '../selectors/wizard-navigation';
import type { AnyRecord, ScreenId, Direction, InquiryWizardSubmissionPayload } from '../types';
import { publicInquiryWizardApi } from '../api';
import { usePublicWizardData } from '../hooks/usePublicWizardData';
import { useWizardComputed } from '../hooks/useWizardComputed';
import { useBuilderPackage } from '../hooks/useBuilderPackage';
import {
    WizardLayout, EventTypeScreen, DateScreen, GuestsScreen,
    YourNameScreen, YourRoleScreen, PartnerRoleScreen,
    PartnerScreen, BrideGroomNamesScreen, BirthdayContactScreen,
    VenueScreen, ForkScreen, BudgetScreen,
    PackagesScreen, BuilderScreen, PaymentTermsScreen, SpecialScreen, SourceScreen,
    CallOfferScreen, CallDetailsScreen, ContactScreen, SummaryScreen,
} from '../components';
import type { Brand } from '@/features/platform/brand/types';

export default function PublicInquiryWizardScreen() {
    const params = useParams();
    const token = params?.token as string;

    const [currentScreenId, setCurrentScreenId] = useState<ScreenId>('event_type');
    const [direction, setDirection] = useState<Direction>('forward');
    const [responses, setResponses] = useState<AnyRecord>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [portalToken, setPortalToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [validationShake, setValidationShake] = useState(false);
    const [callSlots, setCallSlots] = useState<{ time: string; available: boolean }[]>([]);
    const [callSlotsLoading] = useState(false);
    const [callSlotsDuration] = useState(20);
    const screensRef = useRef<ScreenId[]>([]);
    const currentRef = useRef<ScreenId>('event_type');

    const { template, allPackages, packageSets, eventTypes, maxVideographers, maxCamerasPerOp, welcomeSettings, brand, brandName, brandInitial, currencyCode, loading, error: dataError } = usePublicWizardData(token);
    const { builderPackageId, priceEstimate, priceLoading } = useBuilderPackage(currentScreenId, eventTypes);

    const currency = brand?.currency ?? DEFAULT_CURRENCY;

    const { eventType, eventConfig, selectedEventTypeId, eventTypeOptions, filteredPackages, slotLabels, budgetLabels, budgetMax } =
        useWizardComputed({ responses, packageSets, allPackages, eventTypes, currency, setResponses });

    const screens = useMemo(() => computePublicScreens(responses, eventConfig), [responses, eventConfig]);
    const screenIdx = screens.indexOf(currentScreenId);
    const progress = screens.length > 1 ? ((screenIdx + 1) / screens.length) * 100 : 0;
    screensRef.current = screens;
    currentRef.current = currentScreenId;

    const handleChange = useCallback((key: string, value: unknown) => setResponses((p) => ({ ...p, [key]: value })), []);

    const goNext = useCallback(() => {
        const s = screensRef.current; const idx = s.indexOf(currentRef.current);
        if (idx >= 0 && idx < s.length - 1) { setDirection('forward'); setCurrentScreenId(s[idx + 1]); }
    }, []);
    const goBack = useCallback(() => {
        const s = screensRef.current; const idx = s.indexOf(currentRef.current);
        if (idx > 0) { setDirection('back'); setCurrentScreenId(s[idx - 1]); }
    }, []);
    const goTo = useCallback((id: ScreenId) => { setDirection('back'); setCurrentScreenId(id); }, []);
    const autoAdvance = useCallback(() => { setTimeout(goNext, 900); }, [goNext]);
    const singleSelect = useCallback((key: string, value: string) => setResponses((p) => ({ ...p, [key]: value })), []);
    const multiToggle = useCallback((key: string, value: string) => setResponses((p) => {
        const cur: string[] = Array.isArray(p[key]) ? p[key] as string[] : [];
        return { ...p, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
    }), []);

    // Discovery call slots are not available on the unauthenticated surface
    const fetchCallSlots = useCallback(async (_date: string) => { setCallSlots([]); }, []);

    const handleContinue = useCallback(() => {
        if (REQUIRED.has(currentScreenId)) {
            let valid = true;
            if (currentScreenId === 'event_type' && !responses.event_type) valid = false;
            if (currentScreenId === 'date' && !responses.wedding_date) valid = false;
            if (currentScreenId === 'fork' && !responses.package_path) valid = false;
            if (currentScreenId === 'contact' && (!responses.contact_email || !responses.contact_phone)) valid = false;
            if (currentScreenId === 'your_name' && !responses.contact_first_name) valid = false;
            if (!valid) { setValidationShake(true); setTimeout(() => setValidationShake(false), 600); return; }
        }
        if (currentScreenId === 'builder' && (responses.builder_step || 1) < 3) {
            handleChange('builder_step', (responses.builder_step || 1) + 1); return;
        }
        goNext();
    }, [currentScreenId, responses, goNext, handleChange]);

    const handleSubmit = async () => {
        if (!template || !responses.contact_first_name || !responses.contact_email || !responses.contact_phone) { goTo('contact'); return; }
        try {
            setSubmitting(true); setError(null);
            const selectedPkgId = responses.selected_package ? Number(responses.selected_package) : null;
            const payload: InquiryWizardSubmissionPayload = {
                template_id: template.id,
                responses: { ...responses, selected_package: selectedPkgId ? String(selectedPkgId) : undefined },
                selected_package_id: selectedPkgId,
                contact: { first_name: responses.contact_first_name as string, last_name: responses.contact_last_name as string | undefined, email: responses.contact_email as string, phone_number: responses.contact_phone as string | undefined },
                create_inquiry: true,
                inquiry: { wedding_date: responses.wedding_date as string | undefined, guest_count: responses.guest_count as string | undefined, notes: responses.special_requests as string | undefined, lead_source: responses.lead_source as string | undefined, lead_source_details: responses.lead_source_details as string | undefined, selected_package_id: selectedPkgId, event_type_id: selectedEventTypeId ?? undefined },
            };
            if (responses.package_path === 'build' && builderPackageId) {
                payload.selected_package_id = builderPackageId;
                if (payload.inquiry) payload.inquiry.selected_package_id = builderPackageId;
                payload.responses.selected_package = String(builderPackageId);
            }
            const result = await publicInquiryWizardApi.submit(token, payload as unknown as Record<string, unknown>);
            setSubmitted(true);
            const pToken = (result as unknown as { inquiry?: { portal_token?: string } })?.inquiry?.portal_token;
            if (pToken) {
                setPortalToken(pToken);
                window.location.href = `/portal/portal/${pToken}`;
            }
        } catch { setError('Failed to submit. Please try again.'); } finally { setSubmitting(false); }
    };

    const ctx = {
        responses, handleChange, singleSelect, multiToggle, autoAdvance, handleContinue, goNext, goTo,
        eventType, eventConfig, eventTypeOptions, filteredPackages, slotLabels, budgetLabels, budgetMax,
        currency: currencyCode, currentBrand: brand as unknown as Brand, brandName, brandInitial,
        linkedInquiryId: null, template,
        createInquiry: true, setCreateInquiry: () => undefined,
        eventTypes, maxVideographers, maxCamerasPerOp,
        priceEstimate, priceLoading, welcomeSettings,
        callSlots, callSlotsLoading, callSlotsDuration, fetchCallSlots,
    };

    const isOptional = !REQUIRED.has(currentScreenId) && currentScreenId !== 'event_type' && currentScreenId !== 'summary';

    const renderScreen = () => {
        switch (currentScreenId) {
            case 'event_type': return <EventTypeScreen ctx={ctx} />;
            case 'date': return <DateScreen ctx={ctx} />;
            case 'guests': return <GuestsScreen ctx={ctx} />;
            case 'your_name': return <YourNameScreen ctx={ctx} />;
            case 'your_role': return <YourRoleScreen ctx={ctx} />;
            case 'partner_role': return <PartnerRoleScreen ctx={ctx} />;
            case 'partner': return <PartnerScreen ctx={ctx} />;
            case 'bride_groom_names': return <BrideGroomNamesScreen ctx={ctx} />;
            case 'birthday_contact': return <BirthdayContactScreen ctx={ctx} />;
            case 'venue': return <VenueScreen ctx={ctx} />;
            case 'fork': return <ForkScreen ctx={ctx} />;
            case 'budget': return <BudgetScreen ctx={ctx} />;
            case 'packages': return <PackagesScreen ctx={ctx} />;
            case 'builder': return <BuilderScreen ctx={ctx} />;
            case 'payment_terms': return <PaymentTermsScreen ctx={ctx} />;
            case 'special': return <SpecialScreen ctx={ctx} />;
            case 'source': return <SourceScreen ctx={ctx} />;
            case 'call_offer': return <CallOfferScreen ctx={ctx} />;
            case 'call_details': return <CallDetailsScreen ctx={ctx} />;
            case 'contact': return <ContactScreen ctx={ctx} />;
            case 'summary': return <SummaryScreen ctx={ctx} />;
            default: return null;
        }
    };

    const skeletonBg = 'linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%)';

    if (loading) return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: C.bg, gap: 3 }}>
            {[180, 120, 240].map((w, i) => <Box key={i} sx={{ width: w, height: 10, borderRadius: 5, background: skeletonBg, backgroundSize: '200% 100%', animation: `${shimmer} 1.6s ease-in-out ${i * 0.15}s infinite` }} />)}
        </Box>
    );

    if (dataError && !template) return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: C.bg, p: 3 }}>
            <Box sx={{ p: 5, maxWidth: 420, textAlign: 'center', bgcolor: 'hsl(240,4%,16%)', border: '1px solid hsl(240,4%,22%)', borderRadius: 3, animation: `${scaleIn} 0.5s ease both` }}>
                <Typography variant="h6" sx={{ color: C.text, mb: 1, fontWeight: 600 }}>Inquiry Wizard Not Found</Typography>
                <Typography variant="body2" sx={{ color: C.muted, lineHeight: 1.6 }}>{dataError}</Typography>
            </Box>
        </Box>
    );

    if (!template) return null;

    if (submitted) return (
        <Box sx={{ minHeight: '100vh', bgcolor: C.bg, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ textAlign: 'center', maxWidth: 500, p: 4, animation: `${scaleIn} 0.6s ease both` }}>
                <Box sx={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${alpha(C.success, 0.15)}, ${alpha(C.success, 0.05)})`, border: `2px solid ${alpha(C.success, 0.3)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 4, animation: `${subtleFloat} 4s ease-in-out infinite` }}>
                    <CheckCircleIcon sx={{ color: C.success, fontSize: 40 }} />
                </Box>
                <Typography sx={{ fontSize: '1.75rem', fontWeight: 200, letterSpacing: '-0.02em', mb: 1.5 }}>All done!</Typography>
                <Typography sx={{ color: C.muted, fontSize: '0.95rem', lineHeight: 1.7 }}>
                    Your inquiry has been submitted. We&apos;ll be in touch soon.
                </Typography>
                {portalToken ? (
                    <Box sx={{ mt: 3 }}>
                        <Typography sx={{ color: alpha(C.muted, 0.7), fontSize: '0.8rem', mb: 2 }}>Redirecting to your portal&hellip;</Typography>
                        <Button href={`/portal/portal/${portalToken}`}
                            sx={{ background: `linear-gradient(135deg, ${C.gradient1}, ${C.gradient2})`, color: '#fff', fontWeight: 600, fontSize: '0.85rem', px: 4, py: 1.25, borderRadius: '12px', textTransform: 'none', boxShadow: `0 4px 20px ${alpha(C.accent, 0.3)}`, '&:hover': { transform: 'translateY(-1px)' } }}>
                            View Your Portal
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{ mt: 2 }}>
                        <CircularProgress size={18} thickness={3} sx={{ color: C.muted }} />
                    </Box>
                )}
            </Box>
        </Box>
    );

    return (
        <WizardLayout
            currentScreenId={currentScreenId}
            screenIdx={screenIdx}
            progress={progress}
            direction={direction}
            validationShake={validationShake}
            error={error}
            onClearError={() => setError(null)}
            submitting={submitting}
            goBack={goBack}
            handleContinue={handleContinue}
            handleSubmit={handleSubmit}
            goNext={goNext}
            responses={responses}
            handleChange={handleChange}
            isOptional={isOptional}
            currentBrand={brand as unknown as Brand}
            brandName={brandName}
            brandInitial={brandInitial}
            renderScreen={renderScreen}
        />
    );
}
