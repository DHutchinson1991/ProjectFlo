import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';

export type JourneyStepStatus = 'completed' | 'active' | 'waiting' | 'upcoming' | 'locked';
export type JourneyStepSide = 'studio' | 'client';

export interface JourneyStep {
    key: string;
    label: string;
    status: JourneyStepStatus;
    icon: string;
    side: JourneyStepSide;
    waitingMessage?: string;
    completedAt?: string;
    cta?: { label: string; href: string };
    summary?: string;
}

interface SubtaskRow { subtask_key: string; status: string; completed_at: Date | null }
interface TaskRow { name: string; status: string; completed_at: Date | null; is_task_group: boolean }

/**
 * Builds the client-facing journey steps array from inquiry tasks,
 * subtasks, and section data for the portal tracker animation.
 */
@Injectable()
export class ClientPortalJourneyService {
    constructor(private readonly prisma: PrismaService) {}

    async buildJourneySteps(
        inquiryId: number,
        portalToken: string,
        sections: {
            questionnaire: boolean;
            estimate: boolean;
            proposalStatus: string | null;
            proposalShareToken: string | null;
            proposalClientResponse: string | null;
            contractStatus: string | null;
            contractSigningToken: string | null;
            inquiryStatus: string;
            welcomeSentAt: Date | null;
        },
        summaryCtx?: {
            packageName?: string;
            estimateTotal?: number;
            currency?: string;
            eventDate?: string;
            crewConfirmed?: number;
            crewTotal?: number;
        },
    ): Promise<JourneyStep[]> {
        const { subtasks, tasks } = await this.fetchInquiryTaskData(inquiryId);
        const subtaskMap = new Map(subtasks.map((s) => [s.subtask_key, s]));
        const taskMap = new Map(tasks.filter((t) => !t.is_task_group).map((t) => [t.name, t]));

        const steps: JourneyStep[] = [];

        // ── Inquiry Phase ──
        this.addInquiryPhaseSteps(steps, subtaskMap, taskMap, sections, portalToken);

        // ── Booking Phase ──
        this.addBookingPhaseSteps(steps, taskMap, sections, portalToken);

        // ── Post-Booking Phase ──
        this.addPostBookingSteps(steps, sections);

        const resolved = this.resolveActiveStep(steps);

        // Attach contextual summaries to key steps
        if (summaryCtx) {
            this.attachSummaries(resolved, summaryCtx);
        }

        return resolved;
    }

    private attachSummaries(
        steps: JourneyStep[],
        ctx: {
            packageName?: string;
            estimateTotal?: number;
            currency?: string;
            eventDate?: string;
            crewConfirmed?: number;
            crewTotal?: number;
        },
    ) {
        const fmt = (n: number) => {
            const sym = ctx.currency === 'USD' ? '$' : ctx.currency === 'EUR' ? '€' : '£';
            return `${sym}${n.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        };
        for (const step of steps) {
            switch (step.key) {
                case 'confirm_package_selection':
                    if (ctx.packageName) step.summary = `${ctx.packageName} package`;
                    break;
                case 'verify_event_date':
                    if (ctx.eventDate) {
                        const d = new Date(ctx.eventDate);
                        step.summary = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                    }
                    break;
                case 'send_crew_availability_requests':
                    if (ctx.crewTotal) step.summary = `${ctx.crewConfirmed ?? 0} of ${ctx.crewTotal} confirmed`;
                    break;
                case 'estimate_ready':
                    if (ctx.estimateTotal) step.summary = fmt(ctx.estimateTotal);
                    break;
                case 'proposal_sent':
                    if (ctx.packageName) step.summary = `Includes ${ctx.packageName}`;
                    break;
            }
        }
    }

    private addInquiryPhaseSteps(
        steps: JourneyStep[],
        subtaskMap: Map<string, SubtaskRow>,
        taskMap: Map<string, TaskRow>,
        sections: { questionnaire: boolean },
        portalToken: string,
    ) {
        steps.push(this.sectionStep(
            'inquiry_received', 'Inquiry Received', 'clipboard-sparkle',
            sections.questionnaire,
            'client',
            { label: 'View Your Submission', href: `/portal/${portalToken}#questionnaire` },
        ));

        steps.push(this.subtaskStep(subtaskMap, 'verify_contact_details', 'Verifying Your Details', 'person-check', 'studio'));
        steps.push(this.subtaskStep(subtaskMap, 'verify_event_date', 'Confirming Your Date', 'calendar-pin', 'studio'));
        steps.push(this.subtaskStep(subtaskMap, 'confirm_package_selection', 'Confirming Your Package', 'film-package', 'studio'));
        steps.push(this.subtaskStep(subtaskMap, 'check_crew_availability', 'Checking Crew Availability', 'crew-search', 'studio',
            'waiting', 'Your crew is confirming availability'));
        steps.push(this.subtaskStep(subtaskMap, 'check_equipment_availability', 'Securing Equipment', 'camera-search', 'studio'));
        steps.push(this.subtaskStep(subtaskMap, 'reserve_equipment', 'Equipment Reserved', 'camera-check', 'studio'));

