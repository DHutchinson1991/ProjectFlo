import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { ProposalCrudService } from './proposal-crud.service';
import { generateIntroMessageFromTemplate } from './proposal-content-generator.service';
import { randomUUID } from 'crypto';

@Injectable()
export class ProposalLifecycleService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly crudService: ProposalCrudService,
        private readonly inquiryTasksService: InquiryTasksService,
    ) {}

    async sendProposal(id: number, inquiryId: number, brandId: number) {
        const proposal = await this.crudService.findOne(id, inquiryId, brandId);
        if (proposal.status === 'Sent') {
            throw new ForbiddenException('Proposal has already been sent');
        }

        const updated = await this.prisma.proposals.update({
            where: { id },
            data: { status: 'Sent', sent_at: new Date() },
            include: {
                inquiry: {
                    include: { contact: { select: { first_name: true, last_name: true, email: true } } },
                },
                project: { select: { id: true, project_name: true } },
            },
        });

        await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Send Proposal');
        return updated;
    }

    async generateShareToken(id: number, inquiryId: number, brandId: number): Promise<string> {
        const proposal = await this.crudService.findOne(id, inquiryId, brandId);
        if (proposal.share_token) return proposal.share_token;

        const token = randomUUID();
        await this.prisma.proposals.update({ where: { id }, data: { share_token: token } });
        return token;
    }

    async findByShareToken(token: string, preview = false) {
        const proposal = await this.prisma.proposals.findUnique({
            where: { share_token: token },
            include: this._shareTokenInclude(),
        });
        if (!proposal) throw new NotFoundException('Proposal not found');

        // Only track views for client access, not studio preview
        if (!preview) {
            await this.prisma.proposals.update({
                where: { id: proposal.id },
                data: {
                    viewed_at: proposal.viewed_at ?? new Date(),
                    view_count: { increment: 1 },
                },
            });
        }

        // Resolve subject names in film camera_assignments so the frontend doesn't need cross-table ID mapping
        await this._resolveFilmSubjectNames(proposal);

        const brand = await this._findBrandForProposal(proposal.inquiry.contact_id);

        // Fetch task library entries grouped by phase for this brand
        const rawTasks = brand ? await this.prisma.task_library.findMany({
            where: { brand_id: brand.id, is_active: true },
            select: { phase: true, name: true, is_task_group: true, parent_task_id: true, order_index: true },
            orderBy: [{ phase: 'asc' }, { order_index: 'asc' }],
        }) : [];

        const phaseMap = new Map<string, { name: string; isGroup: boolean }[]>();
        for (const t of rawTasks) {
            if (!phaseMap.has(t.phase)) phaseMap.set(t.phase, []);
            // Only include top-level tasks (not children nested under groups)
            if (!t.parent_task_id) {
                phaseMap.get(t.phase)!.push({ name: t.name, isGroup: t.is_task_group });
            }
        }
        const projectPhases = Array.from(phaseMap.entries()).map(([phase, tasks]) => ({
            phase,
            taskCount: tasks.length,
            tasks: tasks.map((t) => t.name),
        }));

        const firstName = proposal.inquiry.contact?.first_name || '';
        const eventType = proposal.inquiry.event_type?.name || 'Event';
        const personalMessage = generateIntroMessageFromTemplate(eventType, firstName);

        return {
            ...proposal,
            viewed_at: preview ? proposal.viewed_at : (proposal.viewed_at ?? new Date()),
            view_count: preview ? proposal.view_count : proposal.view_count + 1,
            brand,
            personalMessage,
            projectPhases,
        };
    }

    async recordSectionView(token: string, sectionType: string, durationSeconds?: number) {
        const proposal = await this.prisma.proposals.findUnique({
            where: { share_token: token },
            select: { id: true },
        });
        if (!proposal) throw new NotFoundException('Proposal not found');

        await this.prisma.proposal_section_views.upsert({
            where: { proposal_id_section_type: { proposal_id: proposal.id, section_type: sectionType } },
            create: { proposal_id: proposal.id, section_type: sectionType, duration_seconds: durationSeconds ?? 0 },
            update: durationSeconds ? { duration_seconds: { increment: durationSeconds } } : {},
        });

        return { recorded: true };
    }

    async saveSectionNote(token: string, sectionType: string, note: string) {
        const proposal = await this.prisma.proposals.findUnique({
            where: { share_token: token },
            select: { id: true },
        });
        if (!proposal) throw new NotFoundException('Proposal not found');

        const result = await this.prisma.proposal_section_notes.upsert({
            where: { proposal_id_section_type: { proposal_id: proposal.id, section_type: sectionType } },
            create: { proposal_id: proposal.id, section_type: sectionType, note },
            update: { note },
        });

        return { id: result.id, section_type: result.section_type, note: result.note };
    }

    async respondToProposal(token: string, response: string, message?: string) {
        if (!['Accepted', 'ChangesRequested', 'Reconsideration'].includes(response)) {
            throw new BadRequestException('Invalid response. Must be "Accepted", "ChangesRequested", or "Reconsideration".');
        }

        const proposal = await this.prisma.proposals.findUnique({
            where: { share_token: token },
            include: { inquiry: { include: { contact: { select: { first_name: true, last_name: true, email: true } } } } },
        });
        if (!proposal) throw new NotFoundException('Proposal not found');
        if (proposal.status !== 'Sent' && !(proposal.status === 'Accepted' && response === 'Reconsideration')) {
            throw new ForbiddenException('This proposal cannot be responded to in its current state.');
        }

        const updated = await this.prisma.proposals.update({
            where: { id: proposal.id },
            data: {
                client_response: response,
                client_response_at: new Date(),
                client_response_message: message || null,
                // Accepted stays Accepted; ChangesRequested/Reconsideration revert to Sent for studio review
                status: response === 'Accepted' ? 'Accepted' : 'Sent',
            },
        });

        if (response === 'Accepted') {
            await this._handleProposalAccepted(proposal.inquiry_id, proposal.inquiry?.contact);
        }

        return updated;
    }

    private async _handleProposalAccepted(inquiryId: number, contact?: { email?: string; first_name?: string | null; last_name?: string | null } | null) {
        const draftContract = await this.prisma.contracts.findFirst({
            where: { inquiry_id: inquiryId, status: 'Draft' },
            orderBy: { id: 'desc' },
        });

        if (draftContract && contact?.email) {
            const signerName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Client';
            await this.prisma.contract_signers.deleteMany({ where: { contract_id: draftContract.id } });
            await this.prisma.contract_signers.create({
                data: { contract_id: draftContract.id, name: signerName, email: contact.email, role: 'client' },
            });
            const now = new Date();
            const signingDeadline = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
            await this.prisma.contracts.update({
                where: { id: draftContract.id },
                data: { status: 'Sent', sent_at: now, signed_date: signingDeadline },
            });
            await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Contract Sent');
        }
    }

    /**
     * Resolve subject_ids in camera_assignments to subject_names so the
     * proposal frontend can display them without cross-table ID mapping.
     * subject_ids may reference PackageDaySubject, ProjectDaySubject, or
     * ProjectFilmSubject — we query all three and build a unified lookup.
     */
    private async _resolveFilmSubjectNames(proposal: any) {
        const films = proposal.inquiry?.schedule_films;
        if (!Array.isArray(films)) return;

        // Collect all subject_ids from all camera_assignments
        const allSubjectIds = new Set<number>();
        for (const pf of films) {
            for (const scene of pf.instance_scenes ?? []) {
                for (const moment of scene.moments ?? []) {
                    for (const ca of moment.recording_setup?.camera_assignments ?? []) {
                        for (const id of ca.subject_ids ?? []) allSubjectIds.add(id);
                    }
                }
            }
        }
        if (allSubjectIds.size === 0) return;

        const ids = Array.from(allSubjectIds);

        // Query all candidate subject tables in parallel
        const [packageDaySubjects, projectDaySubjects, filmSubjects] = await Promise.all([
            this.prisma.packageDaySubject.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
            this.prisma.projectDaySubject.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
            this.prisma.projectFilmSubject.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
        ]);

        const nameMap = new Map<number, string>();
        for (const s of [...packageDaySubjects, ...projectDaySubjects, ...filmSubjects]) {
            if (!nameMap.has(s.id)) nameMap.set(s.id, s.name);
        }

        // Enrich camera_assignments with subject_names
        for (const pf of films) {
            for (const scene of pf.instance_scenes ?? []) {
                for (const moment of scene.moments ?? []) {
                    for (const ca of moment.recording_setup?.camera_assignments ?? []) {
                        (ca as any).subject_names = (ca.subject_ids ?? [])
                            .map((id: number) => nameMap.get(id))
                            .filter(Boolean);
                    }
                }
            }
        }
    }

    private async _findBrandForProposal(contactId: number) {
        const contact = await this.prisma.contacts.findFirst({
            where: { id: contactId },
            select: { brand_id: true },
        });
        if (!contact?.brand_id) return null;
        return this.prisma.brands.findUnique({
            where: { id: contact.brand_id },
            select: { id: true, name: true, display_name: true, description: true, website: true, email: true, phone: true, address_line1: true, address_line2: true, city: true, state: true, country: true, postal_code: true, logo_url: true },
        });
    }

    private _shareTokenInclude() {
        return {
            section_notes: {
                select: { section_type: true, note: true, created_at: true, updated_at: true },
            },
            inquiry: {
                include: {
                    contact: { select: { first_name: true, last_name: true, email: true } },
                    event_type: { select: { name: true } },
                    estimates: {
                        include: {
                            items: true,
                            payment_milestones: { orderBy: { order_index: 'asc' as const }, select: { id: true, label: true, amount: true, due_date: true, status: true } },
                        },
                        orderBy: [{ total_amount: 'desc' as const }, { is_primary: 'desc' as const }, { created_at: 'desc' as const }],
                        take: 1,
                    },
                    selected_package: { select: { id: true, name: true, description: true, currency: true, contents: true } },
                    schedule_event_days: {
                        orderBy: { order_index: 'asc' as const },
                        include: {
                            activities: {
                                orderBy: { order_index: 'asc' as const },
                                select: {
                                    id: true, name: true, description: true, color: true, icon: true,
                                    start_time: true, end_time: true, duration_minutes: true, order_index: true, notes: true,
                                    moments: { orderBy: { order_index: 'asc' as const }, select: { id: true, name: true, order_index: true, duration_seconds: true, is_required: true } },
                                    location_assignments: {
                                        select: {
                                            project_location_slot: {
                                                select: { name: true, location: { select: { name: true, address_line1: true } } },
                                            },
                                        },
                                    },
                                    subject_assignments: {
                                        select: {
                                            project_day_subject: {
                                                select: { id: true, name: true, real_name: true },
                                            },
                                        },
                                    },
                                },
                            },
                            subjects: { orderBy: { order_index: 'asc' as const }, select: { id: true, name: true, real_name: true, count: true, order_index: true } },
                            location_slots: {
                                orderBy: { order_index: 'asc' as const },
                                select: { id: true, name: true, address: true, order_index: true, location: { select: { name: true, address_line1: true, city: true, state: true, lat: true, lng: true } } },
                            },
                            day_crew_slots: {
                                orderBy: { order_index: 'asc' as const },
                                include: {
                                    crew: {
                                        include: {
                                            contact: { select: { first_name: true, last_name: true } },
                                        },
                                    },
                                    job_role: { select: { name: true, display_name: true, on_site: true, category: true } },
                                    equipment: {
                                        include: {
                                            equipment: { select: { id: true, item_name: true, category: true } },
                                        },
                                    },
                                    activity_assignments: {
                                        select: { project_activity_id: true },
                                    },
                                },
                            },
                        },
                    },
                    schedule_films: {
                        orderBy: { order_index: 'asc' as const },
                        select: {
                            id: true, order_index: true,
                            film: {
                                select: {
                                    id: true, name: true, film_type: true,
                                    target_duration_min: true, target_duration_max: true,
                                    _count: { select: { scenes: true } },
                                    scenes: {
                                        orderBy: { order_index: 'asc' as const },
                                        select: {
                                            id: true, name: true, order_index: true, duration_seconds: true, mode: true,
                                            moments: { orderBy: { order_index: 'asc' as const }, select: { id: true, name: true, order_index: true, duration: true } },
                                            location_assignment: { select: { location: { select: { name: true, address_line1: true } } } },
                                        },
                                    },
                                    equipment_assignments: {
                                        select: {
                                            quantity: true,
                                            equipment: { select: { item_name: true, category: true } },
                                        },
                                    },
                                },
                            },
                            instance_tracks: {
                                orderBy: { order_index: 'asc' as const },
                                select: {
                                    id: true, name: true, type: true, order_index: true, is_active: true, is_unmanned: true,
                                    crew_id: true,
                                    crew: { select: { contact: { select: { first_name: true, last_name: true } } } },
                                },
                            },
                            instance_subjects: {
                                select: { id: true, name: true },
                            },
                            instance_scenes: {
                                orderBy: { order_index: 'asc' as const },
                                select: {
                                    id: true, name: true, order_index: true,
                                    moments: {
                                        orderBy: { order_index: 'asc' as const },
                                        select: {
                                            id: true, name: true, order_index: true, duration: true,
                                            recording_setup: {
                                                select: {
                                                    audio_track_ids: true,
                                                    camera_assignments: {
                                                        select: { track_id: true, subject_ids: true, shot_type: true },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    quotes: {
                        orderBy: [{ is_primary: 'desc' as const }, { created_at: 'desc' as const }],
                        take: 1,
                        select: {
                            id: true,
                            quote_number: true,
                            title: true,
                            status: true,
                            issue_date: true,
                            expiry_date: true,
                            total_amount: true,
                            tax_rate: true,
                            deposit_required: true,
                            currency: true,
                            notes: true,
                            payment_method: true,
                            items: {
                                select: {
                                    id: true, description: true, category: true,
                                    quantity: true, unit: true, unit_price: true,
                                },
                            },
                            payment_milestones: {
                                orderBy: { due_date: 'asc' as const },
                                select: { id: true, label: true, amount: true, due_date: true, status: true },
                            },
                        },
                    },
                    contracts: {
                        orderBy: { created_at: 'desc' as const },
                        take: 1,
                        select: {
                            id: true,
                            title: true,
                            status: true,
                            rendered_html: true,
                            sent_at: true,
                            signed_date: true,
                            signers: {
                                select: { id: true, name: true, role: true, status: true, signed_at: true, viewed_at: true },
                            },
                        },
                    },
                },
            },
        };
    }
}
