import React from 'react';
import {
    MicNone,
    NoteAltOutlined,
    Handshake,
    Search,
    Extension,
    TaskAlt,
} from '@mui/icons-material';

// ─── Journey step config ───────────────────────────────────────────────────────

export const STEP_META: Record<string, { icon: React.ReactNode; accent: string }> = {
    'Call Opening': { icon: <MicNone sx={{ fontSize: 16 }} />, accent: '#06b6d4' },
    'The Connection': { icon: <Handshake sx={{ fontSize: 16 }} />, accent: '#3b82f6' },
    'The Discovery': { icon: <Search sx={{ fontSize: 16 }} />, accent: '#a855f7' },
    'The Solution': { icon: <Extension sx={{ fontSize: 16 }} />, accent: '#10b981' },
    'The Close': { icon: <TaskAlt sx={{ fontSize: 16 }} />, accent: '#f59e0b' },
};

const DEFAULT_STEP_META = { icon: <NoteAltOutlined sx={{ fontSize: 16 }} />, accent: '#64748b' };

export function getStepMeta(section: string) {
    return STEP_META[section] ?? DEFAULT_STEP_META;
}

// ─── Phase-specific right-panel widget definitions ─────────────────────────────

export type WidgetType = 'pills' | 'multi-chip' | 'tag-chips' | 'toggle' | 'checklist' | 'date-picker';

export interface PhaseWidget {
    key: string;
    label: string;
    type: WidgetType;
    options?: string[];
    /** Colour map for pill options: option → hex */
    colors?: Record<string, string>;
    placeholder?: string;
}

interface PhaseConfig {
    section: string;
    widgets: PhaseWidget[];
}

