import React from 'react';
import { keyframes } from '@mui/material/styles';
import { Phone, Videocam, PhoneInTalk, PersonPin } from '@mui/icons-material';

/* -- Animations -- */
export const chipBounce = keyframes`
    0%   { transform: scale(1); }
    40%  { transform: scale(1.07); }
    100% { transform: scale(1); }
`;

/* -- Types -- */
export type SlotInfo = { time: string; available: boolean; operator_id?: number };

/* -- Helpers -- */
export function formatSlotLabel(time: string): string {
    if (!time || !time.includes(':')) return time;
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'pm' : 'am';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, '0')}${suffix}`;
}

export const mapMethodToMeetingType = (method?: string): 'VIDEO_CALL' | 'PHONE_CALL' | 'IN_PERSON' | undefined => {
    if (!method) return undefined;
    const lower = method.toLowerCase();
    if (lower.includes('video')) return 'VIDEO_CALL';
    if (lower.includes('phone')) return 'PHONE_CALL';
    if (lower.includes('person')) return 'IN_PERSON';
    return undefined;
};

export const getMethodIcon = (method: string) => {
    const lower = (method || '').toLowerCase();
    if (lower.includes('video') || lower.includes('zoom') || lower.includes('teams')) return React.createElement(Videocam, { sx: { fontSize: 14 } });
    if (lower.includes('phone') || lower.includes('call')) return React.createElement(PhoneInTalk, { sx: { fontSize: 14 } });
    if (lower.includes('person') || lower.includes('meet')) return React.createElement(PersonPin, { sx: { fontSize: 14 } });
    return React.createElement(Phone, { sx: { fontSize: 14 } });
};
