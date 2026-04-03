"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
    Box, Typography, Stack, Chip, TextField,
    CircularProgress, Select, MenuItem, Autocomplete,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    Videocam as FilmIcon,
    MarkEmailRead as MarkEmailReadIcon,
    Check as CheckIcon,
    Place as PlaceIcon,
    CalendarMonth as CalendarIcon,
    Groups as CrewIcon,
    Videocam as CameraIcon,
    Mic as AudioIcon,
    LocationOn as LocationIcon,
    Movie as MovieIcon,
} from '@mui/icons-material';
import { formatDate, formatAnswerValue } from '@/features/workflow/proposals/utils/portal/formatting';
import type { PortalDashboardColors } from '@/features/workflow/proposals/utils/portal/themes';
import { searchNominatim, type NominatimResult } from '@/features/workflow/locations/api/geocoding.api';
import { clientPortalApi, type PaymentScheduleOption } from '@/features/workflow/client-portal/api';
import { EVENT_CONFIGS, DEFAULT_CONFIG } from '@/features/workflow/inquiry-wizard/constants/wizard-config';

/* ── Types (local to section rendering) ──────────────────── */

interface AnswerItem { field_key: string; prompt: string; field_type: string; value: unknown; options?: unknown; readOnly?: boolean }
interface ReviewStep { key: string; label: string; description: string | null; answers: AnswerItem[] }
export interface InquiryReview { submission_id: number; template_name: string; submitted_at: string; steps: ReviewStep[] }

interface EstimateItem { id: number; description: string; quantity: string | number; unit_price: string | number; unit: string | null; category: string | null }
interface PaymentMilestone { id: number; label: string; amount: string | number; due_date: string; status: string; order_index: number }
export interface EstimateData {
    id: number; estimate_number: string; title: string | null; status: string;
    total_amount: string | number; tax_rate: string | number | null;
    issue_date: string; expiry_date: string; notes: string | null;
    deposit_required: string | number | null; payment_method: string | null;
    items: EstimateItem[]; payment_milestones: PaymentMilestone[];
}

interface ContractSigner { id: number; name: string; role: string; status: string; signed_at: string | null }
export interface ContractData {
    title: string; contract_status: string; signing_token: string | null;
    signed_date: string | null; sent_at: string | null; signers: ContractSigner[];
}

interface InvoiceItemData { id: number; description: string; quantity: string | number; unit_price: string | number; category: string | null }
interface InvoicePaymentData { id: number; amount: string | number; payment_date: string; payment_method: string | null }
interface InvoiceMilestoneData { id: number; label: string; due_date: string; amount: string | number; order_index: number }
export interface InvoiceData {
    id: number; invoice_number: string; status: string;
    title: string | null; subtotal: string | number | null;
    total_amount: string | number; amount_paid: string | number | null;
    tax_rate: string | number | null; currency: string | null;
    due_date: string | null; paid_date: string | null; issued_date: string | null;
    notes: string | null; terms: string | null; payment_method: string | null;
    milestone: InvoiceMilestoneData | null;
    items: InvoiceItemData[]; payments: InvoicePaymentData[];
}

export interface PackageData {
    id: number; name: string;
    currency: string | null; description: string | null;
    films: { id: number; name: string }[];
}

/* ── Questionnaire Section Content ───────────────────────── */

/* ── Structured layout definitions ───────────────────────── */

type FieldDef = [key: string, label: string];
interface SectionDef { label: string; rows: FieldDef[][] }

