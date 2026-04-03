'use client';

import React from 'react';
import { Box, Typography, CardContent, Chip } from '@mui/material';
import { Phone } from '@mui/icons-material';
import type { WorkflowCardProps } from '../../lib';
import { WorkflowCard } from '@/shared/ui/WorkflowCard';
import { useDiscoveryCallCard } from '../../hooks/use-discovery-call-card';
import SlotPicker from './SlotPicker';
import MeetingCard from './MeetingCard';
import ClientBookedCard from './ClientBookedCard';

const DiscoveryCallCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor, submission }) => {
    const {
        meetings,
        currentBrand,
        rescheduleMode,
        setRescheduleMode,
        isLoading,
        hasMeetingScheduled,
        showClientBookedState,
        latestMeeting,
        isConfirmed,
        wantsCall,
        declinedCall,
        defaultDuration,
        reqMethod,
        reqDate,
        reqTime,
        handleConfirmClientSlot,
        handleRescheduleSelect,
        handleScheduleViaSlots,
        handleToggleConfirm,
        handleDeleteMeeting,
        createEvent,
    } = useDiscoveryCallCard({ inquiry, onRefresh, submission });

    // -- Header chip --
    const headerChip = () => {
        if (hasMeetingScheduled) {
            return (
                <Chip
                    label={isConfirmed ? 'Confirmed' : 'Scheduled'}
                    size="small"
                    sx={{
                        height: 20, fontSize: '0.65rem', fontWeight: 700,
                        bgcolor: isConfirmed ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: isConfirmed ? '#10b981' : '#f59e0b',
                    }}
                />
            );
        }
        if (showClientBookedState) {
            return (
                <Chip label="Client Booked" size="small" sx={{
                    height: 20, fontSize: '0.65rem', fontWeight: 700,
                    bgcolor: 'rgba(59,130,246,0.1)', color: '#3b82f6',
                }} />
            );
        }
        return null;
    };

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <CardContent>
                {/* -- Header -- */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{
                            width: 28, height: 28, borderRadius: 1.5,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.15)',
                        }}>
                            <Phone sx={{ fontSize: 15, color: '#f59e0b' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#f1f5f9' }}>
                            Discovery Call
                        </Typography>
                        {headerChip()}
                    </Box>
                </Box>

                {/* STATE A -- Meeting already exists */}
                {hasMeetingScheduled && !rescheduleMode && (
                    <Box>
                        {meetings.map((meeting) => (
                            <MeetingCard
                                key={meeting.id}
                                meeting={meeting}
                                isConfirmed={isConfirmed}
                                isLoading={isLoading}
                                onToggleConfirm={handleToggleConfirm}
                                onReschedule={() => setRescheduleMode(true)}
                                onDelete={handleDeleteMeeting}
                            />
                        ))}
                    </Box>
                )}

                {/* Reschedule slot picker (from meeting-exists state) */}
                {hasMeetingScheduled && rescheduleMode && currentBrand?.id && (
                    <Box>
                        <Box sx={{ mb: 1.5, p: 1.25, borderRadius: 2, bgcolor: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
                            <Typography sx={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>
                                Pick a new time for the discovery call
                            </Typography>
                        </Box>
                        <SlotPicker
                            brandId={currentBrand.id}
                            initialDate={latestMeeting ? new Date(latestMeeting.start_time).toISOString().slice(0, 10) : undefined}
                            duration={defaultDuration}
                            onSelect={handleRescheduleSelect}
                            onCancel={() => setRescheduleMode(false)}
                            isLoading={isLoading}
                        />
                    </Box>
                )}

                {/* STATE B -- Client booked a specific slot */}
                {showClientBookedState && !rescheduleMode && (
                    <ClientBookedCard
                        reqDate={reqDate}
                        reqTime={reqTime}
                        reqMethod={reqMethod}
                        isLoading={isLoading}
                        onConfirm={handleConfirmClientSlot}
                        onReschedule={() => setRescheduleMode(true)}
                    />
                )}

                {/* Client-booked reschedule slot picker */}
                {showClientBookedState && rescheduleMode && currentBrand?.id && (
                    <Box>
                        <Box sx={{ mb: 1.5, p: 1.25, borderRadius: 2, bgcolor: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
                            <Typography sx={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>
                                Pick a new time for the discovery call
                            </Typography>
                        </Box>
                        <SlotPicker
                            brandId={currentBrand.id}
                            initialDate={reqDate}
                            duration={defaultDuration}
                            onSelect={(date, time, opId) => createEvent(date, time, true, opId)}
                            onCancel={() => setRescheduleMode(false)}
                            isLoading={isLoading}
                        />
                    </Box>
                )}

                {/* STATE C -- No meeting, no specific slot */}
                {!hasMeetingScheduled && !showClientBookedState && !rescheduleMode && (
                    <Box>
                        {/* Status banners */}
                        {wantsCall && (
                            <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                                <Typography sx={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
                                    Client requested a discovery call
                                </Typography>
                            </Box>
                        )}
                        {!wantsCall && !declinedCall && (
                            <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.1)' }}>
                                <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                                    No call preference received
                                </Typography>
                                <Typography sx={{ fontSize: '0.7rem', color: '#64748b', mt: 0.25 }}>
                                    You can still schedule a discovery call below
                                </Typography>
                            </Box>
                        )}
                        {declinedCall && (
                            <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(100,116,139,0.04)', border: '1px solid rgba(100,116,139,0.1)' }}>
                                <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
                                    Client declined a discovery call
                                </Typography>
                                <Typography sx={{ fontSize: '0.68rem', color: '#475569', mt: 0.25 }}>
                                    You can still schedule one if needed
                                </Typography>
                            </Box>
                        )}

                        {/* Slot-based scheduler */}
                        {currentBrand?.id ? (
                            <SlotPicker
                                brandId={currentBrand.id}
                                duration={defaultDuration}
                                onSelect={handleScheduleViaSlots}
                                onCancel={() => {}}
                                isLoading={isLoading}
                                confirmLabel="Schedule Call"
                                showCancel={false}
                            />
                        ) : (
                            <Box sx={{ py: 3, textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '0.76rem', color: '#475569' }}>
                                    No discovery calls scheduled yet
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </CardContent>
        </WorkflowCard>
    );
};

export default DiscoveryCallCard;
