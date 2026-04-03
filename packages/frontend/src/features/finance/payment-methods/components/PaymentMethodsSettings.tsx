"use client";

import React from "react";
import {
    Box,
    Typography,
    Button,
    IconButton,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Switch,
    FormControlLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Tooltip,
    Divider,
    Grid,
    Alert,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    AccountBalance as BankIcon,
    CreditCard as CardIcon,
    AttachMoney as CashIcon,
    Link as LinkIcon,
    Star as StarIcon,
    StarBorder as StarBorderIcon,
} from "@mui/icons-material";
import {
    usePaymentMethods,
    useCreatePaymentMethod,
    useUpdatePaymentMethod,
    useDeletePaymentMethod,
} from "@/features/finance/payment-methods/hooks";
import type {
    PaymentMethod,
    PaymentMethodType,
    CreatePaymentMethodData,
    BankTransferConfig,
} from "@/features/finance/payment-methods/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const METHOD_TYPE_OPTIONS: { value: PaymentMethodType; label: string; icon: React.ReactNode; description: string }[] = [
    { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: <BankIcon fontSize="small" />, description: 'Direct bank/wire transfer' },
    { value: 'CREDIT_CARD', label: 'Credit / Debit Card', icon: <CardIcon fontSize="small" />, description: 'Manual card payment instructions' },
    { value: 'CASH', label: 'Cash', icon: <CashIcon fontSize="small" />, description: 'Cash payment on the day' },
    { value: 'STRIPE', label: 'Stripe', icon: <LinkIcon fontSize="small" />, description: 'Stripe Checkout' },
];

const DEFAULT_LABELS: Record<PaymentMethodType, string> = {
    BANK_TRANSFER: 'Bank Transfer',
    CREDIT_CARD: 'Credit / Debit Card',
    CASH: 'Cash',
    STRIPE: 'Stripe',
};

