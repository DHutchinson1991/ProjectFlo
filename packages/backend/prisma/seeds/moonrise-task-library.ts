// Moonrise Films Task Library Setup - Comprehensive Task Templates
// Creates: Complete task library for wedding videography workflow
import { PrismaClient, $Enums } from "@prisma/client";
import { createSeedLogger, SeedType, SeedSummary } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

export async function createMoonriseTaskLibrary(brandId: number): Promise<number> {
    logger.sectionHeader('Task Library');

    const taskLibraryItems = [
        // LEAD PHASE
        {
            name: "Lead Qualification",
            description: "Initial assessment of lead quality and fit",
            phase: $Enums.project_phase.Lead,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.5,
            order_index: 1,
            brand_id: brandId,
        },
        {
            name: "Lead Follow-up",
            description: "Follow-up communication with potential client",
            phase: $Enums.project_phase.Lead,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.25,
            order_index: 2,
            brand_id: brandId,
        },
        {
            name: "Lead Nurturing",
            description: "Ongoing relationship building with prospects",
            phase: $Enums.project_phase.Lead,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.5,
            order_index: 3,
            brand_id: brandId,
        },

        // INQUIRY PHASE
        {
            name: "Initial Inquiry Response",
            description: "First response to client inquiry",
            phase: $Enums.project_phase.Inquiry,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.5,
            order_index: 1,
            brand_id: brandId,
        },
        {
            name: "Consultation Scheduling",
            description: "Schedule and coordinate consultation meeting",
            phase: $Enums.project_phase.Inquiry,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.25,
            order_index: 2,
            brand_id: brandId,
        },
        {
            name: "Portfolio Presentation",
            description: "Present work samples and discuss style preferences",
            phase: $Enums.project_phase.Inquiry,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.0,
            order_index: 3,
            brand_id: brandId,
        },
        {
            name: "Requirements Discovery",
            description: "Detailed discussion of client needs and expectations",
            phase: $Enums.project_phase.Inquiry,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.5,
            order_index: 4,
            brand_id: brandId,
        },

        // BOOKING PHASE
        {
            name: "Quote Generation",
            description: "Create detailed quote based on requirements",
            phase: $Enums.project_phase.Booking,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.0,
            order_index: 1,
            brand_id: brandId,
        },
        {
            name: "Contract Preparation",
            description: "Prepare and customize contract for client",
            phase: $Enums.project_phase.Booking,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.5,
            order_index: 2,
            brand_id: brandId,
        },
        {
            name: "Contract Negotiation",
            description: "Review and negotiate contract terms",
            phase: $Enums.project_phase.Booking,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.0,
            order_index: 3,
            brand_id: brandId,
        },
        {
            name: "Booking Confirmation",
            description: "Finalize booking and process initial payment",
            phase: $Enums.project_phase.Booking,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.5,
            order_index: 4,
            brand_id: brandId,
        },

        // CREATIVE DEVELOPMENT PHASE
        {
            name: "Creative Brief Development",
            description: "Develop comprehensive creative brief with client",
            phase: $Enums.project_phase.Creative_Development,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 2.0,
            order_index: 1,
            brand_id: brandId,
        },
        {
            name: "Style Guide Creation",
            description: "Create visual style guide for the project",
            phase: $Enums.project_phase.Creative_Development,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.5,
            order_index: 2,
            brand_id: brandId,
        },
        {
            name: "Shot List Planning",
            description: "Plan specific shots and sequences",
            phase: $Enums.project_phase.Creative_Development,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 2.0,
            order_index: 3,
            brand_id: brandId,
        },
        {
            name: "Mood Board Creation",
            description: "Create visual mood boards for client approval",
            phase: $Enums.project_phase.Creative_Development,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.0,
            order_index: 4,
            brand_id: brandId,
        },
        {
            name: "Creative Concept Approval",
            description: "Present and get approval for creative concepts",
            phase: $Enums.project_phase.Creative_Development,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.0,
            order_index: 5,
            brand_id: brandId,
        },

        // PRE-PRODUCTION PHASE
        {
            name: "Location Scouting",
            description: "Scout and assess filming locations",
            phase: $Enums.project_phase.Pre_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 3.0,
            order_index: 1,
            brand_id: brandId,
        },
        {
            name: "Equipment Preparation",
            description: "Prepare and check all filming equipment",
            phase: $Enums.project_phase.Pre_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 2.0,
            order_index: 2,
            brand_id: brandId,
        },
        {
            name: "Timeline Coordination",
            description: "Coordinate timing with all parties involved",
            phase: $Enums.project_phase.Pre_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.5,
            order_index: 3,
            brand_id: brandId,
        },
        {
            name: "Vendor Coordination",
            description: "Coordinate with other wedding vendors",
            phase: $Enums.project_phase.Pre_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.0,
            order_index: 4,
            brand_id: brandId,
        },
        {
            name: "Client Pre-Production Meeting",
            description: "Final meeting before filming day",
            phase: $Enums.project_phase.Pre_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.0,
            order_index: 5,
            brand_id: brandId,
        },

        // PRODUCTION PHASE
        {
            name: "Getting Ready Coverage",
            description: "Film preparation and getting ready moments",
            phase: $Enums.project_phase.Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 3.0,
            order_index: 1,
            brand_id: brandId,
        },
        {
            name: "Ceremony Filming",
            description: "Film the wedding ceremony",
            phase: $Enums.project_phase.Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 4.0,
            order_index: 2,
            brand_id: brandId,
        },
        {
            name: "Couple Portrait Session",
            description: "Dedicated filming session for couple portraits",
            phase: $Enums.project_phase.Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 2.0,
            order_index: 3,
            brand_id: brandId,
        },
        {
            name: "Family Portrait Session",
            description: "Film family group portraits and interactions",
            phase: $Enums.project_phase.Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.5,
            order_index: 4,
            brand_id: brandId,
        },
        {
            name: "Reception Filming",
            description: "Film reception events and celebrations",
            phase: $Enums.project_phase.Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 6.0,
            order_index: 5,
            brand_id: brandId,
        },
        {
            name: "B-Roll Footage",
            description: "Capture detail shots and supplementary footage",
            phase: $Enums.project_phase.Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 2.0,
            order_index: 6,
            brand_id: brandId,
        },

        // POST-PRODUCTION PHASE
        {
            name: "Footage Review and Selection",
            description: "Review all footage and select best takes",
            phase: $Enums.project_phase.Post_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 4.0,
            order_index: 1,
            brand_id: brandId,
        },
        {
            name: "Audio Enhancement",
            description: "Clean and enhance audio from ceremony and reception",
            phase: $Enums.project_phase.Post_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 3.0,
            order_index: 2,
            brand_id: brandId,
        },
        {
            name: "Color Grading",
            description: "Color correct and grade all footage",
            phase: $Enums.project_phase.Post_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 6.0,
            order_index: 3,
            brand_id: brandId,
        },
        {
            name: "Music Selection and Licensing",
            description: "Select and license appropriate music",
            phase: $Enums.project_phase.Post_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 2.0,
            order_index: 4,
            brand_id: brandId,
        },
        {
            name: "Title Cards and Graphics",
            description: "Create title cards and graphic elements",
            phase: $Enums.project_phase.Post_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 3.0,
            order_index: 5,
            brand_id: brandId,
        },
        {
            name: "Video Editing - Highlight Reel",
            description: "Create 3-5 minute highlight reel",
            phase: $Enums.project_phase.Post_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 8.0,
            order_index: 6,
            brand_id: brandId,
        },
        {
            name: "Video Editing - Ceremony Edit",
            description: "Edit full ceremony footage",
            phase: $Enums.project_phase.Post_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 6.0,
            order_index: 7,
            brand_id: brandId,
        },
        {
            name: "Video Editing - Reception Edit",
            description: "Edit reception highlights and speeches",
            phase: $Enums.project_phase.Post_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 4.0,
            order_index: 8,
            brand_id: brandId,
        },
        {
            name: "Client Review and Revisions",
            description: "Present to client and make requested revisions",
            phase: $Enums.project_phase.Post_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 2.0,
            order_index: 9,
            brand_id: brandId,
        },

        // DELIVERY PHASE
        {
            name: "Final Export and Rendering",
            description: "Export final videos in all required formats",
            phase: $Enums.project_phase.Delivery,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 2.0,
            order_index: 1,
            brand_id: brandId,
        },
        {
            name: "Quality Control Check",
            description: "Final quality check of all deliverables",
            phase: $Enums.project_phase.Delivery,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.0,
            order_index: 2,
            brand_id: brandId,
        },
        {
            name: "USB/Physical Media Preparation",
            description: "Prepare physical delivery media",
            phase: $Enums.project_phase.Delivery,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.5,
            order_index: 3,
            brand_id: brandId,
        },
        {
            name: "Online Gallery Setup",
            description: "Set up online gallery for client access",
            phase: $Enums.project_phase.Delivery,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.0,
            order_index: 4,
            brand_id: brandId,
        },
        {
            name: "Client Delivery Coordination",
            description: "Coordinate delivery with client",
            phase: $Enums.project_phase.Delivery,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.5,
            order_index: 5,
            brand_id: brandId,
        },
        {
            name: "Final Invoice and Payment",
            description: "Process final payment and close project",
            phase: $Enums.project_phase.Delivery,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.5,
            order_index: 6,
            brand_id: brandId,
        },
        {
            name: "Project Archive",
            description: "Archive project files and documentation",
            phase: $Enums.project_phase.Delivery,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.0,
            order_index: 7,
            brand_id: brandId,
        },
    ];

    let created = 0;
    let skipped = 0;
    for (const task of taskLibraryItems) {
        const existing = await prisma.task_library.findFirst({
            where: {
                name: task.name,
                brand_id: task.brand_id
            },
        });

        if (!existing) {
            await prisma.task_library.create({
                data: task,
            });
            created++;
            logger.created(`Task: ${task.name}`, `${$Enums.project_phase[task.phase]} phase`);
        }
        else {
            skipped++;
            logger.skipped(`Task exists: ${task.name}`, `${$Enums.project_phase[task.phase]} phase`);
        }
    }
    const summary: SeedSummary = { created, updated: 0, skipped, total: created + skipped };
    logger.summary('Task library items', summary);
    return taskLibraryItems.length;
}

async function main() {
    logger.sectionHeader('Seeding Moonrise Films Task Library');

    try {
        // Find the Moonrise Films brand
        const brand = await prisma.brands.findUnique({
            where: { name: "Moonrise Films" }
        });

        if (!brand) {
            throw new Error("Moonrise Films brand not found. Please run moonrise-brand-setup.ts first.");
        }

        const taskCount = await createMoonriseTaskLibrary(brand.id);
        logger.success(`Task library setup complete! Created ${taskCount} task items`);
    } catch (error) {
        logger.error(`Task library setup failed: ${String(error)}`);
        throw error;
    }
}

if (require.main === module) {
    main()
        .catch((e) => {
            logger.error(`Task library setup failed: ${String(e)}`);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