const PHASE_WIDGETS: PhaseConfig[] = [
    {
        section: 'Call Opening',
        widgets: [
            {
                key: 'first_impression',
                label: 'First Impression',
                type: 'pills',
                options: ['Warm', 'Neutral', 'Guarded'],
                colors: { Warm: '#10b981', Neutral: '#f59e0b', Guarded: '#ef4444' },
            },
            {
                key: 'energy_level',
                label: 'Energy Level',
                type: 'pills',
                options: ['Enthusiastic', 'Calm', 'Flat'],
                colors: { Enthusiastic: '#10b981', Calm: '#3b82f6', Flat: '#64748b' },
            },
            {
                key: 'who_on_call',
                label: "Who's on the Call",
                type: 'multi-chip',
                options: ['Both partners', 'One partner', 'With planner', 'With parent'],
            },
        ],
    },
    {
        section: 'The Connection',
        widgets: [
            {
                key: 'connection_quality',
                label: 'Connection Quality',
                type: 'pills',
                options: ['Strong', 'Building', 'Distant'],
                colors: { Strong: '#10b981', Building: '#f59e0b', Distant: '#ef4444' },
            },
            {
                key: 'couple_dynamic',
                label: 'Couple Dynamic',
                type: 'pills',
                options: ['Both engaged', 'One leading', 'One quiet'],
                colors: { 'Both engaged': '#10b981', 'One leading': '#f59e0b', 'One quiet': '#64748b' },
            },
            {
                key: 'communication_style',
                label: 'Communication Style',
                type: 'pills',
                options: ['Storytellers', 'Detail-oriented', 'Big picture', 'Visual'],
                colors: { Storytellers: '#a855f7', 'Detail-oriented': '#3b82f6', 'Big picture': '#f59e0b', Visual: '#06b6d4' },
            },
            {
                key: 'emotional_temperature',
                label: 'Emotional Temperature',
                type: 'pills',
                options: ['Excited & chatty', 'Polite & reserved', 'Nervous'],
                colors: { 'Excited & chatty': '#10b981', 'Polite & reserved': '#3b82f6', Nervous: '#f59e0b' },
            },
            {
                key: 'wedding_vibe',
                label: 'Wedding Vibe',
                type: 'multi-chip',
                options: ['Romantic', 'Party', 'Intimate', 'Grand', 'Adventurous', 'Traditional', 'Relaxed', 'Elegant'],
            },
        ],
    },
    {
        section: 'The Discovery',
        widgets: [
            {
                key: 'vision_clarity',
                label: 'Vision Clarity',
                type: 'pills',
                options: ['Crystal clear', 'Forming', 'Uncertain'],
                colors: { 'Crystal clear': '#10b981', Forming: '#f59e0b', Uncertain: '#64748b' },
            },
            {
                key: 'excitement',
                label: 'Excitement',
                type: 'pills',
                options: ['High', 'Moderate', 'Low'],
                colors: { High: '#10b981', Moderate: '#f59e0b', Low: '#ef4444' },
            },
            {
                key: 'style_match',
                label: 'Style Match',
                type: 'pills',
                options: ['Perfect fit', 'Adaptable', 'Mismatch'],
                colors: { 'Perfect fit': '#10b981', Adaptable: '#f59e0b', Mismatch: '#ef4444' },
            },
            {
                key: 'must_haves',
                label: 'Must-Haves',
                type: 'tag-chips',
                placeholder: 'e.g. Drone shots, First look…',
            },
            {
                key: 'dealbreakers',
                label: 'Dealbreakers',
                type: 'tag-chips',
                placeholder: 'e.g. No posed, No same-day edit…',
            },
            {
                key: 'inspiration_sources',
                label: 'Inspiration Sources',
                type: 'multi-chip',
                options: ['Pinterest', 'Instagram', 'Other films', 'Word of mouth', 'None yet'],
            },
        ],
    },
    {
        section: 'The Solution',
        widgets: [
            {
                key: 'budget_comfort',
                label: 'Budget Comfort',
                type: 'pills',
                options: ['Comfortable', 'Stretching', 'Concerned'],
                colors: { Comfortable: '#10b981', Stretching: '#f59e0b', Concerned: '#ef4444' },
            },
            {
                key: 'package_reaction',
                label: 'Package Reaction',
                type: 'pills',
                options: ['Love it', 'Interested', 'Hesitant', 'Too much'],
                colors: { 'Love it': '#10b981', Interested: '#3b82f6', Hesitant: '#f59e0b', 'Too much': '#ef4444' },
            },
            {
                key: 'price_sensitivity',
                label: 'Price Sensitivity',
                type: 'pills',
                options: ['Value-focused', 'Price-focused', 'Flexible'],
                colors: { 'Value-focused': '#3b82f6', 'Price-focused': '#f59e0b', Flexible: '#10b981' },
            },
            {
                key: 'objections_raised',
                label: 'Objections Raised',
                type: 'tag-chips',
                placeholder: 'e.g. budget tight, comparing others…',
            },
            {
                key: 'addon_interest',
                label: 'Add-on Interest',
                type: 'multi-chip',
                options: ['Raw footage', 'Extra hours', 'Same-day edit', 'Photo+video', 'Albums', 'Engagement shoot'],
            },
            {
                key: 'flexibility_signal',
                label: 'Flexibility Signal',
                type: 'pills',
                options: ['Fixed on package', 'Open to customise', 'Wants stripped back'],
                colors: { 'Fixed on package': '#3b82f6', 'Open to customise': '#10b981', 'Wants stripped back': '#f59e0b' },
            },
        ],
    },
    {
        section: 'The Close',
        widgets: [
            {
                key: 'decision_readiness',
                label: 'Decision Readiness',
                type: 'pills',
                options: ['Ready to book', 'Warm — needs time', 'Early stage'],
                colors: { 'Ready to book': '#10b981', 'Warm — needs time': '#f59e0b', 'Early stage': '#64748b' },
            },
            {
                key: 'booking_likelihood',
                label: 'Booking Likelihood',
                type: 'pills',
                options: ['Very likely', 'Possible', 'Unlikely'],
                colors: { 'Very likely': '#10b981', Possible: '#f59e0b', Unlikely: '#ef4444' },
            },
            {
                key: 'red_flags',
                label: 'Red Flags',
                type: 'pills',
                options: ['None', 'Minor', 'Significant'],
                colors: { None: '#10b981', Minor: '#f59e0b', Significant: '#ef4444' },
            },
            {
                key: 'urgency',
                label: 'Urgency',
                type: 'pills',
                options: ['Book this week', 'Within a month', 'No rush', 'Date pressure'],
                colors: { 'Book this week': '#10b981', 'Within a month': '#3b82f6', 'No rush': '#64748b', 'Date pressure': '#f59e0b' },
            },
            {
                key: 'agreed_next_steps',
                label: 'Agreed Next Steps',
                type: 'checklist',
                options: ['Send proposal', 'Send contract', 'Follow-up call', 'Send samples', "They'll discuss & reply"],
            },
            {
                key: 'blocking_factor',
                label: 'Blocking Factor',
                type: 'pills',
                options: ['None', 'Budget', 'Partner buy-in', 'Comparing others', 'Date conflict'],
                colors: { None: '#10b981', Budget: '#f59e0b', 'Partner buy-in': '#f59e0b', 'Comparing others': '#ef4444', 'Date conflict': '#64748b' },
            },
            {
                key: 'follow_up_date',
                label: 'Follow-up Date',
                type: 'date-picker',
            },
        ],
    },
];

export function getPhaseWidgets(sectionName: string): PhaseWidget[] {
    return PHASE_WIDGETS.find((p) => p.section === sectionName)?.widgets ?? [];
}
