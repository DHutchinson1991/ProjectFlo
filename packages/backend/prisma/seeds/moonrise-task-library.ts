// Moonrise Films Task Library Setup - Comprehensive Task Templates
// Creates: Complete task library for wedding videography workflow
import { PrismaClient, $Enums } from "@prisma/client";
import { createSeedLogger, SeedType, SeedSummary } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE);

// ─── Stage definitions (parent tasks) for Inquiry + Booking pipeline ─
interface SubTaskDef {
    name: string;
    description: string;
    effort_hours: number;
    order_index: number;
    is_auto_only: boolean;
    due_date_offset_days: number | null;
}

interface StageDef {
    name: string;
    description: string;
    phase: $Enums.project_phase;
    stage_color: string;
    order_index: number;
    children: SubTaskDef[];
}

// Old stage/task names that are being retired — will be deactivated in the library
const RETIRED_STAGE_NAMES = [
    'Needs Assessment', 'Estimates', 'Discovery Calls',
    'Proposals', 'Proposal Review', 'Quotes', 'Contracts',
];
const RETIRED_TASK_NAMES = [
    'Initial Inquiry Response', 'Date Availability Check', 'Portfolio Presentation',
    'Budget Alignment', 'Consultation Scheduling', 'Consultation Meeting',
    'Quote Generation', 'Contract Preparation', 'Contract Negotiation',
    'Booking Confirmation', 'Proposal Creation', 'Proposal Delivery',
    'Send Needs Assessment', 'Review Needs Assessment',
];

const PIPELINE_STAGES: StageDef[] = [
    {
        name: 'Inquiry',
        description: 'Initial requirements gathering and client qualification',
        phase: $Enums.project_phase.Inquiry,
        stage_color: '#3b82f6',
        order_index: 1,
        children: [
            { name: 'Inquiry Received', description: 'Auto-marked when the inquiry is received — from a needs assessment submission or manual creation', effort_hours: 0, order_index: 1, is_auto_only: true, due_date_offset_days: 0 },
            { name: 'Review Inquiry', description: 'Review what the client submitted — check their responses, date availability, and crew conflicts before responding', effort_hours: 0.25, order_index: 2, is_auto_only: false, due_date_offset_days: 1 },
            { name: 'Qualify & Respond', description: 'Confirm availability, introduce yourself, share portfolio, and transition the inquiry to Contacted', effort_hours: 0.25, order_index: 3, is_auto_only: false, due_date_offset_days: 1 },
            { name: 'Estimate Preparation', description: 'Auto-creates a draft estimate from package/activity selections when the inquiry is submitted', effort_hours: 0, order_index: 4, is_auto_only: true, due_date_offset_days: 0 },
            { name: 'Review Estimate', description: 'Review the auto-created draft estimate, adjust line items if needed, then send to the client', effort_hours: 0.25, order_index: 5, is_auto_only: false, due_date_offset_days: 2 },
        ],
    },
    {
        name: 'Discovery',
        description: 'Discovery call scheduling and post-call notes',
        phase: $Enums.project_phase.Inquiry,
        stage_color: '#f59e0b',
        order_index: 2,
        children: [
            { name: 'Discovery Call Scheduling', description: 'Book the discovery call — typically scheduled at the end of the needs assessment wizard', effort_hours: 0.15, order_index: 1, is_auto_only: false, due_date_offset_days: 2 },
            { name: 'Discovery Call', description: 'Conduct the call, then save post-call notes or transcript in the Discovery Questionnaire section', effort_hours: 0.25, order_index: 2, is_auto_only: false, due_date_offset_days: 7 },
        ],
    },
    {
        name: 'Proposal',
        description: 'Quote, contract prep, proposal creation, and client acceptance',
        phase: $Enums.project_phase.Booking,
        stage_color: '#8b5cf6',
        order_index: 3,
        children: [
            { name: 'Generate Quote', description: 'Review package selections from the discovery call, adjust if needed, then generate the formal quote', effort_hours: 0.75, order_index: 1, is_auto_only: false, due_date_offset_days: 2 },
            { name: 'Prepare Contract', description: 'Auto-generate contract from template using quote values — review and customise clauses before sending', effort_hours: 0.5, order_index: 2, is_auto_only: false, due_date_offset_days: 1 },
            { name: 'Create & Review Proposal', description: 'Generate the full proposal — verify timeline, subjects, venues, package, films, quote, and personal message', effort_hours: 1.0, order_index: 3, is_auto_only: false, due_date_offset_days: 2 },
            { name: 'Send Proposal', description: 'Send the proposal to the client portal — client can Accept or Request Changes', effort_hours: 0.15, order_index: 4, is_auto_only: false, due_date_offset_days: 1 },
            { name: 'Contract Sent', description: 'Auto-sent to client when they accept the proposal — no manual action required', effort_hours: 0, order_index: 5, is_auto_only: true, due_date_offset_days: 0 },
        ],
    },
    {
        name: 'Booking',
        description: 'Contract signing, deposit, date block, and welcome pack',
        phase: $Enums.project_phase.Booking,
        stage_color: '#14b8a6',
        order_index: 4,
        children: [
            { name: 'Contract Signed', description: 'Auto-completes when all signers have signed in the client portal', effort_hours: 0, order_index: 1, is_auto_only: true, due_date_offset_days: 14 },
            { name: 'Raise Deposit Invoice', description: 'Auto-generated from the estimate deposit amount when the contract is signed', effort_hours: 0, order_index: 2, is_auto_only: true, due_date_offset_days: 0 },
            { name: 'Block Wedding Date', description: 'Wedding day calendar block auto-created when inquiry status changes to Booked', effort_hours: 0, order_index: 3, is_auto_only: true, due_date_offset_days: 0 },
            { name: 'Confirm Booking', description: 'Change inquiry status to Booked — triggers calendar block and completes this task', effort_hours: 0.15, order_index: 4, is_auto_only: false, due_date_offset_days: 1 },
            { name: 'Send Welcome Pack', description: 'Unlock the Welcome Pack section in the client portal — introduces what happens next', effort_hours: 0.15, order_index: 5, is_auto_only: false, due_date_offset_days: 2 },
        ],
    },
];

