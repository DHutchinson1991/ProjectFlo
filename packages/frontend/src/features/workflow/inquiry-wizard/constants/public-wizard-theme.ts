import { keyframes } from '@mui/material/styles';
import type { WizardStep } from '../types';

export const fadeInUp = keyframes`
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
`;
export const fadeIn = keyframes`
    from { opacity: 0; }
    to   { opacity: 1; }
`;
export const scaleIn = keyframes`
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
`;
export const shimmer = keyframes`
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
`;
export const float = keyframes`
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50%      { transform: translateY(-14px) rotate(1deg); }
`;
export const gradientShift = keyframes`
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
`;
export const subtleFloat = keyframes`
    0%, 100% { transform: translateY(0) scale(1); }
    50%      { transform: translateY(-8px) scale(1.02); }
`;

export function getColors() {
    return {
        bg: '#0c0c10', card: '#16161e', text: '#fafafa', muted: '#b0b0be',
        accent: '#7c4dff', border: '#2a2a38', accentSoft: '#1e1b4b',
        gradient1: '#7c4dff', gradient2: '#a855f7',
    };
}
export type PortalColors = ReturnType<typeof getColors>;

export { getCurrencySymbol } from '@/shared/utils/formatUtils';

export const CONTACT_TIME_OPTIONS = [
    'Morning (8am–12pm)', 'Afternoon (12pm–5pm)', 'Evening (5pm–9pm)', 'Flexible',
];

export const LOCATION_FIELD_KEYS = new Set([
    'ceremony_location', 'bridal_prep_location', 'groom_prep_location', 'reception_location',
]);

export const DEFAULT_STEPS: WizardStep[] = [
    { key: 'contact', label: 'You', description: 'Tell us a little about yourself' },
    { key: 'event', label: 'Your Wedding', description: 'Event details' },
    { key: 'coverage', label: 'Coverage', description: "What you'd like captured" },
    { key: 'budget', label: 'Budget', description: 'Investment range' },
    { key: 'package', label: 'Package', description: 'Choose your package', type: 'package_select' },
    { key: 'reach', label: 'Reach You', description: 'How did you find us?' },
    { key: 'call', label: 'Discovery Call', description: "How would you like to connect?", type: 'discovery_call' },
];

export function makeFieldSx(colors: PortalColors) {
    return {
        '& .MuiOutlinedInput-root': {
            color: colors.text, borderRadius: '12px', fontSize: '0.925rem',
            bgcolor: `rgba(0,0,0,0.3)`, backdropFilter: 'blur(8px)',
            '& fieldset': { borderColor: `${colors.border}99` },
            '&:hover fieldset': { borderColor: `${colors.accent}66` },
            '&.Mui-focused fieldset': { borderColor: colors.accent, borderWidth: '1.5px' },
        },
        '& .MuiInputLabel-root': { color: colors.muted, fontSize: '0.875rem' },
        '& .MuiInputLabel-root.Mui-focused': { color: colors.accent },
        '& .MuiFormHelperText-root.Mui-error': { color: '#ef4444' },
    };
}

export function makeCardSx(colors: PortalColors) {
    return {
        bgcolor: `${colors.card}b3`, backdropFilter: 'blur(20px) saturate(1.5)',
        border: `1px solid ${colors.border}99`, borderRadius: 4, overflow: 'hidden',
        position: 'relative' as const, transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        '&:hover': { borderColor: `${colors.accent}33`, transform: 'translateY(-2px)' },
    };
}

export function revealSx(visible: boolean, delay = 0) {
    return {
        opacity: visible ? 1 : 0,
        animation: visible ? `${fadeInUp} 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both` : 'none',
    };
}
