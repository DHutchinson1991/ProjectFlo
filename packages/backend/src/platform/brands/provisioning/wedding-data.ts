/**
 * Wedding provisioning data — subject roles and day templates with activity presets.
 * Pure data arrays consumed by provision-wedding.ts.
 */

export const WEDDING_ROLES_DATA = [
  { role_name: "Bride", order_index: 0, never_group: true, is_group: false },
  { role_name: "Groom", order_index: 1, never_group: true, is_group: false },
  { role_name: "Best Man", order_index: 2, never_group: true, is_group: false },
  { role_name: "Maid of Honour", order_index: 3, never_group: true, is_group: false },
  { role_name: "Father of Bride", order_index: 4, never_group: true, is_group: false },
  { role_name: "Mother of Bride", order_index: 5, never_group: true, is_group: false },
  { role_name: "Father of Groom", order_index: 6, never_group: true, is_group: false },
  { role_name: "Mother of Groom", order_index: 7, never_group: true, is_group: false },
  { role_name: "Bridesmaids", order_index: 8, never_group: false, is_group: true },
  { role_name: "Groomsmen", order_index: 9, never_group: false, is_group: true },
  { role_name: "Flower Girl", order_index: 10, never_group: true, is_group: false },
  { role_name: "Ring Bearer", order_index: 11, never_group: true, is_group: false },
  { role_name: "Guests", order_index: 12, never_group: false, is_group: true },
  { role_name: "Officiant", order_index: 13, never_group: true, is_group: false },
] as const;

interface MomentData {
  name: string;
  duration_seconds: number;
  is_key_moment: boolean;
  order_index: number;
}

interface PresetData {
  name: string;
  color: string;
  default_start_time: string;
  default_duration_minutes: number;
  order_index: number;
  moments: MomentData[];
}

export interface WeddingDayTemplate {
  name: string;
  description: string;
  order_index: number;
  presets: PresetData[];
}

