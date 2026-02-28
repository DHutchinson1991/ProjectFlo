import { PrismaClient } from '@prisma/client';
import { createSeedLogger, SeedSummary, SeedType } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

// ─── Wedding Activity → Default Moments Mapping ─────────────────────
// Duration is in seconds. These represent realistic real-world durations
// for how long each moment typically takes during the wedding day.

interface ActivityMomentSeed {
    name: string;
    order_index: number;
    duration_seconds: number;
    is_required: boolean;
}

const ACTIVITY_MOMENTS: Record<string, ActivityMomentSeed[]> = {
    // ── Getting Ready / Bridal Prep (~90–120 min real-world) ──
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

    // ── First Look / Reveal (~15–20 min) ──
    'First Look': [
        { name: 'Anticipation Build', order_index: 0, duration_seconds: 300, is_required: true },
        { name: 'The Reveal', order_index: 1, duration_seconds: 180, is_required: true },
        { name: 'Reaction', order_index: 2, duration_seconds: 300, is_required: true },
        { name: 'Embrace', order_index: 3, duration_seconds: 180, is_required: false },
    ],

    // ── Ceremony (~45–60 min) ──
    'Ceremony': [
        { name: 'Guest Arrival & Seating', order_index: 0, duration_seconds: 600, is_required: false },
        { name: 'Venue & Decor Details', order_index: 1, duration_seconds: 300, is_required: false },
        { name: 'Groom Arrival & Anticipation', order_index: 2, duration_seconds: 300, is_required: false },
        { name: 'Bridal Party Processional', order_index: 3, duration_seconds: 180, is_required: true },
        { name: 'Bride Entrance', order_index: 4, duration_seconds: 120, is_required: true },
        { name: 'Registrar Welcome & Opening', order_index: 5, duration_seconds: 300, is_required: true },
        { name: 'Declaratory Words', order_index: 6, duration_seconds: 180, is_required: true },
        { name: 'Contracting Words (Legal Vows)', order_index: 7, duration_seconds: 120, is_required: true },
        { name: 'Ring Exchange', order_index: 8, duration_seconds: 120, is_required: true },
        { name: 'Readings', order_index: 9, duration_seconds: 300, is_required: false },
        { name: 'Personal Vows / Promises', order_index: 10, duration_seconds: 180, is_required: false },
        { name: 'Signing of the Register', order_index: 11, duration_seconds: 300, is_required: true },
        { name: 'Pronouncement as Married', order_index: 12, duration_seconds: 60, is_required: true },
        { name: 'First Kiss', order_index: 13, duration_seconds: 30, is_required: true },
        { name: 'Guests Reaction & Applause', order_index: 14, duration_seconds: 120, is_required: false },
        { name: 'Recessional (Walk Out)', order_index: 15, duration_seconds: 180, is_required: true },
        { name: 'Confetti Throw', order_index: 16, duration_seconds: 120, is_required: false },
        { name: 'Receiving Line / Congratulations', order_index: 17, duration_seconds: 600, is_required: false },
    ],

    // ── Cocktail Hour (~45–60 min) ──
    'Cocktail Hour': [
        { name: 'Guest Mingling', order_index: 0, duration_seconds: 1200, is_required: true },
        { name: 'Drink Service', order_index: 1, duration_seconds: 600, is_required: false },
        { name: 'Appétiser Service', order_index: 2, duration_seconds: 600, is_required: false },
        { name: 'Live Music/Entertainment', order_index: 3, duration_seconds: 900, is_required: false },
        { name: 'Venue Details', order_index: 4, duration_seconds: 300, is_required: false },
    ],

    // ── Portraits (~30–45 min) ──
    'Portraits': [
        { name: 'Couple Portraits', order_index: 0, duration_seconds: 900, is_required: true },
        { name: 'Bridal Party', order_index: 1, duration_seconds: 600, is_required: true },
        { name: 'Family Formals', order_index: 2, duration_seconds: 600, is_required: true },
        { name: 'Romantic Walk', order_index: 3, duration_seconds: 300, is_required: false },
        { name: 'Creative Shots', order_index: 4, duration_seconds: 300, is_required: false },
    ],

    // ── Reception (~3–4 hours) ──
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

    // ── Rehearsal Dinner (~2 hours) ──
    'Rehearsal Dinner': [
        { name: 'Venue & Table Decor', order_index: 0, duration_seconds: 600, is_required: false },
        { name: 'Guest Arrival', order_index: 1, duration_seconds: 900, is_required: true },
        { name: 'Toasts & Speeches', order_index: 2, duration_seconds: 1200, is_required: true },
        { name: 'Dinner', order_index: 3, duration_seconds: 3600, is_required: false },
        { name: 'Candid Moments', order_index: 4, duration_seconds: 900, is_required: true },
    ],

    // ── Engagement Session (~60–90 min) ──
    'Engagement Session': [
        { name: 'Location Arrival', order_index: 0, duration_seconds: 300, is_required: false },
        { name: 'Walking & Natural', order_index: 1, duration_seconds: 1200, is_required: true },
        { name: 'Posed Portraits', order_index: 2, duration_seconds: 1200, is_required: true },
        { name: 'Candid Moments', order_index: 3, duration_seconds: 900, is_required: true },
        { name: 'Ring Detail', order_index: 4, duration_seconds: 300, is_required: false },
        { name: 'Golden Hour/Creative', order_index: 5, duration_seconds: 900, is_required: false },
    ],

    // ── Golden Hour (~20–30 min) ──
    'Golden Hour': [
        { name: 'Couple Walk', order_index: 0, duration_seconds: 600, is_required: true },
        { name: 'Romantic Portraits', order_index: 1, duration_seconds: 600, is_required: true },
        { name: 'Silhouette Shots', order_index: 2, duration_seconds: 300, is_required: false },
        { name: 'Creative Details', order_index: 3, duration_seconds: 300, is_required: false },
    ],

    // ── Farewell / Send Off (~15–20 min) ──
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

// Case-insensitive activity name lookup
function findMomentsForActivity(activityName: string): ActivityMomentSeed[] | null {
    const normalized = activityName.trim().toLowerCase();
    for (const [key, moments] of Object.entries(ACTIVITY_MOMENTS)) {
        if (key.toLowerCase() === normalized) return moments;
    }
    // Try partial matching for common variations
    for (const [key, moments] of Object.entries(ACTIVITY_MOMENTS)) {
        const keyLower = key.toLowerCase();
        if (normalized.includes(keyLower) || keyLower.includes(normalized)) return moments;
    }
    return null;
}

/**
 * Seed PackageActivityMoments for all existing package activities
 * that match known wedding activity names.
 */
async function seedActivityMoments(): Promise<SeedSummary> {
    logger.sectionHeader('Activity Moments', 'Seeding default moments for package activities');
    logger.startTimer('activity-moments');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Get all package activities
    const activities = await prisma.packageActivity.findMany({
        include: { moments: true },
    });

    for (const activity of activities) {
        const moments = findMomentsForActivity(activity.name);
        if (!moments) {
            skipped++;
            logger.skipped(`Activity "${activity.name}"`, 'no moment template found', 'verbose');
            continue;
        }

        // Skip if activity already has moments
        if (activity.moments.length > 0) {
            skipped++;
            logger.skipped(`Activity "${activity.name}"`, `already has ${activity.moments.length} moments`, 'verbose');
            continue;
        }

        // Create moments for this activity
        await prisma.packageActivityMoment.createMany({
            data: moments.map(m => ({
                package_activity_id: activity.id,
                name: m.name,
                order_index: m.order_index,
                duration_seconds: m.duration_seconds,
                is_required: m.is_required,
            })),
        });

        created += moments.length;
        logger.created(`${moments.length} moments for activity "${activity.name}"`, undefined, 'verbose');
    }

    const total = created + updated + skipped;
    logger.summary('Activity moments', { created, updated, skipped, total });
    logger.endTimer('activity-moments', 'Activity moments seeding');
    return { created, updated, skipped, total };
}

// Export the moment definitions for reuse (e.g. when creating new activities)
export { ACTIVITY_MOMENTS, findMomentsForActivity };

export default seedActivityMoments;

if (require.main === module) {
    seedActivityMoments()
        .catch((error) => {
            console.error('❌ Error seeding activity moments:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
