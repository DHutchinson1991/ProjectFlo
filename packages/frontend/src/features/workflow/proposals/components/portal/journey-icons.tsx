import React from 'react';
import SvgIcon, { type SvgIconProps } from '@mui/material/SvgIcon';

/* ── Inquiry Phase Icons ─────────────────────────────────── */

export function ClipboardSparkleIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <path d="M9 2a1 1 0 0 0-1 1H6a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2a1 1 0 0 0-1-1H9Zm0 1.5h6a.5.5 0 0 1 0 1H9a.5.5 0 0 1 0-1Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M17.5 1l.5 1.5L19.5 3l-1.5.5L17.5 5l-.5-1.5L15.5 3l1.5-.5Z" fill="currentColor" opacity="0.7" />
        </SvgIcon>
    );
}

export function PersonCheckIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <circle cx="10" cy="7" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 20c0-3.5 3.1-6 7-6s7 2.5 7 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M17 10l1.5 1.5L21.5 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </SvgIcon>
    );
}

export function CalendarPinIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="17" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 2v3M16 2v3M3 9h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="15" r="2" fill="currentColor" opacity="0.6" />
        </SvgIcon>
    );
}

export function FilmPackageIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <rect x="3" y="6" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 10h18M8 6v14M16 6v14" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
            <path d="M10 2h4l1 4H9Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </SvgIcon>
    );
}

export function CrewSearchIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <circle cx="7" cy="8" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="14" cy="8" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 18c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5M9 18c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="19.5" cy="19.5" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M21 21l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </SvgIcon>
    );
}

export function CameraSearchIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <path d="M2 8a2 2 0 0 1 2-2h3l1.5-2h5L15 6h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="11" cy="13" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="20" cy="18" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M21.5 19.5l1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </SvgIcon>
    );
}

export function CameraCheckIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <path d="M2 8a2 2 0 0 1 2-2h3l1.5-2h5L15 6h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="11" cy="13" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M17 9l1.5 1.5L22 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </SvgIcon>
    );
}

export function HandshakeIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <path d="M2 11l4-5h3l3 3 3-3h3l4 5-5 6h-2l-3-2-3 2H7Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M9 14l3-3 3 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </SvgIcon>
    );
}

/* ── Discovery Icons ─────────────────────────────────────── */

export function PhoneCalendarIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <path d="M5 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M3 9h8M13 14h7M13 10h7M13 18h7M7 4V2M9 4V2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <rect x="13" y="7" width="8" height="14" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </SvgIcon>
    );
}

export function ChatCheckIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 3V6a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M8 11l2.5 2.5L15 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </SvgIcon>
    );
}

/* ── Booking Phase Icons ─────────────────────────────────── */

export function StarBadgeIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <path d="M12 2l2.4 4.8L20 7.6l-4 3.9.9 5.5L12 14.5 7.1 17l.9-5.5-4-3.9 5.6-.8Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </SvgIcon>
    );
}

export function CalculatorIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <rect x="4" y="2" width="16" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <rect x="6" y="4" width="12" height="4" rx="1" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" />
            <circle cx="8" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="16" cy="12" r="1" fill="currentColor" />
            <circle cx="8" cy="16" r="1" fill="currentColor" /><circle cx="12" cy="16" r="1" fill="currentColor" /><circle cx="16" cy="16" r="1" fill="currentColor" />
            <circle cx="8" cy="19.5" r="1" fill="currentColor" /><rect x="11" y="18.5" width="6" height="2" rx="1" fill="currentColor" opacity="0.5" />
        </SvgIcon>
    );
}

export function DocumentScrollIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 8h8M8 12h6M8 16h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        </SvgIcon>
    );
}

export function ThumbsUpSparkleIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <path d="M7 22V11l3.5-7a1.5 1.5 0 0 1 2.8.7L12 9h6.5a2 2 0 0 1 1.9 2.6l-2.4 7A2 2 0 0 1 16.1 20H7Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <rect x="2" y="11" width="5" height="11" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M19 3l.5 1.5L21 5l-1.5.5L19 7l-.5-1.5L17 5l1.5-.5Z" fill="currentColor" opacity="0.6" />
        </SvgIcon>
    );
}

