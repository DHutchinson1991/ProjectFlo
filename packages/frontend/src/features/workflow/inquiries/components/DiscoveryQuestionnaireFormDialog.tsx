'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Button,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    TextField,
    Paper,
    Chip,
    Select,
    MenuItem,
    FormControl,
    Checkbox,
    FormControlLabel,
    FormGroup,
    CircularProgress,
    Divider,
    Alert,
    ToggleButtonGroup,
    ToggleButton,
} from '@mui/material';
import {
    Close,
    LightbulbOutlined,
    Send,
    Check,
    MicNone,
    NoteAltOutlined,
    VisibilityOutlined,
    VisibilityOffOutlined,
    FiberManualRecord,
} from '@mui/icons-material';
import { api } from '@/lib/api';
import { inquiriesApi } from '@/features/workflow/inquiries';
import { paymentSchedulesApi } from '@/features/finance/payment-schedules';
import {
    DiscoveryQuestionnaireTemplate,
    DiscoveryQuestionnaireSubmission,
    DiscoveryQuestion,
} from '@/lib/types';
import type { PaymentScheduleTemplate, PaymentScheduleRule } from '@/lib/types/domains/sales';

// ─── Section colours ───────────────────────────────────────────────────────────
const SECTION_COLORS: Record<string, string> = {
    'Call Opening': '#06b6d4',
    'Getting to Know You': '#3b82f6',
    'Creative Vision': '#a855f7',
    'Activity & Moment Confirmation': '#10b981',
    'Day Logistics': '#f59e0b',
    'Deliverables & Expectations': '#ef4444',
    'Budget & Fit': '#6366f1',
    'Decision & Next Steps': '#f472b6',
    'Call Closing': '#ec4899',
};

function getSectionColor(section: string) {
    return SECTION_COLORS[section] ?? '#64748b';
}

// ─── Sentiment chip definitions ────────────────────────────────────────────────
const SENTIMENT_DEFS = [
    {
        key: 'excitement',
        label: 'Excitement',
        options: ['High', 'Moderate', 'Low'],
        colors: { High: '#10b981', Moderate: '#f59e0b', Low: '#ef4444' } as Record<string, string>,
    },
    {
        key: 'budget_comfort',
        label: 'Budget Comfort',
        options: ['Comfortable', 'Stretching', 'Concerned'],
        colors: { Comfortable: '#10b981', Stretching: '#f59e0b', Concerned: '#ef4444' } as Record<string, string>,
    },
    {
        key: 'decision_readiness',
        label: 'Decision Readiness',
        options: ['Ready', 'Warm', 'Early Stage'],
        colors: { Ready: '#10b981', Warm: '#f59e0b', 'Early Stage': '#64748b' } as Record<string, string>,
    },
    {
        key: 'red_flags',
        label: 'Red Flags',
        options: ['None', 'Minor', 'Significant'],
        colors: { None: '#10b981', Minor: '#f59e0b', Significant: '#ef4444' } as Record<string, string>,
    },
];

// ─── Single question renderer ─────────────────────────────────────────────────

// ─── Activity/moment types from schedule snapshot ─────────────────────────────

interface SnapshotMoment {
    id: number;
    name: string;
    order_index: number;
    is_required: boolean;
}

interface SnapshotActivity {
    id: number;
    name: string;
    color: string | null;
    icon: string | null;
    order_index: number;
    moments: SnapshotMoment[];
}

interface QuestionFieldProps {
    question: DiscoveryQuestion;
    value: string | string[];
    onChange: (val: string | string[]) => void;
    activities?: SnapshotActivity[];
    paymentSchedule?: PaymentScheduleTemplate | null;
}