function buildQuestionnaireLayout(contactRole: string | undefined): SectionDef[] {
    const isOther = contactRole !== undefined && contactRole !== 'bride' && contactRole !== 'groom';

    return [
        {
            label: 'The Couple',
            rows: isOther ? [
                // Contact is planner/parent/friend — couple names collected separately
                [['bride_first_name', "Bride's First Name"], ['bride_last_name', "Bride's Last Name"]],
                [['groom_first_name', "Groom's First Name"], ['groom_last_name', "Groom's Last Name"]],
                [['bride2_first_name', "Partner's First Name"], ['bride2_last_name', "Partner's Last Name"]],
                [['groom2_first_name', "Partner's First Name"], ['groom2_last_name', "Partner's Last Name"]],
            ] : [
                // Contact IS bride/groom
                [['contact_role', 'Role'], ['contact_first_name', 'First Name'], ['contact_last_name', 'Last Name']],
                [['partner_role', "Partner's Role"], ['partner_first_name', "Partner's First Name"], ['partner_last_name', "Partner's Last Name"]],
            ],
        },
        {
            label: 'Your Wedding',
            rows: [
                [['event_type', 'Event Type'], ['wedding_date', 'Event Date'], ['guest_count', 'Guests']],
                [['wedding_date_approx', 'Approx. Date']],
                [['venue_address', 'Venue']],
            ],
        },
        {
            label: 'Budget & Package',
            twoColumn: true,
            left: [
                [['budget_range', 'Budget Range'], ['budget_flexible', 'Flexibility']],
                [['selected_package', 'Package']],
            ],
            right: '_payment_schedule',
            rows: [],
        },
        {
            label: 'Coverage',
            rows: [
                [['coverage_hours', 'Hours Needed'], ['deliverables', 'Deliverables'], ['add_ons', 'Add-ons']],
                [['builder_activities', 'Activities'], ['builder_films', 'Films']],
                [['operator_count', 'Operators'], ['camera_count', 'Cameras']],
            ],
        },
        {
            label: 'Preferences',
            rows: [
                [['decision_timeline', 'Decision Timeline'], ['booking_date', 'Target Booking Date']],
                [['stakeholders', 'Key Stakeholders'], ['preferred_contact_method', 'Preferred Contact']],
                [['preferred_contact_time', 'Best Time to Reach'], ['notes', 'Additional Notes']],
                [['special_requests', 'Special Requests']],
            ],
        },
        {
            label: isOther ? 'Your Contact' : 'Contact Details',
            rows: isOther ? [
                [['contact_role', 'Role'], ['contact_first_name', 'First Name'], ['contact_last_name', 'Last Name']],
                [['contact_email', 'Email'], ['contact_phone', 'Phone']],
            ] : [
                [['contact_email', 'Email'], ['contact_phone', 'Phone']],
            ],
        },
        {
            label: 'Discovery Call',
            rows: [
                [['discovery_call_date', 'Date'], ['discovery_call_time', 'Time'], ['discovery_call_method', 'Method']],
            ],
        },
    ];
}

/* Display-friendly formatting for raw values */
function formatDisplayValue(key: string, value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    const s = String(value);
    // Format couple_type: bride_groom → Bride & Groom
    if (key === 'couple_type') return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' & ');
    return s;
}

/* ── Shared field wrapper ─────────────────────────────────── */

function FieldShell({ label, colors, onClick, editing, children }: {
    label: string; colors: PortalDashboardColors; onClick?: () => void; editing?: boolean; children: React.ReactNode;
}) {
    return (
        <Box
            onClick={onClick}
            sx={{
                py: 1.5, px: 2, borderRadius: '12px',
                bgcolor: alpha(colors.card, 0.45),
                border: `1px solid ${alpha(colors.border, editing ? 0.5 : 0.2)}`,
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s',
                position: 'relative',
                minHeight: 58,
                ...(onClick && !editing ? {
                    '&:hover': { bgcolor: alpha(colors.card, 0.6), borderColor: alpha(colors.accent, 0.2) },
                } : {}),
            }}
        >
            <Typography sx={{
                color: alpha(colors.muted, 0.6), fontSize: '0.62rem', fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase', mb: 0.4,
            }}>
                {label}
            </Typography>
            {children}
        </Box>
    );
}

/* ── Date picker field (calendar) ────────────────────────── */

