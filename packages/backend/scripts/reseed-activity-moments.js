/**
 * reseed-activity-moments.js
 *
 * Deletes ALL existing PackageActivityMoments and re-seeds them so that
 * moment durations span the full duration_minutes of each activity.
 *
 * Strategy:
 *  - Each template defines moments with a `weight` (proportion of total time).
 *  - The actual duration_seconds for each moment = weight / totalWeight * activityTotalSeconds
 *  - Rounded to nearest 30s, minimum 30s.
 *  - If no duration_minutes is set on the activity, we fall back to a default
 *    total for that activity type.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Templates ────────────────────────────────────────────────────────────────
// Each entry: { name, weight, is_required }
// weight is relative — will be normalised against total weight.

const TEMPLATES = {
  // ─── Getting Ready / Bridal Prep ─────────────────────────────────────────
  'bridal prep': {
    defaultMinutes: 120,
    moments: [
      { name: 'Makeup Artist Arrives & Setup',     weight: 5,  is_required: false },
      { name: 'Hair Styling',                       weight: 15, is_required: true  },
      { name: 'Makeup Application',                 weight: 20, is_required: true  },
      { name: 'Bridesmaid Getting Ready',           weight: 10, is_required: false },
      { name: 'Bride Getting Dressed',              weight: 8,  is_required: true  },
      { name: 'Veil & Accessories',                 weight: 5,  is_required: true  },
      { name: 'Detail Shots — Rings, Bouquet, Shoes', weight: 8, is_required: true },
      { name: 'Dress Reveal',                       weight: 5,  is_required: true  },
      { name: 'Letter / Gift Exchange',             weight: 6,  is_required: false },
      { name: 'Bridesmaids Reaction & Portraits',   weight: 8,  is_required: false },
      { name: 'Father of Bride / Parent Reaction',  weight: 5,  is_required: false },
      { name: 'Final Checks & Touch-Ups',           weight: 5,  is_required: true  },
    ],
  },
  'getting ready': {
    defaultMinutes: 90,
    moments: [
      { name: "Bride's Hair Styling",               weight: 18, is_required: true  },
      { name: "Bride's Makeup Application",         weight: 18, is_required: true  },
      { name: 'Bride Getting Dressed',              weight: 8,  is_required: true  },
      { name: 'Final Touches & Veil',               weight: 5,  is_required: true  },
      { name: 'Detail Shots — Rings, Bouquet, Shoes', weight: 8, is_required: true },
      { name: 'Groom Suiting Up',                   weight: 8,  is_required: false },
      { name: 'Bridesmaids Preparation',            weight: 8,  is_required: false },
      { name: 'Father of Bride Reaction',           weight: 5,  is_required: false },
      { name: 'Letter / Gift Exchange',             weight: 6,  is_required: false },
      { name: 'Final Checks & Touch-Ups',           weight: 5,  is_required: true  },
      { name: 'First Look Preparation',             weight: 5,  is_required: false },
      { name: 'Dress Reveal Moment',                weight: 6,  is_required: true  },
    ],
  },
  'groom prep': {
    defaultMinutes: 90,
    moments: [
      { name: 'Groomsmen Arriving',                 weight: 8,  is_required: false },
      { name: 'Shirt & Tie',                        weight: 10, is_required: true  },
      { name: 'Suiting Up',                         weight: 12, is_required: true  },
      { name: 'Pocket Square & Boutonniere',        weight: 5,  is_required: false },
      { name: 'Cufflinks & Accessories',            weight: 5,  is_required: false },
      { name: 'Shoe Shine / Polish',                weight: 4,  is_required: false },
      { name: 'Groomsmen Candids & Banter',         weight: 12, is_required: true  },
      { name: 'Letter / Gift Exchange',             weight: 8,  is_required: false },
      { name: 'Full-Length Mirror Shots',           weight: 8,  is_required: true  },
      { name: 'Group Groomsmen Portrait',           weight: 8,  is_required: true  },
      { name: 'Groom Detail Shots',                 weight: 6,  is_required: false },
      { name: 'Final Check & Depart',               weight: 8,  is_required: true  },
      { name: 'Nervous Moments / Countdown',        weight: 6,  is_required: false },
    ],
  },
  'groom preparation': {
    defaultMinutes: 90,
    moments: [
      { name: 'Groomsmen Arriving',                 weight: 8,  is_required: false },
      { name: 'Suiting Up',                         weight: 15, is_required: true  },
      { name: 'Detail Shots',                       weight: 8,  is_required: true  },
      { name: 'Groomsmen Candids',                  weight: 12, is_required: true  },
      { name: 'Letter / Gift Exchange',             weight: 8,  is_required: false },
      { name: 'Group Portrait',                     weight: 10, is_required: true  },
      { name: 'Final Check & Depart',               weight: 10, is_required: true  },
      { name: 'Nervous Moments',                    weight: 8,  is_required: false },
    ],
  },

  // ─── First Look ──────────────────────────────────────────────────────────
  'first look': {
    defaultMinutes: 30,
    moments: [
      { name: 'Location Setup & Groom Waits',       weight: 15, is_required: true  },
      { name: "Bride's Approach",                   weight: 10, is_required: true  },
      { name: 'The Reveal',                         weight: 10, is_required: true  },
      { name: 'Groom Reaction Close-Up',            weight: 10, is_required: true  },
      { name: 'First Embrace',                      weight: 10, is_required: true  },
      { name: 'Emotional Reaction',                 weight: 10, is_required: false },
      { name: 'Candid Conversation',                weight: 10, is_required: false },
      { name: 'Quick Couple Portraits',             weight: 25, is_required: true  },
    ],
  },

  // ─── Ceremony ────────────────────────────────────────────────────────────
  'ceremony': {
    defaultMinutes: 45,
    moments: [
      { name: 'Guest Arrival & Seating',            weight: 10, is_required: false },
      { name: 'Venue & Ceremony Décor Details',     weight: 5,  is_required: false },
      { name: 'Officiant & Family Arrival',         weight: 4,  is_required: false },
      { name: 'Groom Arrival & Groomsmen',          weight: 5,  is_required: true  },
      { name: 'Bridal Party Processional',          weight: 5,  is_required: true  },
      { name: 'Bride Entrance',                     weight: 5,  is_required: true  },
      { name: 'Welcome & Opening Words',            weight: 6,  is_required: true  },
      { name: 'Readings',                           weight: 6,  is_required: false },
      { name: 'Declarations of Intent',             weight: 5,  is_required: true  },
      { name: 'Personal Vows',                      weight: 8,  is_required: false },
      { name: 'Contracting Words (Legal Vows)',     weight: 5,  is_required: true  },
      { name: 'Ring Exchange',                      weight: 5,  is_required: true  },
      { name: 'Signing of the Register',            weight: 8,  is_required: true  },
      { name: 'Pronouncement & First Kiss',         weight: 5,  is_required: true  },
      { name: 'Guest Applause & Reactions',         weight: 4,  is_required: false },
      { name: 'Recessional Walk Out',               weight: 5,  is_required: true  },
      { name: 'Confetti Throw',                     weight: 4,  is_required: false },
      { name: 'Receiving Line / Congratulations',   weight: 10, is_required: false },
    ],
  },
  'garden ceremony': {
    defaultMinutes: 45,
    moments: [
      { name: 'Guest Arrival to Garden',            weight: 10, is_required: false },
      { name: 'Garden Décor Details',               weight: 5,  is_required: false },
      { name: 'Groom & Officiant Take Position',    weight: 5,  is_required: true  },
      { name: 'Bridal Party Walk',                  weight: 5,  is_required: true  },
      { name: "Bride's Walk Down the Aisle",        weight: 8,  is_required: true  },
      { name: 'Welcome & Opening',                  weight: 8,  is_required: true  },
      { name: 'Readings',                           weight: 8,  is_required: false },
      { name: 'Personal Vows',                      weight: 10, is_required: false },
      { name: 'Vows & Ring Exchange',               weight: 10, is_required: true  },
      { name: 'First Kiss',                         weight: 5,  is_required: true  },
      { name: 'Recessional',                        weight: 8,  is_required: true  },
      { name: 'Confetti & Congratulations',         weight: 8,  is_required: false },
      { name: 'Receiving Line',                     weight: 10, is_required: false },
    ],
  },
  'intimate ceremony': {
    defaultMinutes: 45,
    moments: [
      { name: 'Guest Arrival',                      weight: 10, is_required: false },
      { name: 'Décor & Setting Details',            weight: 5,  is_required: false },
      { name: 'Groom & Officiant Ready',            weight: 5,  is_required: true  },
      { name: "Bride's Walk Down Aisle",            weight: 8,  is_required: true  },
      { name: 'Welcome & Introduction',             weight: 10, is_required: true  },
      { name: 'Readings & Reflections',             weight: 8,  is_required: false },
      { name: 'Personal Vows',                      weight: 12, is_required: true  },
      { name: 'Ring Exchange',                      weight: 8,  is_required: true  },
      { name: 'First Kiss',                         weight: 5,  is_required: true  },
      { name: 'Recessional',                        weight: 6,  is_required: true  },
      { name: 'Intimate Congratulations',           weight: 8,  is_required: false },
      { name: 'Confetti / Petals Exit',             weight: 5,  is_required: false },
      { name: 'Couple Quiet Moment',                weight: 10, is_required: false },
    ],
  },
  'nikkah ceremony': {
    defaultMinutes: 60,
    moments: [
      { name: 'Guests Assembly',                    weight: 10, is_required: true  },
      { name: 'Imam Welcome & Opening Prayers',     weight: 12, is_required: true  },
      { name: 'Mahr Discussion',                    weight: 8,  is_required: true  },
      { name: 'Bride Consent (Ijab)',               weight: 8,  is_required: true  },
      { name: 'Groom Acceptance (Qabool)',          weight: 8,  is_required: true  },
      { name: 'Witness Signing',                    weight: 8,  is_required: true  },
      { name: 'Recitation of Quranic Verses',       weight: 10, is_required: false },
      { name: 'Wedding Sermon (Khutbah)',           weight: 12, is_required: false },
      { name: 'Ring Exchange',                      weight: 6,  is_required: false },
      { name: 'Congratulations & Prayers',          weight: 10, is_required: true  },
      { name: 'Family Photos',                      weight: 8,  is_required: false },
    ],
  },

  // ─── Confetti / Photos ────────────────────────────────────────────────────
  'confetti & photos': {
    defaultMinutes: 30,
    moments: [
      { name: 'Confetti Tunnel Setup',              weight: 10, is_required: false },
      { name: 'Confetti Throw',                     weight: 12, is_required: true  },
      { name: 'Couple Walk Through Confetti',       weight: 10, is_required: true  },
      { name: 'Bridal Party Portraits',             weight: 20, is_required: true  },
      { name: 'Family Group Portraits',             weight: 20, is_required: true  },
      { name: 'Couple Portraits',                   weight: 20, is_required: true  },
      { name: 'Fun / Candid Group Shot',            weight: 8,  is_required: false },
    ],
  },
  'confetti/photos': {
    defaultMinutes: 30,
    moments: [
      { name: 'Confetti Tunnel Setup',              weight: 10, is_required: false },
      { name: 'Confetti Throw',                     weight: 12, is_required: true  },
      { name: 'Couple Walk Through Confetti',       weight: 10, is_required: true  },
      { name: 'Group Photos',                       weight: 22, is_required: true  },
      { name: 'Couple Portraits',                   weight: 25, is_required: true  },
      { name: 'Bridal Party Shot',                  weight: 12, is_required: false },
      { name: 'Candid Fun',                         weight: 9,  is_required: false },
    ],
  },
  'confetti moment': {
    defaultMinutes: 20,
    moments: [
      { name: 'Guests Line Up',                     weight: 15, is_required: true  },
      { name: 'Confetti Throw',                     weight: 40, is_required: true  },
      { name: 'Couple Walk-Through',                weight: 30, is_required: true  },
      { name: 'Repeat Takes',                       weight: 15, is_required: false },
    ],
  },

  // ─── Cocktail Hour ────────────────────────────────────────────────────────
  'cocktail hour': {
    defaultMinutes: 60,
    moments: [
      { name: 'Guests Spill Out & Mingle',          weight: 15, is_required: true  },
      { name: 'Welcome Drinks Served',              weight: 8,  is_required: true  },
      { name: 'Canapés & Nibbles',                  weight: 8,  is_required: false },
      { name: 'Live Music / Acoustic Set',          weight: 10, is_required: false },
      { name: 'Wide Venue & Garden Shots',          weight: 8,  is_required: false },
      { name: 'Candid Guest Interactions',          weight: 15, is_required: true  },
      { name: 'Guest Mini-Interviews',              weight: 10, is_required: false },
      { name: 'Bridal Party Candids',               weight: 10, is_required: false },
      { name: 'Couple Sneak Away Portraits',        weight: 12, is_required: false },
      { name: 'Overheard Laughter & Stories',       weight: 4,  is_required: false },
    ],
  },
  'cocktail reception': {
    defaultMinutes: 60,
    moments: [
      { name: 'First Guests Arrive',                weight: 10, is_required: true  },
      { name: 'Welcome Drinks Served',              weight: 10, is_required: true  },
      { name: 'Canapés & Standing Bites',           weight: 10, is_required: false },
      { name: 'Candid Mingling',                    weight: 20, is_required: true  },
      { name: 'Wide Venue Shots',                   weight: 8,  is_required: false },
      { name: 'Live Music / Performer',             weight: 10, is_required: false },
      { name: 'Couple Circulates',                  weight: 15, is_required: false },
      { name: 'Group Candids',                      weight: 10, is_required: false },
      { name: 'Signal to Move In',                  weight: 7,  is_required: false },
    ],
  },

  // ─── Portraits ────────────────────────────────────────────────────────────
  'portraits': {
    defaultMinutes: 45,
    moments: [
      { name: 'Location Arrival & Setup',           weight: 8,  is_required: false },
      { name: 'Couple Formal Portraits',            weight: 22, is_required: true  },
      { name: 'Walking Candid Portraits',           weight: 15, is_required: true  },
      { name: 'Close-Up / Intimate Shots',          weight: 12, is_required: true  },
      { name: 'Bridal Party Portraits',             weight: 15, is_required: true  },
      { name: 'Family Formals',                     weight: 12, is_required: true  },
      { name: 'Creative / Artistic Shots',          weight: 10, is_required: false },
      { name: 'Romantic Walk',                      weight: 6,  is_required: false },
    ],
  },
  'couple portraits': {
    defaultMinutes: 45,
    moments: [
      { name: 'Arrival to Location',               weight: 8,  is_required: false },
      { name: 'Walking & Natural Candids',          weight: 20, is_required: true  },
      { name: 'Formal Posed Portraits',             weight: 20, is_required: true  },
      { name: 'Close-Up Intimate Shots',            weight: 12, is_required: true  },
      { name: 'Looking Away / Lifestyle',           weight: 10, is_required: false },
      { name: 'Dramatic / Creative Shots',          weight: 12, is_required: false },
      { name: 'Laughing & Playful Moments',         weight: 10, is_required: true  },
      { name: 'Final Sunset / Golden Shot',         weight: 8,  is_required: false },
    ],
  },
  'couple photos': {
    defaultMinutes: 45,
    moments: [
      { name: 'Arrival & Settle In',                weight: 8,  is_required: false },
      { name: 'Natural Walking Shots',             weight: 20, is_required: true  },
      { name: 'Formal Couple Portraits',           weight: 22, is_required: true  },
      { name: 'Close-Up & Detail',                 weight: 10, is_required: true  },
      { name: 'Candid Laugh & Play',               weight: 15, is_required: true  },
      { name: 'Group Photo',                        weight: 15, is_required: true  },
      { name: 'Creative / Backlit',                 weight: 10, is_required: false },
    ],
  },
  'bride & groom photos': {
    defaultMinutes: 60,
    moments: [
      { name: 'Arrival to Shoot Location',         weight: 8,  is_required: false },
      { name: 'Natural Candid Moments',            weight: 15, is_required: true  },
      { name: 'Formal Couple Portraits',           weight: 20, is_required: true  },
      { name: 'Walking Shots',                     weight: 12, is_required: true  },
      { name: 'Close-Up & Intimate',               weight: 10, is_required: true  },
      { name: 'Creative / Artistic Frames',        weight: 10, is_required: false },
      { name: 'Group Photos',                      weight: 15, is_required: true  },
      { name: 'Final Hero Shot',                   weight: 10, is_required: false },
    ],
  },
  'family portraits': {
    defaultMinutes: 30,
    moments: [
      { name: 'Immediate Family (Bride Side)',      weight: 20, is_required: true  },
      { name: 'Immediate Family (Groom Side)',      weight: 20, is_required: true  },
      { name: 'Extended Family Groups',             weight: 18, is_required: true  },
      { name: 'Bridal Party Group Shot',            weight: 15, is_required: true  },
      { name: 'Fun / Silly Group Photo',            weight: 10, is_required: false },
      { name: 'Parents with Couple',                weight: 10, is_required: false },
      { name: 'Siblings Group',                    weight: 7,  is_required: false },
    ],
  },
  'location portraits': {
    defaultMinutes: 60,
    moments: [
      { name: 'Arrival & Location Scouting',       weight: 8,  is_required: false },
      { name: 'Natural Walk & Candids',            weight: 18, is_required: true  },
      { name: 'Formal Posed Portraits',            weight: 20, is_required: true  },
      { name: 'Walking Together Shots',            weight: 12, is_required: true  },
      { name: 'Close-Up Portraits',                weight: 12, is_required: true  },
      { name: 'Creative / Framed Compositions',   weight: 10, is_required: false },
      { name: 'Lifestyle / Spontaneous',           weight: 10, is_required: false },
      { name: 'Final Hero Shot',                   weight: 10, is_required: false },
    ],
  },

  // ─── Reception ────────────────────────────────────────────────────────────
  'reception': {
    defaultMinutes: 180,
    moments: [
      { name: 'Grand Entrance',                    weight: 5,  is_required: true  },
      { name: 'Welcome Speech',                    weight: 4,  is_required: true  },
      { name: 'First Dance',                       weight: 4,  is_required: true  },
      { name: 'Father-Daughter Dance',             weight: 4,  is_required: false },
      { name: 'Mother-Son Dance',                  weight: 4,  is_required: false },
      { name: 'Guests Seated & Settle',            weight: 4,  is_required: false },
      { name: 'Starter Course Served',             weight: 5,  is_required: false },
      { name: 'Toasts & Speeches',                 weight: 10, is_required: true  },
      { name: 'Main Course Service',               weight: 12, is_required: false },
      { name: 'Table Candids & Reactions',         weight: 8,  is_required: true  },
      { name: 'Cake Cutting',                      weight: 3,  is_required: true  },
      { name: 'Dessert & Coffee',                  weight: 5,  is_required: false },
      { name: 'Guest Mingling',                    weight: 6,  is_required: false },
      { name: 'Dance Floor Opens',                 weight: 8,  is_required: true  },
      { name: 'Open Dancing',                      weight: 10, is_required: true  },
      { name: 'Last Dance',                        weight: 3,  is_required: false },
      { name: 'Bouquet Toss',                      weight: 2,  is_required: false },
      { name: 'Send Off / Exit',                   weight: 3,  is_required: false },
    ],
  },
  'celebration & reception': {
    defaultMinutes: 240,
    moments: [
      { name: 'Welcome Drinks & Canapés',          weight: 5,  is_required: true  },
      { name: 'Grand Entrance',                    weight: 3,  is_required: true  },
      { name: 'First Dance',                       weight: 3,  is_required: true  },
      { name: 'Welcome & Opening Toast',           weight: 4,  is_required: true  },
      { name: 'Starters Served',                   weight: 5,  is_required: false },
      { name: 'Speeches & Toasts',                 weight: 8,  is_required: true  },
      { name: 'Main Course Service',               weight: 12, is_required: false },
      { name: 'Table Candids',                     weight: 8,  is_required: true  },
      { name: 'Cake Cutting',                      weight: 3,  is_required: true  },
      { name: 'Bouquet Toss',                      weight: 2,  is_required: false },
      { name: 'Dance Floor Opens',                 weight: 6,  is_required: true  },
      { name: 'Open Dancing',                      weight: 20, is_required: true  },
      { name: 'Live Entertainment / Band',         weight: 8,  is_required: false },
      { name: 'Candid Guest Moments',              weight: 6,  is_required: true  },
      { name: 'Last Dance',                        weight: 3,  is_required: false },
      { name: 'Send-Off / Sparkler Exit',          weight: 4,  is_required: false },
    ],
  },

  // ─── Formal Dinner ────────────────────────────────────────────────────────
  'formal dinner': {
    defaultMinutes: 120,
    moments: [
      { name: 'Table Reveal & Décor Details',      weight: 5,  is_required: false },
      { name: 'Guests Seated & Settle',            weight: 5,  is_required: true  },
      { name: 'Welcome Toast / Wine Pour',         weight: 5,  is_required: true  },
      { name: 'Starter Course Served',             weight: 12, is_required: false },
      { name: 'Speeches & Toasts',                 weight: 14, is_required: true  },
      { name: 'Main Course Served',                weight: 18, is_required: false },
      { name: 'Table Candids — Laughter & Chat',   weight: 14, is_required: true  },
      { name: 'Dessert & Coffee',                  weight: 12, is_required: false },
      { name: 'Couple Circulates Tables',          weight: 8,  is_required: false },
      { name: 'Candid Wide Room Shots',            weight: 7,  is_required: false },
    ],
  },
  'dinner': {
    defaultMinutes: 90,
    moments: [
      { name: 'Table Décor & Atmosphere Details',  weight: 5,  is_required: false },
      { name: 'Guests Seated',                     weight: 5,  is_required: true  },
      { name: 'Welcome Toast',                     weight: 5,  is_required: true  },
      { name: 'Starter Course',                    weight: 15, is_required: false },
      { name: 'Main Course Service',               weight: 25, is_required: false },
      { name: 'Table Conversations & Candids',     weight: 20, is_required: true  },
      { name: 'Dessert Course',                    weight: 15, is_required: false },
      { name: 'Coffee & After-Dinner Chat',        weight: 10, is_required: false },
    ],
  },
  'dinner & celebration': {
    defaultMinutes: 90,
    moments: [
      { name: 'Guests Seated',                     weight: 5,  is_required: true  },
      { name: 'Toasts & Opening Speeches',         weight: 10, is_required: true  },
      { name: 'Dinner Course',                     weight: 30, is_required: false },
      { name: 'Table Candids',                     weight: 10, is_required: true  },
      { name: 'Cake Cutting',                      weight: 8,  is_required: true  },
      { name: 'Dessert Service',                   weight: 12, is_required: false },
      { name: 'Post-Dinner Mingling',              weight: 15, is_required: false },
      { name: 'Dance Floor Begins',                weight: 10, is_required: false },
    ],
  },

  // ─── Cake Cut & Speeches ──────────────────────────────────────────────────
  'cake cut & speeches': {
    defaultMinutes: 45,
    moments: [
      { name: 'Guests Gather for Speeches',        weight: 8,  is_required: true  },
      { name: 'Best Man Speech',                   weight: 18, is_required: true  },
      { name: 'Maid of Honour Speech',             weight: 15, is_required: false },
      { name: 'Father of Bride Speech',            weight: 15, is_required: false },
      { name: 'Groom Speech',                      weight: 15, is_required: false },
      { name: 'Cake Reveal & Setup Shots',         weight: 5,  is_required: true  },
      { name: 'Cake Cutting',                      weight: 8,  is_required: true  },
      { name: 'Cake Sharing & First Bite',         weight: 6,  is_required: false },
      { name: 'Guest Reactions & Applause',        weight: 5,  is_required: false },
      { name: 'Cake Detail Shots',                 weight: 5,  is_required: false },
    ],
  },
  'cake cutting & speeches': {
    defaultMinutes: 45,
    moments: [
      { name: 'Guests Gather',                     weight: 8,  is_required: true  },
      { name: 'Speaker Introduction',              weight: 5,  is_required: false },
      { name: 'Speeches & Toasts',                 weight: 35, is_required: true  },
      { name: 'Cake Detail & Reveal',              weight: 7,  is_required: true  },
      { name: 'Cake Cutting',                      weight: 12, is_required: true  },
      { name: 'First Bite & Reactions',            weight: 8,  is_required: false },
      { name: 'Cheers & Applause',                 weight: 10, is_required: false },
      { name: 'Dessert Served',                    weight: 15, is_required: false },
    ],
  },
  'food & cake': {
    defaultMinutes: 80,
    moments: [
      { name: 'Dining Area Décor',                 weight: 5,  is_required: false },
      { name: 'Guests Seated',                     weight: 5,  is_required: true  },
      { name: 'Food Service & Speeches',          weight: 30, is_required: true  },
      { name: 'Main Eating & Chat (Candids)',      weight: 25, is_required: true  },
      { name: 'Cake Reveal', weight: 5,            is_required: true  },
      { name: 'Cake Cutting',                      weight: 10, is_required: true  },
      { name: 'Cake Sharing & Reactions',          weight: 8,  is_required: false },
      { name: 'Post-Cake Chat',                    weight: 12, is_required: false },
    ],
  },

  // ─── First Dance & Evening ─────────────────────────────────────────────────
  'first dance & evening': {
    defaultMinutes: 90,
    moments: [
      { name: 'Dance Floor Setup Shots',           weight: 3,  is_required: false },
      { name: 'First Dance — Full Song',           weight: 8,  is_required: true  },
      { name: 'First Dance Close-Ups',             weight: 5,  is_required: true  },
      { name: 'Father-Daughter Dance',             weight: 6,  is_required: false },
      { name: 'Mother-Son Dance',                  weight: 6,  is_required: false },
      { name: 'Band / DJ Starts',                  weight: 4,  is_required: false },
      { name: 'Guests Fill Dance Floor',           weight: 5,  is_required: true  },
      { name: 'Dancing Wide Shots',                weight: 12, is_required: true  },
      { name: 'Dancing Close-Ups & Reactions',     weight: 10, is_required: true  },
      { name: 'Couple Dancing Candids',            weight: 10, is_required: true  },
      { name: 'Energy & Party Moments',            weight: 12, is_required: true  },
      { name: 'Bouquet / Garter Toss',             weight: 4,  is_required: false },
      { name: 'Last Dance',                        weight: 5,  is_required: false },
      { name: 'Sparkler Send-Off',                 weight: 6,  is_required: false },
      { name: 'End of Night Farewells',            weight: 4,  is_required: false },
    ],
  },
  'first dance': {
    defaultMinutes: 10,
    moments: [
      { name: 'Couple Announced',                  weight: 10, is_required: true  },
      { name: 'First Dance — Full Song',           weight: 50, is_required: true  },
      { name: 'Wedding Party Joins',               weight: 15, is_required: false },
      { name: 'Parent Dances',                     weight: 25, is_required: false },
    ],
  },
  'dancing & celebration': {
    defaultMinutes: 60,
    moments: [
      { name: 'Dance Floor Opens',                 weight: 8,  is_required: true  },
      { name: 'First Dance',                       weight: 8,  is_required: true  },
      { name: 'Parent Dances',                     weight: 8,  is_required: false },
      { name: 'Guests Fill Dance Floor',           weight: 10, is_required: true  },
      { name: 'Dancing Wide Shots',                weight: 15, is_required: true  },
      { name: 'Dancing Close-Ups & Reactions',     weight: 12, is_required: true  },
      { name: 'High Energy / Party Vibe',          weight: 15, is_required: true  },
      { name: 'Couple Dancing Candids',            weight: 12, is_required: true  },
      { name: 'Last Dance',                        weight: 5,  is_required: false },
      { name: 'End of Night',                      weight: 7,  is_required: false },
    ],
  },
  'evening dancing': {
    defaultMinutes: 60,
    moments: [
      { name: 'Dance Floor Atmosphere',            weight: 8,  is_required: true  },
      { name: 'First Dance',                       weight: 8,  is_required: true  },
      { name: 'Parent Dances',                     weight: 8,  is_required: false },
      { name: 'Band / DJ Starts',                  weight: 5,  is_required: false },
      { name: 'Guests Join Dance Floor',           weight: 10, is_required: true  },
      { name: 'Dance Floor Wide Shots',            weight: 12, is_required: true  },
      { name: 'High-Energy Party Moments',         weight: 15, is_required: true  },
      { name: 'Couple Dancing Candids',            weight: 12, is_required: true  },
      { name: 'Crowd Reactions & Fun',             weight: 12, is_required: true  },
      { name: 'Open Dance Floor',                  weight: 10, is_required: false },
    ],
  },
  'evening celebrations': {
    defaultMinutes: 120,
    moments: [
      { name: 'Venue Transformation',             weight: 5,  is_required: false },
      { name: 'Evening Guests Arrive',             weight: 5,  is_required: false },
      { name: 'First Dance',                       weight: 5,  is_required: true  },
      { name: 'Parent Dances',                     weight: 5,  is_required: false },
      { name: 'Band / DJ Kicks Off',               weight: 5,  is_required: false },
      { name: 'Guests Fill Dance Floor',           weight: 8,  is_required: true  },
      { name: 'Dance Floor Wide Shots',            weight: 12, is_required: true  },
      { name: 'High-Energy Party Moments',         weight: 14, is_required: true  },
      { name: 'Couple Dancing Candids',            weight: 10, is_required: true  },
      { name: 'Crowd Reactions & Moments',         weight: 10, is_required: true  },
      { name: 'Entertainment Highlights',          weight: 8,  is_required: false },
      { name: 'Last Dance',                        weight: 5,  is_required: false },
      { name: 'Sparkler Exit / Send-Off',          weight: 8,  is_required: false },
    ],
  },

  // ─── Golden Hour ─────────────────────────────────────────────────────────
  'golden hour': {
    defaultMinutes: 45,
    moments: [
      { name: 'Location Walk & Arrive',            weight: 10, is_required: true  },
      { name: 'Warm Backlit Portraits',            weight: 22, is_required: true  },
      { name: 'Walking Candid Shots',              weight: 15, is_required: true  },
      { name: 'Close-Up Intimate Portraits',       weight: 15, is_required: true  },
      { name: 'Silhouette Against Sky',            weight: 15, is_required: false },
      { name: 'Flare & Creative Compositions',     weight: 10, is_required: false },
      { name: 'Final Hero Shot',                   weight: 13, is_required: false },
    ],
  },

  // ─── Detail Shots ─────────────────────────────────────────────────────────
  'detail shots': {
    defaultMinutes: 30,
    moments: [
      { name: 'Engagement & Wedding Rings',        weight: 15, is_required: true  },
      { name: 'Wedding Bands Close-Up',            weight: 10, is_required: true  },
      { name: 'Bridal Bouquet',                    weight: 10, is_required: true  },
      { name: 'Buttonhole & Corsages',             weight: 8,  is_required: false },
      { name: 'Wedding Shoes',                     weight: 8,  is_required: false },
      { name: 'Bridal Gown — Train & Details',     weight: 8,  is_required: false },
      { name: 'Invitations & Stationery',          weight: 8,  is_required: false },
      { name: 'Table Settings & Place Cards',      weight: 8,  is_required: false },
      { name: 'Venue & Floral Décor',              weight: 10, is_required: false },
      { name: 'Perfume, Jewellery & Personal Items', weight: 8, is_required: false },
      { name: 'Cake Detail',                       weight: 7,  is_required: false },
    ],
  },

  // ─── Lifestyle Footage ────────────────────────────────────────────────────
  'lifestyle footage': {
    defaultMinutes: 45,
    moments: [
      { name: 'Natural Walk Together',             weight: 18, is_required: true  },
      { name: 'Sitting & Chatting',                weight: 15, is_required: true  },
      { name: 'Candid Laughter',                   weight: 15, is_required: true  },
      { name: 'Activity Together (Picnic/Dance)',  weight: 18, is_required: false },
      { name: 'Close-Up Glances',                  weight: 12, is_required: false },
      { name: 'Playful Moments',                   weight: 12, is_required: false },
      { name: 'Quiet Intimate Stills',             weight: 10, is_required: false },
    ],
  },

  // ─── Interviews ───────────────────────────────────────────────────────────
  'interview / vows read': {
    defaultMinutes: 30,
    moments: [
      { name: 'Setup & Seated Intro',              weight: 10, is_required: true  },
      { name: 'How We Met Story',                  weight: 20, is_required: true  },
      { name: 'Proposal Story',                    weight: 20, is_required: true  },
      { name: 'First Memories Together',           weight: 10, is_required: false },
      { name: 'What I Love About You',             weight: 10, is_required: false },
      { name: 'Vow Reading (Personal)',            weight: 20, is_required: true  },
      { name: 'Message for Each Other',            weight: 10, is_required: false },
    ],
  },
  'guest interviews': {
    defaultMinutes: 30,
    moments: [
      { name: 'Best Wishes & Congratulations',     weight: 25, is_required: true  },
      { name: 'Funny / Embarrassing Stories',      weight: 20, is_required: true  },
      { name: 'Advice for the Couple',             weight: 20, is_required: true  },
      { name: 'Favourite Memory',                  weight: 15, is_required: false },
      { name: 'Message to Camera',                 weight: 10, is_required: false },
      { name: 'Dancing Predictions',               weight: 10, is_required: false },
    ],
  },

  // ─── Hindu / Asian Ceremonies ─────────────────────────────────────────────
  'mehendi (henna)': {
    defaultMinutes: 180,
    moments: [
      { name: 'Henna Artists Arrive & Setup',      weight: 5,  is_required: false },
      { name: 'Family Gathering',                  weight: 5,  is_required: true  },
      { name: "Bride's Henna Application",         weight: 20, is_required: true  },
      { name: 'Guest Henna Application',           weight: 20, is_required: true  },
      { name: 'Music & Singing',                   weight: 10, is_required: false },
      { name: 'Dhol & Dancing',                    weight: 12, is_required: false },
      { name: 'Groom Teasing / Games',             weight: 8,  is_required: false },
      { name: 'Family Group Photos',               weight: 6,  is_required: true  },
      { name: 'Henna Pattern Detail Shots',        weight: 5,  is_required: true  },
      { name: 'Evening Celebrations',              weight: 9,  is_required: false },
    ],
  },
  'mehndi (henna celebration)': {
    defaultMinutes: 180,
    moments: [
      { name: 'Family Arrive & Welcome',           weight: 5,  is_required: true  },
      { name: 'Henna Artists Setup',               weight: 3,  is_required: false },
      { name: "Bride Seated, Henna Begins",        weight: 18, is_required: true  },
      { name: 'Guest Henna Application',           weight: 16, is_required: true  },
      { name: 'Dhol Playing & Music',              weight: 10, is_required: false },
      { name: 'Group Dancing',                     weight: 12, is_required: false },
      { name: 'Groom Entrance & Tease',            weight: 6,  is_required: false },
      { name: 'Food & Refreshments',               weight: 10, is_required: false },
      { name: 'Family Bonding Candids',            weight: 10, is_required: true  },
      { name: 'Henna Detail Close-Ups',            weight: 6,  is_required: true  },
      { name: 'Group Celebration & Photos',        weight: 8,  is_required: true  },
      { name: 'End of Evening',                    weight: 6,  is_required: false },
    ],
  },
  'mehendi': {
    defaultMinutes: 120,
    moments: [
      { name: 'Henna Artists Arrive',              weight: 4,  is_required: false },
      { name: "Bride's Henna Application",         weight: 15, is_required: true  },
      { name: 'Guest Henna',                       weight: 12, is_required: false },
      { name: 'Music & Singing',                   weight: 10, is_required: false },
      { name: 'Dancing & Dhol',                    weight: 20, is_required: true  },
      { name: 'Groom Tease / Games',               weight: 10, is_required: false },
      { name: 'Family Group Candids',              weight: 10, is_required: true  },
      { name: 'Henna Close-Up Details',            weight: 5,  is_required: true  },
      { name: 'Evening Singing',                   weight: 10, is_required: false },
      { name: 'Close of Celebrations',             weight: 4,  is_required: false },
    ],
  },
  'baraat & bride meet groom': {
    defaultMinutes: 90,
    moments: [
      { name: 'Baraat Music Begins Approaching',   weight: 10, is_required: true  },
      { name: 'Baraat Procession Arrival',         weight: 15, is_required: true  },
      { name: 'Dhol & Dancing Outside',            weight: 12, is_required: true  },
      { name: 'Family Welcome Ritual',             weight: 10, is_required: true  },
      { name: 'Groom Dismounts / Enters',          weight: 5,  is_required: true  },
      { name: "Bride's First Appearance",          weight: 8,  is_required: true  },
      { name: 'Couple Initial Meeting',            weight: 8,  is_required: true  },
      { name: 'Exchange of Garlands (Jaimala)',    weight: 8,  is_required: false },
      { name: 'Family Rituals',                    weight: 12, is_required: true  },
      { name: 'Couple Reaction & Candids',         weight: 8,  is_required: true  },
      { name: 'Group Family Photos',               weight: 4,  is_required: false },
    ],
  },
  'groom arrival (baraat)': {
    defaultMinutes: 90,
    moments: [
      { name: 'Baraat Music & Distant Procession', weight: 10, is_required: true  },
      { name: 'Baraat Procession Arrival',         weight: 15, is_required: true  },
      { name: 'Dhol & Dancing',                    weight: 15, is_required: true  },
      { name: 'Groom on Horse / Car',              weight: 8,  is_required: false },
      { name: 'Family Welcome',                    weight: 10, is_required: true  },
      { name: 'Baraat Street Dancing',             weight: 12, is_required: false },
      { name: 'High-Energy Crowd Shots',           weight: 10, is_required: true  },
      { name: 'Groom Descends & Enters',           weight: 8,  is_required: true  },
      { name: 'Arrival Rituals & Blessings',       weight: 8,  is_required: true  },
      { name: 'Close-Up Groom Reaction',           weight: 4,  is_required: true  },
    ],
  },
  'aashirwad/blessings': {
    defaultMinutes: 90,
    moments: [
      { name: 'Family Gathers',                    weight: 10, is_required: true  },
      { name: 'Elder Blessings Begin',             weight: 15, is_required: true  },
      { name: 'Individual Blessings',              weight: 20, is_required: true  },
      { name: 'Emotional Reactions',               weight: 10, is_required: true  },
      { name: 'Prayers & Rituals',                 weight: 12, is_required: false },
      { name: 'Couple Close-Ups During Blessings', weight: 8,  is_required: true  },
      { name: 'Gift Giving',                       weight: 10, is_required: false },
      { name: 'Family Group Photos',               weight: 10, is_required: true  },
      { name: 'Candid Family Moments',             weight: 5,  is_required: false },
    ],
  },
  'early morning prayers': {
    defaultMinutes: 60,
    moments: [
      { name: 'Pre-Dawn Atmosphere',               weight: 10, is_required: false },
      { name: 'Family Gathers for Prayer',         weight: 12, is_required: true  },
      { name: 'Prayer / Dua',                      weight: 20, is_required: true  },
      { name: 'Quran Reading',                     weight: 15, is_required: false },
      { name: 'Blessings from Elders',             weight: 18, is_required: true  },
      { name: 'Emotional Candids',                 weight: 10, is_required: true  },
      { name: 'Bride Getting Ready (Light)',        weight: 15, is_required: false },
    ],
  },

  // ─── Misc / Other ─────────────────────────────────────────────────────────
  'candid moments': {
    defaultMinutes: 30,
    moments: [
      { name: 'Friends Catching Up',               weight: 20, is_required: true  },
      { name: 'Laughter & Fun Stories',            weight: 20, is_required: true  },
      { name: 'Children at the Wedding',           weight: 12, is_required: false },
      { name: 'Older Guests Moments',              weight: 12, is_required: false },
      { name: 'Background Candids',                weight: 15, is_required: true  },
      { name: 'End of Night Hugs',                 weight: 12, is_required: true  },
      { name: 'Emotional Farewells',               weight: 9,  is_required: false },
    ],
  },
  'casual group photos': {
    defaultMinutes: 30,
    moments: [
      { name: 'Gathering the Group',               weight: 10, is_required: true  },
      { name: 'Friend Group Shots',                weight: 22, is_required: true  },
      { name: 'Family Group Photos',               weight: 22, is_required: true  },
      { name: 'Formal Full Party Photo',           weight: 18, is_required: true  },
      { name: 'Silly / Fun Shot',                  weight: 15, is_required: false },
      { name: 'Candid After Group Photos',         weight: 13, is_required: false },
    ],
  },
  'garden games': {
    defaultMinutes: 60,
    moments: [
      { name: 'Game Setup & Atmosphere',           weight: 8,  is_required: false },
      { name: 'Lawn Bowls / Croquet',              weight: 20, is_required: true  },
      { name: 'Giant Jenga',                       weight: 15, is_required: false },
      { name: 'Group Game Moments',                weight: 20, is_required: true  },
      { name: 'Candid Laughter',                   weight: 15, is_required: true  },
      { name: 'Children Playing',                  weight: 10, is_required: false },
      { name: 'End-of-Round Reactions',            weight: 12, is_required: false },
    ],
  },
  'photos & cocktails': {
    defaultMinutes: 60,
    moments: [
      { name: 'Confetti / Exit from Ceremony',     weight: 8,  is_required: false },
      { name: 'Couple Portraits',                  weight: 20, is_required: true  },
      { name: 'Bridal Party Portraits',            weight: 15, is_required: true  },
      { name: 'Welcome Drinks Served',             weight: 8,  is_required: true  },
      { name: 'Guest Mingling',                    weight: 15, is_required: true  },
      { name: 'Canapés & Nibbles',                 weight: 8,  is_required: false },
      { name: 'Candid Guest Moments',              weight: 12, is_required: false },
      { name: 'Venue & Garden Details',            weight: 8,  is_required: false },
      { name: 'Entertainment / Music',             weight: 6,  is_required: false },
    ],
  },
  'meet & greet': {
    defaultMinutes: 45,
    moments: [
      { name: 'Couple Welcomed to Room',           weight: 10, is_required: true  },
      { name: 'Greeting Close Friends',            weight: 20, is_required: true  },
      { name: 'First-Time Meeting Moments',        weight: 18, is_required: true  },
      { name: 'Group Candids with Couple',         weight: 18, is_required: true  },
      { name: 'Guests Offering Congratulations',   weight: 15, is_required: false },
      { name: 'Candid Hugs & Reactions',           weight: 12, is_required: false },
      { name: 'Couple Circulates',                 weight: 7,  is_required: false },
    ],
  },
  'live entertainment': {
    defaultMinutes: 60,
    moments: [
      { name: 'Performer Setup / Sound Check',     weight: 6,  is_required: false },
      { name: 'Performance Start',                  weight: 8,  is_required: true  },
      { name: 'Wide Performance Shots',            weight: 15, is_required: true  },
      { name: 'Crowd Reactions',                   weight: 20, is_required: true  },
      { name: 'Close-Up Performer',                weight: 12, is_required: false },
      { name: 'Couple Enjoying Show',              weight: 12, is_required: true  },
      { name: 'Dancing Starts',                    weight: 15, is_required: false },
      { name: 'Crowd Atmosphere',                  weight: 8,  is_required: true  },
      { name: 'Final Bow / Applause',              weight: 4,  is_required: false },
    ],
  },
  'outfit change': {
    defaultMinutes: 15,
    moments: [
      { name: 'Exit from Venue',                   weight: 15, is_required: false },
      { name: 'Quick Change in Progress',          weight: 30, is_required: true  },
      { name: 'Fresh Look Reveal',                 weight: 30, is_required: true  },
      { name: 'Reaction from Partner',             weight: 15, is_required: false },
      { name: 'Re-Enter Venue',                    weight: 10, is_required: false },
    ],
  },
  'rehearsal dinner': {
    defaultMinutes: 120,
    moments: [
      { name: 'Venue & Table Décor',               weight: 5,  is_required: false },
      { name: 'Guest Arrivals',                    weight: 8,  is_required: true  },
      { name: 'Welcome Drinks',                    weight: 5,  is_required: false },
      { name: 'Starters Served',                   weight: 10, is_required: false },
      { name: 'Welcome Toast',                     weight: 5,  is_required: true  },
      { name: 'Speeches & Toasts',                 weight: 14, is_required: true  },
      { name: 'Main Course',                       weight: 18, is_required: false },
      { name: 'Candid Family & Friends Moments',   weight: 14, is_required: true  },
      { name: 'Table Laughs',                      weight: 8,  is_required: true  },
      { name: 'Dessert',                           weight: 8,  is_required: false },
      { name: 'Post-Dinner Mingling',              weight: 10, is_required: false },
      { name: 'End of Evening Farewells',          weight: 5,  is_required: false },
    ],
  },
  'engagement session': {
    defaultMinutes: 90,
    moments: [
      { name: 'Location Arrival',                  weight: 5,  is_required: false },
      { name: 'Natural Walking Candids',           weight: 18, is_required: true  },
      { name: 'Posed Portraits',                   weight: 20, is_required: true  },
      { name: 'Close-Up & Intimate Shots',         weight: 12, is_required: true  },
      { name: 'Activity Together',                 weight: 15, is_required: false },
      { name: 'Candid Laughter',                   weight: 12, is_required: true  },
      { name: 'Ring Detail Shot',                  weight: 5,  is_required: false },
      { name: 'Golden Hour / Creative',            weight: 13, is_required: false },
    ],
  },
  'send off': {
    defaultMinutes: 20,
    moments: [
      { name: 'Guests Line Both Sides',            weight: 15, is_required: true  },
      { name: 'Sparkler Line Lit',                 weight: 15, is_required: false },
      { name: 'Couple Walk Out',                   weight: 25, is_required: true  },
      { name: 'Couple Kiss Under Sparklers',       weight: 15, is_required: false },
      { name: 'Car / Getaway Vehicle Departure',   weight: 20, is_required: true  },
      { name: 'Final Waves & Goodbyes',            weight: 10, is_required: false },
    ],
  },
  'farewell': {
    defaultMinutes: 20,
    moments: [
      { name: 'Guests Gathering for Farewell',     weight: 15, is_required: true  },
      { name: 'Sparkler / Petal Exit',             weight: 15, is_required: false },
      { name: 'Couple Walk Out',                   weight: 25, is_required: true  },
      { name: 'Last Hugs & Goodbyes',              weight: 20, is_required: true  },
      { name: 'Car Departure',                     weight: 15, is_required: false },
      { name: 'Guests Wave Goodbye',               weight: 10, is_required: false },
    ],
  },

  // ─── Standalone Speeches / Toasts ─────────────────────────────────────────
  'toasts & speeches': {
    defaultMinutes: 30,
    moments: [
      { name: 'Guests Gather & Settle',            weight: 8,  is_required: true  },
      { name: 'Best Man Speech',                   weight: 20, is_required: true  },
      { name: 'Maid of Honour Speech',             weight: 18, is_required: false },
      { name: 'Father of Bride Speech',            weight: 18, is_required: false },
      { name: 'Groom Speech',                      weight: 18, is_required: false },
      { name: 'Guest Reactions & Laughter',        weight: 10, is_required: true  },
      { name: 'Final Toast & Glasses Raised',      weight: 8,  is_required: true  },
    ],
  },
  'speeches & toasts': {
    defaultMinutes: 30,
    moments: [
      { name: 'Guests Settle & Attention Sought',  weight: 8,  is_required: true  },
      { name: 'Best Man Speech',                   weight: 20, is_required: true  },
      { name: 'Maid of Honour / Bridesmaid Speech', weight: 18, is_required: false },
      { name: 'Father of Bride Speech',            weight: 18, is_required: false },
      { name: 'Groom Speech',                      weight: 18, is_required: false },
      { name: 'Guest Reactions',                   weight: 10, is_required: true  },
      { name: 'Final Toast',                       weight: 8,  is_required: true  },
    ],
  },

  // ─── Welcome Drinks ───────────────────────────────────────────────────────
  'welcome drinks': {
    defaultMinutes: 45,
    moments: [
      { name: 'Guests Arrive & Are Greeted',       weight: 12, is_required: true  },
      { name: 'Welcome Drinks Served',             weight: 10, is_required: true  },
      { name: 'Canapés & Bites',                   weight: 10, is_required: false },
      { name: 'Mingling & Introductions',          weight: 25, is_required: true  },
      { name: 'Candid Guest Moments',              weight: 18, is_required: true  },
      { name: 'Live Music / Ambience',             weight: 10, is_required: false },
      { name: 'Couple Circulates',                 weight: 10, is_required: false },
      { name: 'Move to Next Venue Area',           weight: 5,  is_required: false },
    ],
  },

  // ─── Rehearsal Walk-Through ────────────────────────────────────────────────
  'rehearsal walk-through': {
    defaultMinutes: 45,
    moments: [
      { name: 'Bridal Party Assembles',            weight: 10, is_required: true  },
      { name: 'Officiant Explains Order of Service', weight: 10, is_required: true },
      { name: 'Processional Practice',             weight: 18, is_required: true  },
      { name: 'Vows Walk-Through',                 weight: 15, is_required: true  },
      { name: 'Ring Exchange Practice',            weight: 10, is_required: true  },
      { name: 'Recessional Practice',              weight: 12, is_required: true  },
      { name: 'Q&A / Final Run-Through Notes',     weight: 10, is_required: false },
      { name: 'Candid Laughs & Nerves',            weight: 8,  is_required: false },
      { name: 'Final Group Hug / See You Tomorrow', weight: 7,  is_required: false },
    ],
  },
  'guest arrival & ceremony setup': {
    defaultMinutes: 30,
    moments: [
      { name: 'Guests Arriving & Greeting',        weight: 25, is_required: true  },
      { name: 'Ushers Seating Guests',             weight: 15, is_required: false },
      { name: 'Venue & Ceremony Décor Details',    weight: 15, is_required: false },
      { name: 'Flowers, Candles & Setting',        weight: 10, is_required: false },
      { name: 'Bridal Party Assembly',             weight: 15, is_required: true  },
      { name: 'Bride Processional Begins',         weight: 20, is_required: true  },
    ],
  },
  'confetti moment': {
    defaultMinutes: 20,
    moments: [
      { name: 'Guests Line Up',                    weight: 15, is_required: true  },
      { name: 'Confetti Distributed',              weight: 10, is_required: false },
      { name: 'Confetti Throw',                    weight: 40, is_required: true  },
      { name: 'Couple Walk-Through Close-Ups',     weight: 20, is_required: true  },
      { name: 'Repeat Throws / Fun',               weight: 15, is_required: false },
    ],
  },
};

// ─── Normalise key lookup ──────────────────────────────────────────────────────

function findTemplate(activityName) {
  const needle = activityName.trim().toLowerCase();
  // Exact match
  if (TEMPLATES[needle]) return TEMPLATES[needle];
  // Partial match — needle contains key
  for (const key of Object.keys(TEMPLATES)) {
    if (needle.includes(key) || key.includes(needle)) return TEMPLATES[key];
  }
  return null;
}

// ─── Build moments for one activity ──────────────────────────────────────────

function buildMoments(template, totalSeconds) {
  const moments = template.moments;
  const totalWeight = moments.reduce((s, m) => s + m.weight, 0);
  const results = [];

  let usedSeconds = 0;
  for (let i = 0; i < moments.length; i++) {
    const m = moments[i];
    let dur;
    if (i === moments.length - 1) {
      // Last moment gets whatever is left (ensures exact sum)
      dur = totalSeconds - usedSeconds;
    } else {
      dur = Math.round(((m.weight / totalWeight) * totalSeconds) / 30) * 30;
      dur = Math.max(30, dur);
    }
    usedSeconds += dur;
    results.push({
      name: m.name,
      order_index: i,
      duration_seconds: dur,
      is_required: m.is_required,
    });
  }
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🗑️  Deleting all existing PackageActivityMoments...');
  const deleted = await prisma.packageActivityMoment.deleteMany({});
  console.log(`   Deleted ${deleted.count} moments.\n`);

  const activities = await prisma.packageActivity.findMany({
    orderBy: { id: 'asc' },
  });
  console.log(`📋 Found ${activities.length} activities.\n`);

  let created = 0;
  let skipped = 0;

  for (const activity of activities) {
    const template = findTemplate(activity.name);
    if (!template) {
      console.log(`⏭️  No template for: "${activity.name}" (ID:${activity.id})`);
      skipped++;
      continue;
    }

    const durationMins = activity.duration_minutes ?? template.defaultMinutes;
    const totalSeconds = durationMins * 60;

    const moments = buildMoments(template, totalSeconds);

    await prisma.packageActivityMoment.createMany({
      data: moments.map(m => ({
        package_activity_id: activity.id,
        name: m.name,
        order_index: m.order_index,
        duration_seconds: m.duration_seconds,
        is_required: m.is_required,
      })),
    });

    const momentTotal = moments.reduce((s, m) => s + m.duration_seconds, 0);
    console.log(
      `✅ "${activity.name}" (ID:${activity.id}) → ` +
      `${moments.length} moments, ${durationMins} min, ` +
      `${momentTotal}s / ${totalSeconds}s`
    );
    created += moments.length;
  }

  console.log(`\n🎉 Done! Created ${created} moments across ${activities.length - skipped} activities. Skipped ${skipped}.`);
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
