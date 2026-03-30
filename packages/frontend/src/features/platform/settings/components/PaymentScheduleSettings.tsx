"use client";

import React from "react";
import {
    Box,
    Typography,
    Button,
    CircularProgress,
    Stack,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Snackbar,
    InputAdornment,
    IconButton,
    Tooltip,
    Divider,
    Chip,
    TextField,
    ListSubheader,
    Alert,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Payments as PaymentsIcon,
    Schedule as ScheduleIcon,
    Group as GroupIcon,
    CreditCard as CreditCardIcon,
    ReceiptLong as ReceiptLongIcon,
    Gavel as ContractsIcon,
    StarBorder as StarBorderIcon,
    Calculate as CalcIcon,
} from "@mui/icons-material";
import {
    useCrewPaymentTemplates,
    useCreateCrewPaymentTemplate,
    useUpdateCrewPaymentTemplate,
    useDeleteCrewPaymentTemplate,
} from "@/features/finance/crew-payment-templates";
import type { CrewPaymentTemplate, CrewPaymentTriggerType, CrewPaymentRoleType, CrewPaymentTerms, CrewPaymentFrequency } from "@/features/finance/crew-payment-templates";
import { brandsApi } from "@/features/platform/brand/api";
import { taskLibraryApi } from "@/features/catalog/task-library/api";
import { paymentSchedulesApi } from "@/features/finance/payment-schedules";
import type { PaymentScheduleTemplate, PaymentScheduleRule, PaymentAmountType, PaymentTriggerType } from "@/features/finance/payment-schedules/types";
import type { TaskLibrary } from "@/features/catalog/task-library/types";
import { useBrand } from "@/features/platform/brand";
import { useBrandFinanceSettings, useUpsertBrandFinanceSettings } from "@/features/finance/brand-finance-settings/hooks";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RuleForm = Omit<PaymentScheduleRule, 'id' | 'template_id'>;

type CrewRuleForm = {
    label: string;
    amount_type: PaymentAmountType;
    amount_value: number;
    trigger_type: CrewPaymentTriggerType;
    trigger_days: number;
    task_library_id: number | null;
    frequency: CrewPaymentFrequency | null;
    order_index: number;
};

type CrewPreset = {
    key: string;
    name: string;
    description: string;
    rules: Omit<CrewRuleForm, 'order_index'>[];
};

type CrewDialogStep = 'preset' | 'editor';
type ProjectMode = 'milestone' | 'recurring' | 'simple';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function autoRuleLabel(rule: RuleForm): string {
    switch (rule.trigger_type) {
        case 'AFTER_BOOKING':
            return rule.trigger_days === 0 ? 'Booking Deposit' : `Deposit (${rule.trigger_days} days after booking)`;
        case 'BEFORE_EVENT':
            if (rule.trigger_days === 0) return 'Final Balance';
            return `Final Balance (${rule.trigger_days} days before)`;
        case 'AFTER_EVENT':
            return 'Post-Event Balance';
        default:
            return 'Payment';
    }
}

function autoTemplateName(rules: RuleForm[]): string {
    if (rules.length === 0) return '';
    if (rules.every(r => r.amount_type === 'PERCENT')) {
        const pcts = rules.map(r => Number(r.amount_value));
        if (pcts.length === 1 && pcts[0] === 100) return 'Full Upfront';
        if (pcts.length === 2 && pcts[0] === 50 && pcts[1] === 50) return '50/50 Split';
        if (pcts.length === 2 && pcts[0] === 25 && pcts[1] === 75) return '25/75 Split';
        if (pcts.length === 2 && pcts[0] === 30 && pcts[1] === 70) return '30/70 Split';
        if (pcts.length <= 5) return pcts.join('/') + ' Split';
    }
    return rules.map(r => `${r.amount_value}%`).join(' + ') + ' Schedule';
}

const EMPTY_RULE = (): RuleForm => ({
    label: 'Booking Deposit',
    amount_type: 'PERCENT',
    amount_value: 0,
    trigger_type: 'AFTER_BOOKING',
    trigger_days: 0,
    order_index: 0,
});

const MILESTONE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

function autoCrewRuleLabel(rule: CrewRuleForm): string {
    switch (rule.trigger_type) {
        case 'ON_BOOKING': return 'Booking Payment';
        case 'ON_SHOOT_DAY': return 'Shoot Day Payment';
        case 'ON_COMPLETION': return 'On Completion';
        case 'AFTER_DELIVERY': return rule.trigger_days === 0 ? 'On Delivery' : `Post-Delivery (${rule.trigger_days}d)`;
        case 'BEFORE_EVENT': return rule.trigger_days ? `${rule.trigger_days}d Before Event` : 'Before Event';
        case 'AFTER_EVENT': return rule.trigger_days ? `${rule.trigger_days}d After Event` : 'After Event';
        case 'ON_FIRST_EDIT': return 'First Edit Begins';
        case 'AFTER_ROUGH_CUT': return rule.trigger_days ? `${rule.trigger_days}d After Rough Cut` : 'After Rough Cut';
        case 'NET_DAYS': return rule.trigger_days ? `Net ${rule.trigger_days}` : 'Net Days';
        case 'ON_TASK_COMPLETE': return 'Task Milestone';
        case 'RECURRING':
            return rule.frequency === 'WEEKLY' ? 'Weekly Payment' : rule.frequency === 'FORTNIGHTLY' ? 'Fortnightly Payment' : 'Monthly Payment';
        default: return 'Payment';
    }
}

function autoCrewTemplateName(rules: CrewRuleForm[], roleType: CrewPaymentRoleType): string {
    const prefix = roleType === 'on_site' ? 'On-Location' : 'Project';
    if (rules.length === 0) return prefix;
    if (rules.some(r => r.trigger_type === 'RECURRING')) {
        const freq = rules.find(r => r.trigger_type === 'RECURRING')?.frequency;
        return `${prefix} — ${freq === 'WEEKLY' ? 'Weekly' : freq === 'FORTNIGHTLY' ? 'Fortnightly' : 'Monthly'}`;
    }
    if (rules.some(r => r.trigger_type === 'ON_TASK_COMPLETE')) return `${prefix} — Milestone-Based`;
    if (rules.every(r => r.amount_type === 'PERCENT')) {
        const pcts = rules.map(r => Number(r.amount_value));
        if (pcts.length === 1 && pcts[0] === 100) return `${prefix} — Full Upfront`;
        if (pcts.length === 2 && pcts[0] === 50 && pcts[1] === 50) return `${prefix} — 50/50`;
        if (pcts.length <= 5) return `${prefix} — ${pcts.join('/')}`;
    }
    return `${prefix} Schedule`;
}

const EMPTY_CREW_RULE = (roleType: CrewPaymentRoleType): CrewRuleForm => ({
    label: roleType === 'on_site' ? 'Booking Payment' : 'On Completion',
    amount_type: 'PERCENT',
    amount_value: 0,
    trigger_type: roleType === 'on_site' ? 'ON_BOOKING' : 'ON_COMPLETION',
    trigger_days: 0,
    task_library_id: null,
    frequency: null,
    order_index: 0,
});

const PAYMENT_TERMS_OPTIONS: { value: CrewPaymentTerms; label: string }[] = [
    { value: 'DUE_ON_RECEIPT', label: 'Due on receipt' },
    { value: 'NET_7', label: 'Net 7 — 7 days' },
    { value: 'NET_14', label: 'Net 14 — 14 days' },
    { value: 'NET_30', label: 'Net 30 — 30 days' },
    { value: 'NET_60', label: 'Net 60 — 60 days' },
];