export function QuillScrollIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 8h8M8 12h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
            <path d="M15 12l5-8-2 5 3 1-5 8 2-5Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </SvgIcon>
    );
}

export function StampSealIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" />
            <path d="M12 7V4M12 20v-3M7 12H4M20 12h-3M8.5 8.5L6.5 6.5M17.5 17.5l-2-2M8.5 15.5l-2 2M17.5 6.5l-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </SvgIcon>
    );
}

export function ConfettiIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <path d="M4 21L10 3l4 8 8 4Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M7.5 14.5l2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="17" cy="5" r="1" fill="currentColor" opacity="0.5" />
            <circle cx="20" cy="10" r="0.8" fill="currentColor" opacity="0.5" />
            <circle cx="14" cy="2" r="0.8" fill="currentColor" opacity="0.5" />
            <path d="M19 14l1 2M21 8l1.5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        </SvgIcon>
    );
}

/* ── Post-Booking Phase Icons ────────────────────────────── */

export function GiftOpenIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <rect x="3" y="10" width="18" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <rect x="2" y="7" width="20" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 7v14" stroke="currentColor" strokeWidth="1.2" />
            <path d="M12 7C10 7 8 5 8 3.5S9.5 2 10.5 2C12 2 12 4 12 7ZM12 7c2 0 4-2 4-3.5S14.5 2 13.5 2C12 2 12 4 12 7Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </SvgIcon>
    );
}

export function ClapperboardPencilIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <rect x="2" y="6" width="20" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 6l4-4h12l4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M8 2l2 4M14 2l2 4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M16 12l-6 6-.5 2 2-.5 6-6Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </SvgIcon>
    );
}

export function StoryboardIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <rect x="2" y="3" width="9" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <rect x="13" y="3" width="9" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <rect x="2" y="14" width="9" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <rect x="13" y="14" width="9" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 6l3 2M16 6l3 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
        </SvgIcon>
    );
}

export function FilmReelIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="5.5" r="1.5" fill="currentColor" opacity="0.4" />
            <circle cx="12" cy="18.5" r="1.5" fill="currentColor" opacity="0.4" />
            <circle cx="5.5" cy="12" r="1.5" fill="currentColor" opacity="0.4" />
            <circle cx="18.5" cy="12" r="1.5" fill="currentColor" opacity="0.4" />
        </SvgIcon>
    );
}

export function ScissorsFilmIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <circle cx="6" cy="6" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="6" cy="18" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8.5 8l12 8M8.5 16l12-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="17" y="4" width="5" height="3" rx="0.5" fill="currentColor" opacity="0.3" />
            <rect x="17" y="9" width="5" height="3" rx="0.5" fill="currentColor" opacity="0.3" />
        </SvgIcon>
    );
}

/* ── Icon Registry ───────────────────────────────────────── */

const ICON_MAP: Record<string, React.ComponentType<SvgIconProps>> = {
    'clipboard-sparkle': ClipboardSparkleIcon,
    'person-check': PersonCheckIcon,
    'calendar-pin': CalendarPinIcon,
    'film-package': FilmPackageIcon,
    'crew-search': CrewSearchIcon,
    'camera-search': CameraSearchIcon,
    'camera-check': CameraCheckIcon,
    'handshake': HandshakeIcon,
    'phone-calendar': PhoneCalendarIcon,
    'chat-check': ChatCheckIcon,
    'star-badge': StarBadgeIcon,
    'calculator': CalculatorIcon,
    'document-scroll': DocumentScrollIcon,
    'thumbs-up-sparkle': ThumbsUpSparkleIcon,
    'quill-scroll': QuillScrollIcon,
    'stamp-seal': StampSealIcon,
    'confetti': ConfettiIcon,
    'gift-open': GiftOpenIcon,
    'clapperboard-pencil': ClapperboardPencilIcon,
    'storyboard': StoryboardIcon,
    'film-reel': FilmReelIcon,
    'scissors-film': ScissorsFilmIcon,
};

export function getJourneyIcon(key: string): React.ComponentType<SvgIconProps> {
    return ICON_MAP[key] ?? ClipboardSparkleIcon;
}
