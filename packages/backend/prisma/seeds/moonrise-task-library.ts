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
            name: "Activity Coverage",
            description: "Coverage task generated per scheduled activity and assigned crew member",
            phase: $Enums.project_phase.Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            trigger_type: $Enums.task_trigger_type.per_activity_crew,
            effort_hours: 1.0,
            order_index: 1,
            brand_id: brandId,
        },

        // POST-PRODUCTION PHASE
        {
            name: "Footage Review and Selection",
            description: "Review all footage and select best takes per activity",
            phase: $Enums.project_phase.Post_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            trigger_type: $Enums.task_trigger_type.per_activity,
            effort_hours: 4.0,
            order_index: 1,
            brand_id: brandId,
        },
        {
            name: "Audio Enhancement",
            description: "Clean and enhance audio per film scene, scaled by scene duration",
            phase: $Enums.project_phase.Post_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            trigger_type: $Enums.task_trigger_type.per_film_scene,
            effort_hours: 3.0,
            order_index: 2,
            brand_id: brandId,
        },
        {
            name: "Color Grading",
            description: "Color correct and grade footage per film scene, scaled by scene duration",
            phase: $Enums.project_phase.Post_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            trigger_type: $Enums.task_trigger_type.per_film_scene,
            effort_hours: 6.0,
            order_index: 3,
            brand_id: brandId,
        },
        {
            name: "Music Selection and Licensing",
            description: "Select and license appropriate music for each film",
            phase: $Enums.project_phase.Post_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            trigger_type: $Enums.task_trigger_type.per_film_with_music,
            effort_hours: 2.0,
            order_index: 4,
            brand_id: brandId,
        },
        {
            name: "Title Cards and Graphics",
            description: "Create title cards and graphic elements for each film",
            phase: $Enums.project_phase.Post_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            trigger_type: $Enums.task_trigger_type.per_film_with_graphics,
            effort_hours: 3.0,
            order_index: 5,
            brand_id: brandId,
        },
        {
            name: "Rough Cut",
            description: "Assemble rough cut edit per film scene, scaled by scene duration",
            phase: $Enums.project_phase.Post_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            trigger_type: $Enums.task_trigger_type.per_film_scene,
            effort_hours: 3.0,
            order_index: 6,
            brand_id: brandId,
        },
        {
            name: "Client Review and Revisions",
            description: "Present each film to client and make requested revisions",
            phase: $Enums.project_phase.Post_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            trigger_type: $Enums.task_trigger_type.per_film,
            effort_hours: 2.0,
            order_index: 7,
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