function DateField({ fieldKey, label, answer, colors, onSave }: {
    fieldKey: string; label: string; answer: AnswerItem | undefined; colors: PortalDashboardColors;
    onSave: (key: string, value: unknown) => Promise<void>;
}) {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const blurTimer = useRef<ReturnType<typeof setTimeout>>();

    if (!answer) return <Box />;

    const readOnly = !!answer.readOnly;
    const currentVal = typeof answer.value === 'string' ? answer.value : '';

    const startEdit = () => {
        setEditing(true);
        setTimeout(() => {
            try { inputRef.current?.showPicker?.(); } catch { /* some browsers block */ }
        }, 50);
    };

    const commitAndClose = async () => {
        const dateStr = inputRef.current?.value ?? '';
        if (dateStr && dateStr !== currentVal) {
            setSaving(true);
            try { await onSave(fieldKey, dateStr); } finally { setSaving(false); }
        }
        setEditing(false);
    };

    /* Delay blur so that clicking inside the native calendar popup
       (month arrows, year dropdown) doesn't close the picker. */
    const handleBlur = () => {
        clearTimeout(blurTimer.current);
        blurTimer.current = setTimeout(() => {
            // If focus moved outside our wrapper, commit
            if (!wrapRef.current?.contains(document.activeElement)) {
                commitAndClose();
            }
        }, 200);
    };

    const handleFocus = () => { clearTimeout(blurTimer.current); };

    const displayValue = currentVal
        ? formatDate(currentVal, { month: 'long', day: 'numeric', year: 'numeric' })
        : '—';

    return (
        <FieldShell label={label} colors={colors} editing={editing}
            onClick={!editing && !readOnly ? startEdit : undefined}
        >
            {editing ? (
                <div ref={wrapRef} onBlur={handleBlur} onFocus={handleFocus}>
                    <input
                        ref={inputRef}
                        type="date"
                        defaultValue={currentVal}
                        disabled={saving}
                        style={{
                            fontSize: '0.88rem', fontWeight: 500, color: colors.text,
                            background: 'transparent', border: 'none', outline: 'none',
                            width: '100%', colorScheme: 'dark',
                        }}
                    />
                </div>
            ) : (
                <Typography sx={{ color: colors.text, fontSize: '0.88rem', fontWeight: 500 }}>
                    {saving ? <CircularProgress size={14} /> : displayValue}
                </Typography>
            )}
        </FieldShell>
    );
}

/* ── Guest count dropdown field ──────────────────────────── */

