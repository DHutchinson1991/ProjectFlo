'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    Popover,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';

import type {
    PackageTraceabilityInquiryRole,
    PackageTraceabilityResponse,
} from '@/features/catalog/packages/types/api.types';

import { usePackageTraceability } from '../../../hooks/usePackageTraceability';

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <Typography
            sx={{
                fontSize: '0.62rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#64748b',
                mb: 0.75,
            }}
        >
            {children}
        </Typography>
    );
}

const ROLE_LABEL: Record<PackageTraceabilityInquiryRole, string> = {
    selected_package: 'Selected',
    source_package: 'Schedule source',
};

function formatRoleLabel(role: PackageTraceabilityInquiryRole): string {
    return ROLE_LABEL[role];
}

function LinkRow({
    primary,
    secondary,
    onNavigate,
}: {
    primary: React.ReactNode;
    secondary?: React.ReactNode;
    onNavigate: () => void;
}) {
    const secondaryContent =
        secondary == null || secondary === false ? null : typeof secondary === 'string' ? (
            <Typography sx={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.3 }}>{secondary}</Typography>
        ) : (
            secondary
        );

    return (
        <Box
            component="button"
            type="button"
            onClick={onNavigate}
            sx={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: 1,
                px: 0.75,
                py: 0.85,
                m: 0,
                font: 'inherit',
                color: 'inherit',
                '&:hover': { background: 'rgba(148,163,184,0.08)' },
            }}
        >
            <Typography component="span" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', lineHeight: 1.3 }}>
                {primary}
            </Typography>
            {secondaryContent != null && secondaryContent !== '' && (
                <Box sx={{ mt: 0.25 }}>{secondaryContent}</Box>
            )}
        </Box>
    );
}

function hasAnyLinks(data: PackageTraceabilityResponse | undefined): boolean {
    if (!data) return false;
    return Boolean(
        data.source_blueprint ||
            data.package_template ||
            data.inquiries.length > 0 ||
            data.projects.length > 0,
    );
}

export interface PackageTraceabilityLinkButtonProps {
    packageId: number;
}