export async function createMoonriseTaskLibrary(brandId: number): Promise<number> {
    logger.sectionHeader('Task Library');

    // ─── PIPELINE STAGES (parent/child Inquiry + Booking tasks) ──────
    let stageCreated = 0;
    let stageUpdated = 0;
    let stageSkipped = 0;
    let childCreated = 0;
    let childUpdated = 0;
    let childSkipped = 0;

    for (const stage of PIPELINE_STAGES) {
        // Upsert the parent stage task
        let parentTask = await prisma.task_library.findFirst({
            where: { name: stage.name, brand_id: brandId, is_stage: true },
        });

        if (!parentTask) {
            parentTask = await prisma.task_library.create({
                data: {
                    name: stage.name,
                    description: stage.description,
                    phase: stage.phase,
                    pricing_type: $Enums.pricing_type_options.Fixed,
                    effort_hours: 0,
                    order_index: stage.order_index,
                    brand_id: brandId,
                    is_stage: true,
                    is_active: true,
                    stage_color: stage.stage_color,
                },
            });
            stageCreated++;
            logger.created(`Stage: ${stage.name}`, `${stage.phase} phase`);
        } else {
            // Update existing stage with new values
            parentTask = await prisma.task_library.update({
                where: { id: parentTask.id },
                data: {
                    description: stage.description,
                    phase: stage.phase,
                    order_index: stage.order_index,
                    stage_color: stage.stage_color,
                    is_active: true,
                },
            });
            stageUpdated++;
            logger.skipped(`Stage updated: ${stage.name}`, `${stage.phase} phase`);
        }

        // Upsert child tasks under this parent
        for (const child of stage.children) {
            const existing = await prisma.task_library.findFirst({
                where: { name: child.name, brand_id: brandId },
            });

            if (!existing) {
                await prisma.task_library.create({
                    data: {
                        name: child.name,
                        description: child.description,
                        phase: stage.phase,
                        pricing_type: $Enums.pricing_type_options.Fixed,
                        effort_hours: child.effort_hours,
                        order_index: child.order_index,
                        due_date_offset_days: child.due_date_offset_days,
                        brand_id: brandId,
                        parent_task_id: parentTask.id,
                        is_auto_only: child.is_auto_only,
                        is_active: true,
                    },
                });
                childCreated++;
                logger.created(`Task: ${child.name}`, `→ ${stage.name}`);
            } else {
                // Update all fields on existing task
                await prisma.task_library.update({
                    where: { id: existing.id },
                    data: {
                        description: child.description,
                        phase: stage.phase,
                        effort_hours: child.effort_hours,
                        order_index: child.order_index,
                        due_date_offset_days: child.due_date_offset_days,
                        parent_task_id: parentTask.id,
                        is_auto_only: child.is_auto_only,
                        is_active: true,
                    },
                });
                childUpdated++;
                logger.skipped(`Task updated: ${child.name}`, `→ ${stage.name}`);
            }
        }
    }

    // ─── Deactivate retired stages and tasks ──────────────────────────
    const deactivatedStages = await prisma.task_library.updateMany({
        where: { name: { in: RETIRED_STAGE_NAMES }, brand_id: brandId, is_stage: true },
        data: { is_active: false },
    });
    const deactivatedTasks = await prisma.task_library.updateMany({
        where: { name: { in: RETIRED_TASK_NAMES }, brand_id: brandId, is_stage: false },
        data: { is_active: false },
    });
    if (deactivatedStages.count > 0) logger.skipped(`Deactivated ${deactivatedStages.count} retired stage(s)`, 'library cleanup');
    if (deactivatedTasks.count > 0) logger.skipped(`Deactivated ${deactivatedTasks.count} retired task(s)`, 'library cleanup');

    logger.summary('Pipeline stages', { created: stageCreated, updated: stageUpdated, skipped: stageSkipped, total: stageCreated + stageUpdated + stageSkipped });
    logger.summary('Pipeline sub-tasks', { created: childCreated, updated: childUpdated, skipped: childSkipped, total: childCreated + childUpdated + childSkipped });

    // ─── REMAINING PHASES (flat tasks — not part of the pipeline) ────

    const taskLibraryItems = [
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

    const totalPipelineTasks = PIPELINE_STAGES.length + PIPELINE_STAGES.reduce((sum, s) => sum + s.children.length, 0);
    return totalPipelineTasks + taskLibraryItems.length;
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