function GuestCountField({ answer, colors, onSave, eventType }: {
    answer: AnswerItem | undefined; colors: PortalDashboardColors;
    onSave: (key: string, value: unknown) => Promise<void>;
    eventType: string | undefined;
}) {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    if (!answer) return <Box />;

    const readOnly = !!answer.readOnly;
    const currentVal = String(answer.value ?? '');

    const eventKey = (eventType ?? '').toLowerCase();
    const config = EVENT_CONFIGS[eventKey] ?? DEFAULT_CONFIG;
    const options = config.guestsOptions.map((o) => o.value);

    const save = async (val: string) => {
        if (val !== currentVal) {
            setSaving(true);
            try { await onSave('guest_count', val); } finally { setSaving(false); }
        }
        setEditing(false);
    };

    return (
        <FieldShell label="Guests" colors={colors} editing={editing}
            onClick={!editing && !readOnly ? () => setEditing(true) : undefined}
        >
            {editing ? (
                <Select
                    size="small" fullWidth autoFocus open
                    value={currentVal}
                    disabled={saving}
                    onClose={() => setEditing(false)}
                    onChange={(e) => save(e.target.value)}
                    variant="standard"
                    disableUnderline
                    sx={{
                        fontSize: '0.88rem', fontWeight: 500, color: colors.text,
                        '& .MuiSelect-select': { py: 0, px: 0 },
                    }}
                >
                    {options.map((opt) => (
                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                </Select>
            ) : (
                <Typography sx={{ color: colors.text, fontSize: '0.88rem', fontWeight: 500 }}>
                    {currentVal || '—'}
                </Typography>
            )}
        </FieldShell>
    );
}

/* ── Venue address search field (Nominatim) ──────────────── */

function VenueAddressField({ answer, colors, onSave }: {
    answer: AnswerItem | undefined; colors: PortalDashboardColors;
    onSave: (key: string, value: unknown) => Promise<void>;
}) {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [inputVal, setInputVal] = useState('');
    const [options, setOptions] = useState<NominatimResult[]>([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    if (!answer) return <Box />;

    const readOnly = !!answer.readOnly;
    const currentVal = String(answer.value ?? '');

    /* Extract short venue name from a long display_name */
    const shortName = currentVal ? currentVal.split(',')[0].trim() : '';
    const restAddress = currentVal ? currentVal.split(',').slice(1).join(',').trim() : '';

    const doSearch = useCallback((query: string) => {
        clearTimeout(debounceRef.current);
        if (query.length < 3) { setOptions([]); return; }
        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            const results = await searchNominatim(query);
            setOptions(results);
            setLoading(false);
        }, 500);
    }, []);

    const handleSelect = async (_: unknown, result: NominatimResult | null) => {
        if (!result || typeof result === 'string') return;
        setSaving(true);
        try {
            await onSave('venue_address', result.display_name);
            await onSave('venue_name', result.name || result.display_name.split(',')[0]);
        } finally { setSaving(false); setEditing(false); }
    };

    const cancel = () => {
        setEditing(false);
        setInputVal('');
        setOptions([]);
    };

    return (
        <FieldShell label="Venue" colors={colors} editing={editing}
            onClick={!editing && !readOnly ? () => { setEditing(true); setInputVal(''); setOptions([]); } : undefined}
        >
            {editing ? (
                <Autocomplete
                    options={options}
                    getOptionLabel={(o) => typeof o === 'string' ? o : o.display_name}
                    inputValue={inputVal}
                    onInputChange={(_, v, reason) => { if (reason === 'input') { setInputVal(v); doSearch(v); } }}
                    onChange={handleSelect}
                    loading={loading}
                    onBlur={cancel}
                    size="small"
                    open={options.length > 0}
                    noOptionsText="Type to search…"
                    renderOption={(props, option) => (
                        <li {...props} key={option.place_id}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                <PlaceIcon sx={{ fontSize: 16, mt: 0.3, color: alpha(colors.accent, 0.6), flexShrink: 0 }} />
                                <Box>
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                        {option.name || option.display_name.split(',')[0]}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.7rem', color: '#999' }}>
                                        {option.display_name.split(',').slice(1).join(',').trim()}
                                    </Typography>
                                </Box>
                            </Box>
                        </li>
                    )}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            autoFocus
                            variant="standard"
                            placeholder="Search for a venue…"
                            InputProps={{
                                ...params.InputProps,
                                disableUnderline: true,
                                endAdornment: (
                                    <>
                                        {(loading || saving) && <CircularProgress size={14} />}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                            sx={{
                                '& .MuiInput-input': {
                                    fontSize: '0.88rem', fontWeight: 500, color: colors.text,
                                    py: 0, px: 0,
                                },
                            }}
                        />
                    )}
                />
            ) : (
                currentVal ? (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <PlaceIcon sx={{ fontSize: 16, mt: 0.2, color: alpha(colors.accent, 0.5), flexShrink: 0 }} />
                        <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ color: colors.text, fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.3 }}>
                                {shortName}
                            </Typography>
                            {restAddress && (
                                <Typography sx={{
                                    color: alpha(colors.muted, 0.6), fontSize: '0.72rem', lineHeight: 1.4,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {restAddress}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                ) : (
                    <Typography sx={{ color: alpha(colors.muted, 0.5), fontSize: '0.85rem', fontStyle: 'italic' }}>
                        No venue selected
                    </Typography>
                )
            )}
        </FieldShell>
    );
}

/* ── Payment schedule dropdown field ─────────────────────── */

function PaymentScheduleField({ colors, onSave, portalToken, paymentSchedule }: {
    colors: PortalDashboardColors;
    onSave: (key: string, value: unknown) => Promise<void>;
    portalToken: string;
    paymentSchedule: { id: number; name: string; rules: { label: string; amount_type: string; amount_value: number }[] } | null;
}) {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [options, setOptions] = useState<PaymentScheduleOption[]>([]);
    const [loadingOpts, setLoadingOpts] = useState(false);

    const openDropdown = async () => {
        setEditing(true);
        if (options.length === 0) {
            setLoadingOpts(true);
            try {
                const opts = await clientPortalApi.getPaymentScheduleOptions(portalToken);
                setOptions(opts);
            } catch { /* silent */ }
            finally { setLoadingOpts(false); }
        }
    };

    const save = async (templateId: number) => {
        if (templateId !== paymentSchedule?.id) {
            setSaving(true);
            try { await onSave('payment_schedule_template_id', templateId); } finally { setSaving(false); }
        }
        setEditing(false);
    };

    const fmtAmount = (r: { amount_type: string; amount_value: number }) =>
        r.amount_type === 'PERCENT' ? `${r.amount_value}%` : `£${r.amount_value}`;

    return (
        <FieldShell label="Payment Schedule" colors={colors} editing={editing}
            onClick={!editing ? openDropdown : undefined}
        >
            {editing ? (
                loadingOpts ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                        <CircularProgress size={14} />
                        <Typography sx={{ fontSize: '0.82rem', color: colors.muted }}>Loading options…</Typography>
                    </Box>
                ) : (
                    <Select
                        size="small" fullWidth autoFocus open
                        value={paymentSchedule?.id ?? ''}
                        disabled={saving}
                        onClose={() => setEditing(false)}
                        onChange={(e) => save(Number(e.target.value))}
                        variant="standard"
                        disableUnderline
                        sx={{
                            fontSize: '0.88rem', fontWeight: 500, color: colors.text,
                            '& .MuiSelect-select': { py: 0, px: 0 },
                        }}
                    >
                        {options.map((opt) => (
                            <MenuItem key={opt.id} value={opt.id}>
                                <Box>
                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{opt.name}</Typography>
                                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 0.25 }}>
                                        {opt.rules.map((r, i) => (
                                            <Typography key={i} sx={{ fontSize: '0.7rem', color: '#999' }}>
                                                {r.label} {fmtAmount(r)}{i < opt.rules.length - 1 ? ' ·' : ''}
                                            </Typography>
                                        ))}
                                    </Box>
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                )
            ) : paymentSchedule ? (
                <Box>
                    <Typography sx={{ color: colors.text, fontSize: '0.88rem', fontWeight: 600, mb: 1 }}>
                        {paymentSchedule.name}
                    </Typography>
                    <Stack spacing={0}>
                        {paymentSchedule.rules.map((r, i) => (
                            <Box key={i} sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                py: 0.75,
                                borderBottom: i < paymentSchedule.rules.length - 1 ? `1px solid ${alpha(colors.muted, 0.1)}` : 'none',
                            }}>
                                <Typography sx={{ color: alpha(colors.muted, 0.7), fontSize: '0.8rem' }}>
                                    {r.label}
                                </Typography>
                                <Typography sx={{ color: colors.text, fontSize: '0.8rem', fontWeight: 600 }}>
                                    {fmtAmount(r)}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                </Box>
            ) : (
                <Typography sx={{ color: alpha(colors.muted, 0.5), fontSize: '0.85rem', fontStyle: 'italic' }}>
                    No payment schedule selected
                </Typography>
            )}
        </FieldShell>
    );
}

/* ── Inline-editable field cell ──────────────────────────── */

function InlineField({ fieldKey, label, answer, colors, onSave }: {
    fieldKey: string;
    label: string;
    answer: AnswerItem | undefined;
    colors: PortalDashboardColors;
    onSave: (key: string, value: unknown) => Promise<void>;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);

    if (!answer) return <Box />;

    const readOnly = !!answer.readOnly;
    const displayValue = formatDisplayValue(fieldKey, answer.value);

    const startEdit = () => {
        if (readOnly) return;
        setDraft(typeof answer.value === 'string' ? answer.value : String(answer.value ?? ''));
        setEditing(true);
    };

    const save = async () => {
        const trimmed = draft.trim();
        if (trimmed !== String(answer.value ?? '')) {
            setSaving(true);
            try { await onSave(fieldKey, trimmed); } finally { setSaving(false); }
        }
        setEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
        if (e.key === 'Escape') setEditing(false);
    };

    return (
        <Box
            onClick={() => !editing && startEdit()}
            sx={{
                py: 1.5, px: 2, borderRadius: '12px',
                bgcolor: alpha(colors.card, 0.45),
                border: `1px solid ${alpha(colors.border, editing ? 0.5 : 0.2)}`,
                cursor: readOnly ? 'default' : 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                minHeight: 58,
                ...(!readOnly && !editing ? {
                    '&:hover': {
                        bgcolor: alpha(colors.card, 0.6),
                        borderColor: alpha(colors.accent, 0.2),
                    },
                } : {}),
            }}
        >
            <Typography sx={{
                color: alpha(colors.muted, 0.6), fontSize: '0.62rem', fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase', mb: 0.4,
            }}>
                {label}
            </Typography>

            {editing ? (
                <TextField size="small" fullWidth autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={save}
                    onKeyDown={handleKeyDown}
                    disabled={saving}
                    variant="standard"
                    InputProps={{
                        disableUnderline: true,
                        endAdornment: saving ? <CircularProgress size={14} /> : (
                            <CheckIcon sx={{ fontSize: 14, color: colors.green, opacity: 0.6 }} />
                        ),
                    }}
                    sx={{
                        '& .MuiInput-input': {
                            fontSize: '0.88rem', fontWeight: 500, color: colors.text,
                            py: 0, px: 0,
                        },
                    }}
                />
            ) : (
                fieldKey === 'selected_package' && typeof answer.value === 'string' && answer.value.includes('\n') ? (
                    (() => {
                        const lines = answer.value.split('\n');
                        const descLines = lines.filter((l, i) => i > 0 && !l.startsWith('STAT:'));
                        const statLines = lines.filter(l => l.startsWith('STAT:')).map(l => {
                            const [, label, val] = l.split(':');
                            return { label, value: val };
                        });
                        const statMeta: Record<string, { icon: React.ReactNode; color: string }> = {
                            'Event Days': { icon: <CalendarIcon sx={{ fontSize: 16 }} />, color: '#f59e0b' },
                            'Crew': { icon: <CrewIcon sx={{ fontSize: 16 }} />, color: '#3b82f6' },
                            'Cameras': { icon: <CameraIcon sx={{ fontSize: 16 }} />, color: '#10b981' },
                            'Audio': { icon: <AudioIcon sx={{ fontSize: 16 }} />, color: '#8b5cf6' },
                            'Locations': { icon: <LocationIcon sx={{ fontSize: 16 }} />, color: '#ef4444' },
                            'Films': { icon: <MovieIcon sx={{ fontSize: 16 }} />, color: '#f59e0b' },
                        };
                        return (
                            <Box>
                                <Typography sx={{ color: colors.text, fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.5 }}>
                                    {lines[0]}
                                </Typography>
                                {descLines.length > 0 && (
                                    <Typography sx={{ color: alpha(colors.muted, 0.7), fontSize: '0.76rem', lineHeight: 1.5 }}>
                                        {descLines.join(' ')}
                                    </Typography>
                                )}
                                {statLines.length > 0 && (
                                    <Stack spacing={0} sx={{ mt: 1 }}>
                                        {statLines.map((s, i) => {
                                            const meta = statMeta[s.label] ?? { icon: null, color: colors.muted };
                                            return (
                                                <Box key={i} sx={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    py: 0.75, borderBottom: i < statLines.length - 1 ? `1px solid ${alpha(colors.muted, 0.1)}` : 'none',
                                                }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                                        <Box sx={{ color: meta.color, display: 'flex' }}>{meta.icon}</Box>
                                                        <Typography sx={{ color: colors.text, fontSize: '0.8rem', fontWeight: 500 }}>
                                                            {s.label}
                                                        </Typography>
                                                    </Box>
                                                    <Typography sx={{ color: colors.text, fontSize: '0.8rem', fontWeight: 600 }}>
                                                        {s.value}
                                                    </Typography>
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                )}
                            </Box>
                        );
                    })()
                ) : (
                    <Typography sx={{
                        color: colors.text, fontSize: '0.88rem', fontWeight: 500,
                        lineHeight: 1.5, wordBreak: 'break-word',
                    }}>
                        {displayValue}
                    </Typography>
                )
            )}
        </Box>
    );
}

/* ── Main questionnaire content ──────────────────────────── */

export function QuestionnaireContent({
    data, colors, onFieldSave, portalToken, paymentSchedule,
}: {
    data: InquiryReview; colors: PortalDashboardColors;
    onFieldSave: (fieldKey: string, value: unknown) => Promise<void>;
    portalToken: string;
    paymentSchedule?: { id: number; name: string; rules: { label: string; amount_type: string; amount_value: number }[] } | null;
}) {
    /* Flatten all answers into a lookup map */
    const fieldMap = useMemo(() => {
        const map = new Map<string, AnswerItem>();
        for (const step of data.steps) {
            for (const answer of step.answers) {
                map.set(answer.field_key, answer);
            }
        }
        return map;
    }, [data]);

    /* Resolve event type for guest count options */
    const eventType = useMemo(() => {
        const et = fieldMap.get('event_type');
        return et ? String(et.value ?? '') : undefined;
    }, [fieldMap]);

    /* Specialized field keys that get custom rendering */
    const SPECIALIZED_KEYS = new Set(['wedding_date', 'guest_count', 'venue_address', '_payment_schedule']);

    const renderField = (key: string, label: string) => {
        if (key === 'wedding_date') {
            return <DateField key={key} fieldKey={key} label={label} answer={fieldMap.get(key)} colors={colors} onSave={onFieldSave} />;
        }
        if (key === 'guest_count') {
            return <GuestCountField key={key} answer={fieldMap.get(key)} colors={colors} onSave={onFieldSave} eventType={eventType} />;
        }
        if (key === 'venue_address') {
            return <VenueAddressField key={key} answer={fieldMap.get(key)} colors={colors} onSave={onFieldSave} />;
        }
        if (key === '_payment_schedule') {
            return <PaymentScheduleField key={key} colors={colors} onSave={onFieldSave} portalToken={portalToken} paymentSchedule={paymentSchedule ?? null} />;
        }
        return (
            <InlineField key={key} fieldKey={key} label={label} answer={fieldMap.get(key)} colors={colors} onSave={onFieldSave} />
        );
    };

    const contactRole = fieldMap.get('contact_role')?.value as string | undefined;
    const layout = useMemo(() => buildQuestionnaireLayout(contactRole), [contactRole]);

    return (
        <Stack spacing={4}>
            {layout.map((section, sIdx) => {
                const sectionAny = section as any;

                /* Check if section has data */
                const allKeys = [
                    ...section.rows.flat().map(([key]) => key),
                    ...(sectionAny.left ?? []).flat().map(([key]: string[]) => key),
                    ...(sectionAny.right ? [sectionAny.right] : []),
                ];
                const hasData = allKeys.some((key: string) => key.startsWith('_') || fieldMap.has(key));
                if (!hasData) return null;

                return (
                    <Box key={section.label}>
                        {sIdx > 0 && (
                            <Box sx={{ height: '1px', bgcolor: alpha(colors.border, 0.25), mb: 3 }} />
                        )}
                        <Typography sx={{
                            color: colors.accent, fontSize: '0.66rem', fontWeight: 700,
                            letterSpacing: '0.12em', textTransform: 'uppercase', mb: 2,
                        }}>
                            {section.label}
                        </Typography>

                        {sectionAny.twoColumn ? (
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                gap: 1.5,
                                alignItems: 'start',
                            }}>
                                {/* Left column: stacked rows */}
                                <Stack spacing={1.5}>
                                    {(sectionAny.left as string[][][]).map((row: string[][], rIdx: number) => {
                                        const visible = row.filter(([key]) => key.startsWith('_') || fieldMap.has(key));
                                        if (!visible.length) return null;
                                        return (
                                            <Box key={rIdx} sx={{
                                                display: 'grid',
                                                gridTemplateColumns: { xs: '1fr', sm: `repeat(${row.length}, 1fr)` },
                                                gap: 1.5,
                                            }}>
                                                {row.map(([key, label]) => renderField(key, label))}
                                            </Box>
                                        );
                                    })}
                                </Stack>
                                {/* Right column: single field spanning full height */}
                                {renderField(sectionAny.right, '')}
                            </Box>
                        ) : (
                        <Stack spacing={1.5}>
                            {section.rows.map((row, rIdx) => {
                                const visible = row.filter(([key]) => key.startsWith('_') || fieldMap.has(key));
                                if (!visible.length) return null;
                                const hasRoleFirst = row[0]?.[0]?.includes('_role');
                                return (
                                    <Box key={rIdx} sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', sm: hasRoleFirst ? '0.6fr 1fr 1fr' : `repeat(${row.length}, 1fr)` },
                                        gap: 1.5,
                                    }}>
                                        {row.map(([key, label]) => renderField(key, label))}
                                    </Box>
                                );
                            })}
                        </Stack>
                        )}
                    </Box>
                );
            })}
        </Stack>
    );
}

/* ── Package Section Content ─────────────────────────────── */

export function PackageContent({ data, colors }: { data: PackageData; colors: PortalDashboardColors }) {
    return (
        <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2.5 }}>
            {data.description && (
                <Typography sx={{ color: colors.muted, fontSize: '0.85rem', lineHeight: 1.7, mb: 2.5 }}>
                    {data.description}
                </Typography>
            )}
            {data.films.length > 0 && (
                <Box>
                    <Typography sx={{ color: alpha(colors.muted, 0.6), fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1 }}>
                        Included Films
                    </Typography>
                    <Stack spacing={0.75}>
                        {data.films.map((film) => (
                            <Box key={film.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75, px: 1.5, borderRadius: '10px', bgcolor: alpha('#f59e0b', 0.06), border: `1px solid ${alpha('#f59e0b', 0.12)}` }}>
                                <FilmIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                                <Typography sx={{ color: colors.text, fontSize: '0.82rem', fontWeight: 500 }}>{film.name}</Typography>
                            </Box>
                        ))}
                    </Stack>
                </Box>
            )}
        </Box>
    );
}

/* ── Contract Section Content ────────────────────────────── */

export function ContractContent({ data, colors }: { data: ContractData; colors: PortalDashboardColors }) {
    return (
        <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2.5 }}>
            {data.signers.length > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Typography sx={{ color: alpha(colors.muted, 0.6), fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1 }}>
                        Signers
                    </Typography>
                    <Stack spacing={0.75}>
                        {data.signers.map((signer) => (
                            <Box key={signer.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1, borderRadius: '10px', bgcolor: alpha(colors.card, 0.5), border: `1px solid ${alpha(colors.border, 0.3)}` }}>
                                <Box>
                                    <Typography sx={{ color: colors.text, fontSize: '0.82rem', fontWeight: 500 }}>{signer.name}</Typography>
                                    <Typography sx={{ color: colors.muted, fontSize: '0.68rem', textTransform: 'capitalize' }}>{signer.role}</Typography>
                                </Box>
                                <Chip label={signer.status === 'signed' ? 'Signed' : 'Pending'} size="small"
                                    sx={{
                                        height: 20, fontSize: '0.6rem', fontWeight: 700,
                                        bgcolor: signer.status === 'signed' ? alpha(colors.green, 0.12) : alpha('#f59e0b', 0.12),
                                        color: signer.status === 'signed' ? colors.green : '#f59e0b',
                                        '& .MuiChip-label': { px: 0.75 },
                                    }}
                                />
                            </Box>
                        ))}
                    </Stack>
                </Box>
            )}
        </Box>
    );
}

/* ── Welcome Pack Section Content ────────────────────────── */

export function WelcomePackContent({ sentAt, colors }: { sentAt: string; colors: PortalDashboardColors }) {
    return (
        <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '12px', bgcolor: alpha('#10b981', 0.06), border: `1px solid ${alpha('#10b981', 0.15)}`, mb: 2 }}>
                <MarkEmailReadIcon sx={{ fontSize: 32, color: '#10b981', flexShrink: 0 }} />
                <Box>
                    <Typography sx={{ color: colors.text, fontWeight: 700, fontSize: '0.95rem', mb: 0.25 }}>
                        You&apos;re all booked! 🎉
                    </Typography>
                    <Typography sx={{ color: colors.muted, fontSize: '0.82rem', lineHeight: 1.5 }}>
                        Your welcome pack has been sent. We&apos;re so excited to work with you!
                    </Typography>
                </Box>
            </Box>
            <Typography sx={{ color: alpha(colors.muted, 0.7), fontSize: '0.68rem', textAlign: 'right' }}>
                Welcome pack sent on {formatDate(sentAt, { month: 'long', day: 'numeric', year: 'numeric' })}
            </Typography>
        </Box>
    );
}
