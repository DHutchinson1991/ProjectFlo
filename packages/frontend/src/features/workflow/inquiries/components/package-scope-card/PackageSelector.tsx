'use client';

import React from 'react';
import {
    Box,
    Typography,
    Chip,
    FormControl,
    Select,
    MenuItem,
    ListSubheader,
    Button,
    CircularProgress,
} from '@mui/material';
import { SwapHoriz } from '@mui/icons-material';
import { formatCurrency } from '@/features/workflow/proposals/utils/portal/formatting';
import type { PackageSelectorProps } from './types';

const PackageSelector: React.FC<PackageSelectorProps> = ({
    availablePackages,
    groupedBySet,
    packageSetInfoMap,
    assignPackageId,
    setAssignPackageId,
    assigning,
    onAssign,
    currencyCode,
    getEffectivePrice,
    excludePackageId,
    suggestedPackage,
    budgetRange,
    variant = 'assign',
    onCancel,
}) => {
    const isSwap = variant === 'swap';

    return (
        <Box sx={{
            px: isSwap ? 2 : 2.5,
            py: isSwap ? 1.5 : 2,
            ...(isSwap && {
                bgcolor: 'rgba(245,158,11,0.03)',
                borderBottom: '1px solid rgba(245,158,11,0.12)',
            }),
        }}>
            {isSwap && (
                <Typography sx={{ fontSize: '0.6rem', color: '#64748b', mb: 1, lineHeight: 1.4 }}>
                    Subject names, locations, and crew assignments will be preserved where roles match.
                </Typography>
            )}

            <FormControl fullWidth size="small" sx={isSwap ? undefined : { mb: 1.5 }}>
                <Select
                    value={assignPackageId}
                    displayEmpty
                    onChange={(e) => setAssignPackageId(e.target.value as number | '')}
                    renderValue={(val) => {
                        if (!val) return (
                            <Typography sx={{ color: '#475569', fontSize: isSwap ? '0.75rem' : '0.8rem' }}>
                                {isSwap ? 'Select new package…' : 'Select a package…'}
                            </Typography>
                        );
                        const pkg = availablePackages.find((p: { id: number }) => p.id === Number(val));
                        return <Typography sx={{ fontSize: isSwap ? '0.75rem' : '0.8rem', color: '#e2e8f0' }}>{pkg?.name ?? 'Unknown'}</Typography>;
                    }}
                    sx={{
                        color: '#e2e8f0',
                        bgcolor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 1.5,
                        '& .MuiSelect-icon': { color: '#64748b' },
                    }}
                    MenuProps={{
                        PaperProps: {
                            sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, maxHeight: 300 },
                        },
                    }}
                >
                    {groupedBySet.length > 0 ? (
                        groupedBySet.flatMap((group) => [
                            <ListSubheader
                                key={`header-${group.setName}`}
                                sx={{ bgcolor: '#1a1d24', color: 'text.secondary', fontWeight: 600, fontSize: '0.65rem', lineHeight: '24px', letterSpacing: '0.05em', textTransform: 'uppercase' }}
                            >
                                {group.setEmoji} {group.setName}
                            </ListSubheader>,
                            ...group.packages
                                .filter((pkg: { id: number }) => excludePackageId ? pkg.id !== excludePackageId : true)
                                .map((pkg: { id: number; name: string }) => {
                                    const info = packageSetInfoMap.get(pkg.id);
                                    return (
                                        <MenuItem key={pkg.id} value={pkg.id}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                <Typography variant="body2">{pkg.name}</Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    {info?.tierLabel && (
                                                        <Chip label={info.tierLabel} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem', borderRadius: 0.5 }} />
                                                    )}
                                                    <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace', ml: 0.5 }}>
                                                        {formatCurrency(getEffectivePrice(pkg), currencyCode)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </MenuItem>
                                    );
                                }),
                        ])
                    ) : (
                        <MenuItem disabled>
                            <Typography variant="body2" color="text.secondary">No active packages</Typography>
                        </MenuItem>
                    )}
                </Select>
            </FormControl>

            {/* Budget-based suggestion (assign mode only) */}
            {!isSwap && suggestedPackage && !assignPackageId && (
                <Box
                    onClick={() => setAssignPackageId(suggestedPackage.id)}
                    sx={{
                        px: 1.5, py: 1, mb: 1.5, borderRadius: 1.5, cursor: 'pointer',
                        bgcolor: 'rgba(100,140,255,0.06)', border: '1px solid rgba(100,140,255,0.15)',
                        '&:hover': { bgcolor: 'rgba(100,140,255,0.1)' },
                        display: 'flex', alignItems: 'center', gap: 1,
                    }}
                >
                    <Typography sx={{ fontSize: '0.68rem', color: '#818cf8' }}>💡</Typography>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.68rem', color: '#818cf8', fontWeight: 600 }}>
                            Suggested: {suggestedPackage.name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: '#64748b' }}>
                            {formatCurrency(getEffectivePrice(suggestedPackage), currencyCode)} — fits {budgetRange} budget
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* Action buttons */}
            {assignPackageId && (
                isSwap ? (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button
                            size="small"
                            onClick={onCancel}
                            sx={{ color: '#64748b', textTransform: 'none', fontSize: '0.7rem', flex: 1, borderRadius: 1 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="small"
                            variant="contained"
                            onClick={onAssign}
                            disabled={assigning}
                            startIcon={assigning ? <CircularProgress size={12} color="inherit" /> : <SwapHoriz sx={{ fontSize: 14 }} />}
                            sx={{
                                bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' },
                                textTransform: 'none', fontSize: '0.7rem', fontWeight: 600, flex: 1, borderRadius: 1,
                            }}
                        >
                            Confirm Swap
                        </Button>
                    </Box>
                ) : (
                    <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        onClick={onAssign}
                        disabled={assigning}
                        startIcon={assigning ? <CircularProgress size={14} color="inherit" /> : undefined}
                        sx={{
                            bgcolor: '#648CFF', '&:hover': { bgcolor: '#5A7BF0' },
                            borderRadius: 1.5, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem',
                        }}
                    >
                        Assign Package
                    </Button>
                )
            )}
        </Box>
    );
};

export default PackageSelector;