const ON_SITE_PRESETS: CrewPreset[] = [
    {
        key: 'single', name: 'Single Payment', description: '100% on shoot day',
        rules: [{ label: 'Shoot Day Payment', amount_type: 'PERCENT', amount_value: 100, trigger_type: 'ON_SHOOT_DAY', trigger_days: 0, task_library_id: null, frequency: null }],
    },
    {
        key: '50_50', name: '50/50 Split', description: '50% on booking, 50% on shoot day',
        rules: [
            { label: 'Booking Payment', amount_type: 'PERCENT', amount_value: 50, trigger_type: 'ON_BOOKING', trigger_days: 0, task_library_id: null, frequency: null },
            { label: 'Shoot Day Payment', amount_type: 'PERCENT', amount_value: 50, trigger_type: 'ON_SHOOT_DAY', trigger_days: 0, task_library_id: null, frequency: null },
        ],
    },
    {
        key: 'deposit_balance', name: 'Deposit + Balance', description: '25% on booking, 75% on shoot day',
        rules: [
            { label: 'Booking Deposit', amount_type: 'PERCENT', amount_value: 25, trigger_type: 'ON_BOOKING', trigger_days: 0, task_library_id: null, frequency: null },
            { label: 'Balance Payment', amount_type: 'PERCENT', amount_value: 75, trigger_type: 'ON_SHOOT_DAY', trigger_days: 0, task_library_id: null, frequency: null },
        ],
    },
    {
        key: '3_stage', name: '3-Stage', description: '30% booking, 40% shoot, 30% delivery',
        rules: [
            { label: 'Booking Deposit', amount_type: 'PERCENT', amount_value: 30, trigger_type: 'ON_BOOKING', trigger_days: 0, task_library_id: null, frequency: null },
            { label: 'Shoot Day Payment', amount_type: 'PERCENT', amount_value: 40, trigger_type: 'ON_SHOOT_DAY', trigger_days: 0, task_library_id: null, frequency: null },
            { label: 'Final Payment', amount_type: 'PERCENT', amount_value: 30, trigger_type: 'AFTER_DELIVERY', trigger_days: 0, task_library_id: null, frequency: null },
        ],
    },
];

