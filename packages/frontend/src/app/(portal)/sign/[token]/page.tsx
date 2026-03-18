'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
    Box,
    Typography,
    Button,
    TextField,
    Checkbox,
    FormControlLabel,
    CircularProgress,
    Chip,
    Stack,
} from '@mui/material';
import { alpha, keyframes } from '@mui/material/styles';
import {
    CheckCircle,
    Gavel,
    HourglassEmpty,
    Visibility,
} from '@mui/icons-material';
import { contractSigningService } from '@/lib/api';
import type { SigningContractView } from '@/lib/types';

/* ── Animations ──────────────────────────────────────────────────── */

const fadeInUp = keyframes`
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
`;

/* ── Page Component ──────────────────────────────────────────────── */

export default function ContractSigningPage() {
    const params = useParams();
    const token = params.token as string;

    const [data, setData] = useState<SigningContractView | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Signing form state
    const [signatureText, setSignatureText] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [signed, setSigned] = useState(false);

    useEffect(() => {
        if (!token) return;
        contractSigningService
            .getContract(token)
            .then((result) => {
                setData(result);
                if (result.signer.status === 'signed') {
                    setSigned(true);
                    setSignatureText(result.signer.signed_at ? 'Signed' : '');
                }
            })
            .catch((err) => {
                console.error('Signing error:', err);
                setError('This signing link is invalid or has expired.');
            })
            .finally(() => setLoading(false));
    }, [token]);

    const handleSign = async () => {
        if (!signatureText.trim() || !agreed) return;
        try {
            setSubmitting(true);
            await contractSigningService.submitSignature(token, signatureText.trim());
            setSigned(true);
        } catch (err) {
            console.error('Signature error:', err);
            setError('Failed to submit signature. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    /* ── Loading / Error states ──────────────────────────────────── */

    if (loading) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0f172a' }}>
                <CircularProgress sx={{ color: '#6366f1' }} />
            </Box>
        );
    }

    if (error || !data) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0f172a', p: 3 }}>
                <Box sx={{ maxWidth: 480, textAlign: 'center' }}>
                    <Gavel sx={{ fontSize: 48, color: '#ef4444', mb: 2 }} />
                    <Typography variant="h5" sx={{ color: '#f1f5f9', fontWeight: 700, mb: 1 }}>
                        Unable to Load Contract
                    </Typography>
                    <Typography sx={{ color: '#94a3b8' }}>
                        {error || 'Something went wrong.'}
                    </Typography>
                </Box>
            </Box>
        );
    }

    /* ── Success state ───────────────────────────────────────────── */

    if (signed) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0f172a', p: 3 }}>
                <Box sx={{
                    maxWidth: 520, textAlign: 'center', p: 5,
                    animation: `${fadeInUp} 0.6s ease`,
                    bgcolor: alpha('#1e293b', 0.7), borderRadius: 4,
                    border: '1px solid rgba(34,197,94,0.2)',
                }}>
                    <CheckCircle sx={{ fontSize: 64, color: '#22c55e', mb: 2 }} />
                    <Typography variant="h4" sx={{ color: '#f1f5f9', fontWeight: 800, mb: 1 }}>
                        Contract Signed
                    </Typography>
                    <Typography sx={{ color: '#94a3b8', fontSize: '1.05rem', mb: 3 }}>
                        Thank you, {data.signer.name}. Your signature has been recorded for &ldquo;{data.contract.title}&rdquo;.
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '0.82rem' }}>
                        You may close this window. A copy of the signed contract will be available from the sender.
                    </Typography>
                </Box>
            </Box>
        );
    }

    /* ── Main signing view ───────────────────────────────────────── */

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a', py: { xs: 3, md: 5 }, px: 2 }}>
            <Box sx={{
                maxWidth: 800, mx: 'auto',
                animation: `${fadeInUp} 0.5s ease`,
            }}>
                {/* Contract Header */}
                <Box sx={{
                    textAlign: 'center', mb: 4, p: 4,
                    bgcolor: alpha('#1e293b', 0.6), borderRadius: 4,
                    border: '1px solid rgba(148,163,184,0.1)',
                }}>
                    <Gavel sx={{ fontSize: 40, color: '#6366f1', mb: 1.5 }} />
                    <Typography variant="h4" sx={{ color: '#f1f5f9', fontWeight: 800, mb: 0.5, letterSpacing: '-0.02em' }}>
                        {data.contract.title}
                    </Typography>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                        Please review the contract below and sign at the bottom.
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Chip label={`For: ${data.signer.name}`} size="small" sx={{ bgcolor: alpha('#6366f1', 0.15), color: '#a5b4fc', fontWeight: 600 }} />
                        <Chip label={data.signer.role} size="small" variant="outlined" sx={{ color: '#94a3b8', borderColor: 'rgba(148,163,184,0.2)' }} />
                    </Box>
                </Box>

                {/* Signer Status Overview */}
                {data.signers.length > 1 && (
                    <Box sx={{
                        mb: 3, p: 2, bgcolor: alpha('#1e293b', 0.4), borderRadius: 3,
                        border: '1px solid rgba(148,163,184,0.08)',
                    }}>
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            All Signers
                        </Typography>
                        <Stack spacing={0.5}>
                            {data.signers.map((s, i) => (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {s.status === 'signed' ? (
                                        <CheckCircle sx={{ fontSize: 16, color: '#22c55e' }} />
                                    ) : s.status === 'viewed' ? (
                                        <Visibility sx={{ fontSize: 16, color: '#3b82f6' }} />
                                    ) : (
                                        <HourglassEmpty sx={{ fontSize: 16, color: '#64748b' }} />
                                    )}
                                    <Typography sx={{ color: '#cbd5e1', fontSize: '0.82rem' }}>
                                        {s.name} <span style={{ color: '#64748b' }}>({s.role})</span>
                                    </Typography>
                                    <Chip label={s.status} size="small"
                                        sx={{
                                            height: 18, fontSize: '0.62rem', fontWeight: 600, ml: 'auto',
                                            bgcolor: s.status === 'signed' ? alpha('#22c55e', 0.15) : s.status === 'viewed' ? alpha('#3b82f6', 0.15) : alpha('#64748b', 0.15),
                                            color: s.status === 'signed' ? '#22c55e' : s.status === 'viewed' ? '#3b82f6' : '#94a3b8',
                                        }}
                                    />
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                )}

                {/* Contract Content */}
                <Box sx={{
                    bgcolor: '#fff', borderRadius: 3, p: { xs: 3, md: 5 }, mb: 4,
                    color: '#1e293b', lineHeight: 1.7, fontSize: '0.92rem',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                    '& .contract-section': { mb: 3 },
                    '& .contract-section h3': {
                        fontSize: '1rem', fontWeight: 700, color: '#1e293b',
                        mb: 1, borderBottom: '1px solid #e2e8f0', pb: 0.5,
                    },
                    '& .contract-section p': {
                        fontSize: '0.88rem', lineHeight: 1.7, color: '#334155',
                    },
                }}>
                    {data.contract.rendered_html ? (
                        <div dangerouslySetInnerHTML={{ __html: data.contract.rendered_html }} />
                    ) : (
                        <Typography sx={{ color: '#64748b', fontStyle: 'italic' }}>
                            No contract content available.
                        </Typography>
                    )}
                </Box>

                {/* Signing Section */}
                <Box sx={{
                    p: 4, bgcolor: alpha('#1e293b', 0.7), borderRadius: 4,
                    border: '1px solid rgba(99,102,241,0.2)',
                }}>
                    <Typography variant="h6" sx={{ color: '#f1f5f9', fontWeight: 700, mb: 0.5 }}>
                        Sign this Contract
                    </Typography>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 3 }}>
                        By typing your full legal name below, you are agreeing to all terms in this contract.
                    </Typography>

                    <TextField
                        fullWidth
                        label="Type your full legal name"
                        value={signatureText}
                        onChange={(e) => setSignatureText(e.target.value)}
                        placeholder={data.signer.name}
                        sx={{
                            mb: 2,
                            '& .MuiInputBase-input': {
                                fontFamily: '"Dancing Script", "Brush Script MT", cursive',
                                fontSize: '1.6rem',
                                color: '#f1f5f9',
                                py: 1.5,
                            },
                            '& .MuiOutlinedInput-root': {
                                borderColor: 'rgba(99,102,241,0.3)',
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#6366f1',
                                },
                            },
                        }}
                        InputLabelProps={{ sx: { color: '#94a3b8' } }}
                    />

                    {/* Signature preview */}
                    {signatureText && (
                        <Box sx={{
                            mb: 2, p: 2, textAlign: 'center',
                            borderBottom: '2px solid #6366f1',
                            bgcolor: alpha('#fff', 0.03), borderRadius: '4px 4px 0 0',
                        }}>
                            <Typography sx={{
                                fontFamily: '"Dancing Script", "Brush Script MT", cursive',
                                fontSize: '2rem', color: '#f1f5f9', fontWeight: 700,
                            }}>
                                {signatureText}
                            </Typography>
                            <Typography sx={{ color: '#64748b', fontSize: '0.72rem', mt: 0.5 }}>
                                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </Typography>
                        </Box>
                    )}

                    <FormControlLabel
                        control={
                            <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                                sx={{ color: '#64748b', '&.Mui-checked': { color: '#6366f1' } }} />
                        }
                        label={
                            <Typography sx={{ color: '#cbd5e1', fontSize: '0.82rem' }}>
                                I have read and agree to all terms and conditions in this contract.
                            </Typography>
                        }
                        sx={{ mb: 2 }}
                    />

                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={!signatureText.trim() || !agreed || submitting}
                        onClick={handleSign}
                        startIcon={submitting ? <CircularProgress size={20} /> : <CheckCircle />}
                        sx={{
                            py: 1.5,
                            borderRadius: 3,
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '1rem',
                            bgcolor: '#6366f1',
                            '&:hover': { bgcolor: '#4f46e5' },
                            '&.Mui-disabled': { bgcolor: alpha('#6366f1', 0.3), color: alpha('#f1f5f9', 0.4) },
                        }}
                    >
                        {submitting ? 'Signing...' : 'Sign Contract'}
                    </Button>

                    <Typography sx={{ color: '#475569', fontSize: '0.72rem', textAlign: 'center', mt: 2 }}>
                        Your signature is legally binding. IP address and timestamp are recorded for verification.
                    </Typography>
                </Box>

                {/* Footer */}
                <Box sx={{ textAlign: 'center', mt: 4, pb: 3 }}>
                    <Typography sx={{ color: '#475569', fontSize: '0.72rem' }}>
                        Powered by ProjectFlo • Secure contract signing
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
