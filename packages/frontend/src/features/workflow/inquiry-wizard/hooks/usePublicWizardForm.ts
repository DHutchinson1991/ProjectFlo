'use client';
import { useState, useCallback, useMemo } from 'react';
import { publicInquiryWizardApi } from '../api';
import type { PublicWizardTemplate, WizardStep, InquiryWizardQuestion } from '../types';

import type { AnyRecord } from '../types';

interface Options {
    template: PublicWizardTemplate | null;
    steps: WizardStep[];
    token: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function usePublicWizardForm({ template, steps, token }: Options) {
    const [currentStepIdx, setCurrentStepIdx] = useState(0);
    const [responses, setResponses] = useState<AnyRecord>({});
    const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
    const [fieldErrors, setFieldErrors] = useState<AnyRecord>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [portalToken, setPortalToken] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const api = publicInquiryWizardApi;

    const shouldShowQuestion = useCallback((condition: AnyRecord | null): boolean => {
        if (!condition?.field_key) return true;
        const cur = responses[condition.field_key as string];
        const exp = condition.value;
        switch (condition.operator) {
            case 'not_equals': return cur !== exp;
            case 'contains': return Array.isArray(cur) ? cur.includes(exp) : String(cur || '').includes(String(exp || ''));
            case 'equals':
            default: return cur === exp;
        }
    }, [responses]);

    const questionsForStep = useCallback((stepKey: string): InquiryWizardQuestion[] => {
        if (!template) return [];
        return template.questions.filter(
            (q) => q.category === stepKey && shouldShowQuestion(q.condition_json)
        );
    }, [template, shouldShowQuestion]);

    const currentStep = steps[currentStepIdx];
    const currentQuestions = useMemo(
        () => currentStep ? questionsForStep(currentStep.key) : [],
        [currentStep, questionsForStep]
    );
    const isLastStep = currentStepIdx === steps.length - 1;

    const validateCurrentStep = useCallback((): boolean => {
        if (!currentStep || currentStep.type === 'package_select' || currentStep.type === 'discovery_call') return true;
        const errors: AnyRecord = {};
        for (const q of currentQuestions) {
            const key = q.field_key || `question_${q.id}`;
            const val = responses[key];
            const empty = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
            if (q.required && empty) { errors[key] = 'Required'; }
            else if (q.field_type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val))) {
                errors[key] = 'Enter a valid email';
            }
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }, [currentStep, currentQuestions, responses]);

    const handleChange = useCallback((fieldKey: string, value: unknown) => {
        setResponses((prev) => ({ ...prev, [fieldKey]: value }));
        setFieldErrors((prev) => { const n = { ...prev }; delete n[fieldKey]; return n; });
    }, []);

    const handleNext = useCallback(() => {
        if (!validateCurrentStep()) return;
        setFieldErrors({});
        setCurrentStepIdx((i) => Math.min(i + 1, steps.length - 1));
    }, [validateCurrentStep, steps.length]);

    const handleBack = useCallback(() => {
        setFieldErrors({});
        setCurrentStepIdx((i) => Math.max(i - 1, 0));
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!template) return;
        const allErrors: AnyRecord = {};
        for (const step of steps) {
            if (step.type === 'package_select' || step.type === 'discovery_call') continue;
            for (const q of questionsForStep(step.key)) {
                const key = q.field_key || `question_${q.id}`;
                const val = responses[key];
                const empty = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
                if (q.required && empty) allErrors[key] = 'Required';
                else if (q.field_type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val))) allErrors[key] = 'Enter a valid email';
            }
        }
        if (Object.keys(allErrors).length > 0) {
            setFieldErrors(allErrors);
            for (let i = 0; i < steps.length; i++) {
                if (questionsForStep(steps[i].key).some((q) => allErrors[q.field_key || `question_${q.id}`])) {
                    setCurrentStepIdx(i);
                    break;
                }
            }
            return;
        }
        try {
            setSubmitting(true);
            setSubmitError(null);
            const result = await api.submit(token, { template_id: template.id, responses, selected_package_id: selectedPackageId, create_inquiry: true });
            setSubmitted(true);
            const pToken = result?.inquiry?.portal_token;
            if (pToken) {
                setPortalToken(pToken);
                setTimeout(() => { window.location.href = `/portal/portal/${pToken}`; }, 2000);
            }
        } catch {
            setSubmitError('Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }, [template, steps, questionsForStep, responses, selectedPackageId, token, api]);

    const stepAnsweredCount = useCallback((stepKey: string) => {
        return questionsForStep(stepKey).filter((q) => {
            const val = responses[q.field_key || `question_${q.id}`];
            return val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0);
        }).length;
    }, [questionsForStep, responses]);

    const stepComplete = useCallback((idx: number): boolean => {
        const s = steps[idx];
        if (!s || s.type === 'package_select' || s.type === 'discovery_call') return true;
        return questionsForStep(s.key).filter((q) => q.required).every((q) => {
            const val = responses[q.field_key || `question_${q.id}`];
            return val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0);
        });
    }, [steps, questionsForStep, responses]);

    return {
        currentStepIdx, setCurrentStepIdx, responses, selectedPackageId, setSelectedPackageId,
        fieldErrors, submitting, submitted, portalToken, submitError,
        currentStep, currentQuestions, isLastStep,
        handleNext, handleBack, handleChange, handleSubmit,
        stepAnsweredCount, stepComplete, questionsForStep,
    };
}
