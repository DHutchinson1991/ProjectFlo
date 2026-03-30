// Moonrise Films Workflow Setup - Task Library and Crew Assignments
// Creates: Pipeline stages, task library items, subtask templates, crew assignments, skill rates
import { PrismaClient, $Enums } from "@prisma/client";
import { createSeedLogger, SeedType, SeedSummary } from '../utils/seed-logger';

let prisma: PrismaClient;
const logger = createSeedLogger(SeedType.MOONRISE);

// ─── Stage definitions (parent tasks) for Inquiry + Booking pipeline ─
interface SubTaskDef {
    name: string;
    description: string;
    effort_hours: number;
    order_index: number;
    is_auto_only: boolean;
    due_date_offset_days: number | null;
    due_date_offset_reference: string;
}

interface StageDef {
    name: string;
    description: string;
    phase: $Enums.project_phase;
    order_index: number;
    children: SubTaskDef[];
}

// ─── Subtask templates for pipeline tasks (source of truth) ──────────
interface SubtaskTemplateDef {
    subtask_key: string;
    name: string;
    description?: string;
    order_index: number;
    is_auto_only: boolean;
}

const TASK_SUBTASK_TEMPLATES: Record<string, SubtaskTemplateDef[]> = {
    'Review Inquiry': [
        { subtask_key: 'verify_contact_details', name: 'Verify Contact Details', description: 'Checks that the client submission includes a valid name, email address, and phone number. Flags missing or malformed fields so you can follow up before spending time on the rest of the inquiry.', order_index: 1, is_auto_only: true },
        { subtask_key: 'verify_event_date', name: 'Verify Event Date', description: 'Confirms the event date has been provided and is a valid future date. Cross-checks your booking calendar to surface any existing commitments on that day so you can assess availability immediately.', order_index: 2, is_auto_only: true },
        { subtask_key: 'confirm_package_selection', name: 'Confirm Package Selection', description: 'Validates that the client selected a package from your catalog. If no package was chosen, the inquiry is flagged so you can clarify requirements before building an estimate.', order_index: 3, is_auto_only: true },
        { subtask_key: 'check_crew_availability', name: 'Check Crew Availability', description: 'Scans your crew roster for the event date and identifies who is already booked, who has confirmed availability, and who still needs to be checked. Results are surfaced directly in the Review Inquiry task.', order_index: 4, is_auto_only: true },
        { subtask_key: 'check_equipment_availability', name: 'Check Equipment Availability', description: 'Reviews your equipment inventory for the event date and lists any items that are reserved or unavailable. Highlights conflicts so you can resolve them before committing to the booking.', order_index: 5, is_auto_only: true },
        { subtask_key: 'resolve_availability_conflicts', name: 'Resolve Availability Conflicts', description: 'Evaluates crew and equipment conflicts identified in the availability checks. Where alternatives exist they are suggested automatically; remaining conflicts are surfaced for manual resolution before proceeding.', order_index: 6, is_auto_only: true },
        { subtask_key: 'send_crew_availability_requests', name: 'Send Availability Requests', description: 'Sends availability request notifications to crew members who have not yet confirmed or declined for the event date. Responses update their availability status in real time.', order_index: 7, is_auto_only: true },
        { subtask_key: 'reserve_equipment', name: 'Reserve Equipment', description: 'Places a provisional hold on the required equipment for the event date once availability is confirmed. The reservation is tied to the inquiry and released automatically if the booking does not proceed.', order_index: 8, is_auto_only: true },
    ],
    'Qualify & Respond': [
        { subtask_key: 'review_estimate', name: 'Review Estimate', description: 'Auto-generates a draft estimate from the selected package pricing and any applicable adjustments. Review line items, add or remove services, and confirm the total before sharing with the client.', order_index: 1, is_auto_only: true },
        { subtask_key: 'schedule_discovery_call', name: 'Schedule Discovery Call', order_index: 2, is_auto_only: false },
        { subtask_key: 'mark_inquiry_qualified', name: 'Qualify Inquiry', order_index: 3, is_auto_only: false },
        { subtask_key: 'send_welcome_response', name: 'Send Welcome Response', order_index: 4, is_auto_only: false },
    ],
};

