import { alpha } from "@mui/material/styles";
import { ScreenId, EventTypeConfig } from "../types";

/* ── Colour palette ──────────────────────────────────────────── */
export const C = {
    bg: "#0c0c10", card: "#16161e", text: "#fafafa", muted: "#b0b0be",
    accent: "#7c4dff", border: "#2a2a38", gradient1: "#7c4dff", gradient2: "#a855f7",
    success: "#22c55e",
};

/* ── Shared MUI field / card style helpers ───────────────────── */
export const fieldSx = {
    "& .MuiOutlinedInput-root": {
        color: C.text, borderRadius: "14px", fontSize: "1rem",
        bgcolor: alpha(C.card, 0.6), backdropFilter: "blur(8px)",
        "& fieldset": { borderColor: alpha(C.border, 0.6) },
        "&:hover fieldset": { borderColor: alpha(C.accent, 0.4) },
        "&.Mui-focused fieldset": { borderColor: C.accent, borderWidth: "1.5px" },
    },
    "& .MuiInputLabel-root": { color: C.muted },
    "& .MuiInputLabel-root.Mui-focused": { color: C.accent },
};

export const glassSx = {
    bgcolor: alpha(C.card, 0.55), backdropFilter: "blur(24px) saturate(1.8)",
    border: `1px solid ${alpha(C.border, 0.6)}`, borderRadius: 4,
    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
};

/* ── Per-screen ambient colour palette ──────────────────────── */
export const STEP_AMBIENCE: Record<string, { c1: string; c2: string; c1pos: string; c2pos: string }> = {
    welcome:      { c1: "#7c4dff", c2: "#a855f7", c1pos: "top: 20%; right: 10%", c2pos: "bottom: 15%; left: 8%" },
    event_type:   { c1: "#e879f9", c2: "#7c4dff", c1pos: "top: 10%; left: 12%",  c2pos: "bottom: 20%; right: 6%" },
    date:         { c1: "#38bdf8", c2: "#818cf8", c1pos: "top: 18%; right: 15%", c2pos: "bottom: 12%; left: 10%" },
    guests:       { c1: "#f472b6", c2: "#c084fc", c1pos: "top: 25%; left: 5%",   c2pos: "bottom: 8%; right: 12%" },
    partner:      { c1: "#fb7185", c2: "#e879f9", c1pos: "top: 12%; right: 8%",  c2pos: "bottom: 18%; left: 15%" },
    birthday_contact: { c1: "#fb923c", c2: "#f472b6", c1pos: "top: 15%; left: 10%", c2pos: "bottom: 15%; right: 10%" },
    venue:        { c1: "#34d399", c2: "#38bdf8", c1pos: "top: 8%; right: 12%",  c2pos: "bottom: 22%; left: 6%" },
    fork:         { c1: "#a78bfa", c2: "#f472b6", c1pos: "top: 22%; left: 8%",   c2pos: "bottom: 10%; right: 15%" },
    budget:       { c1: "#fbbf24", c2: "#f472b6", c1pos: "top: 15%; right: 5%",  c2pos: "bottom: 20%; left: 12%" },
    packages:     { c1: "#c084fc", c2: "#38bdf8", c1pos: "top: 10%; left: 15%",  c2pos: "bottom: 15%; right: 8%" },
    activities:   { c1: "#34d399", c2: "#a78bfa", c1pos: "top: 20%; right: 10%", c2pos: "bottom: 12%; left: 15%" },
    coverage:     { c1: "#38bdf8", c2: "#34d399", c1pos: "top: 12%; left: 10%",  c2pos: "bottom: 18%; right: 8%" },
    deliverables: { c1: "#e879f9", c2: "#fb7185", c1pos: "top: 18%; right: 12%", c2pos: "bottom: 8%; left: 10%" },
    operators:    { c1: "#818cf8", c2: "#38bdf8", c1pos: "top: 10%; left: 8%",   c2pos: "bottom: 15%; right: 15%" },
    builder:      { c1: "#e879f9", c2: "#f472b6", c1pos: "top: 15%; left: 10%",  c2pos: "bottom: 12%; right: 8%" },
    payment_terms: { c1: "#fbbf24", c2: "#c084fc", c1pos: "top: 18%; right: 8%",  c2pos: "bottom: 12%; left: 12%" },
    special:      { c1: "#fbbf24", c2: "#fb923c", c1pos: "top: 22%; right: 6%",  c2pos: "bottom: 10%; left: 12%" },
    source:       { c1: "#a78bfa", c2: "#34d399", c1pos: "top: 15%; left: 12%",  c2pos: "bottom: 20%; right: 8%" },
    call_offer:   { c1: "#38bdf8", c2: "#7c4dff", c1pos: "top: 12%; right: 10%", c2pos: "bottom: 15%; left: 10%" },
    call_details: { c1: "#38bdf8", c2: "#c084fc", c1pos: "top: 18%; left: 6%",   c2pos: "bottom: 12%; right: 12%" },
    contact:      { c1: "#7c4dff", c2: "#a855f7", c1pos: "top: 20%; right: 8%",  c2pos: "bottom: 15%; left: 10%" },
    summary:      { c1: "#22c55e", c2: "#38bdf8", c1pos: "top: 10%; left: 10%",  c2pos: "bottom: 18%; right: 10%" },
};
export const DEFAULT_AMB = { c1: "#7c4dff", c2: "#a855f7", c1pos: "top: 20%; right: 10%", c2pos: "bottom: 15%; left: 8%" };

