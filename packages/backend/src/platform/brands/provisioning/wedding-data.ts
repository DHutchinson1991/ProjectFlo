/**
 * Wedding provisioning data — subject roles and day templates with activity presets.
 * Pure data arrays consumed by provision-wedding.ts.
 */

export const WEDDING_ROLES_DATA = [
  { role_name: "Bride", order_index: 0, is_core: true, never_group: true, is_group: false },
  { role_name: "Groom", order_index: 1, is_core: true, never_group: true, is_group: false },
  { role_name: "Best Man", order_index: 2, is_core: true, never_group: true, is_group: false },
  { role_name: "Maid of Honour", order_index: 3, is_core: true, never_group: true, is_group: false },
  { role_name: "Father of Bride", order_index: 4, is_core: false, never_group: true, is_group: false },
  { role_name: "Mother of Bride", order_index: 5, is_core: false, never_group: true, is_group: false },
  { role_name: "Father of Groom", order_index: 6, is_core: false, never_group: true, is_group: false },
  { role_name: "Mother of Groom", order_index: 7, is_core: false, never_group: true, is_group: false },
  { role_name: "Bridesmaids", order_index: 8, is_core: false, never_group: false, is_group: true },
  { role_name: "Groomsmen", order_index: 9, is_core: false, never_group: false, is_group: true },
  { role_name: "Flower Girl", order_index: 10, is_core: false, never_group: true, is_group: false },
  { role_name: "Ring Bearer", order_index: 11, is_core: false, never_group: true, is_group: false },
  { role_name: "Guests", order_index: 12, is_core: false, never_group: false, is_group: true },
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
    name: "Pre-Wedding Day",
    description: "Activities before the main event — rehearsal, welcome party, bridal prep",
    order_index: 0,
    presets: [
      { name: "Rehearsal", color: "#8b5cf6", default_start_time: "15:00", default_duration_minutes: 60, order_index: 0, moments: [
        { name: "Arrival & Setup", duration_seconds: 600, is_key_moment: false, order_index: 0 },
        { name: "Walk-Through", duration_seconds: 1200, is_key_moment: true, order_index: 1 },
        { name: "Practice Run", duration_seconds: 1200, is_key_moment: true, order_index: 2 },
        { name: "Final Notes", duration_seconds: 600, is_key_moment: false, order_index: 3 },
      ] },
      { name: "Welcome Party", color: "#f97316", default_start_time: "17:00", default_duration_minutes: 120, order_index: 1, moments: [
        { name: "Guest Arrival", duration_seconds: 900, is_key_moment: false, order_index: 0 },
        { name: "Welcome Drinks", duration_seconds: 1800, is_key_moment: false, order_index: 1 },
        { name: "Mingling", duration_seconds: 2400, is_key_moment: false, order_index: 2 },
        { name: "Short Speeches", duration_seconds: 600, is_key_moment: true, order_index: 3 },
      ] },
      { name: "Bridal Prep Shopping", color: "#ec4899", default_start_time: "10:00", default_duration_minutes: 90, order_index: 2, moments: [
        { name: "Store Arrival", duration_seconds: 300, is_key_moment: false, order_index: 0 },
        { name: "Browsing", duration_seconds: 3600, is_key_moment: false, order_index: 1 },
        { name: "Decision Moment", duration_seconds: 600, is_key_moment: true, order_index: 2 },
      ] },
      { name: "Mehndi / Henna", color: "#d946ef", default_start_time: "12:00", default_duration_minutes: 120, order_index: 3, moments: [
        { name: "Henna Artist Begins", duration_seconds: 600, is_key_moment: false, order_index: 0 },
        { name: "Bride's Henna", duration_seconds: 3600, is_key_moment: true, order_index: 1 },
        { name: "Guest Henna", duration_seconds: 2400, is_key_moment: false, order_index: 2 },
        { name: "Dancing", duration_seconds: 1200, is_key_moment: true, order_index: 3 },
      ] },
      { name: "Rehearsal Dinner", color: "#14b8a6", default_start_time: "18:00", default_duration_minutes: 120, order_index: 4, moments: [
        { name: "Guest Arrival & Drinks", duration_seconds: 900, is_key_moment: false, order_index: 0 },
        { name: "Dinner Service", duration_seconds: 3600, is_key_moment: false, order_index: 1 },
        { name: "Toasts", duration_seconds: 1200, is_key_moment: true, order_index: 2 },
        { name: "Candid Moments", duration_seconds: 900, is_key_moment: false, order_index: 3 },
      ] },
      { name: "Vendor Walk-Through", color: "#06b6d4", default_start_time: "11:00", default_duration_minutes: 60, order_index: 5, moments: [
        { name: "Venue Tour", duration_seconds: 1200, is_key_moment: false, order_index: 0 },
        { name: "Lighting Review", duration_seconds: 900, is_key_moment: false, order_index: 1 },
        { name: "Final Decisions", duration_seconds: 600, is_key_moment: false, order_index: 2 },
      ] },
    ],
  },
  {
    name: "Getting Ready",
    description: "Morning-of preparations — hair, makeup, suit-up, detail shots",
    order_index: 5,
    presets: [
      { name: "Hair & Makeup", color: "#ec4899", default_start_time: "07:00", default_duration_minutes: 90, order_index: 0, moments: [
        { name: "Makeup Application", duration_seconds: 2400, is_key_moment: false, order_index: 0 },
        { name: "Hair Styling", duration_seconds: 2400, is_key_moment: false, order_index: 1 },
        { name: "Final Look Reveal", duration_seconds: 300, is_key_moment: true, order_index: 2 },
      ] },
      { name: "Suit-Up / Dressing", color: "#648CFF", default_start_time: "09:00", default_duration_minutes: 30, order_index: 1, moments: [
        { name: "Shirt & Tie", duration_seconds: 600, is_key_moment: false, order_index: 0 },
        { name: "Jacket On", duration_seconds: 300, is_key_moment: true, order_index: 1 },
        { name: "Final Check", duration_seconds: 300, is_key_moment: false, order_index: 2 },
      ] },
      { name: "Detail Shots", color: "#06b6d4", default_start_time: "08:30", default_duration_minutes: 30, order_index: 2, moments: [
        { name: "Dress on Hanger", duration_seconds: 300, is_key_moment: true, order_index: 0 },
        { name: "Shoes & Accessories", duration_seconds: 300, is_key_moment: false, order_index: 1 },
        { name: "Rings & Jewellery", duration_seconds: 300, is_key_moment: true, order_index: 2 },
        { name: "Perfume", duration_seconds: 180, is_key_moment: false, order_index: 3 },
        { name: "Stationery", duration_seconds: 300, is_key_moment: false, order_index: 4 },
      ] },
      { name: "Letters & Gifts", color: "#a855f7", default_start_time: "09:30", default_duration_minutes: 20, order_index: 3, moments: [
        { name: "Reading Letters", duration_seconds: 600, is_key_moment: true, order_index: 0 },
        { name: "Gift Opening", duration_seconds: 600, is_key_moment: true, order_index: 1 },
      ] },
      { name: "First Reveal (Family)", color: "#10b981", default_start_time: "10:00", default_duration_minutes: 15, order_index: 4, moments: [
        { name: "Parent Reveal Reaction", duration_seconds: 300, is_key_moment: true, order_index: 0 },
        { name: "Family Embrace", duration_seconds: 300, is_key_moment: true, order_index: 1 },
        { name: "Quick Family Photo", duration_seconds: 300, is_key_moment: false, order_index: 2 },
      ] },
      { name: "Candid Prep Moments", color: "#f97316", default_start_time: "10:15", default_duration_minutes: 30, order_index: 5, moments: [
        { name: "Friends Laughing", duration_seconds: 600, is_key_moment: true, order_index: 0 },
        { name: "Champagne Toast", duration_seconds: 300, is_key_moment: true, order_index: 1 },
        { name: "Nervous Excitement", duration_seconds: 600, is_key_moment: false, order_index: 2 },
      ] },
    ],
  },
  {
    name: "Wedding Day",
    description: "The main event day — ceremony, reception, first look, portraits",
    order_index: 1,
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
  {
    name: "Day After Session",
    description: "Post-wedding creative shoot — trash the dress, golden hour, drone",
    order_index: 2,
    presets: [
      { name: "Trash the Dress", color: "#ec4899", default_start_time: "10:00", default_duration_minutes: 60, order_index: 0, moments: [
        { name: "Location Arrival", duration_seconds: 300, is_key_moment: false, order_index: 0 },
        { name: "Creative Shots", duration_seconds: 1800, is_key_moment: true, order_index: 1 },
        { name: "Water / Nature Sequence", duration_seconds: 1200, is_key_moment: true, order_index: 2 },
      ] },
      { name: "Couples Portraits", color: "#0ea5e9", default_start_time: "11:00", default_duration_minutes: 60, order_index: 1, moments: [
        { name: "Scenic Walk", duration_seconds: 600, is_key_moment: false, order_index: 0 },
        { name: "Candid & Lifestyle", duration_seconds: 1200, is_key_moment: true, order_index: 1 },
        { name: "Formal Portraits", duration_seconds: 900, is_key_moment: false, order_index: 2 },
      ] },
      { name: "Drone Aerials", color: "#648CFF", default_start_time: "12:00", default_duration_minutes: 45, order_index: 2, moments: [
        { name: "Equipment Setup", duration_seconds: 300, is_key_moment: false, order_index: 0 },
        { name: "Wide Landscape", duration_seconds: 900, is_key_moment: true, order_index: 1 },
        { name: "Couple in Landscape", duration_seconds: 900, is_key_moment: true, order_index: 2 },
        { name: "Fly-Overs", duration_seconds: 600, is_key_moment: false, order_index: 3 },
      ] },
      { name: "Beach / Nature Walk", color: "#10b981", default_start_time: "14:00", default_duration_minutes: 60, order_index: 3, moments: [
        { name: "Walking Shots", duration_seconds: 900, is_key_moment: false, order_index: 0 },
        { name: "Seaside Poses", duration_seconds: 1200, is_key_moment: true, order_index: 1 },
        { name: "Playful Candids", duration_seconds: 900, is_key_moment: false, order_index: 2 },
      ] },
      { name: "Golden Hour Session", color: "#f59e0b", default_start_time: "17:30", default_duration_minutes: 45, order_index: 4, moments: [
        { name: "Warm Light Portraits", duration_seconds: 1200, is_key_moment: true, order_index: 0 },
        { name: "Silhouette Shots", duration_seconds: 600, is_key_moment: true, order_index: 1 },
        { name: "Final Embrace", duration_seconds: 300, is_key_moment: true, order_index: 2 },
      ] },
    ],
  },
  {
    name: "Engagement Session",
    description: "Pre-wedding couple shoot — portraits, lifestyle, golden hour",
    order_index: 3,
    presets: [
      { name: "Location Portraits", color: "#0ea5e9", default_start_time: "15:00", default_duration_minutes: 60, order_index: 0, moments: [
        { name: "Arrival & Settling In", duration_seconds: 300, is_key_moment: false, order_index: 0 },
        { name: "Formal Poses", duration_seconds: 900, is_key_moment: false, order_index: 1 },
        { name: "Walking Together", duration_seconds: 600, is_key_moment: true, order_index: 2 },
        { name: "Close-Up Portraits", duration_seconds: 900, is_key_moment: true, order_index: 3 },
      ] },
      { name: "Lifestyle Footage", color: "#10b981", default_start_time: "16:00", default_duration_minutes: 45, order_index: 1, moments: [
        { name: "Casual Candids", duration_seconds: 900, is_key_moment: false, order_index: 0 },
        { name: "Activity Together", duration_seconds: 900, is_key_moment: true, order_index: 1 },
        { name: "Laughter", duration_seconds: 600, is_key_moment: true, order_index: 2 },
      ] },
      { name: "Interview / Vows Read", color: "#8b5cf6", default_start_time: "16:45", default_duration_minutes: 30, order_index: 2, moments: [
        { name: "How We Met", duration_seconds: 600, is_key_moment: true, order_index: 0 },
        { name: "Proposal Story", duration_seconds: 600, is_key_moment: true, order_index: 1 },
        { name: "Vow Reading", duration_seconds: 480, is_key_moment: true, order_index: 2 },
      ] },
      { name: "Outfit Change", color: "#ec4899", default_start_time: "17:15", default_duration_minutes: 15, order_index: 3, moments: [
        { name: "Quick Change", duration_seconds: 600, is_key_moment: false, order_index: 0 },
        { name: "Fresh Look Reveal", duration_seconds: 300, is_key_moment: true, order_index: 1 },
      ] },
      { name: "Golden Hour", color: "#f59e0b", default_start_time: "17:30", default_duration_minutes: 45, order_index: 4, moments: [
        { name: "Warm Light Portraits", duration_seconds: 1200, is_key_moment: true, order_index: 0 },
        { name: "Silhouette Shots", duration_seconds: 600, is_key_moment: true, order_index: 1 },
        { name: "Final Moments", duration_seconds: 600, is_key_moment: false, order_index: 2 },
      ] },
      { name: "Detail Shots", color: "#06b6d4", default_start_time: "15:30", default_duration_minutes: 20, order_index: 5, moments: [
        { name: "Ring Close-Ups", duration_seconds: 300, is_key_moment: true, order_index: 0 },
        { name: "Outfit Details", duration_seconds: 300, is_key_moment: false, order_index: 1 },
        { name: "Personal Items", duration_seconds: 300, is_key_moment: false, order_index: 2 },
      ] },
    ],
  },
  {
    name: "Rehearsal Dinner",
    description: "Evening before the wedding — dinner, toasts, and gathering",
    order_index: 4,
    presets: [
      { name: "Welcome Drinks", color: "#f97316", default_start_time: "17:00", default_duration_minutes: 45, order_index: 0, moments: [
        { name: "Guest Arrival", duration_seconds: 600, is_key_moment: false, order_index: 0 },
        { name: "Drinks & Mingling", duration_seconds: 1800, is_key_moment: false, order_index: 1 },
        { name: "Candid Group", duration_seconds: 600, is_key_moment: false, order_index: 2 },
      ] },
      { name: "Rehearsal Walk-Through", color: "#8b5cf6", default_start_time: "15:30", default_duration_minutes: 30, order_index: 1, moments: [
        { name: "Venue Walk-Through", duration_seconds: 900, is_key_moment: true, order_index: 0 },
        { name: "Practice Processional", duration_seconds: 600, is_key_moment: false, order_index: 1 },
        { name: "Final Notes", duration_seconds: 300, is_key_moment: false, order_index: 2 },
      ] },
      { name: "Dinner", color: "#14b8a6", default_start_time: "18:00", default_duration_minutes: 90, order_index: 2, moments: [
        { name: "Table Seating", duration_seconds: 600, is_key_moment: false, order_index: 0 },
        { name: "Dinner Service", duration_seconds: 3600, is_key_moment: false, order_index: 1 },
        { name: "Table Candids", duration_seconds: 900, is_key_moment: false, order_index: 2 },
      ] },
      { name: "Toasts & Speeches", color: "#a855f7", default_start_time: "19:30", default_duration_minutes: 30, order_index: 3, moments: [
        { name: "Welcome Toast", duration_seconds: 300, is_key_moment: true, order_index: 0 },
        { name: "Family Speeches", duration_seconds: 900, is_key_moment: true, order_index: 1 },
        { name: "Emotional Moments", duration_seconds: 300, is_key_moment: true, order_index: 2 },
      ] },
      { name: "Candid Moments", color: "#0ea5e9", default_start_time: "20:00", default_duration_minutes: 30, order_index: 4, moments: [
        { name: "Friends Catching Up", duration_seconds: 600, is_key_moment: false, order_index: 0 },
        { name: "Laughter & Stories", duration_seconds: 600, is_key_moment: true, order_index: 1 },
        { name: "End of Night Hugs", duration_seconds: 300, is_key_moment: false, order_index: 2 },
      ] },
    ],
  },
  {
    name: "Welcome Party",
    description: "Pre-wedding celebration — cocktails, entertainment, guest interactions",
    order_index: 6,
    presets: [
      { name: "Cocktail Reception", color: "#f97316", default_start_time: "17:00", default_duration_minutes: 60, order_index: 0, moments: [
        { name: "First Guests Arrive", duration_seconds: 600, is_key_moment: false, order_index: 0 },
        { name: "Drinks & Canapés", duration_seconds: 1800, is_key_moment: false, order_index: 1 },
        { name: "Mingling Wide Shots", duration_seconds: 900, is_key_moment: false, order_index: 2 },
      ] },
      { name: "Meet & Greet", color: "#10b981", default_start_time: "18:00", default_duration_minutes: 45, order_index: 1, moments: [
        { name: "Couple Greeting Guests", duration_seconds: 1200, is_key_moment: true, order_index: 0 },
        { name: "First-Time Meetings", duration_seconds: 900, is_key_moment: false, order_index: 1 },
        { name: "Group Candids", duration_seconds: 600, is_key_moment: false, order_index: 2 },
      ] },
      { name: "Live Entertainment", color: "#d946ef", default_start_time: "19:00", default_duration_minutes: 60, order_index: 2, moments: [
        { name: "Performance Start", duration_seconds: 300, is_key_moment: true, order_index: 0 },
        { name: "Crowd Reactions", duration_seconds: 1200, is_key_moment: false, order_index: 1 },
        { name: "Dancing", duration_seconds: 1800, is_key_moment: true, order_index: 2 },
      ] },
      { name: "Guest Interviews", color: "#8b5cf6", default_start_time: "18:45", default_duration_minutes: 30, order_index: 3, moments: [
        { name: "Best Wishes Messages", duration_seconds: 900, is_key_moment: true, order_index: 0 },
        { name: "Funny Stories", duration_seconds: 600, is_key_moment: true, order_index: 1 },
        { name: "Advice for Couple", duration_seconds: 300, is_key_moment: false, order_index: 2 },
      ] },
      { name: "Casual Group Photos", color: "#0ea5e9", default_start_time: "20:00", default_duration_minutes: 30, order_index: 4, moments: [
        { name: "Friend Group Shots", duration_seconds: 600, is_key_moment: false, order_index: 0 },
        { name: "Family Groups", duration_seconds: 600, is_key_moment: true, order_index: 1 },
        { name: "Full Party Photo", duration_seconds: 300, is_key_moment: true, order_index: 2 },
      ] },
    ],
  },
];