const PIPELINE_STAGES: StageDef[] = [
    {
        name: 'Inquiry',
        description: 'Initial requirements gathering and client qualification',
        phase: $Enums.project_phase.Inquiry,
        order_index: 1,
        children: [
            { name: 'Review Inquiry', description: 'Review what the client submitted — check their responses, date availability, and crew conflicts before responding', effort_hours: 0.25, order_index: 1, is_auto_only: false, due_date_offset_days: 1, due_date_offset_reference: 'inquiry_created' },
            { name: 'Qualify & Respond', description: 'Confirm availability, introduce yourself, share portfolio, and transition the inquiry to Contacted', effort_hours: 0.25, order_index: 2, is_auto_only: false, due_date_offset_days: 2, due_date_offset_reference: 'inquiry_created' },
        ],
    },
    {
        name: 'Discovery',
        description: 'Discovery call and post-call notes',
        phase: $Enums.project_phase.Inquiry,
        order_index: 2,
        children: [
            { name: 'Discovery Call', description: 'Conduct the call, then save post-call notes or transcript in the Discovery Questionnaire section', effort_hours: 0.25, order_index: 1, is_auto_only: false, due_date_offset_days: 7, due_date_offset_reference: 'inquiry_created' },
        ],
    },
    {
        name: 'Proposal',
        description: 'Quote, contract prep, proposal creation, and client acceptance',
        phase: $Enums.project_phase.Booking,
        order_index: 3,
        children: [
            { name: 'Generate Quote', description: 'Review package selections from the discovery call, adjust if needed, then generate the formal quote', effort_hours: 0.75, order_index: 1, is_auto_only: false, due_date_offset_days: 8, due_date_offset_reference: 'inquiry_created' },
            { name: 'Prepare Contract', description: 'Auto-generate contract from template using quote values — review and customise clauses before sending', effort_hours: 0.5, order_index: 2, is_auto_only: false, due_date_offset_days: 9, due_date_offset_reference: 'inquiry_created' },
            { name: 'Create & Review Proposal', description: 'Generate the full proposal — verify timeline, subjects, venues, package, films, quote, and personal message', effort_hours: 1.0, order_index: 3, is_auto_only: false, due_date_offset_days: 10, due_date_offset_reference: 'inquiry_created' },
            { name: 'Send Proposal', description: 'Send the proposal to the client portal — client can Accept or Request Changes', effort_hours: 0.15, order_index: 4, is_auto_only: false, due_date_offset_days: 11, due_date_offset_reference: 'inquiry_created' },
            { name: 'Contract Sent', description: 'Auto-sent to client when they accept the proposal — no manual action required', effort_hours: 0, order_index: 5, is_auto_only: true, due_date_offset_days: 12, due_date_offset_reference: 'inquiry_created' },
        ],
    },
    {
        name: 'Booking',
        description: 'Contract signing, deposit, date block, and welcome pack',
        phase: $Enums.project_phase.Booking,
        order_index: 4,
        children: [
            { name: 'Contract Signed', description: 'Auto-completes when all signers have signed in the client portal', effort_hours: 0, order_index: 1, is_auto_only: true, due_date_offset_days: 0, due_date_offset_reference: 'booking_date' },
            { name: 'Raise Deposit Invoice', description: 'Auto-generated from the estimate deposit amount when the contract is signed', effort_hours: 0, order_index: 2, is_auto_only: true, due_date_offset_days: 0, due_date_offset_reference: 'booking_date' },
            { name: 'Block Wedding Date', description: 'Wedding day calendar block auto-created when inquiry status changes to Booked', effort_hours: 0, order_index: 3, is_auto_only: true, due_date_offset_days: 0, due_date_offset_reference: 'booking_date' },
            { name: 'Confirm Booking', description: 'Change inquiry status to Booked — triggers calendar block and completes this task', effort_hours: 0.15, order_index: 4, is_auto_only: false, due_date_offset_days: 1, due_date_offset_reference: 'booking_date' },
            { name: 'Send Welcome Pack', description: 'Unlock the Welcome Pack section in the client portal — introduces what happens next', effort_hours: 0.15, order_index: 5, is_auto_only: false, due_date_offset_days: 2, due_date_offset_reference: 'booking_date' },
        ],
    },
];

