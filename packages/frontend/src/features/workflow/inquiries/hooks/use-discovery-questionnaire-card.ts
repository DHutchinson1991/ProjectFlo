import { useState, useEffect, useRef, useMemo } from 'react';
import { useMeetingSettings } from '@/features/platform/settings/hooks';
import type {
    DiscoveryQuestionnaireSubmission,
    DiscoveryQuestion,
} from '@/features/workflow/inquiries/types';
import { DEFAULT_CURRENCY, formatCurrency } from '@projectflo/shared';
import {
    useDiscoveryQuestionnaireTemplate,
    useScheduleSnapshotActivities,
    useInquiryPaymentSchedule,
    useWizardResponses,
} from './use-discovery-questionnaire-data';
import { useSubmitDiscoveryQuestionnaire } from './use-submit-discovery-questionnaire';

// ─── Script hint variable interpolation ───────────────────────────────────────

interface ScriptHintContext {
    customerName?: string;
    producerName?: string;
    brandName?: string;
    callDuration: number;
    venueName?: string;
    weddingDate?: string;
    packageName?: string;
    coverageHours: string;
    deliverables: string;
    highlightLength: string;
    budgetRange?: string;
    exactPrice: string;
    paymentTerms: string;
}

const TRIGGER_LABELS: Record<string, string> = {
    AFTER_BOOKING: 'on booking',
    BEFORE_EVENT: 'before the event',
    AFTER_EVENT: 'after the event',
    ON_DATE: 'on a fixed date',
};

