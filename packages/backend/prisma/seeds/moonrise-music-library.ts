// Moonrise Films - Music Library Seed
// Creates wedding music templates for Moonrise Films brand
import { PrismaClient, MusicType } from "@prisma/client";
import { createSeedLogger, SeedType } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

export async function createMoonriseMusicLibrary() {
    logger.sectionHeader('Music Library');

    try {
        // Get the Moonrise Films brand
        const brand = await prisma.brands.findFirst({
            where: { name: "Moonrise Films" }
        });

        if (!brand) {
            logger.error('Moonrise Films brand not found!');
            logger.info('Please run the Moonrise brand setup first');
            throw new Error("Moonrise Films brand not found");
        }

        logger.success(`Found Moonrise Films brand (ID: ${brand.id})`);

        // Clear existing music for this brand
        const deleted = await prisma.musicLibrary.deleteMany({
            where: { brand_id: brand.id }
        });
        logger.info(`Cleared ${deleted.count} existing music templates for Moonrise Films`);

        // Wedding music templates for Moonrise Films
        const musicTemplates = [
            {
                assignment_number: 'M001',
                music_name: 'First Dance Song',
                artist: 'To Be Determined',
                music_type: MusicType.SCENE_MATCHED,
                duration: 240, // 4 minutes
                notes: 'Special first dance song chosen by the couple. Usually romantic and meaningful to their relationship.',
                brand_id: brand.id
            },
            {
                assignment_number: 'M002',
                music_name: 'Processional Music',
                artist: 'To Be Determined',
                music_type: MusicType.ORCHESTRAL,
                duration: 180, // 3 minutes
                notes: 'Music for the bridal processional. Often classical or orchestral pieces like Canon in D or Pachelbel.',
                brand_id: brand.id
            },
            {
                assignment_number: 'M003',
                music_name: 'Reception Entrance',
                artist: 'To Be Determined',
                music_type: MusicType.MODERN,
                duration: 120, // 2 minutes
                notes: 'Upbeat music for couple\'s grand entrance into the reception venue.',
                brand_id: brand.id
            },
            {
                assignment_number: 'M004',
                music_name: 'Father-Daughter Dance',
                artist: 'To Be Determined',
                music_type: MusicType.VINTAGE,
                duration: 210, // 3.5 minutes
                notes: 'Traditional father-daughter dance song. Often sentimental and classic.',
                brand_id: brand.id
            },
            {
                assignment_number: 'M005',
                music_name: 'Mother-Son Dance',
                artist: 'To Be Determined',
                music_type: MusicType.VINTAGE,
                duration: 210, // 3.5 minutes  
                notes: 'Traditional mother-son dance song. Usually follows the father-daughter dance.',
                brand_id: brand.id
            },
            {
                assignment_number: 'M006',
                music_name: 'Recessional Music',
                artist: 'To Be Determined',
                music_type: MusicType.ORCHESTRAL,
                duration: 150, // 2.5 minutes
                notes: 'Joyful music for the couple\'s exit after the ceremony. Often triumphant and celebratory.',
                brand_id: brand.id
            },
            {
                assignment_number: 'M007',
                music_name: 'Cocktail Hour Background',
                artist: 'To Be Determined',
                music_type: MusicType.MODERN,
                duration: 3600, // 60 minutes
                notes: 'Light background music during cocktail hour and mingling. Jazz, acoustic, or soft contemporary.',
                brand_id: brand.id
            },
            {
                assignment_number: 'M008',
                music_name: 'Dinner Service Background',
                artist: 'To Be Determined',
                music_type: MusicType.ORCHESTRAL,
                duration: 2400, // 40 minutes
                notes: 'Elegant background music during dinner service. Classical or soft instrumental.',
                brand_id: brand.id
            },
            {
                assignment_number: 'M009',
                music_name: 'Wedding Party Entrance',
                artist: 'To Be Determined',
                music_type: MusicType.MODERN,
                duration: 300, // 5 minutes
                notes: 'Upbeat music for wedding party entrances during reception introductions.',
                brand_id: brand.id
            },
            {
                assignment_number: 'M010',
                music_name: 'Cake Cutting Ceremony',
                artist: 'To Be Determined',
                music_type: MusicType.SCENE_MATCHED,
                duration: 180, // 3 minutes
                notes: 'Music during cake cutting ceremony. Often something sweet and romantic.',
                brand_id: brand.id
            },
            {
                assignment_number: 'M011',
                music_name: 'Bouquet Toss',
                artist: 'To Be Determined',
                music_type: MusicType.MODERN,
                duration: 120, // 2 minutes
                notes: 'Fun, upbeat music for the bouquet toss. Often pop or dance music.',
                brand_id: brand.id
            },
            {
                assignment_number: 'M012',
                music_name: 'Garter Toss',
                artist: 'To Be Determined',
                music_type: MusicType.MODERN,
                duration: 120, // 2 minutes
                notes: 'Playful music for the garter toss. Often rock or upbeat pop.',
                brand_id: brand.id
            },
            {
                assignment_number: 'M013',
                music_name: 'Last Dance',
                artist: 'To Be Determined',
                music_type: MusicType.SCENE_MATCHED,
                duration: 300, // 5 minutes
                notes: 'Final song of the evening. Often slow and meaningful to the couple.',
                brand_id: brand.id
            },
            {
                assignment_number: 'M014',
                music_name: 'Grand Exit',
                artist: 'To Be Determined',
                music_type: MusicType.MODERN,
                duration: 180, // 3 minutes
                notes: 'Celebratory music for the couple\'s final exit. Upbeat and joyful.',
                brand_id: brand.id
            },
            {
                assignment_number: 'M015',
                music_name: 'Prelude Music',
                artist: 'To Be Determined',
                music_type: MusicType.ORCHESTRAL,
                duration: 900, // 15 minutes
                notes: 'Soft music as guests are seated before the ceremony begins.',
                brand_id: brand.id
            }
        ];

        const createdMusic: Array<{
            id: number;
            assignment_number: string | null;
            music_name: string | null;
            duration: number | null;
            brand_id: number | null;
            music_type: MusicType;
        }> = [];
        let successCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const template of musicTemplates) {
            try {
                // Check if music template already exists by assignment_number
                const existing = await prisma.musicLibrary.findFirst({
                    where: {
                        assignment_number: template.assignment_number,
                        brand_id: brand.id
                    }
                });

                if (existing) {
                    logger.skipped(`Music template "${template.assignment_number} - ${template.music_name}" already exists (ID: ${existing.id})`, undefined, 'verbose');
                    createdMusic.push(existing);
                    skippedCount++;
                } else {
                    const created = await prisma.musicLibrary.create({
                        data: template
                    });
                    createdMusic.push(created);
                    logger.created(`Music template: ${template.assignment_number} - ${template.music_name}`, 'verbose');
                    successCount++;
                }
            } catch (error) {
                logger.error(`Failed to process music template ${template.assignment_number}: ${String(error)}`);
                errorCount++;
            }
        }

        // Categorize the results
        const result = {
            music: createdMusic,
            total: createdMusic.length,
            success: successCount,
            skipped: skippedCount,
            errors: errorCount,
            ceremony: createdMusic.filter(m =>
                m.assignment_number?.includes('M002') || // Processional
                m.assignment_number?.includes('M006') || // Recessional
                m.assignment_number?.includes('M015')    // Prelude
            ),
            reception: createdMusic.filter(m =>
                m.assignment_number?.includes('M003') || // Reception Entrance
                m.assignment_number?.includes('M007') || // Cocktail Hour
                m.assignment_number?.includes('M008') || // Dinner
                m.assignment_number?.includes('M009')    // Wedding Party Entrance
            ),
            dances: createdMusic.filter(m =>
                m.assignment_number?.includes('M001') || // First Dance
                m.assignment_number?.includes('M004') || // Father-Daughter
                m.assignment_number?.includes('M005') || // Mother-Son
                m.assignment_number?.includes('M013')    // Last Dance
            ),
            special: createdMusic.filter(m =>
                m.assignment_number?.includes('M010') || // Cake Cutting
                m.assignment_number?.includes('M011') || // Bouquet Toss
                m.assignment_number?.includes('M012') || // Garter Toss
                m.assignment_number?.includes('M014')    // Grand Exit
            )
        };

        logger.summary('Music templates', { created: successCount, updated: 0, skipped: skippedCount, total: result.total });

        return result;

    } catch (error) {
        logger.error(`Failed to create Moonrise music library: ${String(error)}`);
        throw error;
    }
}

async function main() {
    logger.sectionHeader('Moonrise Films - Music Library Seed');

    try {
        const result = await createMoonriseMusicLibrary();

        logger.sectionDivider('Summary');
        logger.success('Moonrise Music Library Seeded Successfully!');
        logger.info(`Brand: Moonrise Films`);
        logger.info(`Total Music Templates: ${result.total}`);
        logger.info(`Successfully Created: ${result.success}`);
        if (result.errors > 0) {
            logger.warning(`Errors: ${result.errors}`);
        }
        logger.info(`Ceremony Music: ${result.ceremony.length} templates`);
        logger.info(`Reception Music: ${result.reception.length} templates`);
        logger.info(`Dance Music: ${result.dances.length} templates`);
        logger.info(`Special Moments: ${result.special.length} templates`);

    } catch (error) {
        logger.error(`Moonrise music library seeding failed: ${String(error)}`);
        throw error;
    }
}

// Export the main function for use in other modules
export default main;

if (require.main === module) {
    main()
        .catch((e) => {
            logger.error(`Moonrise music library seeding failed: ${String(e)}`);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
