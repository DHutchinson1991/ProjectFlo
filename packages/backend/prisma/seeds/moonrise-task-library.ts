// Moonrise Films Task Library Setup - Comprehensive Task Templates
// Creates: Complete task library for wedding videography workflow
import { PrismaClient, $Enums } from "@prisma/client";
import { createSeedLogger, SeedType, SeedSummary } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

export async function createMoonriseTaskLibrary(brandId: number): Promise<number> {
    logger.sectionHeader('Task Library');

    const taskLibraryItems = [
        // ── INQUIRY PHASE ────────────────────────────────────────────
        {
            name: "Initial Inquiry Response",
            description: "Acknowledge inquiry, introduce yourself, and set expectations for the process",
            phase: $Enums.project_phase.Inquiry,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.5,
            order_index: 1,
            brand_id: brandId,
        },
        {
            name: "Date Availability Check",
            description: "Check calendar availability for the requested date before investing further time",
            phase: $Enums.project_phase.Inquiry,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.15,
            order_index: 2,
            brand_id: brandId,
        },
        {
            name: "Send Needs Assessment",
            description: "Send questionnaire to capture the client's vision, style preferences, and requirements",
            phase: $Enums.project_phase.Inquiry,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.15,
            order_index: 3,
            brand_id: brandId,
        },
        {
            name: "Review Needs Assessment",
            description: "Analyse questionnaire responses, identify key requirements, red flags, and opportunities",
            phase: $Enums.project_phase.Inquiry,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.25,
            order_index: 4,
            brand_id: brandId,
        },
        {
            name: "Portfolio Presentation",
            description: "Share relevant work samples that match the client's style and vision",
            phase: $Enums.project_phase.Inquiry,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.5,
            order_index: 5,
            brand_id: brandId,
        },
        {
            name: "Estimate Preparation",
            description: "Prepare ballpark pricing based on needs assessment before the discovery call",
            phase: $Enums.project_phase.Inquiry,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.5,
            order_index: 6,
            brand_id: brandId,
        },
        {
            name: "Discovery Call Scheduling",
            description: "Book the initial discovery call based on mutual availability",
            phase: $Enums.project_phase.Inquiry,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.15,
            order_index: 7,
            brand_id: brandId,
        },
        {
            name: "Discovery Call",
            description: "First real conversation — understand their vision, answer questions, and build rapport",
            phase: $Enums.project_phase.Inquiry,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.75,
            order_index: 8,
            brand_id: brandId,
        },
        {
            name: "Budget Alignment",
            description: "Confirm client expectations match their budget based on discovery findings",
            phase: $Enums.project_phase.Inquiry,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.25,
            order_index: 9,
            brand_id: brandId,
        },

        // ── BOOKING PHASE ────────────────────────────────────────────
        {
            name: "Proposal Creation",
            description: "Build the full creative pitch — packages, vision, deliverables, and pricing",
            phase: $Enums.project_phase.Booking,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.0,
            order_index: 1,
            brand_id: brandId,
        },
        {
            name: "Proposal Delivery",
            description: "Send proposal to client, explain how to review it, and set follow-up date",
            phase: $Enums.project_phase.Booking,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.15,
            order_index: 2,
            brand_id: brandId,
        },
        {
            name: "Consultation Scheduling",
            description: "Book the deeper consultation meeting to walk through the proposal",
            phase: $Enums.project_phase.Booking,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.15,
            order_index: 3,
            brand_id: brandId,
        },
        {
            name: "Consultation Meeting",
            description: "Walk through proposal in detail, address concerns, and tailor packages to client needs",
            phase: $Enums.project_phase.Booking,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.0,
            order_index: 4,
            brand_id: brandId,
        },
        {
            name: "Quote Generation",
            description: "Create formal detailed quote reflecting any changes agreed during consultation",
            phase: $Enums.project_phase.Booking,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.75,
            order_index: 5,
            brand_id: brandId,
        },
        {
            name: "Contract Preparation",
            description: "Draft contract based on the agreed quote and terms",
            phase: $Enums.project_phase.Booking,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.5,
            order_index: 6,
            brand_id: brandId,
        },
        {
            name: "Contract Negotiation",
            description: "Review terms with client, handle revisions, and reach final agreement",
            phase: $Enums.project_phase.Booking,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.75,
            order_index: 7,
            brand_id: brandId,
        },
        {
            name: "Booking Confirmation",
            description: "Collect deposit, block the date, and send welcome pack to client",
            phase: $Enums.project_phase.Booking,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.5,
            order_index: 8,
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