function resolveScriptHint(hint: string, ctx: ScriptHintContext): string {
    return hint
        .replace(/\{\{customer_name\}\}/g, ctx.customerName || 'there')
        .replace(/\{\{producer_name\}\}/g, ctx.producerName || '[your name]')
        .replace(/\{\{brand_name\}\}/g, ctx.brandName || '[brand name]')
        .replace(/\{\{call_duration\}\}/g, String(ctx.callDuration))
        .replace(/\{\{venue_name\}\}/g, ctx.venueName || '[venue]')
        .replace(/\{\{wedding_date\}\}/g, ctx.weddingDate ? new Date(ctx.weddingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '[date TBC]')
        .replace(/\{\{package_name\}\}/g, ctx.packageName || '[package]')
        .replace(/\{\{coverage_hours\}\}/g, ctx.coverageHours || '[coverage hours]')
        .replace(/\{\{deliverables\}\}/g, ctx.deliverables || '[deliverables]')
        .replace(/\{\{highlight_length\}\}/g, ctx.highlightLength || '[highlight length]')
        .replace(/\{\{budget_range\}\}/g, ctx.budgetRange || '[budget]')
        .replace(/\{\{exact_price\}\}/g, ctx.exactPrice || '[price]')
        .replace(/\{\{payment_terms\}\}/g, ctx.paymentTerms || '[payment terms]');
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseDiscoveryCallFormParams {
    open: boolean;
    inquiryId: number;
    brandId: number;
    customerName?: string;
    producerName?: string;
    brandName?: string;
    venueName?: string;
    weddingDate?: string;
    packageName?: string;
    budgetRange?: string;
    estimateTotal?: number | null;
    currency?: string;
    existingSubmission?: DiscoveryQuestionnaireSubmission | null;
    onSubmitted?: (submission: DiscoveryQuestionnaireSubmission) => void;
}

export function useDiscoveryCallForm({
    open,
    inquiryId,
    brandId,
    customerName,
    producerName,
    brandName,
    venueName,
    weddingDate,
    packageName,
    budgetRange,
    estimateTotal,
    currency,
    existingSubmission,
    onSubmitted,
}: UseDiscoveryCallFormParams) {
    const { data: meetingSettings } = useMeetingSettings();
    const { data: template, isLoading: templateLoading, isError: templateError } = useDiscoveryQuestionnaireTemplate();
    const { data: activities = [] } = useScheduleSnapshotActivities(inquiryId);
    const { data: paymentSchedule = null } = useInquiryPaymentSchedule(inquiryId, brandId);
    const { data: wizardData = {} } = useWizardResponses(inquiryId);
    const submitMutation = useSubmitDiscoveryQuestionnaire();

    const [callDuration, setCallDuration] = useState<number>(20);
    const [responses, setResponses] = useState<Record<string, string | string[]>>({});
    const [transcript, setTranscript] = useState('');
    const [sentiment, setSentiment] = useState<Record<string, string>>({});
    const [recordingConsent, setRecordingConsent] = useState<boolean | null>(null);
    const [sectionIndex, setSectionIndex] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const callOpenedAt = useRef<number | null>(null);
    const [hasInitialized, setHasInitialized] = useState(false);

    const loading = templateLoading;
    const error = templateError
        ? 'Failed to load questionnaire template.'
        : submitMutation.error
          ? 'Failed to save questionnaire. Please try again.'
          : null;

    // ─── Effects ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        setCallDuration(meetingSettings?.duration_minutes ?? 20);
    }, [meetingSettings?.duration_minutes, open]);

    useEffect(() => {
        if (!open || !template || hasInitialized) return;
        if (!callOpenedAt.current) callOpenedAt.current = Date.now();
        if (existingSubmission?.responses) {
            setResponses(existingSubmission.responses as Record<string, string | string[]>);
            setTranscript(existingSubmission.transcript ?? '');
            setSentiment((existingSubmission.sentiment as Record<string, string>) ?? {});
            const existingResponses = existingSubmission.responses as Record<string, unknown>;
            setRecordingConsent(
                existingResponses?.recording_consent === 'yes'
                    ? true
                    : existingResponses?.recording_consent === 'no'
                      ? false
                      : null,
            );
        } else {
            setResponses({});
            setTranscript('');
            setSentiment({});
            setRecordingConsent(null);
        }
        setSectionIndex(0);
        setSubmitted(false);
        setHasInitialized(true);
    }, [open, template, existingSubmission, hasInitialized]);

    useEffect(() => {
        if (!open) setHasInitialized(false);
    }, [open]);

    // ─── Computed ─────────────────────────────────────────────────────
    const sections = useMemo(() => {
        if (!template) return [];
        const map = new Map<string, DiscoveryQuestion[]>();
        for (const q of template.questions) {
            const key = q.section ?? 'Other';
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(q);
        }
        return Array.from(map.entries()).map(([name, questions]) => ({ name, questions }));
    }, [template]);

    // ─── Script hint context ──────────────────────────────────────────
    const rawDeliverables = wizardData.deliverables;
    const scriptCtx: ScriptHintContext = {
        customerName,
        producerName,
        brandName,
        callDuration,
        venueName,
        weddingDate,
        packageName,
        coverageHours: String(wizardData.coverage_hours ?? ''),
        deliverables: Array.isArray(rawDeliverables)
            ? rawDeliverables.join(', ')
            : typeof rawDeliverables === 'string' ? rawDeliverables : '',
        highlightLength: String(wizardData.highlight_length ?? ''),
        budgetRange,
        exactPrice: estimateTotal != null ? formatCurrency(estimateTotal, currency || DEFAULT_CURRENCY) : '',
        paymentTerms: paymentSchedule?.rules
            ?.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((r) => {
                const amt = r.amount_type === 'PERCENT'
                    ? `${r.amount_value}%`
                    : formatCurrency(r.amount_value, currency || DEFAULT_CURRENCY);
                return `${amt} ${TRIGGER_LABELS[r.trigger_type] ?? r.trigger_type}`;
            })
            .join(', ') ?? '',
    };

    // ─── Handlers ─────────────────────────────────────────────────────
    const handleChange = (fieldKey: string, val: string | string[]) => {
        setResponses((prev) => ({ ...prev, [fieldKey]: val }));
    };

    const handleSentimentChange = (key: string, val: string | null) => {
        setSentiment((prev) => {
            const next = { ...prev };
            if (val === null) delete next[key];
            else next[key] = val;
            return next;
        });
    };

    const handleSubmit = () => {
        if (!template) return;
        const elapsed = callOpenedAt.current
            ? Math.round((Date.now() - callOpenedAt.current) / 1000)
            : undefined;
        submitMutation.mutate(
            {
                existingSubmissionId: existingSubmission?.id,
                templateId: template.id,
                inquiryId,
                responses,
                transcript: transcript || undefined,
                sentiment: Object.keys(sentiment).length > 0 ? sentiment : undefined,
                callDurationSeconds: elapsed,
            },
            {
                onSuccess: (submission) => {
                    setSubmitted(true);
                    onSubmitted?.(submission);
                },
            },
        );
    };

    const handleClose = () => {
        if (!submitMutation.isPending) {
            callOpenedAt.current = null;
        }
    };

    const sectionHasAnswers = (s: { name: string; questions: DiscoveryQuestion[] }) =>
        s.questions.some((q) => {
            const v = responses[q.field_key ?? ''];
            return v && (Array.isArray(v) ? v.length > 0 : String(v).trim() !== '');
        });

    return {
        // Data
        template,
        activities,
        paymentSchedule,
        sections,
        loading,
        error,
        submitted,
        saving: submitMutation.isPending,

        // Form state
        responses,
        transcript,
        sentiment,
        recordingConsent,
        sectionIndex,
        setSectionIndex,

        // Derived
        currentSection: sections[sectionIndex] as { name: string; questions: DiscoveryQuestion[] } | undefined,
        nextSectionName: sectionIndex < sections.length - 1 ? sections[sectionIndex + 1]?.name : null,
        prevSectionName: sectionIndex > 0 ? sections[sectionIndex - 1]?.name : null,

        // Handlers
        handleChange,
        handleSentimentChange,
        handleSubmit,
        handleClose,
        sectionHasAnswers,
        resolveHint: (hint: string) => resolveScriptHint(hint, scriptCtx),

        // Transcript/consent
        setTranscript,
        setRecordingConsent,
    };
}