/* ── Event configs ──────────────────────────────────────────── */
export const EVENT_CONFIGS: Record<string, EventTypeConfig> = {
    wedding: {
        dateLabel: "When's the big day?",
        guestsLabel: "How big is the celebration?",
        showGuests: true,
        guestsOptions: [
            { label: "Intimate", desc: "Under 50",   value: "Under 50" },
            { label: "Classic",  desc: "50 – 150",   value: "50 – 150" },
            { label: "Grand",    desc: "150 – 300",  value: "150 – 300" },
            { label: "Epic",     desc: "300+",        value: "300+" },
        ],
        showPartner: true, partnerLabel: "What's your partner's name?",
        venueLabel: "Where's the ceremony?",
        activities: [
            { key: "getting_ready",  label: "Getting Ready",       emoji: "✨" },
            { key: "first_look",     label: "First Look",          emoji: "👀" },
            { key: "ceremony",       label: "Ceremony",            emoji: "💍" },
            { key: "cocktail_hour",  label: "Cocktail Hour",       emoji: "🥂" },
            { key: "reception",      label: "Reception & Party",   emoji: "🎉" },
            { key: "first_dance",    label: "First Dance",         emoji: "💃" },
            { key: "speeches",       label: "Speeches & Toasts",   emoji: "🎤" },
            { key: "grand_exit",     label: "Grand Exit",          emoji: "🎆" },
            { key: "golden_hour",    label: "Golden Hour",         emoji: "🌅" },
        ],
    },
    birthday: {
        dateLabel: "When's the celebration?",
        guestsLabel: "How many guests?",
        showGuests: true,
        guestsOptions: [
            { label: "Small",     desc: "Under 30", value: "Under 30" },
            { label: "Medium",    desc: "30 – 80",  value: "30 – 80" },
            { label: "Large",     desc: "80 – 150", value: "80 – 150" },
            { label: "Big Party", desc: "150+",      value: "150+" },
        ],
        showPartner: false, partnerLabel: "",
        venueLabel: "Where's the party?",
        activities: [
            { key: "arrival",       label: "Arrival & Setup",  emoji: "🎈" },
            { key: "cake_cutting",  label: "Cake Cutting",     emoji: "🎂" },
            { key: "games",         label: "Games & Activities",emoji: "🎮" },
            { key: "speeches",      label: "Speeches / Toasts",emoji: "🎤" },
            { key: "dance_floor",   label: "Dance Floor",      emoji: "💃" },
            { key: "gift_opening",  label: "Gift Opening",     emoji: "🎁" },
            { key: "party_moments", label: "Party Moments",    emoji: "📸" },
        ],
    },
    engagement: {
        dateLabel: "When are you thinking?",
        guestsLabel: "", showGuests: false, guestsOptions: [],
        showPartner: true, partnerLabel: "Who's the other half?",
        venueLabel: "Where's the magic happening?",
        activities: [
            { key: "session",     label: "The Session",          emoji: "💍" },
            { key: "locations",   label: "Multiple Locations",   emoji: "📍" },
            { key: "adventure",   label: "Adventure / Outdoors", emoji: "🏔️" },
            { key: "getting_ready",label: "Getting Ready",       emoji: "✨" },
            { key: "portraits",   label: "Portraits",            emoji: "📸" },
            { key: "celebration", label: "Celebration After",    emoji: "🥂" },
        ],
    },
    elopement: {
        dateLabel: "When are you thinking?",
        guestsLabel: "Who's coming along?",
        showGuests: true,
        guestsOptions: [
            { label: "Just Us",    desc: "2 people", value: "Just Us" },
            { label: "Small Group",desc: "2 – 10",   value: "2 – 10" },
            { label: "Gathering",  desc: "10+",       value: "10+" },
        ],
        showPartner: true, partnerLabel: "Who's the other half?",
        venueLabel: "Where's it happening?",
        activities: [
            { key: "ceremony",    label: "The Ceremony",         emoji: "💍" },
            { key: "locations",   label: "Location Changes",     emoji: "📍" },
            { key: "adventure",   label: "Adventure / Outdoors", emoji: "🏔️" },
            { key: "getting_ready",label: "Getting Ready",       emoji: "✨" },
            { key: "portraits",   label: "Portraits",            emoji: "📸" },
            { key: "celebration", label: "Celebration After",    emoji: "🥂" },
        ],
    },
};