function getMethodIcon(type: PaymentMethodType) {
    switch (type) {
        case 'BANK_TRANSFER': return <BankIcon fontSize="small" />;
        case 'CREDIT_CARD': return <CardIcon fontSize="small" />;
        case 'CASH': return <CashIcon fontSize="small" />;
        case 'STRIPE': return <LinkIcon fontSize="small" />;
    }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PaymentMethodsSettings() {
    const { data: methods = [], isLoading } = usePaymentMethods();
    const createMutation = useCreatePaymentMethod();
    const updateMutation = useUpdatePaymentMethod();
    const deleteMutation = useDeletePaymentMethod();

    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editingMethod, setEditingMethod] = React.useState<PaymentMethod | null>(null);
    const [deleteConfirm, setDeleteConfirm] = React.useState<PaymentMethod | null>(null);

    // Form state
    const [formType, setFormType] = React.useState<PaymentMethodType>('BANK_TRANSFER');
    const [formLabel, setFormLabel] = React.useState('');
    const [formInstructions, setFormInstructions] = React.useState('');
    const [formIsDefault, setFormIsDefault] = React.useState(false);
    const [formIsActive, setFormIsActive] = React.useState(true);

    // Bank transfer config
    const [bankName, setBankName] = React.useState('');
    const [bankAccountName, setBankAccountName] = React.useState('');
    const [bankSortCode, setBankSortCode] = React.useState('');
    const [bankAccountNumber, setBankAccountNumber] = React.useState('');



    const resetForm = () => {
        setFormType('BANK_TRANSFER');
        setFormLabel('');
        setFormInstructions('');
        setFormIsDefault(false);
        setFormIsActive(true);
        setBankName('');
        setBankAccountName('');
        setBankSortCode('');
        setBankAccountNumber('');
        setEditingMethod(null);
    };

    const openCreate = () => {
        resetForm();
        setDialogOpen(true);
    };

    const openEdit = (method: PaymentMethod) => {
        setEditingMethod(method);
        setFormType(method.type);
        setFormLabel(method.label);
        setFormInstructions(method.instructions || '');
        setFormIsDefault(method.is_default);
        setFormIsActive(method.is_active);

        const cfg = (method.config || {}) as Record<string, unknown>;
        if (method.type === 'BANK_TRANSFER') {
            setBankName((cfg.bank_name as string) || '');
            setBankAccountName((cfg.account_name as string) || '');
            setBankSortCode((cfg.sort_code as string) || '');
            setBankAccountNumber((cfg.account_number as string) || '');
        }
        setDialogOpen(true);
    };

    const buildConfig = (): Record<string, unknown> | undefined => {
        if (formType === 'BANK_TRANSFER') {
            const c: BankTransferConfig = {};
            if (bankName.trim()) c.bank_name = bankName.trim();
            if (bankAccountName.trim()) c.account_name = bankAccountName.trim();
            if (bankSortCode.trim()) c.sort_code = bankSortCode.trim();
            if (bankAccountNumber.trim()) c.account_number = bankAccountNumber.trim();
            return Object.keys(c).length ? c : undefined;
        }
        return undefined;
    };

    const handleSave = async () => {
        const label = formLabel.trim() || DEFAULT_LABELS[formType];
        const data: CreatePaymentMethodData = {
            type: formType,
            label,
            is_default: formIsDefault,
            is_active: formIsActive,
            instructions: formInstructions.trim() || undefined,
            config: buildConfig(),
        };

        if (editingMethod) {
            await updateMutation.mutateAsync({ id: editingMethod.id, data });
        } else {
            await createMutation.mutateAsync(data);
        }
        setDialogOpen(false);
        resetForm();
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        await deleteMutation.mutateAsync(deleteConfirm.id);
        setDeleteConfirm(null);
    };

    const handleSetDefault = async (method: PaymentMethod) => {
        if (method.is_default) return;
        await updateMutation.mutateAsync({ id: method.id, data: { is_default: true } });
    };

    const handleToggleActive = async (method: PaymentMethod) => {
        await updateMutation.mutateAsync({
            id: method.id,
            data: { is_active: !method.is_active },
        });
    };

    // Auto-fill label when type changes in create mode
    const handleTypeChange = (type: PaymentMethodType) => {
        setFormType(type);
        if (!editingMethod && (!formLabel.trim() || Object.values(DEFAULT_LABELS).includes(formLabel))) {
            setFormLabel(DEFAULT_LABELS[type]);
        }
    };

    const saving = createMutation.isPending || updateMutation.isPending;

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BankIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                    <Typography variant="subtitle2" fontWeight={700}>Payment Methods</Typography>
                </Box>
                <Button startIcon={<AddIcon />} size="small" onClick={openCreate}
                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
                    Add Method
                </Button>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Configure how your clients can pay you. Active methods will be shown in the client payment portal.
            </Typography>

            {isLoading ? (
                <Typography variant="body2" color="text.secondary">Loading…</Typography>
            ) : methods.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                    No payment methods configured yet. Add your first payment method to get started.
                </Alert>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {methods.map((method) => (
                        <Box
                            key={method.id}
                            sx={{
                                p: 2,
                                borderRadius: 2.5,
                                border: 1,
                                borderColor: method.is_default ? 'primary.main' : 'divider',
                                bgcolor: (theme) => alpha(theme.palette.background.paper, method.is_active ? 0.8 : 0.4),
                                opacity: method.is_active ? 1 : 0.6,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                transition: 'all 0.2s',
                                '&:hover': { borderColor: 'primary.light' },
                            }}
                        >
                            <Box sx={{ color: 'primary.main', display: 'flex' }}>
                                {getMethodIcon(method.type)}
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" fontWeight={600} noWrap>
                                        {method.label}
                                    </Typography>
                                    {method.is_default && (
                                        <Chip label="Default" size="small" color="primary" variant="outlined"
                                            sx={{ height: 20, fontSize: '0.65rem' }} />
                                    )}
                                    {!method.is_active && (
                                        <Chip label="Inactive" size="small" color="default" variant="outlined"
                                            sx={{ height: 20, fontSize: '0.65rem' }} />
                                    )}
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                    {METHOD_TYPE_OPTIONS.find(o => o.value === method.type)?.description}
                                    {method.instructions && ` · ${method.instructions.slice(0, 50)}${method.instructions.length > 50 ? '…' : ''}`}
                                </Typography>
                            </Box>

                            <Tooltip title={method.is_default ? 'Default method' : 'Set as default'}>
                                <IconButton size="small" onClick={() => handleSetDefault(method)}
                                    sx={{ color: method.is_default ? 'warning.main' : 'action.disabled' }}>
                                    {method.is_default ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                                </IconButton>
                            </Tooltip>

                            <Tooltip title={method.is_active ? 'Disable' : 'Enable'}>
                                <Switch size="small" checked={method.is_active}
                                    onChange={() => handleToggleActive(method)} />
                            </Tooltip>

                            <Button size="small" onClick={() => openEdit(method)}
                                sx={{ textTransform: 'none', minWidth: 0, fontSize: '0.75rem' }}>
                                Edit
                            </Button>

                            <Tooltip title="Delete">
                                <IconButton size="small" onClick={() => setDeleteConfirm(method)}
                                    sx={{ color: 'error.main' }}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    ))}
                </Box>
            )}

            {/* ─── Create / Edit Dialog ─── */}
            <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); resetForm(); }}
                maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>
                    {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                        {/* Type selector */}
                        <FormControl fullWidth size="small">
                            <InputLabel>Type</InputLabel>
                            <Select label="Type" value={formType}
                                onChange={(e) => handleTypeChange(e.target.value as PaymentMethodType)}
                                disabled={!!editingMethod}
                                sx={{ borderRadius: 2 }}>
                                {METHOD_TYPE_OPTIONS.map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {opt.icon}
                                            <Box>
                                                <Typography variant="body2">{opt.label}</Typography>
                                                <Typography variant="caption" color="text.secondary">{opt.description}</Typography>
                                            </Box>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Label */}
                        <TextField label="Display Label" size="small" fullWidth value={formLabel}
                            onChange={(e) => setFormLabel(e.target.value)}
                            placeholder={DEFAULT_LABELS[formType]}
                            helperText="Shown to clients in the payment portal"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />

                        {/* Type-specific config */}
                        {formType === 'BANK_TRANSFER' && (
                            <>
                                <Divider><Typography variant="caption" color="text.secondary">Bank Details</Typography></Divider>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField label="Bank Name" size="small" fullWidth value={bankName}
                                            onChange={(e) => setBankName(e.target.value)}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField label="Account Name" size="small" fullWidth value={bankAccountName}
                                            onChange={(e) => setBankAccountName(e.target.value)}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField label="Sort Code" size="small" fullWidth value={bankSortCode}
                                            onChange={(e) => setBankSortCode(e.target.value)}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField label="Account Number" size="small" fullWidth value={bankAccountNumber}
                                            onChange={(e) => setBankAccountNumber(e.target.value)}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                    </Grid>
                                </Grid>
                            </>
                        )}

                        {formType === 'STRIPE' && (
                            <Alert severity="success" sx={{ borderRadius: 2 }}>
                                Clients will be directed to Stripe Checkout to pay securely via card, Apple Pay, Google Pay, and more.
                                No additional configuration needed — payments are processed through your connected Stripe account.
                            </Alert>
                        )}

                        {formType === 'CREDIT_CARD' && (
                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                                Add instructions below to tell clients how to pay by card (e.g. &quot;Call us on 07xxx to pay over the phone&quot;).
                            </Alert>
                        )}

                        {formType === 'CASH' && (
                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                                Add any instructions below (e.g. &quot;Cash payment on the day of the event&quot;).
                            </Alert>
                        )}

                        {/* Instructions (all types) */}
                        <TextField
                            label="Instructions for Client"
                            size="small"
                            fullWidth
                            multiline
                            minRows={2}
                            maxRows={4}
                            value={formInstructions}
                            onChange={(e) => setFormInstructions(e.target.value)}
                            placeholder="Any additional instructions shown to the client…"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControlLabel
                                control={<Switch size="small" checked={formIsDefault} onChange={(_, v) => setFormIsDefault(v)} />}
                                label={<Typography variant="body2">Default method</Typography>}
                            />
                            <FormControlLabel
                                control={<Switch size="small" checked={formIsActive} onChange={(_, v) => setFormIsActive(v)} />}
                                label={<Typography variant="body2">Active</Typography>}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => { setDialogOpen(false); resetForm(); }}
                        sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button variant="contained" disableElevation onClick={handleSave} disabled={saving}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
                        {saving ? 'Saving…' : editingMethod ? 'Save Changes' : 'Add Method'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ─── Delete Confirmation ─── */}
            <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}
                PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>Delete Payment Method</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        Are you sure you want to delete <strong>{deleteConfirm?.label}</strong>? This cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteConfirm(null)} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button variant="contained" color="error" disableElevation onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
                        {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