const SIMPLE_SPLIT_PRESETS: CrewPreset[] = [
    {
        key: 'full_completion', name: 'On Completion', description: '100% on completion',
        rules: [{ label: 'On Completion', amount_type: 'PERCENT', amount_value: 100, trigger_type: 'ON_COMPLETION', trigger_days: 0, task_library_id: null, frequency: null }],
    },
    {
        key: 'start_delivery', name: 'Start + Delivery', description: '50% on booking, 50% after delivery',
        rules: [
            { label: 'Booking Payment', amount_type: 'PERCENT', amount_value: 50, trigger_type: 'ON_BOOKING', trigger_days: 0, task_library_id: null, frequency: null },
            { label: 'Delivery Payment', amount_type: 'PERCENT', amount_value: 50, trigger_type: 'AFTER_DELIVERY', trigger_days: 0, task_library_id: null, frequency: null },
        ],
    },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PaymentScheduleSettings() {
    const { currentBrand, refreshBrands } = useBrand();

    // ── Brand payment/tax settings ───────────────────────────────────────────
    const [paymentSettings, setPaymentSettings] = React.useState({
        default_tax_rate: 0 as number,
        tax_number: '',
        default_payment_method: 'Bank Transfer',
        payment_terms_days: 30 as number,
        bank_name: '',
        bank_account_name: '',
        bank_sort_code: '',
        bank_account_number: '',
        late_fee_percent: 2 as number,
        cancellation_tier1_days: 90 as number,
        cancellation_tier2_days: 30 as number,
        cancellation_tier1_percent: 50 as number,
        crew_payment_terms: '50% on booking confirmation, 50% within 7 days of delivery',
        crew_response_deadline_days: 5 as number,
        inquiry_validity_days: 14 as number,
    });
    const [originalPaymentSettings, setOriginalPaymentSettings] = React.useState(paymentSettings);
    const [savingSettings, setSavingSettings] = React.useState(false);
    const paymentSettingsChanged = JSON.stringify(paymentSettings) !== JSON.stringify(originalPaymentSettings);

    const loadPaymentSettings = React.useCallback(async () => {
        if (!currentBrand?.id) return;
        try {
            const b = await brandsApi.getById(currentBrand.id);
            const vals = {
                default_tax_rate: b.default_tax_rate ?? 0,
                tax_number: b.tax_number || '',
                default_payment_method: b.default_payment_method || 'Bank Transfer',
                payment_terms_days: b.payment_terms_days ?? 30,
                bank_name: b.bank_name || '',
                bank_account_name: b.bank_account_name || '',
                bank_sort_code: b.bank_sort_code || '',
                bank_account_number: b.bank_account_number || '',
                late_fee_percent: b.late_fee_percent ?? 2,
                cancellation_tier1_days: b.cancellation_tier1_days ?? 90,
                cancellation_tier2_days: b.cancellation_tier2_days ?? 30,
                cancellation_tier1_percent: b.cancellation_tier1_percent ?? 50,
                crew_payment_terms: b.crew_payment_terms || '50% on booking confirmation, 50% within 7 days of delivery',
                crew_response_deadline_days: b.crew_response_deadline_days ?? 5,
                inquiry_validity_days: b.inquiry_validity_days ?? 14,
            };
            setPaymentSettings(vals);
            setOriginalPaymentSettings(vals);
        } catch { /* ignore */ }
    }, [currentBrand?.id]);

    React.useEffect(() => { loadPaymentSettings(); }, [loadPaymentSettings]);

    const handleSaveSettings = async () => {
        if (!currentBrand?.id) return;
        setSavingSettings(true);
        try {
            await brandsApi.update(currentBrand.id, paymentSettings);
            setOriginalPaymentSettings({ ...paymentSettings });
            await refreshBrands();
            setSnack('Payment settings saved');
        } catch { setSnack('Failed to save settings'); }
        finally { setSavingSettings(false); }
    };

    const handleDiscardSettings = () => setPaymentSettings({ ...originalPaymentSettings });

    // ── On-site billing thresholds ───────────────────────────────────────────
    const { data: financeSettings } = useBrandFinanceSettings();
    const upsertFinanceSettings = useUpsertBrandFinanceSettings();
    const [halfDayMax, setHalfDayMax] = React.useState<number>(6);
    const [fullDayMax, setFullDayMax] = React.useState<number>(12);
    const [onsiteSaved, setOnsiteSaved] = React.useState(false);

    React.useEffect(() => {
        if (financeSettings) {
            setHalfDayMax(financeSettings.onsite_half_day_max_hours);
            setFullDayMax(financeSettings.onsite_full_day_max_hours);
        }
    }, [financeSettings]);

    const handleSaveOnsite = () => {
        upsertFinanceSettings.mutate(
            { onsite_half_day_max_hours: halfDayMax, onsite_full_day_max_hours: fullDayMax },
            { onSuccess: () => { setOnsiteSaved(true); setTimeout(() => setOnsiteSaved(false), 3000); } }
        );
    };

    // ── Payment schedule templates ───────────────────────────────────────────
    const [templates, setTemplates] = React.useState<PaymentScheduleTemplate[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<PaymentScheduleTemplate | null>(null);
    const [form, setForm] = React.useState<{ name: string; description: string; is_default: boolean; rules: RuleForm[] }>({
        name: '', description: '', is_default: false, rules: [EMPTY_RULE()],
    });
    const nameIsAuto = React.useRef(true);
    const [saving, setSaving] = React.useState(false);
    const [snack, setSnack] = React.useState('');

    const brandId = currentBrand?.id ?? null;

    const loadTemplates = React.useCallback(async () => {
        if (!brandId) {
            setTemplates([]);
            setLoading(false);
            return;
        }
        try {
            const res = await paymentSchedulesApi.getAll();
            setTemplates(res);
        } catch {
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    }, [brandId]);

    React.useEffect(() => { loadTemplates(); }, []);

    const openNew = () => {
        nameIsAuto.current = true;
        setEditing(null);
        const rules = [EMPTY_RULE()];
        setForm({ name: autoTemplateName(rules), description: '', is_default: templates.length === 0, rules });
        setDialogOpen(true);
    };

    const openEdit = (t: PaymentScheduleTemplate) => {
        nameIsAuto.current = false;
        setEditing(t);
        setForm({
            name: t.name,
            description: t.description ?? '',
            is_default: t.is_default,
            rules: t.rules.map(r => ({
                label: r.label,
                amount_type: r.amount_type,
                amount_value: r.amount_value,
                trigger_type: r.trigger_type,
                trigger_days: r.trigger_days ?? 0,
                order_index: r.order_index ?? 0,
            })),
        });
        setDialogOpen(true);
    };

    const addRule = () => {
        const newRule = { ...EMPTY_RULE(), label: autoRuleLabel(EMPTY_RULE()), order_index: form.rules.length };
        const newRules = [...form.rules, newRule];
        setForm(f => ({ ...f, name: nameIsAuto.current ? autoTemplateName(newRules) : f.name, rules: newRules }));
    };

    const removeRule = (i: number) => {
        const newRules = form.rules.filter((_, idx) => idx !== i);
        setForm(f => ({ ...f, name: nameIsAuto.current ? autoTemplateName(newRules) : f.name, rules: newRules }));
    };

    const updateRule = (i: number, patch: Partial<RuleForm>) => {
        setForm(f => {
            const newRules = f.rules.map((r, idx) => {
                if (idx !== i) return r;
                const updated = { ...r, ...patch };
                updated.label = autoRuleLabel(updated);
                return updated;
            });
            return { ...f, name: nameIsAuto.current ? autoTemplateName(newRules) : f.name, rules: newRules };
        });
    };

    const handleSave = async () => {
        const finalName = form.name.trim() || autoTemplateName(form.rules) || 'Payment Schedule';
        setSaving(true);
        try {
            const payload = { ...form, name: finalName, rules: form.rules.map((r, i) => ({ ...r, order_index: i })) };
            if (editing) {
                await paymentSchedulesApi.update(editing.id, payload);
            } else {
                await paymentSchedulesApi.create(payload);
            }
            setSnack(editing ? 'Template updated' : 'Template created');
            setDialogOpen(false);
            loadTemplates();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : '';
            setSnack(msg.includes('already exists') ? 'A template with that name already exists' : 'Failed to save template');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        try {
            await paymentSchedulesApi.delete(id);
            setSnack('Template deleted');
            loadTemplates();
        } catch { setSnack('Failed to delete template'); }
    };

    const handleSetDefault = async (t: PaymentScheduleTemplate) => {
        try {
            await paymentSchedulesApi.update(t.id, { is_default: true });
            setSnack(`"${t.name}" is now the default`);
            loadTemplates();
        } catch { setSnack('Failed to update default'); }
    };

    const pctTotal = form.rules
        .filter(r => r.amount_type === 'PERCENT')
        .reduce((s, r) => s + Number(r.amount_value), 0);

    // ── Crew payment templates ───────────────────────────────────────────────
    const { data: crewTemplates = [], refetch: refetchCrewTemplates } = useCrewPaymentTemplates();
    const createCrewMutation = useCreateCrewPaymentTemplate();
    const updateCrewMutation = useUpdateCrewPaymentTemplate();
    const deleteCrewMutation = useDeleteCrewPaymentTemplate();
    const [crewDialogOpen, setCrewDialogOpen] = React.useState(false);
    const [crewEditing, setCrewEditing] = React.useState<CrewPaymentTemplate | null>(null);
    const [crewDialogStep, setCrewDialogStep] = React.useState<CrewDialogStep>('preset');
    const [crewProjectMode, setCrewProjectMode] = React.useState<ProjectMode | null>(null);
    const [crewForm, setCrewForm] = React.useState<{ name: string; description: string; role_type: CrewPaymentRoleType; payment_terms: CrewPaymentTerms; is_default: boolean; rules: CrewRuleForm[] }>({
        name: '', description: '', role_type: 'on_site', payment_terms: 'DUE_ON_RECEIPT', is_default: false, rules: [EMPTY_CREW_RULE('on_site')],
    });
    const crewNameIsAuto = React.useRef(true);
    const [crewSaving, setCrewSaving] = React.useState(false);
    const [taskLibraryItems, setTaskLibraryItems] = React.useState<TaskLibrary[]>([]);

    React.useEffect(() => {
        if (!crewDialogOpen || crewForm.role_type !== 'off_site') return;
        taskLibraryApi.getAll({ is_active: true }).then(setTaskLibraryItems).catch(() => {});
    }, [crewDialogOpen, crewForm.role_type]);

    const openNewCrew = (roleType: CrewPaymentRoleType = 'on_site') => {
        crewNameIsAuto.current = true;
        setCrewEditing(null);
        setCrewDialogStep('preset');
        setCrewProjectMode(null);
        setCrewForm({ name: '', description: '', role_type: roleType, payment_terms: 'DUE_ON_RECEIPT', is_default: crewTemplates.filter(t => t.role_type === roleType).length === 0, rules: [] });
        setCrewDialogOpen(true);
    };

    const openEditCrew = (t: CrewPaymentTemplate) => {
        crewNameIsAuto.current = false;
        setCrewEditing(t);
        setCrewDialogStep('editor');
        if (t.role_type === 'off_site') {
            if (t.rules.some(r => r.trigger_type === 'ON_TASK_COMPLETE')) setCrewProjectMode('milestone');
            else if (t.rules.some(r => r.trigger_type === 'RECURRING')) setCrewProjectMode('recurring');
            else setCrewProjectMode('simple');
        } else {
            setCrewProjectMode(null);
        }
        setCrewForm({
            name: t.name,
            description: t.description ?? '',
            role_type: t.role_type,
            payment_terms: (t.payment_terms as CrewPaymentTerms) ?? 'DUE_ON_RECEIPT',
            is_default: t.is_default,
            rules: t.rules.map(r => ({
                label: r.label,
                amount_type: r.amount_type,
                amount_value: r.amount_value,
                trigger_type: r.trigger_type as CrewPaymentTriggerType,
                trigger_days: r.trigger_days ?? 0,
                task_library_id: r.task_library_id ?? null,
                frequency: (r.frequency as CrewPaymentFrequency) ?? null,
                order_index: r.order_index ?? 0,
            })),
        });
        setCrewDialogOpen(true);
    };

    const applyCrewPreset = (preset: CrewPreset) => {
        crewNameIsAuto.current = true;
        const rules = preset.rules.map((r, i) => ({ ...r, order_index: i }));
        setCrewForm(f => ({ ...f, name: autoCrewTemplateName(rules, f.role_type), rules }));
        setCrewDialogStep('editor');
    };

    const addCrewRule = () => {
        const newRule = { ...EMPTY_CREW_RULE(crewForm.role_type), label: autoCrewRuleLabel(EMPTY_CREW_RULE(crewForm.role_type)), order_index: crewForm.rules.length };
        const newRules = [...crewForm.rules, newRule];
        setCrewForm(f => ({ ...f, name: crewNameIsAuto.current ? autoCrewTemplateName(newRules, f.role_type) : f.name, rules: newRules }));
    };

    const removeCrewRule = (i: number) => {
        const newRules = crewForm.rules.filter((_, idx) => idx !== i);
        setCrewForm(f => ({ ...f, name: crewNameIsAuto.current ? autoCrewTemplateName(newRules, f.role_type) : f.name, rules: newRules }));
    };

    const updateCrewRule = (i: number, patch: Partial<CrewRuleForm>) => {
        setCrewForm(f => {
            const newRules = f.rules.map((r, idx) => {
                if (idx !== i) return r;
                const updated = { ...r, ...patch };
                updated.label = autoCrewRuleLabel(updated);
                return updated;
            });
            return { ...f, name: crewNameIsAuto.current ? autoCrewTemplateName(newRules, f.role_type) : f.name, rules: newRules };
        });
    };

    const handleSaveCrew = async () => {
        const finalName = crewForm.name.trim() || autoCrewTemplateName(crewForm.rules, crewForm.role_type) || 'Crew Payment Terms';
        setCrewSaving(true);
        try {
            const payload = { ...crewForm, name: finalName, rules: crewForm.rules.map((r, i) => ({ ...r, order_index: i })) };
            if (crewEditing) {
                await updateCrewMutation.mutateAsync({ id: crewEditing.id, data: payload });
            } else {
                await createCrewMutation.mutateAsync(payload);
            }
            setSnack(crewEditing ? 'Crew terms updated' : 'Crew terms created');
            setCrewDialogOpen(false);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : '';
            setSnack(msg.includes('already exists') ? 'A template with that name already exists' : 'Failed to save crew terms');
        } finally { setCrewSaving(false); }
    };

    const handleDeleteCrew = async (id: number) => {
        try {
            await deleteCrewMutation.mutateAsync(id);
            setSnack('Crew terms deleted');
        } catch { setSnack('Failed to delete crew terms'); }
    };

    const handleSetDefaultCrew = async (t: CrewPaymentTemplate) => {
        try {
            await updateCrewMutation.mutateAsync({ id: t.id, data: { is_default: true } });
            setSnack(`"${t.name}" is now the default for ${t.role_type === 'on_site' ? 'on-site' : 'off-site'} roles`);
        } catch { setSnack('Failed to update default'); }
    };

    const crewPctTotal = crewForm.rules
        .filter(r => r.amount_type === 'PERCENT')
        .reduce((s, r) => s + Number(r.amount_value), 0);

    const onSiteTemplates = crewTemplates.filter(t => t.role_type === 'on_site');
    const offSiteTemplates = crewTemplates.filter(t => t.role_type === 'off_site');

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;

    return (
        <>
            {/* Save/Discard bar for payment settings */}
            {paymentSettingsChanged && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
                    <Button onClick={handleDiscardSettings} sx={{ textTransform: 'none' }}>Discard</Button>
                    <Button variant="contained" onClick={handleSaveSettings} disabled={savingSettings} disableElevation
                        sx={{ fontWeight: 600, borderRadius: 2, textTransform: 'none' }}>
                        {savingSettings ? 'Saving…' : 'Save Settings'}
                    </Button>
                </Box>
            )}

            {/* ─── Two-column layout ─── */}
            <Grid container spacing={3}>
                {/* LEFT COLUMN */}
                <Grid item xs={12} md={7}>
                    {/* Payment Defaults */}
                    <Box sx={{ mb: 3.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <CreditCardIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                            <Typography variant="subtitle2" fontWeight={700}>Payment Defaults</Typography>
                        </Box>
                        <Box sx={{ p: 2.5, borderRadius: 2.5, border: 1, borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6) }}>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Default Payment Method</InputLabel>
                                        <Select label="Default Payment Method"
                                            value={paymentSettings.default_payment_method}
                                            onChange={e => setPaymentSettings(s => ({ ...s, default_payment_method: e.target.value }))}
                                            sx={{ borderRadius: 2 }}>
                                            <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                                            <MenuItem value="Credit Card">Credit Card</MenuItem>
                                            <MenuItem value="PayPal">PayPal</MenuItem>
                                            <MenuItem value="Stripe">Stripe</MenuItem>
                                            <MenuItem value="Cash">Cash</MenuItem>
                                            <MenuItem value="Cheque">Cheque</MenuItem>
                                            <MenuItem value="Other">Other</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Payment Terms</InputLabel>
                                        <Select label="Payment Terms"
                                            value={paymentSettings.payment_terms_days}
                                            onChange={e => setPaymentSettings(s => ({ ...s, payment_terms_days: Number(e.target.value) }))}
                                            sx={{ borderRadius: 2 }}>
                                            <MenuItem value={0}>Due on receipt</MenuItem>
                                            <MenuItem value={7}>Net 7 — 7 days</MenuItem>
                                            <MenuItem value={14}>Net 14 — 14 days</MenuItem>
                                            <MenuItem value={30}>Net 30 — 30 days</MenuItem>
                                            <MenuItem value={45}>Net 45 — 45 days</MenuItem>
                                            <MenuItem value={60}>Net 60 — 60 days</MenuItem>
                                            <MenuItem value={90}>Net 90 — 90 days</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 0.5 }} />
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Bank Details</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Bank Name" fullWidth size="small"
                                        value={paymentSettings.bank_name}
                                        onChange={e => setPaymentSettings(s => ({ ...s, bank_name: e.target.value }))}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Account Name" fullWidth size="small"
                                        value={paymentSettings.bank_account_name}
                                        onChange={e => setPaymentSettings(s => ({ ...s, bank_account_name: e.target.value }))}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Sort Code" fullWidth size="small"
                                        value={paymentSettings.bank_sort_code}
                                        onChange={e => setPaymentSettings(s => ({ ...s, bank_sort_code: e.target.value }))}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Account Number" fullWidth size="small"
                                        value={paymentSettings.bank_account_number}
                                        onChange={e => setPaymentSettings(s => ({ ...s, bank_account_number: e.target.value }))}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>

                    {/* Tax Details */}
                    <Box sx={{ mb: 3.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <ReceiptLongIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                            <Typography variant="subtitle2" fontWeight={700}>Tax Details</Typography>
                        </Box>
                        <Box sx={{ p: 2.5, borderRadius: 2.5, border: 1, borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6) }}>
                            {(currentBrand?.country === 'GB' || currentBrand?.country === 'United Kingdom') ? (
                                <Grid container spacing={2.5}>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>VAT Rate</InputLabel>
                                            <Select label="VAT Rate"
                                                value={paymentSettings.default_tax_rate}
                                                onChange={e => setPaymentSettings(s => ({ ...s, default_tax_rate: Number(e.target.value) }))}
                                                sx={{ borderRadius: 2 }}>
                                                <MenuItem value={20}>Standard Rate — 20%</MenuItem>
                                                <MenuItem value={5}>Reduced Rate — 5%</MenuItem>
                                                <MenuItem value={0}>Zero Rate — 0%</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                                            Applied to new estimates, quotes & invoices
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField label="VAT Number" fullWidth size="small"
                                            value={paymentSettings.tax_number}
                                            onChange={e => setPaymentSettings(s => ({ ...s, tax_number: e.target.value }))}
                                            placeholder="GB 123 4567 89"
                                            helperText="Displayed on invoices & estimates"
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="caption" color="text.disabled">
                                            VAT rates based on HMRC guidelines. Register for VAT if your taxable turnover exceeds 90,000.
                                        </Typography>
                                    </Grid>
                                </Grid>
                            ) : (
                                <Grid container spacing={2.5}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField label="Default Tax Rate" fullWidth size="small" type="number"
                                            value={paymentSettings.default_tax_rate}
                                            onChange={e => setPaymentSettings(s => ({ ...s, default_tax_rate: Number(e.target.value) }))}
                                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                            inputProps={{ min: 0, max: 100, step: 0.01 }}
                                            helperText="Applied to new estimates, quotes & invoices"
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField label="Tax Number" fullWidth size="small"
                                            value={paymentSettings.tax_number}
                                            onChange={e => setPaymentSettings(s => ({ ...s, tax_number: e.target.value }))}
                                            placeholder="e.g. VAT, GST, EIN"
                                            helperText="Displayed on invoices & estimates"
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </Grid>
                                </Grid>
                            )}
                        </Box>
                    </Box>

                    {/* Inquiry & Crew Defaults */}
                    <Box sx={{ mb: 3.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <ScheduleIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                            <Typography variant="subtitle2" fontWeight={700}>Inquiry & Crew Defaults</Typography>
                        </Box>
                        <Box sx={{ p: 2.5, borderRadius: 2.5, border: 1, borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6) }}>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Crew Response Deadline" fullWidth size="small" type="number"
                                        value={paymentSettings.crew_response_deadline_days}
                                        onChange={e => setPaymentSettings(s => ({ ...s, crew_response_deadline_days: Number(e.target.value) }))}
                                        InputProps={{ endAdornment: <InputAdornment position="end">days</InputAdornment> }}
                                        inputProps={{ min: 1, max: 90 }}
                                        helperText="How long crew have to respond to availability requests"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Inquiry Validity Period" fullWidth size="small" type="number"
                                        value={paymentSettings.inquiry_validity_days}
                                        onChange={e => setPaymentSettings(s => ({ ...s, inquiry_validity_days: Number(e.target.value) }))}
                                        InputProps={{ endAdornment: <InputAdornment position="end">days</InputAdornment> }}
                                        inputProps={{ min: 1, max: 365 }}
                                        helperText="How long an inquiry offer stays valid after creation"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>

                    {/* Contract Policies */}
                    <Box sx={{ mb: 3.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <ContractsIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                            <Typography variant="subtitle2" fontWeight={700}>Contract Policies</Typography>
                        </Box>
                        <Box sx={{ p: 2.5, borderRadius: 2.5, border: 1, borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6) }}>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                                These values are used as contract template variables (e.g. {'{{brand.late_fee_percent}}'}) so your clauses stay in sync with your policies.
                            </Typography>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Late Fee" fullWidth size="small" type="number"
                                        value={paymentSettings.late_fee_percent}
                                        onChange={e => setPaymentSettings(s => ({ ...s, late_fee_percent: Number(e.target.value) }))}
                                        InputProps={{ endAdornment: <InputAdornment position="end">% / month</InputAdornment> }}
                                        inputProps={{ min: 0, max: 100, step: 0.5 }}
                                        helperText="Charged on overdue invoices"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Cancellation Fee" fullWidth size="small" type="number"
                                        value={paymentSettings.cancellation_tier1_percent}
                                        onChange={e => setPaymentSettings(s => ({ ...s, cancellation_tier1_percent: Number(e.target.value) }))}
                                        InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                        inputProps={{ min: 0, max: 100, step: 5 }}
                                        helperText="Charged when cancelled within tier 1"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Cancellation Tier 1" fullWidth size="small" type="number"
                                        value={paymentSettings.cancellation_tier1_days}
                                        onChange={e => setPaymentSettings(s => ({ ...s, cancellation_tier1_days: Number(e.target.value) }))}
                                        InputProps={{ endAdornment: <InputAdornment position="end">days</InputAdornment> }}
                                        inputProps={{ min: 0 }}
                                        helperText="Partial fee applies within this window"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Cancellation Tier 2" fullWidth size="small" type="number"
                                        value={paymentSettings.cancellation_tier2_days}
                                        onChange={e => setPaymentSettings(s => ({ ...s, cancellation_tier2_days: Number(e.target.value) }))}
                                        InputProps={{ endAdornment: <InputAdornment position="end">days</InputAdornment> }}
                                        inputProps={{ min: 0 }}
                                        helperText="Full fee applies within this window"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>

                    {/* On-site Billing Thresholds */}
                    <Box sx={{ mb: 3.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <CalcIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                            <Typography variant="subtitle2" fontWeight={700}>On-site Billing Thresholds</Typography>
                        </Box>
                        <Box sx={{ p: 2.5, borderRadius: 2.5, border: 1, borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6) }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                Controls how on-site crew hours are billed. Hours are summed per person per day from unique activity durations.
                            </Typography>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Half-day max hours" fullWidth size="small" type="number"
                                        value={halfDayMax}
                                        onChange={e => setHalfDayMax(parseInt(e.target.value) || 1)}
                                        inputProps={{ min: 1, max: fullDayMax - 1 }}
                                        helperText={`≤ ${halfDayMax}h → half-day rate`}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Overtime threshold hours" fullWidth size="small" type="number"
                                        value={fullDayMax}
                                        onChange={e => setFullDayMax(parseInt(e.target.value) || 1)}
                                        inputProps={{ min: halfDayMax + 1 }}
                                        helperText={`≥ ${fullDayMax}h → full-day + overtime`}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            &lt; {halfDayMax}h → half-day rate &nbsp;|&nbsp; {halfDayMax}–{fullDayMax - 1}h → full-day rate &nbsp;|&nbsp; {fullDayMax}h+ → full-day + overtime
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    {onsiteSaved && <Alert severity="success" sx={{ mb: 1.5, py: 0.5 }}>Saved</Alert>}
                                    <Button variant="contained" size="small" disableElevation
                                        onClick={handleSaveOnsite}
                                        disabled={upsertFinanceSettings.isPending || halfDayMax >= fullDayMax}
                                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                                        {upsertFinanceSettings.isPending ? 'Saving…' : 'Save Thresholds'}
                                    </Button>
                                    {halfDayMax >= fullDayMax && (
                                        <Typography variant="caption" color="error" sx={{ ml: 2 }}>Half-day max must be less than overtime threshold</Typography>
                                    )}
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>

                </Grid>

                {/* RIGHT COLUMN — Payment Schedules */}
                <Grid item xs={12} md={5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <ScheduleIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                        <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>Payment Schedules</Typography>
                        <Button size="small" startIcon={<AddIcon />} onClick={openNew}
                            sx={{ fontWeight: 600, borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}>
                            New
                        </Button>
                    </Box>
                    <Box sx={{ borderRadius: 2.5, border: 1, borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6), overflow: 'hidden' }}>
                        {templates.length === 0 ? (
                            <Box sx={{ py: 5, textAlign: 'center' }}>
                                <PaymentsIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                                <Typography variant="body2" color="text.secondary" fontWeight={600}>No templates yet</Typography>
                                <Button onClick={openNew} size="small" startIcon={<AddIcon />}
                                    sx={{ mt: 1.5, textTransform: 'none', fontWeight: 600, borderRadius: 2, fontSize: '0.75rem' }}>
                                    Create template
                                </Button>
                            </Box>
                        ) : (
                            <Stack spacing={0} divider={<Divider />}>
                                {templates.map((t) => {
                                    const total = t.rules.reduce((s, r) => s + Number(r.amount_value), 0);
                                    return (
                                        <Box key={t.id}
                                            onClick={() => openEdit(t)}
                                            sx={{ px: 2.5, py: 2, cursor: 'pointer', transition: 'background 0.15s', '&:hover': { bgcolor: 'action.hover' } }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
                                                <Typography variant="subtitle2" fontWeight={700} color="text.primary"
                                                    sx={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {t.name}
                                                </Typography>
                                                {t.is_default && (
                                                    <Chip label="Default" size="small" color="primary" variant="outlined"
                                                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
                                                )}
                                                <Typography variant="caption" fontWeight={700} fontFamily="monospace"
                                                    color={total === 100 ? 'success.main' : 'warning.main'}>
                                                    {total}%
                                                </Typography>
                                                {!t.is_default && (
                                                    <Box sx={{ display: 'flex', gap: 0.25, ml: 0.5 }}>
                                                        <Tooltip title="Set as default">
                                                            <IconButton size="small"
                                                                onClick={e => { e.stopPropagation(); handleSetDefault(t); }}
                                                                sx={{ p: 0.4, color: 'text.disabled', '&:hover': { color: 'warning.main' } }}>
                                                                <StarBorderIcon sx={{ fontSize: 15 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete">
                                                            <IconButton size="small"
                                                                onClick={e => { e.stopPropagation(); handleDelete(t.id); }}
                                                                sx={{ p: 0.4, color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                                                                <DeleteIcon sx={{ fontSize: 15 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', bgcolor: 'action.hover', mb: 1 }}>
                                                {t.rules.map((r, i) => (
                                                    <Box key={i} sx={{ flex: Number(r.amount_value) || 1, bgcolor: MILESTONE_COLORS[i % MILESTONE_COLORS.length], opacity: 0.35, mr: i < t.rules.length - 1 ? '2px' : 0 }} />
                                                ))}
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                                {t.rules.map((r, i) => (
                                                    <Typography key={i} variant="caption" color="text.secondary"
                                                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, lineHeight: 1.4 }}>
                                                        <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, bgcolor: MILESTONE_COLORS[i % MILESTONE_COLORS.length], opacity: 0.5 }} />
                                                        {Number(r.amount_value)}% {r.label}
                                                    </Typography>
                                                ))}
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        )}
                    </Box>

                    {/* ─── Crew Payment Terms ─── */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 4 }}>
                        <GroupIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                        <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>Crew Payment Terms</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, mt: -1 }}>
                        Role-based payment terms included in crew availability emails.
                    </Typography>

                    {/* On-Site Roles */}
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                On-Site Roles
                            </Typography>
                            <Chip label="Videographer, Sound" size="small" variant="outlined"
                                sx={{ height: 18, fontSize: '0.6rem', color: 'text.disabled', borderColor: 'divider' }} />
                            <Box sx={{ flex: 1 }} />
                            <Button size="small" onClick={() => openNewCrew('on_site')}
                                sx={{ minWidth: 0, fontSize: '0.7rem', textTransform: 'none', fontWeight: 600, px: 1 }}>
                                + Add
                            </Button>
                        </Box>
                        <Box sx={{ borderRadius: 2.5, border: 1, borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6), overflow: 'hidden' }}>
                            {onSiteTemplates.length === 0 ? (
                                <Box sx={{ py: 3, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.disabled">No on-site terms yet</Typography>
                                </Box>
                            ) : (
                                <Stack spacing={0} divider={<Divider />}>
                                    {onSiteTemplates.map((t) => {
                                        const total = t.rules.reduce((s, r) => s + Number(r.amount_value), 0);
                                        return (
                                            <Box key={t.id} onClick={() => openEditCrew(t)}
                                                sx={{ px: 2.5, py: 2, cursor: 'pointer', transition: 'background 0.15s', '&:hover': { bgcolor: 'action.hover' } }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
                                                    <Typography variant="subtitle2" fontWeight={700} color="text.primary"
                                                        sx={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {t.name}
                                                    </Typography>
                                                    {t.is_default && (
                                                        <Chip label="Default" size="small" color="primary" variant="outlined"
                                                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
                                                    )}
                                                    <Typography variant="caption" fontWeight={700} fontFamily="monospace"
                                                        color={total === 100 ? 'success.main' : 'warning.main'}>
                                                        {total}%
                                                    </Typography>
                                                    {!t.is_default && (
                                                        <Box sx={{ display: 'flex', gap: 0.25, ml: 0.5 }}>
                                                            <Tooltip title="Set as default">
                                                                <IconButton size="small"
                                                                    onClick={e => { e.stopPropagation(); handleSetDefaultCrew(t); }}
                                                                    sx={{ p: 0.4, color: 'text.disabled', '&:hover': { color: 'warning.main' } }}>
                                                                    <StarBorderIcon sx={{ fontSize: 15 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Delete">
                                                                <IconButton size="small"
                                                                    onClick={e => { e.stopPropagation(); handleDeleteCrew(t.id); }}
                                                                    sx={{ p: 0.4, color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                                                                    <DeleteIcon sx={{ fontSize: 15 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    )}
                                                </Box>
                                                <Box sx={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', bgcolor: 'action.hover', mb: 1 }}>
                                                    {t.rules.map((r, i) => (
                                                        <Box key={i} sx={{ flex: Number(r.amount_value) || 1, bgcolor: MILESTONE_COLORS[i % MILESTONE_COLORS.length], opacity: 0.35, mr: i < t.rules.length - 1 ? '2px' : 0 }} />
                                                    ))}
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                                    {t.rules.map((r, i) => (
                                                        <Typography key={i} variant="caption" color="text.secondary"
                                                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, lineHeight: 1.4 }}>
                                                            <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, bgcolor: MILESTONE_COLORS[i % MILESTONE_COLORS.length], opacity: 0.5 }} />
                                                            {Number(r.amount_value)}% {r.label}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Box>
                    </Box>

                    {/* Off-Site / Project Roles */}
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Project Roles
                            </Typography>
                            <Chip label="Editor, Producer, Director" size="small" variant="outlined"
                                sx={{ height: 18, fontSize: '0.6rem', color: 'text.disabled', borderColor: 'divider' }} />
                            <Box sx={{ flex: 1 }} />
                            <Button size="small" onClick={() => openNewCrew('off_site')}
                                sx={{ minWidth: 0, fontSize: '0.7rem', textTransform: 'none', fontWeight: 600, px: 1 }}>
                                + Add
                            </Button>
                        </Box>
                        <Box sx={{ borderRadius: 2.5, border: 1, borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6), overflow: 'hidden' }}>
                            {offSiteTemplates.length === 0 ? (
                                <Box sx={{ py: 3, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.disabled">No project terms yet</Typography>
                                </Box>
                            ) : (
                                <Stack spacing={0} divider={<Divider />}>
                                    {offSiteTemplates.map((t) => {
                                        const total = t.rules.reduce((s, r) => s + Number(r.amount_value), 0);
                                        return (
                                            <Box key={t.id} onClick={() => openEditCrew(t)}
                                                sx={{ px: 2.5, py: 2, cursor: 'pointer', transition: 'background 0.15s', '&:hover': { bgcolor: 'action.hover' } }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
                                                    <Typography variant="subtitle2" fontWeight={700} color="text.primary"
                                                        sx={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {t.name}
                                                    </Typography>
                                                    {t.is_default && (
                                                        <Chip label="Default" size="small" color="primary" variant="outlined"
                                                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
                                                    )}
                                                    <Typography variant="caption" fontWeight={700} fontFamily="monospace"
                                                        color={total === 100 ? 'success.main' : 'warning.main'}>
                                                        {total}%
                                                    </Typography>
                                                    {!t.is_default && (
                                                        <Box sx={{ display: 'flex', gap: 0.25, ml: 0.5 }}>
                                                            <Tooltip title="Set as default">
                                                                <IconButton size="small"
                                                                    onClick={e => { e.stopPropagation(); handleSetDefaultCrew(t); }}
                                                                    sx={{ p: 0.4, color: 'text.disabled', '&:hover': { color: 'warning.main' } }}>
                                                                    <StarBorderIcon sx={{ fontSize: 15 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Delete">
                                                                <IconButton size="small"
                                                                    onClick={e => { e.stopPropagation(); handleDeleteCrew(t.id); }}
                                                                    sx={{ p: 0.4, color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                                                                    <DeleteIcon sx={{ fontSize: 15 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    )}
                                                </Box>
                                                <Box sx={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', bgcolor: 'action.hover', mb: 1 }}>
                                                    {t.rules.map((r, i) => (
                                                        <Box key={i} sx={{ flex: Number(r.amount_value) || 1, bgcolor: MILESTONE_COLORS[i % MILESTONE_COLORS.length], opacity: 0.35, mr: i < t.rules.length - 1 ? '2px' : 0 }} />
                                                    ))}
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                                    {t.rules.map((r, i) => (
                                                        <Typography key={i} variant="caption" color="text.secondary"
                                                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, lineHeight: 1.4 }}>
                                                            <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, bgcolor: MILESTONE_COLORS[i % MILESTONE_COLORS.length], opacity: 0.5 }} />
                                                            {Number(r.amount_value)}% {r.label}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {/* ─── Create / Edit dialog ─── */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 2.5 } }}>
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <ScheduleIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                        <Typography variant="h6" fontWeight={700}>{editing ? 'Edit Schedule' : 'New Schedule'}</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ pt: 1.5 }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                            <TextField label="Schedule Name" fullWidth value={form.name}
                                onChange={e => { nameIsAuto.current = false; setForm(f => ({ ...f, name: e.target.value })); }}
                                placeholder="Auto-generated from milestones"
                                inputProps={{ autoComplete: 'off' }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <FormControlLabel
                                control={<Switch checked={form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} />}
                                label={<Typography variant="body2" color="text.secondary" noWrap>Default</Typography>}
                                sx={{ flexShrink: 0, mt: 0.75 }}
                            />
                        </Box>
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle2" fontWeight={700}>Milestones</Typography>
                                {pctTotal > 0 && (
                                    <Chip label={`${pctTotal}%`} size="small"
                                        color={pctTotal === 100 ? 'success' : pctTotal > 100 ? 'error' : 'warning'}
                                        variant="outlined"
                                        sx={{ height: 22, fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }} />
                                )}
                            </Box>
                            <Stack spacing={1.5}>
                                {form.rules.map((rule, i) => {
                                    const color = MILESTONE_COLORS[i % MILESTONE_COLORS.length];
                                    return (
                                        <Box key={i} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6) }}>
                                            <Box sx={{ height: 3, width: 32, borderRadius: 1.5, bgcolor: color, mb: 1.5, opacity: 0.5 }} />
                                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                                <TextField size="small" type="number" value={rule.amount_value}
                                                    onChange={e => updateRule(i, { amount_value: Number(e.target.value) })}
                                                    inputProps={{ min: 0, autoComplete: 'off' }}
                                                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                                    sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: 2 }, '& input': { fontFamily: 'monospace', fontWeight: 700, textAlign: 'center', fontSize: '1rem' } }}
                                                />
                                                <FormControl size="small" sx={{ flex: 1 }}>
                                                    <Select value={rule.trigger_type}
                                                        onChange={e => updateRule(i, { trigger_type: e.target.value as PaymentTriggerType })}
                                                        sx={{ borderRadius: 2 }}>
                                                        <MenuItem value="AFTER_BOOKING">After booking</MenuItem>
                                                        <MenuItem value="BEFORE_EVENT">Before event</MenuItem>
                                                        <MenuItem value="AFTER_EVENT">After event</MenuItem>
                                                        <MenuItem value="ON_DATE">Fixed date</MenuItem>
                                                    </Select>
                                                </FormControl>
                                                {rule.trigger_type !== 'ON_DATE' ? (
                                                    <TextField size="small" type="number" value={rule.trigger_days ?? 0}
                                                        onChange={e => updateRule(i, { trigger_days: Number(e.target.value) })}
                                                        inputProps={{ min: 0, autoComplete: 'off' }}
                                                        InputProps={{ endAdornment: <InputAdornment position="end">days</InputAdornment> }}
                                                        sx={{ width: 110, '& .MuiOutlinedInput-root': { borderRadius: 2 }, '& input': { textAlign: 'center' } }}
                                                    />
                                                ) : <Box sx={{ width: 110 }} />}
                                                {form.rules.length > 1 ? (
                                                    <IconButton size="small" onClick={() => removeRule(i)}
                                                        sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                ) : <Box sx={{ width: 34 }} />}
                                            </Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                                                {rule.label}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Stack>
                            <Button onClick={addRule} size="small" startIcon={<AddIcon />}
                                sx={{ mt: 2, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
                                Add milestone
                            </Button>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving} disableElevation
                        sx={{ fontWeight: 600, borderRadius: 2, textTransform: 'none', px: 3 }}>
                        {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ─── Crew Payment Template dialog ─── */}
            <Dialog open={crewDialogOpen} onClose={() => setCrewDialogOpen(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 2.5 } }}>
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <GroupIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                        <Typography variant="h6" fontWeight={700}>
                            {crewEditing ? 'Edit Crew Terms' : crewDialogStep === 'preset' ? 'Choose Pay Structure' : 'Crew Payment Terms'}
                        </Typography>
                        <Chip label={crewForm.role_type === 'on_site' ? 'On-Site' : 'Project'} size="small" variant="outlined"
                            color={crewForm.role_type === 'on_site' ? 'info' : 'secondary'}
                            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, ml: 'auto' }} />
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {/* ── STEP 1: Preset selection ── */}
                    {crewDialogStep === 'preset' && (
                        <Stack spacing={2.5} sx={{ pt: 1 }}>
                            {crewForm.role_type === 'on_site' ? (
                                <>
                                    <Typography variant="body2" color="text.secondary">
                                        Choose a pay structure for on-site crew, or start from scratch.
                                    </Typography>
                                    <Stack spacing={1}>
                                        {ON_SITE_PRESETS.map(p => (
                                            <Box key={p.key} onClick={() => applyCrewPreset(p)}
                                                sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', cursor: 'pointer', transition: 'all 0.15s',
                                                    '&:hover': { borderColor: 'primary.main', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) } }}>
                                                <Typography variant="subtitle2" fontWeight={700}>{p.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{p.description}</Typography>
                                                <Box sx={{ display: 'flex', height: 3, borderRadius: 1.5, overflow: 'hidden', mt: 1 }}>
                                                    {p.rules.map((r, i) => (
                                                        <Box key={i} sx={{ flex: Number(r.amount_value) || 1, bgcolor: MILESTONE_COLORS[i % MILESTONE_COLORS.length], opacity: 0.4, mr: i < p.rules.length - 1 ? '2px' : 0 }} />
                                                    ))}
                                                </Box>
                                            </Box>
                                        ))}
                                    </Stack>
                                    <Button size="small" onClick={() => { applyCrewPreset({ key: 'custom', name: 'Custom', description: '', rules: [{ ...EMPTY_CREW_RULE('on_site'), label: 'Booking Payment' }] }); }}
                                        sx={{ textTransform: 'none', fontWeight: 600, alignSelf: 'flex-start' }}>
                                        Start from scratch
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Typography variant="body2" color="text.secondary">
                                        Choose a payment mode for project roles.
                                    </Typography>
                                    <Stack spacing={1}>
                                        <Box onClick={() => { setCrewProjectMode('milestone'); setCrewDialogStep('editor'); crewNameIsAuto.current = true; setCrewForm(f => ({ ...f, name: 'Project — Milestone-Based', rules: [] })); }}
                                            sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', cursor: 'pointer', transition: 'all 0.15s',
                                                '&:hover': { borderColor: 'primary.main', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) } }}>
                                            <Typography variant="subtitle2" fontWeight={700}>Milestone-Based</Typography>
                                            <Typography variant="caption" color="text.secondary">Link payments to task completions from your task library</Typography>
                                        </Box>
                                        <Box onClick={() => { setCrewProjectMode('recurring'); setCrewDialogStep('editor'); crewNameIsAuto.current = true; setCrewForm(f => ({ ...f, name: 'Project — Monthly', rules: [{ label: 'Monthly Payment', amount_type: 'PERCENT', amount_value: 100, trigger_type: 'RECURRING', trigger_days: 0, task_library_id: null, frequency: 'MONTHLY', order_index: 0 }] })); }}
                                            sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', cursor: 'pointer', transition: 'all 0.15s',
                                                '&:hover': { borderColor: 'primary.main', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) } }}>
                                            <Typography variant="subtitle2" fontWeight={700}>Recurring</Typography>
                                            <Typography variant="caption" color="text.secondary">Weekly, fortnightly, or monthly payments across the project</Typography>
                                        </Box>
                                        <Box sx={{ mt: 0.5 }}>
                                            <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, pl: 0.5, mb: 0.5, display: 'block' }}>
                                                Simple Splits
                                            </Typography>
                                            <Stack spacing={1}>
                                                {SIMPLE_SPLIT_PRESETS.map(p => (
                                                    <Box key={p.key} onClick={() => { setCrewProjectMode('simple'); applyCrewPreset(p); }}
                                                        sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', cursor: 'pointer', transition: 'all 0.15s',
                                                            '&:hover': { borderColor: 'primary.main', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) } }}>
                                                        <Typography variant="subtitle2" fontWeight={700}>{p.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{p.description}</Typography>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Box>
                                    </Stack>
                                </>
                            )}
                        </Stack>
                    )}

                    {/* ── STEP 2: Milestone editor ── */}
                    {crewDialogStep === 'editor' && (
                        <Stack spacing={3} sx={{ pt: 1.5 }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                <TextField label="Template Name" size="small" fullWidth
                                    value={crewForm.name}
                                    inputProps={{ autoComplete: 'off' }}
                                    onChange={e => { crewNameIsAuto.current = false; setCrewForm(f => ({ ...f, name: e.target.value })); }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                                <FormControlLabel
                                    control={<Switch checked={crewForm.is_default} onChange={e => setCrewForm(f => ({ ...f, is_default: e.target.checked }))} />}
                                    label={<Typography variant="body2" color="text.secondary" noWrap>Default</Typography>}
                                    sx={{ flexShrink: 0, mt: 0.75 }}
                                />
                            </Box>
                            <FormControl size="small" fullWidth>
                                <InputLabel>Invoice Terms</InputLabel>
                                <Select label="Invoice Terms" value={crewForm.payment_terms}
                                    onChange={e => setCrewForm(f => ({ ...f, payment_terms: e.target.value as CrewPaymentTerms }))}
                                    sx={{ borderRadius: 2 }}>
                                    {PAYMENT_TERMS_OPTIONS.map(o => (
                                        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {crewProjectMode === 'recurring' && (
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Payment Frequency</InputLabel>
                                    <Select label="Payment Frequency"
                                        value={crewForm.rules[0]?.frequency ?? 'MONTHLY'}
                                        onChange={e => {
                                            const freq = e.target.value as CrewPaymentFrequency;
                                            const label = freq === 'WEEKLY' ? 'Weekly Payment' : freq === 'FORTNIGHTLY' ? 'Fortnightly Payment' : 'Monthly Payment';
                                            const name = `Project — ${freq === 'WEEKLY' ? 'Weekly' : freq === 'FORTNIGHTLY' ? 'Fortnightly' : 'Monthly'}`;
                                            setCrewForm(f => ({
                                                ...f,
                                                name: crewNameIsAuto.current ? name : f.name,
                                                rules: [{ label, amount_type: 'PERCENT' as PaymentAmountType, amount_value: 100, trigger_type: 'RECURRING' as CrewPaymentTriggerType, trigger_days: 0, task_library_id: null, frequency: freq, order_index: 0 }],
                                            }));
                                        }}
                                        sx={{ borderRadius: 2 }}>
                                        <MenuItem value="WEEKLY">Weekly</MenuItem>
                                        <MenuItem value="FORTNIGHTLY">Fortnightly</MenuItem>
                                        <MenuItem value="MONTHLY">Monthly</MenuItem>
                                    </Select>
                                </FormControl>
                            )}

                            {crewProjectMode === 'milestone' && (
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="subtitle2" fontWeight={700}>Task Milestones</Typography>
                                        {crewPctTotal > 0 && (
                                            <Chip label={`${crewPctTotal}%`} size="small"
                                                color={crewPctTotal === 100 ? 'success' : crewPctTotal > 100 ? 'error' : 'warning'}
                                                variant="outlined"
                                                sx={{ height: 22, fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }} />
                                        )}
                                    </Box>
                                    <Stack spacing={1.5}>
                                        {crewForm.rules.map((rule, i) => {
                                            const color = MILESTONE_COLORS[i % MILESTONE_COLORS.length];
                                            const selectedTask = taskLibraryItems.find(t => t.id === rule.task_library_id);
                                            return (
                                                <Box key={i} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6) }}>
                                                    <Box sx={{ height: 3, width: 32, borderRadius: 1.5, bgcolor: color, mb: 1.5, opacity: 0.5 }} />
                                                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                                        <TextField size="small" type="number" value={rule.amount_value}
                                                            onChange={e => updateCrewRule(i, { amount_value: Number(e.target.value) })}
                                                            inputProps={{ min: 0, autoComplete: 'off' }}
                                                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                                            sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: 2 }, '& input': { fontFamily: 'monospace', fontWeight: 700, textAlign: 'center', fontSize: '1rem' } }}
                                                        />
                                                        <FormControl size="small" sx={{ flex: 1 }}>
                                                            <InputLabel>Task</InputLabel>
                                                            <Select label="Task" value={rule.task_library_id ?? ''}
                                                                onChange={e => {
                                                                    const taskId = Number(e.target.value);
                                                                    const task = taskLibraryItems.find(t => t.id === taskId);
                                                                    updateCrewRule(i, { task_library_id: taskId || null, label: task ? `On: ${task.name}` : 'Task Milestone' });
                                                                }}
                                                                sx={{ borderRadius: 2 }}>
                                                                {taskLibraryItems.filter(t => !t.is_task_group).map(t => (
                                                                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>
                                                        {crewForm.rules.length > 1 && (
                                                            <IconButton size="small" onClick={() => removeCrewRule(i)}
                                                                sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                                                                <DeleteIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        )}
                                                    </Box>
                                                    {selectedTask && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block', fontStyle: 'italic' }}>
                                                            {selectedTask.phase?.replace(/_/g, ' ')} — {selectedTask.name}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                    <Button onClick={() => {
                                        const newRule: CrewRuleForm = { label: 'Task Milestone', amount_type: 'PERCENT', amount_value: 0, trigger_type: 'ON_TASK_COMPLETE', trigger_days: 0, task_library_id: null, frequency: null, order_index: crewForm.rules.length };
                                        setCrewForm(f => ({ ...f, rules: [...f.rules, newRule] }));
                                    }} size="small" startIcon={<AddIcon />}
                                        sx={{ mt: 2, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
                                        Add task milestone
                                    </Button>
                                </Box>
                            )}

                            {crewProjectMode !== 'milestone' && crewProjectMode !== 'recurring' && (
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="subtitle2" fontWeight={700}>Milestones</Typography>
                                        {crewPctTotal > 0 && (
                                            <Chip label={`${crewPctTotal}%`} size="small"
                                                color={crewPctTotal === 100 ? 'success' : crewPctTotal > 100 ? 'error' : 'warning'}
                                                variant="outlined"
                                                sx={{ height: 22, fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }} />
                                        )}
                                    </Box>
                                    <Stack spacing={1.5}>
                                        {crewForm.rules.map((rule, i) => {
                                            const color = MILESTONE_COLORS[i % MILESTONE_COLORS.length];
                                            const needsDays = ['AFTER_DELIVERY', 'BEFORE_EVENT', 'AFTER_EVENT', 'AFTER_ROUGH_CUT', 'NET_DAYS'].includes(rule.trigger_type);
                                            return (
                                                <Box key={i} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6) }}>
                                                    <Box sx={{ height: 3, width: 32, borderRadius: 1.5, bgcolor: color, mb: 1.5, opacity: 0.5 }} />
                                                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                                        <TextField size="small" type="number" value={rule.amount_value}
                                                            onChange={e => updateCrewRule(i, { amount_value: Number(e.target.value) })}
                                                            inputProps={{ min: 0, autoComplete: 'off' }}
                                                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                                            sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: 2 }, '& input': { fontFamily: 'monospace', fontWeight: 700, textAlign: 'center', fontSize: '1rem' } }}
                                                        />
                                                        <FormControl size="small" sx={{ flex: 1 }}>
                                                            <Select value={rule.trigger_type}
                                                                onChange={e => updateCrewRule(i, { trigger_type: e.target.value as CrewPaymentTriggerType })}
                                                                sx={{ borderRadius: 2 }}>
                                                                <ListSubheader sx={{ fontSize: '0.7rem', fontWeight: 700, lineHeight: '28px', color: 'text.disabled', textTransform: 'uppercase' }}>Booking & Production</ListSubheader>
                                                                <MenuItem value="ON_BOOKING">On booking</MenuItem>
                                                                <MenuItem value="ON_SHOOT_DAY">On shoot day</MenuItem>
                                                                <MenuItem value="ON_FIRST_EDIT">First edit begins</MenuItem>
                                                                <ListSubheader sx={{ fontSize: '0.7rem', fontWeight: 700, lineHeight: '28px', color: 'text.disabled', textTransform: 'uppercase' }}>Completion & Delivery</ListSubheader>
                                                                <MenuItem value="ON_COMPLETION">On completion</MenuItem>
                                                                <MenuItem value="AFTER_ROUGH_CUT">After rough cut</MenuItem>
                                                                <MenuItem value="AFTER_DELIVERY">After final delivery</MenuItem>
                                                                <ListSubheader sx={{ fontSize: '0.7rem', fontWeight: 700, lineHeight: '28px', color: 'text.disabled', textTransform: 'uppercase' }}>Relative to Event</ListSubheader>
                                                                <MenuItem value="BEFORE_EVENT">Before event</MenuItem>
                                                                <MenuItem value="AFTER_EVENT">After event</MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                        {needsDays ? (
                                                            <TextField size="small" type="number" value={rule.trigger_days ?? 0}
                                                                onChange={e => updateCrewRule(i, { trigger_days: Number(e.target.value) })}
                                                                inputProps={{ min: 0, autoComplete: 'off' }}
                                                                InputProps={{ endAdornment: <InputAdornment position="end">days</InputAdornment> }}
                                                                sx={{ width: 110, '& .MuiOutlinedInput-root': { borderRadius: 2 }, '& input': { textAlign: 'center' } }}
                                                            />
                                                        ) : <Box sx={{ width: 110 }} />}
                                                        {crewForm.rules.length > 1 ? (
                                                            <IconButton size="small" onClick={() => removeCrewRule(i)}
                                                                sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                                                                <DeleteIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        ) : <Box sx={{ width: 34 }} />}
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                                                        {rule.label}
                                                    </Typography>
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                    <Button onClick={addCrewRule} size="small" startIcon={<AddIcon />}
                                        sx={{ mt: 2, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
                                        Add milestone
                                    </Button>
                                </Box>
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    {crewDialogStep === 'editor' && !crewEditing && (
                        <Button onClick={() => { setCrewDialogStep('preset'); setCrewProjectMode(null); }} sx={{ textTransform: 'none', mr: 'auto' }}>
                            ← Back
                        </Button>
                    )}
                    <Button onClick={() => setCrewDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
                    {crewDialogStep === 'editor' && (
                        <Button variant="contained" onClick={handleSaveCrew}
                            disabled={crewSaving || (crewProjectMode !== 'recurring' && crewPctTotal !== 100)}
                            disableElevation
                            sx={{ fontWeight: 600, borderRadius: 2, textTransform: 'none', px: 3 }}>
                            {crewSaving ? 'Saving…' : crewEditing ? 'Save Changes' : 'Create'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <Snackbar open={!!snack} autoHideDuration={3500} onClose={() => setSnack('')}
                message={snack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
        </>
    );
}

export default PaymentScheduleSettings;
