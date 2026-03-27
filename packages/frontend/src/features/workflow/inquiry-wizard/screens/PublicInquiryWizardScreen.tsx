'use client';
import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Box, Typography, Button, Stack, Alert, CircularProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import { getColors, shimmer, scaleIn, subtleFloat, fadeInUp } from '../constants/public-wizard-theme';
import PortalBrandHeader from '../components/layout/PortalBrandHeader';
import PortalWizardHero from '../components/layout/PortalWizardHero';
import PortalStepIndicator from '../components/layout/PortalStepIndicator';
import PortalQuestionCard from '../components/steps/PortalQuestionCard';
import PortalDiscoveryCallStep from '../components/steps/PortalDiscoveryCallStep';
import PortalPackageStep from '../components/steps/PortalPackageStep';
import PortalWizardFooter from '../components/layout/PortalWizardFooter';
import { usePublicWizardTemplate } from '../hooks/usePublicWizardTemplate';
import { usePublicWizardForm } from '../hooks/usePublicWizardForm';

function useReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return { ref, visible };
}

function SectionDivider({ color }: { color: string }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3, gap: 2 }}>
            <Box sx={{ width: 28, height: 1, background: `linear-gradient(90deg, transparent, ${alpha(color, 0.3)})`, borderRadius: 1 }} />
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: alpha(color, 0.15), border: `1px solid ${alpha(color, 0.1)}` }} />
            <Box sx={{ width: 28, height: 1, background: `linear-gradient(90deg, ${alpha(color, 0.3)}, transparent)`, borderRadius: 1 }} />
        </Box>
    );
}