function QuestionField({ question, value, onChange, activities = [], paymentSchedule }: QuestionFieldProps) {
    const opts: string[] =
        question.options && 'values' in (question.options as object)
            ? ((question.options as { values: string[] }).values ?? [])
            : [];

    const strVal = typeof value === 'string' ? value : '';
    const arrVal = Array.isArray(value) ? value : [];

    switch (question.field_type) {
        case 'select':
            return (
                <FormControl fullWidth size="small">
                    <Select
                        value={strVal}
                        displayEmpty
                        onChange={(e) => onChange(e.target.value as string)}
                        sx={{ bgcolor: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.85rem', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(100,116,139,0.3)' } }}
                        MenuProps={{ PaperProps: { sx: { bgcolor: '#1e2330' } } }}
                    >
                        <MenuItem value="" disabled sx={{ color: '#64748b', fontSize: '0.82rem' }}>
                            Choose an option…
                        </MenuItem>
                        {opts.map((o) => (
                            <MenuItem key={o} value={o} sx={{ color: '#e2e8f0', fontSize: '0.82rem' }}>{o}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            );

        case 'multiselect':
            return (
                <FormGroup sx={{ flexDirection: 'row', gap: 1, flexWrap: 'wrap' }}>
                    {opts.map((o) => (
                        <FormControlLabel
                            key={o}
                            control={
                                <Checkbox
                                    size="small"
                                    checked={arrVal.includes(o)}
                                    onChange={(e) => {
                                        if (e.target.checked) onChange([...arrVal, o]);
                                        else onChange(arrVal.filter((v) => v !== o));
                                    }}
                                    sx={{ color: '#64748b', '&.Mui-checked': { color: '#3b82f6' } }}
                                />
                            }
                            label={o}
                            sx={{ '& .MuiFormControlLabel-label': { color: '#94a3b8', fontSize: '0.8rem' } }}
                        />
                    ))}
                </FormGroup>
            );

        case 'textarea':
            return (
                <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    maxRows={6}
                    size="small"
                    value={strVal}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Type your notes here…"
                    sx={{
                        '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.85rem' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(100,116,139,0.3)' },
                    }}
                />
            );

        case 'text':
            return (
                <TextField
                    fullWidth
                    size="small"
                    value={strVal}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Type here…"
                    sx={{
                        '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.85rem' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(100,116,139,0.3)' },
                    }}
                />
            );

        case 'activity_checklist': {
            if (activities.length === 0) {
                return (
                    <Paper sx={{ p: 2, bgcolor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 2 }}>
                        <Typography sx={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>
                            No activities found — select a package first.
                        </Typography>
                    </Paper>
                );
            }
            // Parse stored value: JSON array of { id, name, confirmed, notes }
            let actState: { id: number; name: string; confirmed: boolean; notes: string }[] = [];
            try { actState = JSON.parse(strVal || '[]'); } catch { /* ignore */ }
            const actMap = new Map(actState.map((a) => [a.id, a]));
            const toggleActivity = (act: SnapshotActivity) => {
                const existing = actMap.get(act.id);
                const next = actState.filter((a) => a.id !== act.id);
                if (!existing?.confirmed) {
                    next.push({ id: act.id, name: act.name, confirmed: true, notes: existing?.notes ?? '' });
                } else {
                    next.push({ id: act.id, name: act.name, confirmed: false, notes: existing?.notes ?? '' });
                }
                onChange(JSON.stringify(next));
            };
            const setActivityNotes = (actId: number, actName: string, notes: string) => {
                const next = actState.filter((a) => a.id !== actId);
                const existing = actMap.get(actId);
                next.push({ id: actId, name: actName, confirmed: existing?.confirmed ?? true, notes });
                onChange(JSON.stringify(next));
            };
            return (
                <Paper sx={{ p: 2, bgcolor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 2 }}>
                    <Stack spacing={1}>
                        {activities.map((act) => {
                            const entry = actMap.get(act.id);
                            const confirmed = entry?.confirmed ?? false;
                            return (
                                <Box key={act.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Checkbox
                                            size="small"
                                            checked={confirmed}
                                            onChange={() => toggleActivity(act)}
                                            sx={{ color: '#64748b', '&.Mui-checked': { color: '#10b981' }, p: 0.5 }}
                                        />
                                        {act.color && (
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: act.color, flexShrink: 0 }} />
                                        )}
                                        <Typography sx={{ color: confirmed ? '#e2e8f0' : '#64748b', fontSize: '0.85rem', fontWeight: 600, textDecoration: confirmed ? 'none' : 'none' }}>
                                            {act.name}
                                        </Typography>
                                        <Typography sx={{ color: '#475569', fontSize: '0.7rem', ml: 'auto' }}>
                                            {act.moments.length} moment{act.moments.length !== 1 ? 's' : ''}
                                        </Typography>
                                    </Box>
                                    {confirmed && (
                                        <TextField
                                            fullWidth
                                            size="small"
                                            value={entry?.notes ?? ''}
                                            onChange={(e) => setActivityNotes(act.id, act.name, e.target.value)}
                                            placeholder="Notes — e.g. Bride only, no groomsmen"
                                            sx={{ ml: 4, mt: 0.5, '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.03)', color: '#94a3b8', fontSize: '0.78rem' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(16,185,129,0.15)' } }}
                                        />
                                    )}
                                </Box>
                            );
                        })}
                    </Stack>
                </Paper>
            );
        }

        case 'moment_checklist': {
            const activitiesWithMoments = activities.filter((a) => a.moments.length > 0);
            if (activitiesWithMoments.length === 0) {
                return (
                    <Paper sx={{ p: 2, bgcolor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 2 }}>
                        <Typography sx={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>
                            No moments found — activities have no moments configured yet.
                        </Typography>
                    </Paper>
                );
            }
            // Parse stored value: JSON array of { momentId, activityId, activityName, momentName, confirmed }
            let momState: { momentId: number; activityId: number; activityName: string; momentName: string; confirmed: boolean }[] = [];
            try { momState = JSON.parse(strVal || '[]'); } catch { /* ignore */ }
            const momMap = new Map(momState.map((m) => [m.momentId, m]));
            const toggleMoment = (act: SnapshotActivity, mom: SnapshotMoment) => {
                const existing = momMap.get(mom.id);
                const next = momState.filter((m) => m.momentId !== mom.id);
                next.push({ momentId: mom.id, activityId: act.id, activityName: act.name, momentName: mom.name, confirmed: !existing?.confirmed });
                onChange(JSON.stringify(next));
            };
            return (
                <Paper sx={{ p: 2, bgcolor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 2 }}>
                    <Stack spacing={1.5}>
                        {activitiesWithMoments.map((act) => (
                            <Box key={act.id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    {act.color && (
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: act.color, flexShrink: 0 }} />
                                    )}
                                    <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        {act.name}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 2 }}>
                                    {act.moments.map((mom) => {
                                        const entry = momMap.get(mom.id);
                                        const confirmed = entry?.confirmed ?? false;
                                        return (
                                            <Chip
                                                key={mom.id}
                                                label={mom.name}
                                                size="small"
                                                onClick={() => toggleMoment(act, mom)}
                                                icon={confirmed ? <Check sx={{ fontSize: 14 }} /> : undefined}
                                                sx={{
                                                    fontSize: '0.75rem',
                                                    height: 26,
                                                    bgcolor: confirmed ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                                                    color: confirmed ? '#6ee7b7' : '#64748b',
                                                    border: `1px solid ${confirmed ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.2)'}`,
                                                    cursor: 'pointer',
                                                    '&:hover': { bgcolor: confirmed ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)' },
                                                }}
                                            />
                                        );
                                    })}
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                </Paper>
            );
        }

        case 'payment_terms': {
            const TRIGGER_LABELS: Record<string, string> = {
                AFTER_BOOKING: 'on booking',
                BEFORE_EVENT: 'before the event',
                AFTER_EVENT: 'after the event',
                ON_DATE: 'on a fixed date',
            };
            const rules = paymentSchedule?.rules ?? [];
            const formatRule = (r: PaymentScheduleRule) => {
                const amt = r.amount_type === 'PERCENT' ? `${r.amount_value}%` : `£${r.amount_value.toFixed(2)}`;
                const trigger = TRIGGER_LABELS[r.trigger_type] ?? r.trigger_type;
                const days = r.trigger_days && r.trigger_days > 0 ? ` (${r.trigger_days} days ${r.trigger_type === 'BEFORE_EVENT' ? 'before' : 'after'})` : '';
                return `${r.label}: ${amt} ${trigger}${days}`;
            };

            // Stored value is JSON: { confirmed: 'yes'|'no'|'needs_change', notes: string }
            let ptState: { confirmed: string; notes: string } = { confirmed: '', notes: '' };
            try { ptState = JSON.parse(strVal || '{}'); } catch { /* ignore */ }
            const updatePt = (patch: Partial<{ confirmed: string; notes: string }>) =>
                onChange(JSON.stringify({ ...ptState, ...patch }));

            return (
                <Stack spacing={1.5}>
                    {rules.length > 0 ? (
                        <Paper sx={{ p: 2, bgcolor: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 2 }}>
                            <Typography sx={{ color: '#a5b4fc', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
                                {paymentSchedule?.name ?? 'Payment Schedule'}
                            </Typography>
                            <Stack spacing={0.5}>
                                {rules
                                    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                                    .map((r, i) => (
                                        <Typography key={i} sx={{ color: '#c7d2fe', fontSize: '0.82rem' }}>
                                            • {formatRule(r)}
                                        </Typography>
                                    ))}
                            </Stack>
                        </Paper>
                    ) : (
                        <Paper sx={{ p: 2, bgcolor: 'rgba(100,116,139,0.06)', border: '1px solid rgba(100,116,139,0.15)', borderRadius: 2 }}>
                            <Typography sx={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                No payment schedule set for this inquiry yet.
                            </Typography>
                        </Paper>
                    )}
                    <FormControl fullWidth size="small">
                        <Select
                            value={ptState.confirmed}
                            displayEmpty
                            onChange={(e) => updatePt({ confirmed: e.target.value as string })}
                            sx={{ bgcolor: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.85rem', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(100,116,139,0.3)' } }}
                            MenuProps={{ PaperProps: { sx: { bgcolor: '#1e2330' } } }}
                        >
                            <MenuItem value="" disabled sx={{ color: '#64748b', fontSize: '0.82rem' }}>
                                Customer response…
                            </MenuItem>
                            <MenuItem value="confirmed" sx={{ color: '#e2e8f0', fontSize: '0.82rem' }}>Confirmed — happy with these terms</MenuItem>
                            <MenuItem value="needs_adjustment" sx={{ color: '#e2e8f0', fontSize: '0.82rem' }}>Needs adjustment — discuss alternatives</MenuItem>
                            <MenuItem value="not_discussed" sx={{ color: '#e2e8f0', fontSize: '0.82rem' }}>Not discussed yet</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={4}
                        size="small"
                        value={ptState.notes}
                        onChange={(e) => updatePt({ notes: e.target.value })}
                        placeholder="Notes — e.g. prefers 3 instalments, wants to pay deposit after meeting…"
                        sx={{
                            '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.85rem' },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(100,116,139,0.3)' },
                        }}
                    />
                </Stack>
            );
        }

        case 'number':
            return (
                <TextField
                    size="small"
                    type="number"
                    value={strVal}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="e.g. 120"
                    sx={{
                        width: 160,
                        '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.85rem' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(100,116,139,0.3)' },
                    }}
                />
            );

        default:
            return (
                <TextField
                    fullWidth
                    size="small"
                    value={strVal}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Type your answer…"
                    sx={{
                        '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.85rem' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(100,116,139,0.3)' },
                    }}
                />
            );
    }
}

// ─── Sentiment chips panel ────────────────────────────────────────────────────

interface SentimentPanelProps {
    sentiment: Record<string, string>;
    onChange: (key: string, val: string | null) => void;
}

function SentimentPanel({ sentiment, onChange }: SentimentPanelProps) {
    return (
        <Stack spacing={1.5}>
            <Typography sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Call Sentiment
            </Typography>
            {SENTIMENT_DEFS.map((def) => (
                <Box key={def.key}>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem', mb: 0.5, fontWeight: 600 }}>
                        {def.label}
                    </Typography>
                    <ToggleButtonGroup
                        exclusive
                        size="small"
                        value={sentiment[def.key] ?? null}
                        onChange={(_, val) => onChange(def.key, val)}
                        sx={{ flexWrap: 'wrap', gap: 0.5 }}
                    >
                        {def.options.map((opt) => (
                            <ToggleButton
                                key={opt}
                                value={opt}
                                sx={{
                                    px: 1.2,
                                    py: 0.3,
                                    fontSize: '0.7rem',
                                    textTransform: 'none',
                                    border: '1px solid rgba(100,116,139,0.2)',
                                    color: '#64748b',
                                    borderRadius: '12px !important',
                                    '&.Mui-selected': {
                                        bgcolor: `${def.colors[opt]}22`,
                                        color: def.colors[opt],
                                        borderColor: `${def.colors[opt]}44`,
                                        '&:hover': { bgcolor: `${def.colors[opt]}33` },
                                    },
                                }}
                            >
                                {opt}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </Box>
            ))}
        </Stack>
    );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DiscoveryQuestionnaireFormDialogProps {
    open: boolean;
    onClose: () => void;
    inquiryId: number;
    brandId: number;
    customerName?: string;
    producerName?: string;
    brandName?: string;
    existingSubmission?: DiscoveryQuestionnaireSubmission | null;
    onSubmitted?: (submission: DiscoveryQuestionnaireSubmission) => void;
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

export default function DiscoveryQuestionnaireFormDialog({
    open,
    onClose,
    inquiryId,
    brandId,
    customerName,
    producerName,
    brandName,
    existingSubmission,
    onSubmitted,
}: DiscoveryQuestionnaireFormDialogProps) {
    const [template, setTemplate] = useState<DiscoveryQuestionnaireTemplate | null>(null);
    const [activities, setActivities] = useState<SnapshotActivity[]>([]);
    const [callDuration, setCallDuration] = useState<number>(20);
    const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleTemplate | null>(null);
    const [responses, setResponses] = useState<Record<string, string | string[]>>({});
    const [callNotes, setCallNotes] = useState('');
    const [transcript, setTranscript] = useState('');
    const [sentiment, setSentiment] = useState<Record<string, string>>({});
    const [recordingConsent, setRecordingConsent] = useState<boolean | null>(null);
    const [sectionIndex, setSectionIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const callOpenedAt = useRef<number | null>(null);

    const resolveScriptHint = (hint: string) =>
        hint
            .replace(/\{\{customer_name\}\}/g, customerName || 'there')
            .replace(/\{\{producer_name\}\}/g, producerName || '[your name]')
            .replace(/\{\{brand_name\}\}/g, brandName || '[brand name]')
            .replace(/\{\{call_duration\}\}/g, String(callDuration));

    // Load template
    useEffect(() => {
        if (!open) return;
        if (!callOpenedAt.current) callOpenedAt.current = Date.now();
        setLoading(true);
        setError(null);
        Promise.all([
            api.discoveryQuestionnaireTemplates.getActive(),
            inquiriesApi.scheduleSnapshot.getActivities(inquiryId).catch(() => [] as SnapshotActivity[]),
            brandId > 0 ? api.brands.getMeetingSettings(brandId).catch(() => null) : Promise.resolve(null),
            brandId > 0
                ? inquiriesApi.getById(inquiryId)
                    .then((inq) => inq.preferred_payment_schedule_template_id
                        ? paymentSchedulesApi.getById(inq.preferred_payment_schedule_template_id)
                        : paymentSchedulesApi.getDefault())
                    .catch(() => null)
                : Promise.resolve(null),
        ])
            .then(([t, acts, meetingSettings, schedule]) => {
                setTemplate(t);
                setActivities(acts ?? []);
                if (meetingSettings?.duration_minutes) setCallDuration(meetingSettings.duration_minutes);
                if (schedule) setPaymentSchedule(schedule);
                if (existingSubmission?.responses) {
                    setResponses(existingSubmission.responses as Record<string, string | string[]>);
                    setCallNotes(existingSubmission.call_notes ?? '');
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
                    setCallNotes('');
                    setTranscript('');
                    setSentiment({});
                    setRecordingConsent(null);
                }
                setSectionIndex(0);
                setSubmitted(false);
            })
            .catch(() => setError('Failed to load questionnaire template.'))
            .finally(() => setLoading(false));
    }, [open, existingSubmission, inquiryId]);

    // Group questions by section
    const sections = React.useMemo(() => {
        if (!template) return [];
        const map = new Map<string, DiscoveryQuestion[]>();
        for (const q of template.questions) {
            const key = q.section ?? 'Other';
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(q);
        }
        return Array.from(map.entries()).map(([name, questions]) => ({ name, questions }));
    }, [template]);

    const currentSection = sections[sectionIndex];

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

    const handleSubmit = async () => {
        if (!template) return;
        setSaving(true);
        setError(null);
        const elapsed = callOpenedAt.current
            ? Math.round((Date.now() - callOpenedAt.current) / 1000)
            : undefined;
        try {
            let submission: DiscoveryQuestionnaireSubmission;
            if (existingSubmission?.id) {
                submission = await api.discoveryQuestionnaireSubmissions.update(existingSubmission.id, {
                    responses,
                    call_notes: callNotes || undefined,
                    transcript: transcript || undefined,
                    sentiment: Object.keys(sentiment).length > 0 ? sentiment : undefined,
                    call_duration_seconds: elapsed,
                });
            } else {
                submission = await api.discoveryQuestionnaireSubmissions.create({
                    template_id: template.id,
                    inquiry_id: inquiryId,
                    responses,
                    call_notes: callNotes || undefined,
                    transcript: transcript || undefined,
                    sentiment: Object.keys(sentiment).length > 0 ? sentiment : undefined,
                    call_duration_seconds: elapsed,
                });
            }
            setSubmitted(true);
            onSubmitted?.(submission);
        } catch {
            setError('Failed to save questionnaire. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        if (!saving) {
            callOpenedAt.current = null;
            onClose();
        }
    };

    // Check whether a section has any answered questions
    const sectionHasAnswers = (s: { name: string; questions: DiscoveryQuestion[] }) =>
        s.questions.some((q) => {
            const v = responses[q.field_key ?? ''];
            return v && (Array.isArray(v) ? v.length > 0 : String(v).trim() !== '');
        });

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="lg"
            PaperProps={{
                sx: {
                    bgcolor: '#0f1117',
                    background: 'linear-gradient(145deg, #0f1117, #141820)',
                    border: '1px solid rgba(59,130,246,0.15)',
                    borderRadius: 3,
                    color: '#e2e8f0',
                    height: '88vh',
                    maxHeight: '88vh',
                },
            }}
        >
            {/* Header */}
            <DialogTitle sx={{ p: 2.5, pb: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <MicNone sx={{ color: '#3b82f6', fontSize: 22 }} />
                        <Typography sx={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1.05rem' }}>
                            Discovery Call Guide
                        </Typography>
                    </Box>
                    <Typography sx={{ color: '#64748b', fontSize: '0.78rem' }}>
                        {existingSubmission ? 'Edit and re-save to update call notes' : 'Navigate freely between sections — fill in as the conversation flows'}
                    </Typography>
                </Box>
                <IconButton size="small" onClick={handleClose} sx={{ color: '#64748b', mt: -0.5 }}>
                    <Close sx={{ fontSize: 18 }} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0, pt: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress size={36} sx={{ color: '#3b82f6' }} />
                    </Box>
                )}

                {error && !loading && (
                    <Alert severity="error" sx={{ mx: 2.5, mb: 2 }}>{error}</Alert>
                )}

                {submitted && (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Check sx={{ fontSize: 48, color: '#10b981', mb: 2 }} />
                        <Typography sx={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1.1rem', mb: 1 }}>
                            Discovery Notes Saved!
                        </Typography>
                        <Typography sx={{ color: '#64748b', fontSize: '0.85rem', mb: 3 }}>
                            {existingSubmission
                                ? 'Your call notes have been updated.'
                                : 'The Discovery Call task has been automatically completed.'}
                        </Typography>
                        <Button
                            variant="outlined"
                            onClick={handleClose}
                            size="small"
                            sx={{ color: '#3b82f6', borderColor: '#3b82f6', textTransform: 'none' }}
                        >
                            Close
                        </Button>
                    </Box>
                )}

                {!loading && !submitted && template && sections.length > 0 && (
                    <>
                        {/* Section tabs */}
                        <Box sx={{
                            px: 1,
                            borderBottom: '1px solid rgba(100,116,139,0.12)',
                            display: 'flex',
                            overflowX: 'auto',
                            '&::-webkit-scrollbar': { height: 0 },
                        }}>
                            {sections.map((s, i) => {
                                const isActive = i === sectionIndex;
                                const color = getSectionColor(s.name);
                                const hasAnswers = sectionHasAnswers(s);
                                return (
                                    <Box
                                        key={s.name}
                                        onClick={() => setSectionIndex(i)}
                                        sx={{
                                            position: 'relative',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 0.75,
                                            px: 1.75,
                                            py: 1.25,
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            minWidth: 0,
                                            flexShrink: 0,
                                            transition: 'color 0.15s ease',
                                            color: isActive ? '#f1f5f9' : '#64748b',
                                            '&:hover': {
                                                color: isActive ? '#f1f5f9' : '#94a3b8',
                                            },
                                            '&::after': {
                                                content: '""',
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 8,
                                                right: 8,
                                                height: isActive ? 2 : 0,
                                                borderRadius: '2px 2px 0 0',
                                                bgcolor: color,
                                                transition: 'height 0.15s ease',
                                            },
                                        }}
                                    >
                                        {hasAnswers && (
                                            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                                        )}
                                        <Typography
                                            sx={{
                                                fontSize: '0.75rem',
                                                fontWeight: isActive ? 700 : 500,
                                                lineHeight: 1.35,
                                                maxWidth: 110,
                                                whiteSpace: 'normal',
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {s.name}
                                        </Typography>
                                        {s.questions[0]?.visibility === 'internal' && (
                                            <VisibilityOffOutlined sx={{ fontSize: 11, color: isActive ? '#94a3b8' : '#475569', flexShrink: 0 }} />
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>

                        {/* Split panel layout */}
                        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', gap: 0 }}>
                            {/* LEFT PANEL — Questions (60%) */}
                            <Box
                                sx={{
                                    flex: '0 0 60%',
                                    overflowY: 'auto',
                                    px: 2.5,
                                    py: 2,
                                    borderRight: '1px solid rgba(100,116,139,0.12)',
                                }}
                            >
                                {currentSection && (
                                    <Stack spacing={2.5}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ width: 3, height: 20, borderRadius: 2, bgcolor: getSectionColor(currentSection.name) }} />
                                            <Typography sx={{ color: getSectionColor(currentSection.name), fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                {currentSection.name}
                                            </Typography>
                                            {currentSection.questions[0]?.visibility === 'internal' && (
                                                <Chip
                                                    icon={<VisibilityOffOutlined sx={{ fontSize: 11 }} />}
                                                    label="Internal only"
                                                    size="small"
                                                    sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(100,116,139,0.12)', color: '#64748b', ml: 1 }}
                                                />
                                            )}
                                            {currentSection.questions[0]?.visibility === 'both' && (
                                                <Chip
                                                    icon={<VisibilityOutlined sx={{ fontSize: 11 }} />}
                                                    label="Shared with client"
                                                    size="small"
                                                    sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(59,130,246,0.08)', color: '#60a5fa', ml: 1 }}
                                                />
                                            )}
                                        </Box>

                                        {currentSection.questions.map((q, qIndex) => (
                                            <Box key={q.id}>
                                                {q.script_hint && (() => {
                                                    const paras = resolveScriptHint(q.script_hint).split('\n\n');
                                                    return (
                                                        <Paper sx={{ p: 1.5, mb: 1.5, bgcolor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 2 }}>
                                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                                                <LightbulbOutlined sx={{ color: '#3b82f6', fontSize: 15, mt: 0.2, flexShrink: 0 }} />
                                                                <Box>
                                                                    {paras.map((para, i) => (
                                                                        <Typography key={i} sx={{ color: '#93c5fd', fontSize: '0.78rem', lineHeight: 1.5, fontStyle: 'italic', mb: i < paras.length - 1 ? 1 : 0 }}>
                                                                            {para}
                                                                        </Typography>
                                                                    ))}
                                                                </Box>
                                                            </Box>
                                                        </Paper>
                                                    );
                                                })()}

                                                <Typography sx={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, mb: 0.75 }}>
                                                    {q.prompt}
                                                    {q.required && <Box component="span" sx={{ color: '#ef4444', ml: 0.5 }}>*</Box>}
                                                </Typography>

                                                <QuestionField
                                                    question={q}
                                                    value={responses[q.field_key ?? q.id.toString()] ?? (q.field_type === 'multiselect' ? [] : '')}
                                                    onChange={(v) => handleChange(q.field_key ?? String(q.id), v)}
                                                    activities={activities}
                                                    paymentSchedule={paymentSchedule}
                                                />

                                                {/* ── Transcript consent — after intro script in Call Opening ── */}
                                                {currentSection.name === 'Call Opening' && qIndex === 0 && (
                                                    <Paper
                                                        sx={{
                                                            p: 2,
                                                            mt: 2,
                                                            bgcolor: recordingConsent === true
                                                                ? 'rgba(16,185,129,0.06)'
                                                                : recordingConsent === false
                                                                  ? 'rgba(239,68,68,0.06)'
                                                                  : 'rgba(245,158,11,0.06)',
                                                            border: `1px solid ${
                                                                recordingConsent === true
                                                                    ? 'rgba(16,185,129,0.2)'
                                                                    : recordingConsent === false
                                                                      ? 'rgba(239,68,68,0.2)'
                                                                      : 'rgba(245,158,11,0.25)'
                                                            }`,
                                                            borderRadius: 2,
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                                                            <FiberManualRecord sx={{ fontSize: 10, color: recordingConsent === true ? '#10b981' : recordingConsent === false ? '#ef4444' : '#f59e0b' }} />
                                                            <Typography sx={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 700 }}>
                                                                Transcript Consent
                                                            </Typography>
                                                        </Box>
                                                        <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem', mb: 1.5, lineHeight: 1.6 }}>
                                                            Did they agree to Google Call Notes running during the call?
                                                        </Typography>
                                                        <ToggleButtonGroup
                                                            exclusive
                                                            size="small"
                                                            value={recordingConsent === true ? 'yes' : recordingConsent === false ? 'no' : null}
                                                            onChange={(_, val) => {
                                                                if (val === 'yes') {
                                                                    setRecordingConsent(true);
                                                                    handleChange('recording_consent', 'yes');
                                                                } else if (val === 'no') {
                                                                    setRecordingConsent(false);
                                                                    handleChange('recording_consent', 'no');
                                                                    setTranscript('');
                                                                }
                                                            }}
                                                            sx={{ gap: 0.75 }}
                                                        >
                                                            <ToggleButton
                                                                value="yes"
                                                                sx={{
                                                                    px: 2, py: 0.5, fontSize: '0.78rem', textTransform: 'none',
                                                                    border: '1px solid rgba(100,116,139,0.2)', color: '#64748b', borderRadius: '14px !important',
                                                                    '&.Mui-selected': { bgcolor: 'rgba(16,185,129,0.15)', color: '#10b981', borderColor: 'rgba(16,185,129,0.4)', '&:hover': { bgcolor: 'rgba(16,185,129,0.25)' } },
                                                                }}
                                                            >
                                                                Yes &mdash; consented
                                                            </ToggleButton>
                                                            <ToggleButton
                                                                value="no"
                                                                sx={{
                                                                    px: 2, py: 0.5, fontSize: '0.78rem', textTransform: 'none',
                                                                    border: '1px solid rgba(100,116,139,0.2)', color: '#64748b', borderRadius: '14px !important',
                                                                    '&.Mui-selected': { bgcolor: 'rgba(239,68,68,0.12)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.35)', '&:hover': { bgcolor: 'rgba(239,68,68,0.2)' } },
                                                                }}
                                                            >
                                                                No &mdash; declined
                                                            </ToggleButton>
                                                        </ToggleButtonGroup>
                                                    </Paper>
                                                )}
                                            </Box>
                                        ))}
                                    </Stack>
                                )}

                                {/* Section progress chips at bottom */}
                                <Box sx={{ display: 'flex', gap: 0.5, mt: 3, mb: 1, flexWrap: 'wrap' }}>
                                    {sections.map((s, i) => (
                                        <Chip
                                            key={s.name}
                                            size="small"
                                            label={i === sectionIndex ? s.name : `${i + 1}`}
                                            onClick={() => setSectionIndex(i)}
                                            sx={{
                                                height: 20,
                                                fontSize: '0.7rem',
                                                bgcolor: i === sectionIndex ? getSectionColor(s.name) : 'rgba(100,116,139,0.15)',
                                                color: i === sectionIndex ? '#fff' : '#64748b',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Box>

                            {/* RIGHT PANEL — Notes / Transcript / Sentiment (40%) */}
                            <Box
                                sx={{
                                    flex: '0 0 40%',
                                    overflowY: 'auto',
                                    px: 2.5,
                                    py: 2,
                                    bgcolor: 'rgba(0,0,0,0.15)',
                                }}
                            >
                                <Stack spacing={2.5}>
                                    {/* Sentiment chips */}
                                    <SentimentPanel
                                        sentiment={sentiment}
                                        onChange={handleSentimentChange}
                                    />

                                    <Divider sx={{ borderColor: 'rgba(100,116,139,0.15)' }} />

                                    {/* Call Notes */}
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                                            <NoteAltOutlined sx={{ fontSize: 15, color: '#f59e0b' }} />
                                            <Typography sx={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}>
                                                Call Notes
                                            </Typography>
                                        </Box>
                                        <Typography sx={{ color: '#64748b', fontSize: '0.72rem', mb: 0.75 }}>
                                            Quick summary — tone, enthusiasm, objections, overall vibe.
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            multiline
                                            minRows={4}
                                            maxRows={10}
                                            size="small"
                                            value={callNotes}
                                            onChange={(e) => setCallNotes(e.target.value)}
                                            placeholder="e.g. Very excited, clear creative vision. Budget slightly tight but open to a phased package. Decision by end of month. Send proposal Monday."
                                            sx={{
                                                '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.82rem' },
                                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(100,116,139,0.25)' },
                                            }}
                                        />
                                    </Box>

                                    <Divider sx={{ borderColor: 'rgba(100,116,139,0.15)' }} />

                                    {/* Transcript — only shown when consent is granted */}
                                    {recordingConsent === true && (
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                                                <MicNone sx={{ fontSize: 15, color: '#3b82f6' }} />
                                                <Typography sx={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}>
                                                    Transcript
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label="Consent given"
                                                    sx={{ height: 16, fontSize: '0.6rem', bgcolor: 'rgba(16,185,129,0.12)', color: '#10b981', ml: 'auto' }}
                                                />
                                            </Box>
                                            <Typography sx={{ color: '#64748b', fontSize: '0.72rem', mb: 0.75 }}>
                                                Paste the Google Call Notes transcript here.
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                multiline
                                                minRows={6}
                                                maxRows={20}
                                                size="small"
                                                value={transcript}
                                                onChange={(e) => setTranscript(e.target.value)}
                                                placeholder="Paste transcript from Google Call Notes…"
                                                sx={{
                                                    '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.78rem', fontFamily: 'monospace' },
                                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(100,116,139,0.25)' },
                                                }}
                                            />
                                        </Box>
                                    )}

                                    {recordingConsent === false && (
                                        <Paper sx={{ p: 1.5, bgcolor: 'rgba(100,116,139,0.06)', border: '1px solid rgba(100,116,139,0.12)', borderRadius: 2 }}>
                                            <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontStyle: 'italic' }}>
                                                Transcript hidden — couple declined recording. Take detailed notes above instead.
                                            </Typography>
                                        </Paper>
                                    )}
                                </Stack>
                            </Box>
                        </Box>
                    </>
                )}
            </DialogContent>

            {!loading && !submitted && (
                <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: '1px solid rgba(100,116,139,0.15)', gap: 1 }}>
                    <Typography sx={{ color: '#475569', fontSize: '0.7rem', mr: 'auto' }}>
                        {Object.values(responses).filter((v) => v && (Array.isArray(v) ? v.length > 0 : String(v).trim() !== '')).length}
                        {' / '}
                        {template?.questions.length ?? 0} answered
                    </Typography>

                    <Button
                        size="small"
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : <Send sx={{ fontSize: 15 }} />}
                        sx={{ bgcolor: '#10b981', textTransform: 'none', fontSize: '0.8rem', '&:hover': { bgcolor: '#059669' }, '&:disabled': { bgcolor: 'rgba(16,185,129,0.3)' } }}
                    >
                        {saving ? 'Saving…' : existingSubmission ? 'Update Call Notes' : 'Save Call Notes'}
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
}
