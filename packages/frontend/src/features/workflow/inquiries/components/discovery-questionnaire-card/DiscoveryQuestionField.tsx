import React from 'react';
import {
    Box,
    Typography,
    TextField,
    Paper,
    Chip,
    Select,
    MenuItem,
    FormControl,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Stack,
    Tooltip,
} from '@mui/material';
import { Check } from '@mui/icons-material';
import type { DiscoveryQuestion } from '@/features/workflow/inquiries/types';
import type { PaymentScheduleTemplate, PaymentScheduleRule } from '@/features/finance/payment-schedules/types';
import type { SnapshotActivity, SnapshotMoment } from '@/features/workflow/inquiries/types/schedule-snapshot';
import { DEFAULT_CURRENCY, formatCurrency } from '@projectflo/shared';

export interface DiscoveryQuestionFieldProps {
    question: DiscoveryQuestion;
    value: string | string[];
    onChange: (val: string | string[]) => void;
    activities?: SnapshotActivity[];
    paymentSchedule?: PaymentScheduleTemplate | null;
    optionLabels?: Record<string, string>;
}

export function DiscoveryQuestionField({ question, value, onChange, activities = [], paymentSchedule, optionLabels }: DiscoveryQuestionFieldProps) {
    const opts: string[] =
        question.options && 'values' in (question.options as object)
            ? ((question.options as { values: string[] }).values ?? [])
            : [];

    const strVal = typeof value === 'string' ? value : '';
    const arrVal = Array.isArray(value) ? value : [];

    const inputSx = {
        '& .MuiInputBase-root': {
            bgcolor: 'rgba(255,255,255,0.05)',
            color: '#e2e8f0',
            fontSize: '0.88rem',
            borderRadius: 2,
        },
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(148,163,184,0.18)',
        },
        '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(148,163,184,0.35)',
        },
        '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3b82f6',
            borderWidth: 1.5,
        },
    };

    switch (question.field_type) {
        case 'script_only':
            return null;

        case 'select':
            return (
                <FormControl fullWidth size="small">
                    <Select
                        value={strVal}
                        displayEmpty
                        onChange={(e) => onChange(e.target.value as string)}
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.05)',
                            color: '#e2e8f0',
                            fontSize: '0.88rem',
                            borderRadius: 2,
                            '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.18)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.35)' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6', borderWidth: 1.5 },
                        }}
                        MenuProps={{ PaperProps: { sx: { bgcolor: '#1a1f2e', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 2 } } }}
                    >
                        <MenuItem value="" disabled sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                            Choose an option...
                        </MenuItem>
                        {opts.map((o) => (
                            <MenuItem key={o} value={o} sx={{ color: '#e2e8f0', fontSize: '0.85rem' }}>{o}</MenuItem>
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
                                    sx={{ color: '#475569', '&.Mui-checked': { color: '#3b82f6' } }}
                                />
                            }
                            label={optionLabels?.[o] ?? o}
                            sx={{ '& .MuiFormControlLabel-label': { color: '#94a3b8', fontSize: '0.85rem' } }}
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
                    placeholder="Type your notes here..."
                    sx={inputSx}
                />
            );

        case 'text':
            return (
                <TextField
                    fullWidth
                    size="small"
                    value={strVal}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Type here..."
                    sx={inputSx}
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
                                        <Typography sx={{ color: confirmed ? '#e2e8f0' : '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
                                            {act.name}
                                        </Typography>
                                        <Tooltip
                                            title={act.moments.length > 0 ? (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, py: 0.5 }}>
                                                    {act.moments.map((m) => (
                                                        <Typography key={m.id} sx={{ fontSize: '0.75rem' }}>{m.name}</Typography>
                                                    ))}
                                                </Box>
                                            ) : 'No moments'}
                                            arrow
                                            placement="left"
                                        >
                                            <Typography sx={{ color: '#475569', fontSize: '0.7rem', ml: 'auto', cursor: 'default', '&:hover': { color: '#94a3b8' } }}>
                                                {act.moments.length} moment{act.moments.length !== 1 ? 's' : ''}
                                            </Typography>
                                        </Tooltip>
                                    </Box>
                                    {confirmed && (
                                        <TextField
                                            fullWidth
                                            size="small"
                                            value={entry?.notes ?? ''}
                                            onChange={(e) => setActivityNotes(act.id, act.name, e.target.value)}
                                            placeholder="Notes — e.g. Bride only, no groomsmen"
                                            sx={{ ml: 4, mt: 0.5, width: 'calc(100% - 32px)', '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.03)', color: '#94a3b8', fontSize: '0.78rem' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(16,185,129,0.15)' } }}
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
                const scheduleCurrency = (paymentSchedule as unknown as { currency?: string | null })?.currency || DEFAULT_CURRENCY;
                const amt = r.amount_type === 'PERCENT'
                    ? `${r.amount_value}%`
                    : formatCurrency(r.amount_value, scheduleCurrency);
                const trigger = TRIGGER_LABELS[r.trigger_type] ?? r.trigger_type;
                const days = r.trigger_days && r.trigger_days > 0 ? ` (${r.trigger_days} days ${r.trigger_type === 'BEFORE_EVENT' ? 'before' : 'after'})` : '';
                return `${r.label}: ${amt} ${trigger}${days}`;
            };

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
                        placeholder="Notes — e.g. prefers 3 instalments, wants to pay deposit after meeting..."
                        sx={{
                            '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.85rem', borderRadius: 2 },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(100,116,139,0.3)' },
                            '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.35)' },
                            '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6', borderWidth: 1.5 },
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
                    sx={{ width: 160, ...inputSx }}
                />
            );

        default:
            return (
                <TextField
                    fullWidth
                    size="small"
                    value={strVal}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Type your answer..."
                    sx={inputSx}
                />
            );
    }
}
