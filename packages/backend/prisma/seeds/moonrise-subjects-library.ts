// Moonrise Films - Wedding Subjects Library Seed
// Creates conventional wedding film subjects for Moonrise Films brand
import { PrismaClient, SubjectsLibrary } from "@prisma/client";
import { createSeedLogger, SeedType } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

export async function createMoonriseSubjectsLibrary() {
    logger.sectionHeader('Wedding Subjects Library');

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

        // Clear existing subjects for this brand
        const deleted = await prisma.subjectsLibrary.deleteMany({
            where: { brand_id: brand.id }
        });
        logger.info(`Cleared ${deleted.count} existing subjects for Moonrise Films`);

        const weddingSubjects = [
            // Primary Couple
            {
                first_name: "Sarah",
                last_name: "Johnson",
                context_role: "Bride",
                hair_color: "Blonde",
                hair_style: "Long, Wavy",
                skin_tone: "Fair",
                height: "5'6\"",
                eye_color: "Blue",
                appearance_notes: "Elegant and graceful, radiant smile",
                brand_id: brand.id
            },
            {
                first_name: "Michael",
                last_name: "Thompson",
                context_role: "Groom",
                hair_color: "Dark Brown",
                hair_style: "Short, Well-groomed",
                skin_tone: "Medium",
                height: "6'1\"",
                eye_color: "Brown",
                appearance_notes: "Confident and charming, broad shoulders",
                brand_id: brand.id
            },

            // Bridal Party
            {
                first_name: "Emma",
                last_name: "Williams",
                context_role: "Maid of Honor",
                hair_color: "Auburn",
                hair_style: "Updo",
                skin_tone: "Fair",
                height: "5'4\"",
                eye_color: "Green",
                appearance_notes: "Bride's sister, very emotional and supportive",
                brand_id: brand.id
            },
            {
                first_name: "Jessica",
                last_name: "Davis",
                context_role: "Bridesmaid",
                hair_color: "Black",
                hair_style: "Shoulder-length, Straight",
                skin_tone: "Olive",
                height: "5'7\"",
                eye_color: "Brown",
                appearance_notes: "College roommate, bubbly personality",
                brand_id: brand.id
            },
            {
                first_name: "Ashley",
                last_name: "Miller",
                context_role: "Bridesmaid",
                hair_color: "Light Brown",
                hair_style: "Curly, Medium length",
                skin_tone: "Fair",
                height: "5'5\"",
                eye_color: "Hazel",
                appearance_notes: "Childhood friend, loves to laugh",
                brand_id: brand.id
            },
            {
                first_name: "James",
                last_name: "Wilson",
                context_role: "Best Man",
                hair_color: "Blonde",
                hair_style: "Short, Tousled",
                skin_tone: "Fair",
                height: "6'0\"",
                eye_color: "Blue",
                appearance_notes: "Groom's brother, natural leader",
                brand_id: brand.id
            },
            {
                first_name: "David",
                last_name: "Brown",
                context_role: "Groomsman",
                hair_color: "Dark Brown",
                hair_style: "Short, Professional",
                skin_tone: "Medium",
                height: "5'11\"",
                eye_color: "Brown",
                appearance_notes: "College friend, quiet but warm",
                brand_id: brand.id
            },
            {
                first_name: "Ryan",
                last_name: "Garcia",
                context_role: "Groomsman",
                hair_color: "Black",
                hair_style: "Short, Styled",
                skin_tone: "Tan",
                height: "5'10\"",
                eye_color: "Brown",
                appearance_notes: "Work colleague, great sense of humor",
                brand_id: brand.id
            },

            // Parents
            {
                first_name: "Robert",
                last_name: "Johnson",
                context_role: "Father of the Bride",
                hair_color: "Gray",
                hair_style: "Short, Distinguished",
                skin_tone: "Fair",
                height: "5'10\"",
                eye_color: "Blue",
                appearance_notes: "Proud father, emotional during ceremony",
                brand_id: brand.id
            },
            {
                first_name: "Linda",
                last_name: "Johnson",
                context_role: "Mother of the Bride",
                hair_color: "Blonde with highlights",
                hair_style: "Short, Elegant",
                skin_tone: "Fair",
                height: "5'4\"",
                eye_color: "Blue",
                appearance_notes: "Organized and caring, tears of joy",
                brand_id: brand.id
            },
            {
                first_name: "William",
                last_name: "Thompson",
                context_role: "Father of the Groom",
                hair_color: "Silver",
                hair_style: "Short, Classic",
                skin_tone: "Medium",
                height: "6'0\"",
                eye_color: "Brown",
                appearance_notes: "Warm smile, strong handshake",
                brand_id: brand.id
            },
            {
                first_name: "Margaret",
                last_name: "Thompson",
                context_role: "Mother of the Groom",
                hair_color: "Brown",
                hair_style: "Medium length, Styled",
                skin_tone: "Medium",
                height: "5'6\"",
                eye_color: "Brown",
                appearance_notes: "Welcoming personality, loves to chat",
                brand_id: brand.id
            },

            // Extended Family & VIP Guests
            {
                first_name: "Eleanor",
                last_name: "Johnson",
                context_role: "Grandmother of the Bride",
                hair_color: "White",
                hair_style: "Short, Permed",
                skin_tone: "Fair",
                height: "5'2\"",
                eye_color: "Blue",
                appearance_notes: "Family matriarch, wearing heirloom jewelry",
                brand_id: brand.id
            },
            {
                first_name: "Frank",
                last_name: "Thompson",
                context_role: "Grandfather of the Groom",
                hair_color: "Bald",
                hair_style: "None",
                skin_tone: "Medium",
                height: "5'8\"",
                eye_color: "Brown",
                appearance_notes: "Veteran, wearing military pin",
                brand_id: brand.id
            },
            {
                first_name: "Pastor",
                last_name: "Richards",
                context_role: "Wedding Officiant",
                hair_color: "Gray",
                hair_style: "Short, Professional",
                skin_tone: "Medium",
                height: "5'9\"",
                eye_color: "Brown",
                appearance_notes: "Calm presence, meaningful voice",
                brand_id: brand.id
            },

            // Special Participants
            {
                first_name: "Sophie",
                last_name: "Anderson",
                context_role: "Flower Girl",
                hair_color: "Blonde",
                hair_style: "Long, Braided",
                skin_tone: "Fair",
                height: "3'2\"",
                eye_color: "Blue",
                appearance_notes: "Bride's niece, age 5, adorable and shy",
                brand_id: brand.id
            },
            {
                first_name: "Lucas",
                last_name: "Thompson",
                context_role: "Ring Bearer",
                hair_color: "Brown",
                hair_style: "Short, Boyish",
                skin_tone: "Medium",
                height: "3'5\"",
                eye_color: "Brown",
                appearance_notes: "Groom's nephew, age 6, energetic",
                brand_id: brand.id
            },

            // Key Wedding Vendors & Officials
            {
                first_name: "Samantha",
                last_name: "Lee",
                context_role: "Wedding Planner",
                hair_color: "Black",
                hair_style: "Long, Professional",
                skin_tone: "Asian",
                height: "5'5\"",
                eye_color: "Brown",
                appearance_notes: "Always organized, subtle but present",
                brand_id: brand.id
            },
            {
                first_name: "Maria",
                last_name: "Rodriguez",
                context_role: "Maid of Honor Speech Giver",
                hair_color: "Dark Brown",
                hair_style: "Medium, Wavy",
                skin_tone: "Tan",
                height: "5'6\"",
                eye_color: "Brown",
                appearance_notes: "Emotional speaker, bride's best friend",
                brand_id: brand.id
            },
            {
                first_name: "Christopher",
                last_name: "Davis",
                context_role: "Best Man Speech Giver",
                hair_color: "Light Brown",
                hair_style: "Medium, Casual",
                skin_tone: "Fair",
                height: "6'2\"",
                eye_color: "Green",
                appearance_notes: "Funny storyteller, groom's college buddy",
                brand_id: brand.id
            }
        ];

        const createdSubjects: SubjectsLibrary[] = [];
        let successCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const subject of weddingSubjects) {
            try {
                // Check if subject already exists by name and role combination
                const existing = await prisma.subjectsLibrary.findFirst({
                    where: {
                        first_name: subject.first_name,
                        last_name: subject.last_name,
                        context_role: subject.context_role,
                        brand_id: brand.id
                    }
                });

                if (existing) {
                    logger.skipped(`Subject "${subject.first_name} ${subject.last_name}" (${subject.context_role}) already exists (ID: ${existing.id})`, undefined, 'verbose');
                    createdSubjects.push(existing);
                    skippedCount++;
                } else {
                    const created = await prisma.subjectsLibrary.create({
                        data: subject
                    });
                    createdSubjects.push(created);
                    logger.created(`Subject: ${subject.first_name} ${subject.last_name} (${subject.context_role})`, 'verbose');
                    successCount++;
                }
            } catch (err) {
                logger.error(`Failed to process subject ${subject.first_name} ${subject.last_name}: ${String(err)}`);
                errorCount++;
            }
        }

        // Categorize the results
        const result = {
            subjects: createdSubjects,
            total: createdSubjects.length,
            success: successCount,
            skipped: skippedCount,
            errors: errorCount,
            primary: createdSubjects.filter(s => ['Bride', 'Groom'].includes(s.context_role)),
            bridalParty: createdSubjects.filter(s => ['Maid of Honor', 'Bridesmaid', 'Best Man', 'Groomsman'].includes(s.context_role)),
            family: createdSubjects.filter(s =>
                s.context_role.includes('Father') ||
                s.context_role.includes('Mother') ||
                s.context_role.includes('Grandmother') ||
                s.context_role.includes('Grandfather')
            ),
            children: createdSubjects.filter(s => ['Flower Girl', 'Ring Bearer'].includes(s.context_role)),
            vendors: createdSubjects.filter(s =>
                ['Wedding Planner', 'Wedding Officiant'].includes(s.context_role) ||
                s.context_role.includes('Speech Giver')
            )
        };

        logger.summary('Subjects', { created: successCount, updated: 0, skipped: skippedCount, total: result.total });
        return result;

    } catch (err) {
        logger.error(`Failed to create Moonrise subjects library: ${String(err)}`);
        throw err;
    }
}

async function main() {
    logger.sectionHeader('Moonrise Films - Wedding Subjects Library Seed');

    try {
        const result = await createMoonriseSubjectsLibrary();

        logger.sectionDivider('Summary');
        logger.success('Moonrise Wedding Subjects Library Seeded Successfully!');
        logger.info(`Brand: Moonrise Films`);
        logger.info(`Total Subjects: ${result.total}`);
        logger.info(`Successfully Created: ${result.success}`);
        if (result.errors > 0) {
            logger.warning(`Errors: ${result.errors}`);
        }
        logger.info(`Primary Couple: ${result.primary.length} (Bride & Groom)`);
        logger.info(`Bridal Party: ${result.bridalParty.length} members`);
        logger.info(`Family: ${result.family.length} family members`);
        logger.info(`Children: ${result.children.length} (Flower Girl & Ring Bearer)`);
        logger.info(`Vendors/Officials: ${result.vendors.length} key people`);

    } catch (err) {
        logger.error(`Moonrise subjects seeding failed: ${String(err)}`);
        throw err;
    }
}

// Export the main function for use in other modules
export default main;

if (require.main === module) {
    main()
        .catch((e) => {
            logger.error(`Moonrise subjects seeding failed: ${String(e)}`);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