// Pipeline tasks need skill mappings — backfilled separately so crew assignment can resolve them
const PIPELINE_TASK_SKILLS: Record<string, { skills_needed: string[] }> = {
    'Review Inquiry':         { skills_needed: ['Client Relations', 'Communication', 'Scheduling'] },
    'Qualify & Respond':      { skills_needed: ['Client Relations', 'Sales', 'Communication'] },
    'Discovery Call':         { skills_needed: ['Consultation', 'Communication', 'Client Relations'] },
    'Generate Quote':         { skills_needed: ['Pricing', 'Planning', 'Client Relations'] },
    'Prepare Contract':       { skills_needed: ['Legal', 'Documentation', 'Contract Management'] },
    'Create & Review Proposal': { skills_needed: ['Creative Direction', 'Presentation', 'Pricing'] },
    'Send Proposal':          { skills_needed: ['Communication', 'Client Relations'] },
    'Confirm Booking':        { skills_needed: ['Client Relations', 'Documentation'] },
    'Send Welcome Pack':      { skills_needed: ['Client Relations', 'Communication'] },
};

export async function createMoonriseTaskLibrary(db: PrismaClient, brandId: number): Promise<number> {
    prisma = db;
    logger.sectionHeader('Task Library');

    // ─── PIPELINE STAGES (parent/child Inquiry + Booking tasks) ──────
    let stageCreated = 0;
    let stageUpdated = 0;
    const stageSkipped = 0;
    let childCreated = 0;
    let childUpdated = 0;
    const childSkipped = 0;

    for (const stage of PIPELINE_STAGES) {
        let parentTask = await prisma.task_library.findFirst({
            where: { name: stage.name, brand_id: brandId, is_task_group: true },
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
                    is_task_group: true,
                    is_active: true,
                },
            });
            stageCreated++;
            logger.created(`Stage: ${stage.name}`, `${stage.phase} phase`);
        } else {
            parentTask = await prisma.task_library.update({
                where: { id: parentTask.id },
                data: {
                    description: stage.description,
                    phase: stage.phase,
                    order_index: stage.order_index,
                    is_active: true,
                },
            });
            stageUpdated++;
            logger.skipped(`Stage updated: ${stage.name}`, `${stage.phase} phase`);
        }

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
                        due_date_offset_reference: child.due_date_offset_reference as $Enums.due_date_offset_reference,
                        brand_id: brandId,
                        parent_task_id: parentTask.id,
                        is_auto_only: child.is_auto_only,
                        is_active: true,
                    },
                });
                childCreated++;
                logger.created(`Task: ${child.name}`, `→ ${stage.name}`);
            } else {
                await prisma.task_library.update({
                    where: { id: existing.id },
                    data: {
                        description: child.description,
                        phase: stage.phase,
                        effort_hours: child.effort_hours,
                        order_index: child.order_index,
                        due_date_offset_days: child.due_date_offset_days,
                        due_date_offset_reference: child.due_date_offset_reference as $Enums.due_date_offset_reference,
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

    logger.summary('Pipeline stages', { created: stageCreated, updated: stageUpdated, skipped: stageSkipped, total: stageCreated + stageUpdated + stageSkipped });
    logger.summary('Pipeline sub-tasks', { created: childCreated, updated: childUpdated, skipped: childSkipped, total: childCreated + childUpdated + childSkipped });

    // ─── SUBTASK TEMPLATES ────────────────────────────────────────────
    let subtaskCreated = 0;
    let subtaskUpdated = 0;

    for (const [taskName, templates] of Object.entries(TASK_SUBTASK_TEMPLATES)) {
        const task = await prisma.task_library.findFirst({
            where: { name: taskName, brand_id: brandId, is_active: true },
        });
        if (!task) {
            logger.skipped(`Subtask templates skipped: ${taskName}`, 'task not found');
            continue;
        }

        for (const template of templates) {
            const existing = await prisma.task_library_subtask_templates.findFirst({
                where: { task_library_id: task.id, subtask_key: template.subtask_key },
            });

            if (!existing) {
                await prisma.task_library_subtask_templates.create({
                    data: {
                        task_library_id: task.id,
                        subtask_key: template.subtask_key,
                        name: template.name,
                        description: template.description,
                        order_index: template.order_index,
                        is_auto_only: template.is_auto_only,
                    },
                });
                subtaskCreated++;
                logger.created(`Subtask: ${template.name}`, `→ ${taskName}`);
            } else {
                await prisma.task_library_subtask_templates.update({
                    where: { id: existing.id },
                    data: {
                        name: template.name,
                        description: template.description,
                        order_index: template.order_index,
                        is_auto_only: template.is_auto_only,
                    },
                });
                subtaskUpdated++;
            }
        }
    }
    logger.summary('Subtask templates', { created: subtaskCreated, updated: subtaskUpdated, skipped: 0, total: subtaskCreated + subtaskUpdated });

    // ─── REMAINING PHASES (flat tasks) ───────────────────────────────
    // skills_needed drives role resolution in seedTaskCrewAssignments via skill_role_mappings.
    const taskLibraryItems = [
        // CREATIVE DEVELOPMENT PHASE
        {
            name: "Creative Brief Development",
            description: "Develop comprehensive creative brief with client",
            phase: $Enums.project_phase.Creative_Development,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 2.0,
            skills_needed: ['Creative Vision', 'Storytelling', 'Creative Direction', 'Client Relations'],
            due_date_offset_days: 7,
            due_date_offset_reference: $Enums.due_date_offset_reference.booking_date,
            order_index: 1,
            brand_id: brandId,
        },
        {
            name: "Style Guide Creation",
            description: "Create visual style guide for the project",
            phase: $Enums.project_phase.Creative_Development,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.5,
            skills_needed: ['Style Guide', 'Creative Direction', 'Visual Arts', 'Design'],
            due_date_offset_days: 14,
            due_date_offset_reference: $Enums.due_date_offset_reference.booking_date,
            order_index: 2,
            brand_id: brandId,
        },
        {
            name: "Shot List Planning",
            description: "Plan specific shots and sequences",
            phase: $Enums.project_phase.Creative_Development,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 2.0,
            skills_needed: ['Shot Planning', 'Cinematography', 'Camera Operation'],
            due_date_offset_days: 21,
            due_date_offset_reference: $Enums.due_date_offset_reference.booking_date,
            order_index: 3,
            brand_id: brandId,
        },
        {
            name: "Mood Board Creation",
            description: "Create visual mood boards for client approval",
            phase: $Enums.project_phase.Creative_Development,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.0,
            skills_needed: ['Mood Board Creation', 'Creative Direction', 'Visual Arts'],
            due_date_offset_days: 14,
            due_date_offset_reference: $Enums.due_date_offset_reference.booking_date,
            order_index: 4,
            brand_id: brandId,
        },
        {
            name: "Creative Concept Approval",
            description: "Present and get approval for creative concepts",
            phase: $Enums.project_phase.Creative_Development,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.0,
            skills_needed: ['Creative Direction', 'Creative Vision', 'Presentation'],
            due_date_offset_days: 28,
            due_date_offset_reference: $Enums.due_date_offset_reference.booking_date,
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
            skills_needed: ['Location Scouting', 'Cinematography', 'Camera Operation'],
            due_date_offset_days: -30,
            due_date_offset_reference: $Enums.due_date_offset_reference.event_date,
            order_index: 1,
            brand_id: brandId,
        },
        {
            name: "Equipment Preparation",
            description: "Prepare and check all filming equipment",
            phase: $Enums.project_phase.Pre_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 2.0,
            skills_needed: ['Equipment Management', 'Technical Knowledge', 'Camera Operation'],
            due_date_offset_days: -7,
            due_date_offset_reference: $Enums.due_date_offset_reference.event_date,
            order_index: 2,
            brand_id: brandId,
        },
        {
            name: "Timeline Coordination",
            description: "Coordinate timing with all parties involved",
            phase: $Enums.project_phase.Pre_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.5,
            skills_needed: ['Scheduling', 'Planning', 'Vendor Coordination'],
            due_date_offset_days: -21,
            due_date_offset_reference: $Enums.due_date_offset_reference.event_date,
            order_index: 3,
            brand_id: brandId,
        },
        {
            name: "Vendor Coordination",
            description: "Coordinate with other wedding vendors",
            phase: $Enums.project_phase.Pre_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.0,
            skills_needed: ['Vendor Coordination', 'Project Management', 'Communication'],
            due_date_offset_days: -21,
            due_date_offset_reference: $Enums.due_date_offset_reference.event_date,
            order_index: 4,
            brand_id: brandId,
        },
        {
            name: "Client Pre-Production Meeting",
            description: "Final meeting before filming day",
            phase: $Enums.project_phase.Pre_Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.0,
            skills_needed: ['Client Relations', 'Communication', 'Consultation'],
            due_date_offset_days: -14,
            due_date_offset_reference: $Enums.due_date_offset_reference.event_date,
            order_index: 5,
            brand_id: brandId,
        },

        // PRODUCTION PHASE
        // One per_activity_crew task per on-site job role. Each task generates one instance per
        // crew slot × activity pair at runtime, filtered to the task's default_job_role_id.
        {
            name: "Video Coverage",
            description: "Video capture task generated per scheduled activity for Videographer crew",
            phase: $Enums.project_phase.Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            trigger_type: $Enums.task_trigger_type.per_activity_crew,
            is_on_site: true,
            effort_hours: 1.0,
            skills_needed: ['Event Coverage', 'Cinematography', 'Camera Operation'],
            due_date_offset_days: 0,
            due_date_offset_reference: $Enums.due_date_offset_reference.event_date,
            order_index: 1,
            brand_id: brandId,
        },
        {
            name: "Audio Coverage",
            description: "Audio capture task generated per scheduled activity for Sound Engineer crew",
            phase: $Enums.project_phase.Production,
            pricing_type: $Enums.pricing_type_options.Fixed,
            trigger_type: $Enums.task_trigger_type.per_activity_crew,
            is_on_site: true,
            effort_hours: 1.0,
            skills_needed: ['Live Audio Recording', 'Sound Engineering', 'Audio Recording'],
            due_date_offset_days: 0,
            due_date_offset_reference: $Enums.due_date_offset_reference.event_date,
            order_index: 2,
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
            skills_needed: ['Content Review', 'Video Editing', 'Organization'],
            due_date_offset_days: 7,
            due_date_offset_reference: $Enums.due_date_offset_reference.event_date,
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
            skills_needed: ['Audio Enhancement', 'Audio Engineering', 'Sound Design'],
            due_date_offset_days: 21,
            due_date_offset_reference: $Enums.due_date_offset_reference.event_date,
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
            skills_needed: ['Color Grading', 'Video Editing'],
            due_date_offset_days: 28,
            due_date_offset_reference: $Enums.due_date_offset_reference.event_date,
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
            skills_needed: ['Music Selection', 'Music Licensing', 'Music Sync'],
            due_date_offset_days: 14,
            due_date_offset_reference: $Enums.due_date_offset_reference.event_date,
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
            skills_needed: ['Title Card Design', 'Motion Graphics'],
            due_date_offset_days: -21,
            due_date_offset_reference: $Enums.due_date_offset_reference.delivery_date,
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
            skills_needed: ['Rough Cut Editing', 'Video Editing', 'Storytelling'],
            due_date_offset_days: 21,
            due_date_offset_reference: $Enums.due_date_offset_reference.event_date,
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
            skills_needed: ['Communication', 'Client Relations', 'Project Management'],
            due_date_offset_days: -14,
            due_date_offset_reference: $Enums.due_date_offset_reference.delivery_date,
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
            skills_needed: ['Final Export', 'Media Rendering', 'Quality Control'],
            due_date_offset_days: -7,
            due_date_offset_reference: $Enums.due_date_offset_reference.delivery_date,
            order_index: 1,
            brand_id: brandId,
        },
        {
            name: "Quality Control Check",
            description: "Final quality check of all deliverables",
            phase: $Enums.project_phase.Delivery,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.0,
            skills_needed: ['Quality Control', 'Content Review', 'Video Editing'],
            due_date_offset_days: -3,
            due_date_offset_reference: $Enums.due_date_offset_reference.delivery_date,
            order_index: 2,
            brand_id: brandId,
        },
        {
            name: "USB/Physical Media Preparation",
            description: "Prepare physical delivery media",
            phase: $Enums.project_phase.Delivery,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.5,
            skills_needed: ['Client Delivery', 'Documentation'],
            due_date_offset_days: 0,
            due_date_offset_reference: $Enums.due_date_offset_reference.delivery_date,
            order_index: 3,
            brand_id: brandId,
        },
        {
            name: "Online Gallery Setup",
            description: "Set up online gallery for client access",
            phase: $Enums.project_phase.Delivery,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.0,
            skills_needed: ['Gallery Setup', 'Organization'],
            due_date_offset_days: -3,
            due_date_offset_reference: $Enums.due_date_offset_reference.delivery_date,
            order_index: 4,
            brand_id: brandId,
        },
        {
            name: "Client Delivery Coordination",
            description: "Coordinate delivery with client",
            phase: $Enums.project_phase.Delivery,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.5,
            skills_needed: ['Client Delivery', 'Client Relations', 'Communication'],
            due_date_offset_days: 0,
            due_date_offset_reference: $Enums.due_date_offset_reference.delivery_date,
            order_index: 5,
            brand_id: brandId,
        },
        {
            name: "Final Invoice and Payment",
            description: "Process final payment and close project",
            phase: $Enums.project_phase.Delivery,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 0.5,
            skills_needed: ['Invoicing', 'Client Relations', 'Documentation'],
            due_date_offset_days: 7,
            due_date_offset_reference: $Enums.due_date_offset_reference.delivery_date,
            order_index: 6,
            brand_id: brandId,
        },
        {
            name: "Project Archive",
            description: "Archive project files and documentation",
            phase: $Enums.project_phase.Delivery,
            pricing_type: $Enums.pricing_type_options.Fixed,
            effort_hours: 1.0,
            skills_needed: ['Archiving', 'Documentation'],
            due_date_offset_days: 14,
            due_date_offset_reference: $Enums.due_date_offset_reference.delivery_date,
            order_index: 7,
            brand_id: brandId,
        },
    ];

    // Clean up legacy unified task replaced by role-specific Video Coverage + Audio Coverage
    const legacyActivityCoverage = await prisma.task_library.findFirst({
        where: { name: 'Activity Coverage', brand_id: brandId },
    });
    if (legacyActivityCoverage) {
        await prisma.task_library.delete({ where: { id: legacyActivityCoverage.id } });
        logger.created('Removed legacy task: Activity Coverage', 'replaced by Video Coverage + Audio Coverage');
    }

    let created = 0;
    let skipped = 0;
    for (const task of taskLibraryItems) {
        const existing = await prisma.task_library.findFirst({
            where: { name: task.name, brand_id: task.brand_id },
        });

        if (!existing) {
            await prisma.task_library.create({ data: task });
            created++;
            logger.created(`Task: ${task.name}`, `${$Enums.project_phase[task.phase]} phase`);
        } else {
            // Always patch so re-seeding picks up changes (including trigger_type fixes)
            await prisma.task_library.update({
                where: { id: existing.id },
                data: {
                    skills_needed: task.skills_needed ?? [],
                    due_date_offset_days: task.due_date_offset_days ?? null,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    due_date_offset_reference: (task as any).due_date_offset_reference ?? null,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    is_on_site: (task as any).is_on_site ?? false,
                    trigger_type: task.trigger_type,
                },
            });
            skipped++;
            logger.skipped(`Task patched: ${task.name}`, `${$Enums.project_phase[task.phase]} phase`);
        }
    }
    const summary: SeedSummary = { created, updated: 0, skipped, total: created + skipped };
    logger.summary('Task library items', summary);

    const totalPipelineTasks = PIPELINE_STAGES.length + PIPELINE_STAGES.reduce((sum, s) => sum + s.children.length, 0);
    return totalPipelineTasks + taskLibraryItems.length;
}

/** Backfill skills_needed onto pipeline tasks that don't have them yet. */
export async function backfillPipelineSkills(db: PrismaClient, brandId: number): Promise<number> {
    prisma = db;
    let updated = 0;

    for (const [taskName, config] of Object.entries(PIPELINE_TASK_SKILLS)) {
        const task = await prisma.task_library.findFirst({
            where: { name: taskName, brand_id: brandId, is_active: true },
            select: { id: true, skills_needed: true },
        });

        if (!task) continue;

        if (task.skills_needed.length === 0) {
            await prisma.task_library.update({
                where: { id: task.id },
                data: { skills_needed: config.skills_needed },
            });
            updated++;
            logger.created(`Backfill: ${taskName}`, `skills: [${config.skills_needed.join(', ')}]`);
        }
    }

    return updated;
}

export async function seedTaskCrewAssignments(db: PrismaClient, brandId: number): Promise<SeedSummary> {
    prisma = db;
    logger.sectionHeader('Task Library Crew Assignments');

    // ── Load all reference data ────────────────────────────────────────
    const tasks = await prisma.task_library.findMany({
        where: { brand_id: brandId, is_active: true, is_task_group: false },
        select: {
            id: true,
            name: true,
            skills_needed: true,
            default_job_role_id: true,
            default_crew_id: true,
        },
    });

    const skillMappings = await prisma.skill_role_mappings.findMany({
        where: { is_active: true },
        orderBy: { priority: 'desc' },
    });

    const jobRoles = await prisma.job_roles.findMany({
        where: { is_active: true },
        select: { id: true, name: true },
    });
    const roleNameById = new Map(jobRoles.map(r => [r.id, r.name]));

    const allBrackets = await prisma.payment_brackets.findMany({
        where: { is_active: true },
        orderBy: [{ job_role_id: 'asc' }, { level: 'asc' }],
    });

    const brandCrewMembers = await prisma.crew.findMany({
        where: {
            contact: { brand_id: brandId },
            job_role_assignments: { some: {} },
        },
        select: {
            id: true,
            contact: { select: { first_name: true, last_name: true } },
            job_role_assignments: {
                select: {
                    job_role_id: true,
                    payment_bracket_id: true,
                    is_primary: true,
                    payment_bracket: { select: { level: true } },
                },
            },
        },
    });

    // ── Resolve each task ──────────────────────────────────────────────
    let rolesAssigned = 0;
    let crewAssigned = 0;
    let skillRatesCreated = 0;
    let skipped = 0;

    for (const task of tasks) {
        if (task.skills_needed.length === 0) {
            skipped++;
            continue;
        }

        // 1. Resolve best job role from skills (highest priority mapping wins)
        const roleScores = new Map<number, number>();
        for (const skill of task.skills_needed) {
            const mappings = skillMappings.filter(m => m.skill_name === skill);
            for (const m of mappings) {
                roleScores.set(m.job_role_id, (roleScores.get(m.job_role_id) ?? 0) + m.priority);
            }
        }

        if (roleScores.size === 0) {
            logger.skipped(`${task.name}`, 'no skill→role mappings found');
            skipped++;
            continue;
        }

        let bestRoleId = 0;
        let bestScore = 0;
        for (const [roleId, score] of roleScores) {
            if (score > bestScore) {
                bestRoleId = roleId;
                bestScore = score;
            }
        }

        const roleName = roleNameById.get(bestRoleId) ?? 'unknown';

        // 2. Find the crew member with the highest bracket for this role (primary preferred)
        let bestCrewMember: { id: number; name: string; bracketId: number | null; bracketLevel: number } | null = null;

        for (const c of brandCrewMembers) {
            const crewRole = c.job_role_assignments.find(r => r.job_role_id === bestRoleId);
            if (!crewRole) continue;

            const level = crewRole.payment_bracket?.level ?? 0;
            const isPrimary = crewRole.is_primary;

            if (
                !bestCrewMember ||
                level > bestCrewMember.bracketLevel ||
                (level === bestCrewMember.bracketLevel && isPrimary)
            ) {
                bestCrewMember = {
                    id: c.id,
                    name: `${c.contact.first_name} ${c.contact.last_name}`,
                    bracketId: crewRole.payment_bracket_id ?? null,
                    bracketLevel: level,
                };
            }
        }

        // Use the crew member's actual bracket for skill rate snapshots
        const targetBracket = bestCrewMember?.bracketId
            ? allBrackets.find(b => b.id === bestCrewMember!.bracketId)
            : undefined;

        // 3. Update task
        const updateData: Record<string, unknown> = {};
        if (task.default_job_role_id !== bestRoleId) {
            updateData.default_job_role_id = bestRoleId;
        }
        if (bestCrewMember && task.default_crew_id !== bestCrewMember.id) {
            updateData.default_crew_id = bestCrewMember.id;
        }

        if (Object.keys(updateData).length > 0) {
            await prisma.task_library.update({
                where: { id: task.id },
                data: updateData,
            });

            if (updateData.default_job_role_id) rolesAssigned++;
            if (updateData.default_crew_id) crewAssigned++;

            const crewLabel = bestCrewMember ? ` → ${bestCrewMember.name}` : '';
            const bracketLabel = targetBracket ? ` (L${bestCrewMember?.bracketLevel} ${targetBracket.name})` : '';
            logger.created(`${task.name}`, `${roleName}${bracketLabel}${crewLabel}`);
        } else {
            skipped++;
        }

        // 4. Create skill_rates for each skill at the resolved bracket rate
        if (targetBracket) {
            for (const skill of task.skills_needed) {
                const existing = await prisma.task_library_skill_rates.findUnique({
                    where: {
                        task_library_id_skill_name_skill_level: {
                            task_library_id: task.id,
                            skill_name: skill,
                            skill_level: targetBracket.name,
                        },
                    },
                });

                if (!existing) {
                    await prisma.task_library_skill_rates.create({
                        data: {
                            task_library_id: task.id,
                            skill_name: skill,
                            skill_level: targetBracket.name,
                            hourly_rate: targetBracket.hourly_rate,
                        },
                    });
                    skillRatesCreated++;
                }
            }
        }
    }

    const summary: SeedSummary = {
        created: rolesAssigned + crewAssigned + skillRatesCreated,
        updated: 0,
        skipped,
        total: tasks.length,
    };

    logger.summary('Role assignments', { created: rolesAssigned, updated: 0, skipped: 0, total: rolesAssigned });
    logger.summary('Crew assignments', { created: crewAssigned, updated: 0, skipped: 0, total: crewAssigned });
    logger.summary('Skill rates', { created: skillRatesCreated, updated: 0, skipped: 0, total: skillRatesCreated });

    return summary;
}

async function main() {
    logger.sectionHeader('Seeding Moonrise Films Workflow');

    try {
        const brand = await prisma.brands.findUnique({
            where: { name: "Moonrise Films" },
        });

        if (!brand) {
            throw new Error("Moonrise Films brand not found. Run moonrise-platform.seed.ts first.");
        }

        const taskCount = await createMoonriseTaskLibrary(prisma, brand.id);
        logger.success(`Task library setup complete! Created ${taskCount} task items`);

        const backfilled = await backfillPipelineSkills(prisma, brand.id);
        logger.info(`Backfilled skills on ${backfilled} pipeline tasks`);

        const summary = await seedTaskCrewAssignments(prisma, brand.id);
        logger.success(`Crew assignment complete! ${summary.created} assignments made.`);
    } catch (error) {
        logger.error(`Workflow setup failed: ${String(error)}`);
        throw error;
    }
}

if (require.main === module) {
    main()
        .catch((e) => {
            logger.error(`Workflow setup failed: ${String(e)}`);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