export default function PublicInquiryWizardScreen() {
    const params = useParams();
    const token = params?.token as string;
    const colors = getColors();
    const heroReveal = useReveal();
    const footerReveal = useReveal();

    const { template, loading, error: templateError, steps, eventTypeOptions, packages, selectedEventType, setSelectedEventType, brand, brandName, brandInitial, currencyCode } = usePublicWizardTemplate(token);
    const { currentStepIdx, setCurrentStepIdx, responses, selectedPackageId, setSelectedPackageId, fieldErrors, submitting, submitted, portalToken, submitError, currentStep, currentQuestions, isLastStep, handleNext, handleBack, handleChange, handleSubmit, stepAnsweredCount, stepComplete } = usePublicWizardForm({ template, steps, token });

    const fieldSx = {
        '& .MuiOutlinedInput-root': { color: colors.text, borderRadius: '12px', fontSize: '0.925rem', bgcolor: alpha(colors.card, 0.5), backdropFilter: 'blur(8px)', '& fieldset': { borderColor: alpha(colors.border, 0.6) }, '&:hover fieldset': { borderColor: alpha(colors.accent, 0.4) }, '&.Mui-focused fieldset': { borderColor: colors.accent, borderWidth: '1.5px' } },
        '& .MuiInputLabel-root': { color: colors.muted, fontSize: '0.875rem' }, '& .MuiInputLabel-root.Mui-focused': { color: colors.accent }, '& .MuiFormHelperText-root.Mui-error': { color: '#ef4444' },
    };
    const cardSx = {
        bgcolor: alpha(colors.card, 0.7), backdropFilter: 'blur(20px) saturate(1.5)', border: `1px solid ${alpha(colors.border, 0.6)}`, borderRadius: 4, overflow: 'hidden', position: 'relative' as const, transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${alpha(colors.gradient1, 0.4)}, ${alpha(colors.gradient2, 0.4)}, transparent)`, opacity: 0, transition: 'opacity 0.4s ease' },
        '&:hover': { borderColor: alpha(colors.accent, 0.2), boxShadow: `0 12px 40px ${alpha(colors.accent, 0.1)}, 0 4px 12px ${alpha('#000', 0.2)}`, transform: 'translateY(-2px)', '&::before': { opacity: 1 } },
    };

    if (loading) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: colors.bg, gap: 3 }}>
                {[180, 120, 240].map((w, i) => (
                    <Box key={i} sx={{ width: w, height: 10, borderRadius: 5, background: 'linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%)', backgroundSize: '200% 100%', animation: `${shimmer} 1.6s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }} />
                ))}
            </Box>
        );
    }

    if (templateError && !template) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: colors.bg, p: 3 }}>
                <Box sx={{ p: 5, maxWidth: 420, textAlign: 'center', bgcolor: colors.card, border: `1px solid ${colors.border}`, borderRadius: 3, animation: `${scaleIn} 0.5s cubic-bezier(0.16, 1, 0.3, 1) both` }}>
                    <Typography variant="h6" sx={{ color: colors.text, mb: 1, fontWeight: 600 }}>Inquiry Wizard Not Found</Typography>
                    <Typography variant="body2" sx={{ color: colors.muted, lineHeight: 1.6 }}>{templateError}</Typography>
                </Box>
            </Box>
        );
    }

    if (!template) return null;

    if (submitted) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: colors.bg, color: colors.text, overflowX: 'hidden', WebkitFontSmoothing: 'antialiased' }}>
                <PortalBrandHeader brand={brand} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                    <Box sx={{ textAlign: 'center', maxWidth: 500, p: 4, animation: `${scaleIn} 0.6s cubic-bezier(0.16, 1, 0.3, 1) both` }}>
                        <Box sx={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${alpha('#22c55e', 0.15)}, ${alpha('#22c55e', 0.05)})`, border: `2px solid ${alpha('#22c55e', 0.3)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 4, animation: `${subtleFloat} 4s ease-in-out infinite` }}>
                            <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 40 }} />
                        </Box>
                        <Typography sx={{ color: colors.text, fontSize: '1.75rem', fontWeight: 200, letterSpacing: '-0.02em', mb: 1.5 }}>All done!</Typography>
                        <Typography sx={{ color: colors.muted, fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 380, mx: 'auto' }}>
                            Your inquiry has been submitted successfully. We&apos;ll be in touch soon to discuss next steps.
                        </Typography>
                        {portalToken && (
                            <Box sx={{ mt: 3 }}>
                                <Typography sx={{ color: alpha(colors.muted, 0.7), fontSize: '0.8rem', mb: 2 }}>Redirecting to your portal…</Typography>
                                <Button href={`/portal/portal/${portalToken}`} sx={{ background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`, color: '#fff', fontWeight: 600, fontSize: '0.85rem', px: 4, py: 1.25, borderRadius: '12px', textTransform: 'none', boxShadow: `0 4px 20px ${alpha(colors.accent, 0.3)}`, '&:hover': { background: `linear-gradient(135deg, ${colors.gradient2}, ${colors.gradient1})`, transform: 'translateY(-1px)' } }}>
                                    View Your Portal
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: colors.bg, color: colors.text, overflowX: 'hidden', scrollBehavior: 'smooth', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}>
            <PortalBrandHeader brand={brand} />

            <Box ref={heroReveal.ref}>
                <PortalWizardHero template={template} visible={heroReveal.visible} />
            </Box>

            <Box sx={{ maxWidth: 680, mx: 'auto', px: { xs: 2.5, md: 0 }, py: { xs: 5, md: 8 }, display: 'flex', flexDirection: 'column', gap: { xs: 3, md: 4 } }}>
                <PortalStepIndicator steps={steps} currentStepIdx={currentStepIdx} onStepClick={setCurrentStepIdx} colors={colors} cardSx={cardSx} />

                {(submitError) && (
                    <Alert severity="error" sx={{ bgcolor: alpha('#ef4444', 0.08), color: '#fca5a5', border: `1px solid ${alpha('#ef4444', 0.2)}`, borderRadius: 3, '& .MuiAlert-icon': { color: '#ef4444' } }}>
                        {submitError}
                    </Alert>
                )}

                <Box sx={{ animation: `${fadeInUp} 0.4s cubic-bezier(0.16, 1, 0.3, 1) both` }} key={currentStepIdx}>
                    {currentStep?.type === 'discovery_call' ? (
                        <PortalDiscoveryCallStep responses={responses} onChange={handleChange} colors={colors} fieldSx={fieldSx} cardSx={cardSx} />
                    ) : currentStep?.type === 'package_select' ? (
                        <PortalPackageStep packages={packages} selectedPackageId={selectedPackageId} onSelect={setSelectedPackageId} currencyCode={currencyCode} selectedEventType={selectedEventType} colors={colors} cardSx={cardSx} />
                    ) : (
                        <Stack spacing={2.5}>
                            {currentStep?.key === 'event' && eventTypeOptions.length > 0 && (
                                <Box sx={{ ...cardSx, p: { xs: 3, md: 4 } }}>
                                    <Typography sx={{ color: colors.accent, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 2 }}>Event Type</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                        {eventTypeOptions.map((opt) => {
                                            const active = selectedEventType === opt;
                                            return (
                                                <Box key={opt} onClick={() => { const nv = active ? null : opt; setSelectedEventType(nv); handleChange('event_type', nv ?? ''); }}
                                                    sx={{ px: 2.5, py: 1.25, borderRadius: '12px', cursor: 'pointer', border: `1.5px solid ${active ? colors.accent : colors.border}`, bgcolor: active ? alpha(colors.accent, 0.12) : alpha(colors.card, 0.5), transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 1, '&:hover': { bgcolor: active ? alpha(colors.accent, 0.12) : alpha(colors.text, 0.04), borderColor: active ? colors.accent : alpha(colors.border, 0.8) } }}>
                                                    {active && <CheckIcon sx={{ fontSize: 14, color: colors.accent }} />}
                                                    <Typography sx={{ color: active ? colors.text : alpha(colors.text, 0.7), fontSize: '0.875rem', fontWeight: active ? 600 : 400 }}>{opt}</Typography>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            )}
                            {currentQuestions.length === 0 ? (
                                <Box sx={{ ...cardSx, p: 4, textAlign: 'center' }}><Typography sx={{ color: colors.muted, fontSize: '0.875rem' }}>No questions for this step</Typography></Box>
                            ) : currentQuestions.map((q, idx) => (
                                <PortalQuestionCard key={q.field_key || `question_${q.id}`} question={q} index={idx} value={responses[q.field_key || `question_${q.id}`] ?? ''} error={fieldErrors[q.field_key || `question_${q.id}`] as string | undefined} onChange={handleChange} colors={colors} fieldSx={fieldSx} cardSx={cardSx} />
                            ))}
                            {currentQuestions.length > 0 && (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Typography sx={{ color: colors.muted, fontSize: '0.72rem' }}>{stepAnsweredCount(currentStep!.key)}/{currentQuestions.length} answered</Typography>
                                </Box>
                            )}
                        </Stack>
                    )}
                </Box>

                <SectionDivider color={colors.accent} />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Button onClick={handleBack} disabled={currentStepIdx === 0} startIcon={<ArrowBackIcon sx={{ fontSize: '0.9rem !important' }} />}
                        sx={{ color: colors.muted, fontSize: '0.85rem', textTransform: 'none', px: 2.5, py: 1, borderRadius: '12px', border: '1px solid transparent', '&:hover': { bgcolor: alpha(colors.text, 0.04), color: colors.text, borderColor: alpha(colors.border, 0.5) }, '&:disabled': { color: alpha(colors.muted, 0.3) } }}>
                        Back
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {steps.map((_, idx) => (
                                <Box key={idx} sx={{ width: idx === currentStepIdx ? 18 : 6, height: 6, borderRadius: 3, bgcolor: idx === currentStepIdx ? colors.accent : stepComplete(idx) ? alpha('#22c55e', 0.5) : alpha(colors.border, 0.8), transition: 'all 0.25s' }} />
                            ))}
                        </Box>
                        {isLastStep ? (
                            <Button onClick={handleSubmit} disabled={submitting} endIcon={!submitting && <CheckCircleIcon sx={{ fontSize: '0.9rem !important' }} />}
                                sx={{ background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`, color: '#fff', fontWeight: 600, fontSize: '0.85rem', px: 4, py: 1.25, borderRadius: '12px', textTransform: 'none', boxShadow: `0 4px 20px ${alpha(colors.accent, 0.3)}`, transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', '&:hover': { background: `linear-gradient(135deg, ${colors.gradient2}, ${colors.gradient1})`, transform: 'translateY(-1px)', boxShadow: `0 8px 28px ${alpha(colors.accent, 0.4)}` }, '&:disabled': { bgcolor: alpha(colors.text, 0.06), color: alpha(colors.text, 0.2), boxShadow: 'none' } }}>
                                {submitting && <CircularProgress size={16} sx={{ color: 'inherit', mr: 1 }} />}
                                {submitting ? 'Submitting…' : 'Submit'}
                            </Button>
                        ) : (
                            <Button onClick={handleNext} endIcon={<ArrowForwardIcon sx={{ fontSize: '0.9rem !important' }} />}
                                sx={{ background: `linear-gradient(135deg, ${colors.gradient1}, ${colors.gradient2})`, color: '#fff', fontWeight: 600, fontSize: '0.85rem', px: 4, py: 1.25, borderRadius: '12px', textTransform: 'none', boxShadow: `0 4px 20px ${alpha(colors.accent, 0.3)}`, transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', '&:hover': { background: `linear-gradient(135deg, ${colors.gradient2}, ${colors.gradient1})`, transform: 'translateY(-1px)', boxShadow: `0 8px 28px ${alpha(colors.accent, 0.4)}` } }}>
                                Next
                            </Button>
                        )}
                    </Box>
                </Box>
            </Box>

            {brand && (
                <Box ref={footerReveal.ref}>
                    <PortalWizardFooter brand={brand} brandName={brandName} brandInitial={brandInitial} visible={footerReveal.visible} colors={colors} />
                </Box>
            )}
        </Box>
    );
}
