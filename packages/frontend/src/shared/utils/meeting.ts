/**
 * Meeting utilities — method mapping, icons, slot formatting.
 */
import React from 'react';
import { Phone, Videocam, PhoneInTalk, PersonPin } from '@mui/icons-material';

/** Map a free-text method string to a canonical MeetingType enum value. */
export const mapMethodToMeetingType = (method?: string): 'VIDEO_CALL' | 'PHONE_CALL' | 'IN_PERSON' | undefined => {
    if (!method) return undefined;
    const lower = method.toLowerCase();
    if (lower.includes('video')) return 'VIDEO_CALL';
    if (lower.includes('phone')) return 'PHONE_CALL';
    if (lower.includes('person')) return 'IN_PERSON';
    return undefined;
};

/** Return an icon element for a meeting method string. */
export const getMethodIcon = (method: string) => {
    const lower = (method || '').toLowerCase();
    if (lower.includes('video') || lower.includes('zoom') || lower.includes('teams')) return React.createElement(Videocam, { sx: { fontSize: 14 } });
    if (lower.includes('phone') || lower.includes('call')) return React.createElement(PhoneInTalk, { sx: { fontSize: 14 } });
    if (lower.includes('person') || lower.includes('meet')) return React.createElement(PersonPin, { sx: { fontSize: 14 } });
    return React.createElement(Phone, { sx: { fontSize: 14 } });
};