export const DEFAULT_CONFIG: EventTypeConfig = {
    dateLabel: "When is it?", guestsLabel: "How many guests?", showGuests: true,
    guestsOptions: [
        { label: "Small",  desc: "Under 50",  value: "Under 50" },
        { label: "Medium", desc: "50 – 150",  value: "50 – 150" },
        { label: "Large",  desc: "150+",       value: "150+" },
    ],
    showPartner: false, partnerLabel: "", venueLabel: "Where is it being held?",
    activities: [
        { key: "main_event", label: "Main Event",       emoji: "🎬" },
        { key: "candid",     label: "Candid Moments",   emoji: "📸" },
        { key: "highlights", label: "Highlights",       emoji: "⭐" },
    ],
};

export const EVENT_LABELS: Record<string, string> = {
    wedding: "A Wedding", weddings: "A Wedding",
    birthday: "A Birthday", birthdays: "A Birthday",
    engagement: "An Engagement", engagements: "An Engagement",
    elopement: "An Elopement", elopements: "An Elopement",
    corporate: "A Corporate Event", events: "An Event",
};

export const EVENT_EMOJIS: Record<string, string> = {
    wedding: "💍", weddings: "💍", birthday: "🎂", birthdays: "🎂",
    engagement: "💍", engagements: "💍", elopement: "🏔️", elopements: "🏔️",
    corporate: "🏢", events: "🎬",
};

export const EVENT_DESCS: Record<string, string> = {
    wedding: "Your love story, beautifully captured", weddings: "Your love story, beautifully captured",
    birthday: "Make it a celebration to remember",   birthdays: "Make it a celebration to remember",
    engagement: "The moment you said yes",           engagements: "The moment you said yes",
    elopement: "Intimate & adventurous",             elopements: "Intimate & adventurous",
    corporate: "Professional brand content",
};

export const DELIVERABLE_OPTIONS = [
    { key: "highlight_reel", label: "Highlight Reel",        emoji: "🎬", desc: "3–5 min cinematic edit" },
    { key: "full_ceremony",  label: "Full Ceremony",          emoji: "💍", desc: "Uncut ceremony film" },
    { key: "full_reception", label: "Full Reception",         emoji: "🎉", desc: "Full reception coverage" },
    { key: "social_edits",   label: "Social Media Edits",     emoji: "📱", desc: "Short vertical clips" },
    { key: "same_day_edit",  label: "Same-Day Edit",          emoji: "⚡", desc: "Edit shown at the event" },
    { key: "raw_footage",    label: "Raw Footage",            emoji: "🗂️", desc: "All unedited footage" },
    { key: "documentary",    label: "Documentary Edit",       emoji: "🎥", desc: "30+ min feature film" },
    { key: "drone",          label: "Drone Footage",          emoji: "🚁", desc: "Aerial shots" },
];

export const COVERAGE_OPTIONS = ["4 hours", "6 hours", "8 hours", "10 hours", "12+ hours"];

export const BUDGET_RANGES: readonly (readonly [number, number | null])[] = [
    [0, 500], [500, 800], [800, 1500], [1500, 2500], [2500, 5000],
    [5000, 7500], [7500, 10000], [10000, 15000], [15000, null],
];

export const LEAD_SOURCES = [
    "Google Search", "Instagram", "TikTok", "Facebook",
    "Wedding Wire", "The Knot", "Referral", "Venue Recommendation", "Other",
];

export const BIRTHDAY_RELATIONS = ["Parent", "Sibling", "Friend", "Partner", "Colleague", "Other"];

export const CALL_TIME_OPTIONS = [
    "Morning (8am–12pm)", "Afternoon (12pm–5pm)", "Evening (5pm–9pm)", "Flexible",
];

export const DAY_NAMES   = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const SEASONS = [
    { label: "Spring", months: [2, 3, 4]  as const, emoji: "🌸" },
    { label: "Summer", months: [5, 6, 7]  as const, emoji: "☀️" },
    { label: "Autumn", months: [8, 9, 10] as const, emoji: "🍂" },
    { label: "Winter", months: [11, 0, 1] as const, emoji: "❄️" },
] as const;

export const REQUIRED: Set<ScreenId> = new Set(["event_type", "date", "fork", "contact"]);