        const crewStep = this.subtaskStep(subtaskMap, 'send_crew_availability_requests', 'Assembling Your Crew', 'handshake', 'studio',
            'waiting', 'Crew responses coming in');
        steps.push(crewStep);

        // Discovery call steps
        const schedCallSub = subtaskMap.get('schedule_discovery_call');
        const discoveryTask = taskMap.get('Discovery Call');

        steps.push(this.buildDiscoveryScheduleStep(schedCallSub, discoveryTask));
        steps.push(this.buildDiscoveryCompleteStep(discoveryTask));
    }

    private addBookingPhaseSteps(
        steps: JourneyStep[],
        taskMap: Map<string, TaskRow>,
        sections: {
            estimate: boolean;
            proposalStatus: string | null;
            proposalShareToken: string | null;
            proposalClientResponse: string | null;
            contractStatus: string | null;
            contractSigningToken: string | null;
            inquiryStatus: string;
            welcomeSentAt: Date | null;
        },
        portalToken: string,
    ) {
        const qualifySub = taskMap.get('Qualify & Respond');
        steps.push({
            key: 'inquiry_qualified',
            label: 'Inquiry Qualified',
            icon: 'star-badge',
            side: 'studio',
            status: qualifySub?.status === 'Completed' ? 'completed' : 'upcoming',
            completedAt: qualifySub?.completed_at?.toISOString(),
        });

        steps.push(this.sectionStep('estimate_ready', 'Estimate Ready', 'calculator',
            sections.estimate, 'studio',
            { label: 'View Estimate', href: `/portal/${portalToken}#estimate` },
        ));

        // Proposal sent
        const proposalSent = !!sections.proposalStatus;
        const proposalAccepted = sections.proposalStatus === 'Accepted';
        const proposalReconsideration = sections.proposalClientResponse === 'Reconsideration';
        const proposalPending = proposalSent && !proposalAccepted;
        steps.push({
            key: 'proposal_sent',
            label: proposalReconsideration
                ? 'Under Review'
                : proposalPending ? 'Awaiting Your Review' : 'Proposal Sent',
            icon: 'document-scroll',
            side: proposalReconsideration ? 'studio' : proposalPending ? 'client' : 'studio',
            status: proposalAccepted ? 'completed' : proposalReconsideration ? 'waiting' : proposalPending ? 'waiting' : 'upcoming',
            waitingMessage: proposalReconsideration
                ? 'Your feedback is being reviewed'
                : proposalPending ? 'Take your time reviewing' : undefined,
            cta: proposalSent && sections.proposalShareToken
                ? { label: 'Review Proposal', href: `/proposals/${sections.proposalShareToken}` }
                : undefined,
        });

        steps.push({
            key: 'proposal_accepted',
            label: 'Proposal Accepted',
            icon: 'thumbs-up-sparkle',
            side: 'client',
            status: proposalAccepted ? 'completed' : 'upcoming',
        });

        // Contract
        const contractSent = !!sections.contractStatus;
        const contractSigned = sections.contractStatus === 'Signed';
        const contractPending = contractSent && !contractSigned;
        steps.push({
            key: 'contract_ready',
            label: contractPending ? 'Awaiting Your Signature' : 'Contract Ready',
            icon: 'quill-scroll',
            side: contractPending ? 'client' : 'studio',
            status: contractSigned ? 'completed' : contractPending ? 'waiting' : 'upcoming',
            waitingMessage: contractPending ? 'Ready when you are' : undefined,
            cta: contractPending && sections.contractSigningToken
                ? { label: 'Sign Contract', href: `/sign/${sections.contractSigningToken}` }
                : undefined,
        });

        steps.push({
            key: 'contract_signed',
            label: 'Contract Signed',
            icon: 'stamp-seal',
            side: 'client',
            status: contractSigned ? 'completed' : 'upcoming',
        });

        const isBooked = sections.inquiryStatus === 'Booked' || sections.inquiryStatus === 'Converted';
        steps.push({
            key: 'booking_confirmed',
            label: 'Booking Confirmed!',
            icon: 'confetti',
            side: 'studio',
            status: isBooked ? 'completed' : 'upcoming',
        });
    }

    private addPostBookingSteps(
        steps: JourneyStep[],
        sections: { inquiryStatus: string; welcomeSentAt: Date | null },
    ) {
        const isBooked = sections.inquiryStatus === 'Booked' || sections.inquiryStatus === 'Converted';

        steps.push({
            key: 'welcome_pack',
            label: 'Welcome Pack Sent',
            icon: 'gift-open',
            side: 'studio',
            status: sections.welcomeSentAt ? 'completed' : isBooked ? 'upcoming' : 'locked',
            completedAt: sections.welcomeSentAt?.toISOString(),
        });

        const postBookingPhases = [
            { key: 'creative_development', label: 'Planning Your Film', icon: 'clapperboard-pencil', side: 'studio' as const },
            { key: 'pre_production', label: 'Pre-Production', icon: 'storyboard', side: 'studio' as const },
            { key: 'production_day', label: 'Your Wedding Day!', icon: 'film-reel', side: 'client' as const },
            { key: 'post_and_delivery', label: 'Your Film is Being Made', icon: 'scissors-film', side: 'studio' as const },
        ];

        for (const phase of postBookingPhases) {
            steps.push({
                key: phase.key,
                label: phase.label,
                icon: phase.icon,
                side: phase.side,
                status: isBooked ? 'upcoming' : 'locked',
            });
        }
    }

    private buildDiscoveryScheduleStep(
        schedCallSub: SubtaskRow | undefined,
        discoveryTask: TaskRow | undefined,
    ): JourneyStep {
        const scheduled = schedCallSub?.status === 'Completed';
        const callDone = discoveryTask?.status === 'Completed';

        if (callDone) {
            return { key: 'schedule_discovery', label: 'Discovery Call Scheduled', icon: 'phone-calendar', side: 'studio' as const, status: 'completed' };
        }
        if (scheduled) {
            return {
                key: 'schedule_discovery', label: 'Discovery Call Scheduled', icon: 'phone-calendar',
                side: 'studio' as const, status: 'waiting', waitingMessage: 'Looking forward to chatting!',
            };
        }
        return { key: 'schedule_discovery', label: 'Scheduling Discovery Call', icon: 'phone-calendar', side: 'studio' as const, status: 'upcoming' };
    }

    private buildDiscoveryCompleteStep(discoveryTask: TaskRow | undefined): JourneyStep {
        return {
            key: 'discovery_complete',
            label: 'Discovery Call Complete',
            icon: 'chat-check',
            side: 'client',
            status: discoveryTask?.status === 'Completed' ? 'completed' : 'upcoming',
            completedAt: discoveryTask?.completed_at?.toISOString(),
        };
    }

    /** Map a subtask key to a journey step with optional waiting state. */
    private subtaskStep(
        map: Map<string, SubtaskRow>,
        key: string,
        label: string,
        icon: string,
        side: JourneyStepSide = 'studio',
        _waitingStatus?: 'waiting',
        waitingMsg?: string,
    ): JourneyStep {
        const sub = map.get(key);
        const done = sub?.status === 'Completed';
        return {
            key,
            label,
            icon,
            side,
            status: done ? 'completed' : 'upcoming',
            completedAt: done ? sub.completed_at?.toISOString() : undefined,
            waitingMessage: waitingMsg,
        };
    }

    /** Map a section existence check to a journey step. */
    private sectionStep(
        key: string,
        label: string,
        icon: string,
        exists: boolean,
        side: JourneyStepSide = 'studio',
        cta?: { label: string; href: string },
    ): JourneyStep {
        return {
            key,
            label,
            icon,
            side,
            status: exists ? 'completed' : 'upcoming',
            cta: exists ? cta : undefined,
        };
    }

    /**
     * Walk from top: first non-completed step becomes active (or waiting if
     * the step has a waiting variant). Steps after active stay upcoming/locked.
     */
    private resolveActiveStep(steps: JourneyStep[]): JourneyStep[] {
        let foundActive = false;
        for (const step of steps) {
            if (foundActive) {
                if (step.status === 'completed') continue; // allow out-of-order completions
                if (step.status !== 'locked') step.status = 'upcoming';
                continue;
            }
            if (step.status !== 'completed') {
                step.status = step.waitingMessage ? 'waiting' : 'active';
                foundActive = true;
            }
        }
        return steps;
    }

    private async fetchInquiryTaskData(inquiryId: number) {
        const [subtasks, tasks] = await Promise.all([
            this.prisma.inquiry_task_subtasks.findMany({
                where: { inquiry_task: { inquiry_id: inquiryId } },
                select: { subtask_key: true, status: true, completed_at: true },
            }),
            this.prisma.inquiry_tasks.findMany({
                where: { inquiry_id: inquiryId, is_active: true },
                select: { name: true, status: true, completed_at: true, is_task_group: true },
                orderBy: { order_index: 'asc' },
            }),
        ]);
        return { subtasks, tasks };
    }
}