export function PackageTraceabilityLinkButton({ packageId }: PackageTraceabilityLinkButtonProps) {
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const open = Boolean(anchorEl);
    const traceQuery = usePackageTraceability(packageId, { enabled: open });

    const data = traceQuery.data;

    const emptyReady = useMemo(() => traceQuery.isFetched && !hasAnyLinks(data), [traceQuery.isFetched, data]);

    const handleNavigateBlueprint = () => {
        if (!data?.source_blueprint) return;
        router.push(`/packages/${packageId}?mode=edit&tab=blueprint`);
        setAnchorEl(null);
    };

    const handleNavigateTemplate = () => {
        router.push('/packages');
        setAnchorEl(null);
    };

    const handleNavigateInquiry = (id: number) => {
        router.push(`/inquiries/${id}`);
        setAnchorEl(null);
    };

    const handleNavigateProject = (id: number) => {
        router.push(`/projects/${id}`);
        setAnchorEl(null);
    };

    const formatWeddingDate = (isoDate: string) => {
        const d = new Date(`${isoDate}T12:00:00`);
        return Number.isNaN(d.getTime()) ? isoDate : d.toLocaleDateString(undefined, { dateStyle: 'medium' });
    };

    return (
        <>
            <Tooltip title="Where this package came from and where it's used">
                <IconButton
                    size="small"
                    aria-label="Package origins and links"
                    aria-expanded={open}
                    aria-haspopup="dialog"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{
                        color: '#8fa8ff',
                        p: 0.35,
                        ml: 0.25,
                        flexShrink: 0,
                        '&:hover': { background: 'rgba(100,140,255,0.12)', color: '#a8bcff' },
                    }}
                >
                    <LinkIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </Tooltip>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 0.75,
                            width: 320,
                            maxHeight: 380,
                            background: 'rgba(22, 26, 32, 0.98)',
                            border: '1px solid rgba(52, 58, 68, 0.65)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
                            overflow: 'hidden',
                        },
                    },
                }}
            >
                <Box sx={{ p: 1.5 }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#f1f5f9', mb: 0.35 }}>
                        Origins & links
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: '#64748b', lineHeight: 1.45, mb: 1 }}>
                        Blueprint / template = where this package came from. Inquiries & projects use this catalog package.
                    </Typography>

                    {traceQuery.isLoading && (
                        <Stack alignItems="center" sx={{ py: 3 }}>
                            <CircularProgress size={22} sx={{ color: '#475569' }} />
                            <Typography sx={{ mt: 1.25, fontSize: '0.75rem', color: '#64748b' }}>
                                Loading…
                            </Typography>
                        </Stack>
                    )}

                    {traceQuery.isError && (
                        <Typography sx={{ fontSize: '0.78rem', color: '#f87171' }}>
                            Could not load links. Try again.
                        </Typography>
                    )}

                    {!traceQuery.isLoading && !traceQuery.isError && data && (
                        <>
                            {emptyReady && (
                                <Typography sx={{ fontSize: '0.78rem', color: '#64748b', py: 1 }}>
                                    No blueprint lineage, creation template, inquiries, or projects are tied to this package yet.
                                </Typography>
                            )}

                            {!emptyReady && (
                                <Stack spacing={1.5} sx={{ maxHeight: 300, overflowY: 'auto', pr: 0.25 }}>
                                    {data.source_blueprint && (
                                        <Box>
                                            <SectionTitle>Source day blueprint</SectionTitle>
                                            <LinkRow
                                                primary={
                                                    <>
                                                        {data.source_blueprint.display_name}
                                                        {data.source_blueprint.version_number != null
                                                            ? ` · v${data.source_blueprint.version_number}`
                                                            : ''}
                                                    </>
                                                }
                                                secondary="View day design on this package"
                                                onNavigate={handleNavigateBlueprint}
                                            />
                                        </Box>
                                    )}

                                    {data.package_template && (
                                        <Box>
                                            {data.source_blueprint && <Divider sx={{ borderColor: 'rgba(52,58,68,0.6)', mb: 1 }} />}
                                            <SectionTitle>Created from</SectionTitle>
                                            <LinkRow
                                                primary={`Template · ${data.package_template.name}`}
                                                secondary="Preset used when this package was built · Opens Packages"
                                                onNavigate={handleNavigateTemplate}
                                            />
                                        </Box>
                                    )}

                                    {data.inquiries.length > 0 && (
                                        <Box>
                                            {(data.source_blueprint || data.package_template) && (
                                                <Divider sx={{ borderColor: 'rgba(52,58,68,0.6)', mb: 1 }} />
                                            )}
                                            <SectionTitle>Inquiries using this package</SectionTitle>
                                            <Stack spacing={0}>
                                                {data.inquiries.map((row) => (
                                                    <Box key={row.id}>
                                                        <LinkRow
                                                            primary={row.label}
                                                            secondary={
                                                                <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.25 }}>
                                                                    {row.roles.map((role) => (
                                                                        <Chip
                                                                            key={role}
                                                                            label={formatRoleLabel(role)}
                                                                            size="small"
                                                                            sx={{
                                                                                height: 18,
                                                                                fontSize: '0.58rem',
                                                                                fontWeight: 700,
                                                                                bgcolor: 'rgba(99,102,241,0.12)',
                                                                                color: '#a5b4fc',
                                                                                border: '1px solid rgba(99,102,241,0.25)',
                                                                                '& .MuiChip-label': { px: 0.75 },
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </Stack>
                                                            }
                                                            onNavigate={() => handleNavigateInquiry(row.id)}
                                                        />
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Box>
                                    )}

                                    {data.projects.length > 0 && (
                                        <Box>
                                            {(data.source_blueprint || data.package_template || data.inquiries.length > 0) && (
                                                <Divider sx={{ borderColor: 'rgba(52,58,68,0.6)', mb: 1 }} />
                                            )}
                                            <SectionTitle>Projects from this package</SectionTitle>
                                            <Stack spacing={0}>
                                                {data.projects.map((p) => (
                                                    <LinkRow
                                                        key={p.id}
                                                        primary={p.name?.trim() || `Project #${p.id}`}
                                                        secondary={
                                                            p.wedding_date ? `Event · ${formatWeddingDate(p.wedding_date)}` : undefined
                                                        }
                                                        onNavigate={() => handleNavigateProject(p.id)}
                                                    />
                                                ))}
                                            </Stack>
                                        </Box>
                                    )}
                                </Stack>
                            )}
                        </>
                    )}
                </Box>
            </Popover>
        </>
    );
}
