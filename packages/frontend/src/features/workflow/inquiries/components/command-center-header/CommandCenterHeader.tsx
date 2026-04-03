'use client';

import React from 'react';
import { Box } from '@mui/material';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { useBrand } from '@/features/platform/brand';
import ContactInfo from './ContactInfo';
import MetricsPills from './MetricsPills';
import HeaderActions from './HeaderActions';
import type { CommandCenterHeaderProps } from './types';

export type { CommandCenterHeaderProps } from './types';

export default function CommandCenterHeader({
    inquiry,
    inquiryTasks,
    needsAssessmentSubmission,
    conversionData,
    dealValue,
    onRefresh,
    onSnackbar,
}: CommandCenterHeaderProps) {
    const { currentBrand } = useBrand();
    const currencyCode = currentBrand?.currency ?? DEFAULT_CURRENCY;
    const validityDays = currentBrand?.inquiry_validity_days ?? 14;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                mb: 2,
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(16, 18, 24, 0.92), rgba(20, 22, 30, 0.85))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(52, 58, 68, 0.25)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(52, 58, 68, 0.08)',
                overflow: 'hidden',
            }}
        >
            {/* ===== TOP ROW: Identity + Contact + Metrics + Actions ===== */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    px: 2.5,
                    py: 2,
                }}
            >
                {/* Contact info (avatar + name + email + phone) */}
                <ContactInfo
                    inquiry={inquiry}
                    conversionData={conversionData}
                    onRefresh={onRefresh}
                    onSnackbar={onSnackbar}
                />

                {/* Right side: metrics pills + action buttons */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0, ml: 'auto' }}>
                    <MetricsPills
                        inquiry={inquiry}
                        needsAssessmentSubmission={needsAssessmentSubmission}
                        conversionData={conversionData}
                        dealValue={dealValue}
                        currencyCode={currencyCode}
                        validityDays={validityDays}
                    />
                    <HeaderActions
                        inquiry={inquiry}
                        inquiryTasks={inquiryTasks}
                        submission={needsAssessmentSubmission}
                        onRefresh={onRefresh}
                        onSnackbar={onSnackbar}
                    />
                </Box>
            </Box>
        </Box>
    );
}