export const WEDDING_DAY_TEMPLATES: WeddingDayTemplate[] = [
  {
    name: "Wedding Day",
    description: "The main event day — ceremony, reception, first look, portraits",
    order_index: 0,
    presets: [
      { name: "Bridal Prep", color: "#ec4899", default_start_time: "08:00", default_duration_minutes: 120, order_index: 0, moments: [
        { name: "Hair & Makeup", duration_seconds: 3600, is_key_moment: false, order_index: 0 },
        { name: "Getting Dressed", duration_seconds: 900, is_key_moment: true, order_index: 1 },
        { name: "Final Touches", duration_seconds: 600, is_key_moment: false, order_index: 2 },
        { name: "Father Reaction", duration_seconds: 300, is_key_moment: true, order_index: 3 },
        { name: "Bridesmaids Prep", duration_seconds: 600, is_key_moment: false, order_index: 4 },
      ] },
      { name: "Groom Prep", color: "#648CFF", default_start_time: "09:00", default_duration_minutes: 90, order_index: 1, moments: [
        { name: "Getting Dressed", duration_seconds: 900, is_key_moment: false, order_index: 0 },
        { name: "Suit-Up & Tie", duration_seconds: 600, is_key_moment: true, order_index: 1 },
        { name: "Groomsmen Candids", duration_seconds: 1200, is_key_moment: false, order_index: 2 },
        { name: "Gift/Letter", duration_seconds: 600, is_key_moment: true, order_index: 3 },
      ] },
      { name: "First Look", color: "#a855f7", default_start_time: "11:00", default_duration_minutes: 30, order_index: 2, moments: [
        { name: "Setup & Anticipation", duration_seconds: 300, is_key_moment: false, order_index: 0 },
        { name: "The Reveal", duration_seconds: 180, is_key_moment: true, order_index: 1 },
        { name: "Couple's Reaction", duration_seconds: 300, is_key_moment: true, order_index: 2 },
        { name: "Quick Portraits", duration_seconds: 600, is_key_moment: false, order_index: 3 },
      ] },
      { name: "Ceremony", color: "#f59e0b", default_start_time: "13:00", default_duration_minutes: 60, order_index: 3, moments: [
        { name: "Guest Seating", duration_seconds: 600, is_key_moment: false, order_index: 0 },
        { name: "Processional", duration_seconds: 300, is_key_moment: true, order_index: 1 },
        { name: "Vows", duration_seconds: 600, is_key_moment: true, order_index: 2 },
        { name: "Ring Exchange", duration_seconds: 180, is_key_moment: true, order_index: 3 },
        { name: "First Kiss", duration_seconds: 120, is_key_moment: true, order_index: 4 },
        { name: "Recessional", duration_seconds: 300, is_key_moment: true, order_index: 5 },
      ] },
      { name: "Family Portraits", color: "#10b981", default_start_time: "14:00", default_duration_minutes: 30, order_index: 4, moments: [
        { name: "Immediate Family", duration_seconds: 600, is_key_moment: true, order_index: 0 },
        { name: "Extended Family", duration_seconds: 600, is_key_moment: false, order_index: 1 },
        { name: "Bridal Party", duration_seconds: 600, is_key_moment: false, order_index: 2 },
      ] },
      { name: "Couple Portraits", color: "#0ea5e9", default_start_time: "14:30", default_duration_minutes: 45, order_index: 5, moments: [
        { name: "Location Walk", duration_seconds: 300, is_key_moment: false, order_index: 0 },
        { name: "Formal Portraits", duration_seconds: 900, is_key_moment: true, order_index: 1 },
        { name: "Candid / Lifestyle", duration_seconds: 900, is_key_moment: false, order_index: 2 },
        { name: "Dramatic / Creative", duration_seconds: 600, is_key_moment: true, order_index: 3 },
      ] },
      { name: "Cocktail Hour", color: "#f97316", default_start_time: "15:15", default_duration_minutes: 60, order_index: 6, moments: [
        { name: "Guest Mingling", duration_seconds: 1800, is_key_moment: false, order_index: 0 },
        { name: "Canapés & Drinks", duration_seconds: 1200, is_key_moment: false, order_index: 1 },
        { name: "Candid Guest Moments", duration_seconds: 600, is_key_moment: false, order_index: 2 },
      ] },
      { name: "Reception", color: "#14b8a6", default_start_time: "16:30", default_duration_minutes: 180, order_index: 7, moments: [
        { name: "Grand Entrance", duration_seconds: 300, is_key_moment: true, order_index: 0 },
        { name: "Welcome & Seating", duration_seconds: 600, is_key_moment: false, order_index: 1 },
        { name: "Dinner Service", duration_seconds: 3600, is_key_moment: false, order_index: 2 },
        { name: "Table Candids", duration_seconds: 1200, is_key_moment: false, order_index: 3 },
      ] },
      { name: "First Dance", color: "#d946ef", default_start_time: "19:30", default_duration_minutes: 10, order_index: 8, moments: [
        { name: "First Dance", duration_seconds: 240, is_key_moment: true, order_index: 0 },
        { name: "Parent Dances", duration_seconds: 360, is_key_moment: true, order_index: 1 },
      ] },
      { name: "Speeches & Toasts", color: "#8b5cf6", default_start_time: "17:30", default_duration_minutes: 45, order_index: 9, moments: [
        { name: "Best Man Speech", duration_seconds: 600, is_key_moment: true, order_index: 0 },
        { name: "Father of Bride Speech", duration_seconds: 600, is_key_moment: true, order_index: 1 },
        { name: "Groom / Couple Speech", duration_seconds: 600, is_key_moment: true, order_index: 2 },
        { name: "MoH Speech", duration_seconds: 480, is_key_moment: false, order_index: 3 },
      ] },
      { name: "Detail Shots", color: "#06b6d4", default_start_time: "10:30", default_duration_minutes: 30, order_index: 10, moments: [
        { name: "Rings & Jewellery", duration_seconds: 300, is_key_moment: true, order_index: 0 },
        { name: "Flowers & Bouquet", duration_seconds: 300, is_key_moment: false, order_index: 1 },
        { name: "Table Settings", duration_seconds: 600, is_key_moment: false, order_index: 2 },
        { name: "Stationery", duration_seconds: 300, is_key_moment: false, order_index: 3 },
      ] },
      { name: "Send Off", color: "#ef4444", default_start_time: "21:00", default_duration_minutes: 15, order_index: 11, moments: [
        { name: "Sparkler / Confetti Line", duration_seconds: 300, is_key_moment: true, order_index: 0 },
        { name: "Couple Exit", duration_seconds: 300, is_key_moment: true, order_index: 1 },
        { name: "Getaway Car", duration_seconds: 180, is_key_moment: false, order_index: 2 },
      ] },
    ],
  },
];
