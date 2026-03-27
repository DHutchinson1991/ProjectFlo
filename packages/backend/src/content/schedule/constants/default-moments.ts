/**
 * Default moments for wedding-day activities.
 * Durations are in seconds representing realistic real-world timing.
 */

type DefaultMoment = { name: string; order_index: number; duration_seconds: number; is_required: boolean };

export const WEDDING_ACTIVITY_DEFAULTS: Record<string, DefaultMoment[]> = {
  'Bridal Prep': [
    { name: 'Makeup & Hair', order_index: 0, duration_seconds: 3600, is_required: true },
    { name: 'Dress Reveal', order_index: 1, duration_seconds: 300, is_required: true },
    { name: 'Getting Dressed', order_index: 2, duration_seconds: 600, is_required: true },
    { name: 'Detail Shots', order_index: 3, duration_seconds: 600, is_required: true },
    { name: 'Veil & Accessories', order_index: 4, duration_seconds: 300, is_required: false },
    { name: 'Bridesmaids Reaction', order_index: 5, duration_seconds: 300, is_required: false },
    { name: 'Letter Reading', order_index: 6, duration_seconds: 300, is_required: false },
    { name: 'Gift Exchange', order_index: 7, duration_seconds: 300, is_required: false },
  ],
  'Getting Ready': [
    { name: 'Makeup & Hair', order_index: 0, duration_seconds: 3600, is_required: true },
    { name: 'Dress Reveal', order_index: 1, duration_seconds: 300, is_required: true },
    { name: 'Getting Dressed', order_index: 2, duration_seconds: 600, is_required: true },
    { name: 'Detail Shots', order_index: 3, duration_seconds: 600, is_required: true },
    { name: 'Suits Up', order_index: 4, duration_seconds: 300, is_required: false },
    { name: 'Letter Reading', order_index: 5, duration_seconds: 300, is_required: false },
    { name: 'Gift Exchange', order_index: 6, duration_seconds: 300, is_required: false },
  ],
  'Groom Prep': [
    { name: 'Suiting Up', order_index: 0, duration_seconds: 900, is_required: true },
    { name: 'Detail Shots', order_index: 1, duration_seconds: 600, is_required: true },
    { name: 'Groomsmen Jokes', order_index: 2, duration_seconds: 300, is_required: false },
    { name: 'Letter Reading', order_index: 3, duration_seconds: 300, is_required: false },
    { name: 'Gift Exchange', order_index: 4, duration_seconds: 300, is_required: false },
  ],
  'First Look': [
    { name: 'Anticipation Build', order_index: 0, duration_seconds: 300, is_required: true },
    { name: 'The Reveal', order_index: 1, duration_seconds: 180, is_required: true },
    { name: 'Reaction', order_index: 2, duration_seconds: 300, is_required: true },
    { name: 'Embrace', order_index: 3, duration_seconds: 180, is_required: false },
  ],
  'Ceremony': [
    { name: 'Guest Arrival', order_index: 0, duration_seconds: 600, is_required: false },
    { name: 'Processional', order_index: 1, duration_seconds: 180, is_required: true },
    { name: 'Opening Words', order_index: 2, duration_seconds: 300, is_required: false },
    { name: 'Readings', order_index: 3, duration_seconds: 300, is_required: false },
    { name: 'Vows', order_index: 4, duration_seconds: 180, is_required: true },
    { name: 'Ring Exchange', order_index: 5, duration_seconds: 120, is_required: true },
    { name: 'Unity Ceremony', order_index: 6, duration_seconds: 300, is_required: false },
    { name: 'First Kiss', order_index: 7, duration_seconds: 30, is_required: true },
    { name: 'Pronouncement', order_index: 8, duration_seconds: 60, is_required: true },
    { name: 'Recessional', order_index: 9, duration_seconds: 180, is_required: true },
  ],
  'Cocktail Hour': [
    { name: 'Guest Mingling', order_index: 0, duration_seconds: 1200, is_required: true },
    { name: 'Drink Service', order_index: 1, duration_seconds: 600, is_required: false },
    { name: 'Live Music/Entertainment', order_index: 2, duration_seconds: 900, is_required: false },
    { name: 'Venue Details', order_index: 3, duration_seconds: 300, is_required: false },
  ],
  'Portraits': [
    { name: 'Couple Portraits', order_index: 0, duration_seconds: 900, is_required: true },
    { name: 'Bridal Party', order_index: 1, duration_seconds: 600, is_required: true },
    { name: 'Family Formals', order_index: 2, duration_seconds: 600, is_required: true },
    { name: 'Romantic Walk', order_index: 3, duration_seconds: 300, is_required: false },
    { name: 'Creative Shots', order_index: 4, duration_seconds: 300, is_required: false },
  ],
  'Reception': [
    { name: 'Grand Entrance', order_index: 0, duration_seconds: 300, is_required: true },
    { name: 'First Dance', order_index: 1, duration_seconds: 240, is_required: true },
    { name: 'Parent Dances', order_index: 2, duration_seconds: 360, is_required: true },
    { name: 'Toasts & Speeches', order_index: 3, duration_seconds: 1800, is_required: true },
    { name: 'Dinner Service', order_index: 4, duration_seconds: 3600, is_required: false },
    { name: 'Cake Cutting', order_index: 5, duration_seconds: 300, is_required: true },
    { name: 'Bouquet Toss', order_index: 6, duration_seconds: 180, is_required: false },
    { name: 'Garter Toss', order_index: 7, duration_seconds: 180, is_required: false },
    { name: 'Open Dancing', order_index: 8, duration_seconds: 3600, is_required: true },
    { name: 'Last Dance', order_index: 9, duration_seconds: 240, is_required: false },
    { name: 'Send Off / Exit', order_index: 10, duration_seconds: 300, is_required: false },
  ],
  'Golden Hour': [
    { name: 'Couple Walk', order_index: 0, duration_seconds: 600, is_required: true },
    { name: 'Romantic Portraits', order_index: 1, duration_seconds: 600, is_required: true },
    { name: 'Silhouette Shots', order_index: 2, duration_seconds: 300, is_required: false },
    { name: 'Creative Details', order_index: 3, duration_seconds: 300, is_required: false },
  ],
  'Send Off': [
    { name: 'Sparkler Line', order_index: 0, duration_seconds: 300, is_required: false },
    { name: 'The Exit', order_index: 1, duration_seconds: 300, is_required: true },
    { name: 'Car Departure', order_index: 2, duration_seconds: 180, is_required: false },
  ],
  'Farewell': [
    { name: 'Sparkler Line', order_index: 0, duration_seconds: 300, is_required: false },
    { name: 'The Exit', order_index: 1, duration_seconds: 300, is_required: true },
    { name: 'Car Departure', order_index: 2, duration_seconds: 180, is_required: false },
  ],
};

/**
 * Returns default moments for a given activity name (wedding-specific).
 * Uses exact match first, then partial match.
 */
export function getDefaultMomentsForActivity(activityName: string): DefaultMoment[] {
  const normalized = activityName.trim().toLowerCase();
  for (const [key, moments] of Object.entries(WEDDING_ACTIVITY_DEFAULTS)) {
    if (key.toLowerCase() === normalized) return moments;
  }
  for (const [key, moments] of Object.entries(WEDDING_ACTIVITY_DEFAULTS)) {
    const keyLower = key.toLowerCase();
    if (normalized.includes(keyLower) || keyLower.includes(normalized)) return moments;
  }
  return [];
}
