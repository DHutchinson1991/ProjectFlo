import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProposalDto, UpdateProposalDto } from './dto/proposals.dto';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { InquiryTasksService } from '../inquiry-tasks/inquiry-tasks.service';

@Injectable()
export class ProposalsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly inquiryTasksService: InquiryTasksService,
    ) { }

    async findAllByInquiry(inquiryId: number, brandId: number) {
        // First verify the inquiry belongs to the brand
        const inquiry = await this.prisma.inquiries.findFirst({
            where: {
                id: inquiryId,
                contact: {
                    brand_id: brandId,
                },
            },
        });

        if (!inquiry) {
            throw new NotFoundException(`Inquiry with ID ${inquiryId} not found`);
        }

        return this.prisma.proposals.findMany({
            where: {
                inquiry_id: inquiryId,
            },
            include: {
                inquiry: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                                brand_id: true,
                            },
                        },
                    },
                },
                project: {
                    select: {
                        id: true,
                        project_name: true,
                    },
                },
            },
            orderBy: {
                created_at: 'desc',
            },
        });
    }

    async findOne(id: number, inquiryId: number, brandId: number) {
        // First verify the inquiry belongs to the brand
        const inquiry = await this.prisma.inquiries.findFirst({
            where: {
                id: inquiryId,
                contact: {
                    brand_id: brandId,
                },
            },
        });

        if (!inquiry) {
            throw new NotFoundException(`Inquiry with ID ${inquiryId} not found`);
        }

        const proposal = await this.prisma.proposals.findFirst({
            where: {
                id,
                inquiry_id: inquiryId,
            },
            include: {
                inquiry: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                                brand_id: true,
                            },
                        },
                    },
                },
                project: {
                    select: {
                        id: true,
                        project_name: true,
                    },
                },
            },
        });

        if (!proposal) {
            throw new NotFoundException(`Proposal with ID ${id} not found`);
        }

        return proposal;
    }

    async create(inquiryId: number, createProposalDto: CreateProposalDto, brandId: number) {
        // Fetch inquiry with contact and event type for auto-generation
        const inquiry = await this.prisma.inquiries.findFirst({
            where: {
                id: inquiryId,
                contact: {
                    brand_id: brandId,
                },
            },
            include: {
                contact: true,
                event_type: true,
                selected_package: {
                    select: { id: true, name: true, base_price: true, currency: true },
                },
            },
        });

        if (!inquiry) {
            throw new NotFoundException(`Inquiry with ID ${inquiryId} not found`);
        }

        // Auto-generate proposal content from brand settings + inquiry data
        const content = await this.generateProposalContent(inquiry, brandId);
        const title = this.generateTitle(inquiry);

        // Create proposal with auto-generated content and share token
        const shareToken = randomUUID();

        const proposal = await this.prisma.proposals.create({
            data: {
                inquiry_id: inquiryId,
                title,
                content: content as Prisma.InputJsonValue,
                status: 'Draft',
                version: 1,
                share_token: shareToken,
            },
            include: {
                inquiry: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                },
                project: {
                    select: {
                        id: true,
                        project_name: true,
                    },
                },
            },
        });

        await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Create & Review Proposal');

        return proposal;
    }

    /* ------------------------------------------------------------------ */
    /* Auto-generation helpers                                             */
    /* ------------------------------------------------------------------ */

    private generateTitle(inquiry: any): string {
        const firstName = inquiry.contact?.first_name || '';
        const lastName = inquiry.contact?.last_name || '';
        const eventType = inquiry.event_type?.name || 'Event';
        return `${eventType} Proposal – ${firstName} ${lastName}`.trim();
    }

    private async generateProposalContent(inquiry: any, brandId: number): Promise<Record<string, unknown>> {
        // Fetch brand proposal-defaults setting
        let defaults: any = {};
        try {
            const setting = await this.prisma.brand_settings.findUnique({
                where: { brand_id_key: { brand_id: brandId, key: 'proposal_defaults' } },
            });
            if (setting?.value) {
                defaults = JSON.parse(setting.value as string);
            }
        } catch { /* use empty defaults */ }

        const contact = inquiry.contact;
        const eventTypeName = inquiry.event_type?.name || 'Event';
        const firstName = contact?.first_name || '';
        const lastName = contact?.last_name || '';
        const eventDate = inquiry.wedding_date;

        const heroTitle = this.generateHeroTitle(eventTypeName, firstName, lastName, defaults);
        const introMessage = this.generateIntroMessage(eventTypeName, firstName, lastName, defaults);

        const sections = this.buildSectionsFromDefaults(defaults, inquiry, heroTitle, introMessage, eventDate);

        return {
            theme: defaults.theme || 'cinematic-dark',
            meta: { branding: { tagline: defaults.tagline, aboutText: defaults.aboutText, socialLinks: defaults.socialLinks, contactDisplay: defaults.contactDisplay } },
            sections,
        };
    }

    private generateHeroTitle(eventType: string, firstName: string, lastName: string, defaults: any): string {
        // Check for a custom template in settings
        const heroTemplate = defaults.heroTitleTemplate;

        // Smart defaults based on event type
        switch (eventType.toLowerCase()) {
            case 'wedding':
                return `Mr & Mrs ${lastName}`;
            case 'birthday':
                return `${firstName}'s Birthday Celebration`;
            case 'corporate':
                return `${firstName} ${lastName} – Corporate Event`;
            case 'anniversary':
                return `The ${lastName} Anniversary`;
            case 'engagement':
                return `${firstName} & Partner's Engagement`;
            case 'bar mitzvah':
            case 'bat mitzvah':
                return `${firstName}'s ${eventType}`;
            default:
                if (heroTemplate) {
                    return this.resolveTemplate(heroTemplate, { client_name: `${firstName} ${lastName}`, first_name: firstName, last_name: lastName, event_type: eventType });
                }
                return `${firstName}'s ${eventType}`;
        }
    }

    private generateIntroMessage(eventType: string, firstName: string, lastName: string, defaults: any): string {
        // Use custom template from settings if available
        const template = defaults.introMessageTemplate;
        if (template) {
            return this.resolveTemplate(template, { first_name: firstName, last_name: lastName, event_type: eventType });
        }

        // Smart default intro messages by event type
        switch (eventType.toLowerCase()) {
            case 'wedding':
                return `Dear ${firstName}, thank you for considering us to capture your wedding day. We're truly honoured and excited to be part of this incredible chapter in your love story. Here's what we have in mind for you.`;
            case 'birthday':
                return `Dear ${firstName}, we're thrilled to help make your birthday celebration one to remember! Here's our plan to capture all the joy and special moments of your big day.`;
            case 'corporate':
                return `Dear ${firstName}, thank you for considering us for your corporate event. We understand the importance of professional, polished content and we're ready to deliver exactly that.`;
            case 'anniversary':
                return `Dear ${firstName}, congratulations on this wonderful milestone! We'd love to help you celebrate and capture the magic of your anniversary.`;
            default:
                return `Dear ${firstName}, thank you for choosing us for your upcoming ${eventType.toLowerCase()}. We can't wait to create something truly memorable for you. Here's what we've prepared.`;
        }
    }

    private resolveTemplate(template: string, vars: Record<string, string>): string {
        return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `{${key}}`);
    }

    private buildSectionsFromDefaults(defaults: any, inquiry: any, heroTitle: string, introMessage: string, eventDate: Date | null): any[] {
        const enabledSections = (defaults.sections || []).filter((s: any) => s.enabled);
        const sections: any[] = [];

        // If no settings yet, build a sensible default set
        if (enabledSections.length === 0) {
            return this.buildFallbackSections(inquiry, heroTitle, introMessage, eventDate, defaults);
        }

        for (const sectionDef of enabledSections) {
            const id = randomUUID().slice(0, 9);
            switch (sectionDef.type) {
                case 'hero':
                    sections.push({ id, type: 'hero', isVisible: true, data: { title: heroTitle, subtitle: eventDate ? new Date(eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : (defaults.heroSubtitleTemplate || ''), backgroundImageUrl: defaults.heroBackgroundUrl || '' } });
                    break;
                case 'text':
                    sections.push({ id, type: 'text', isVisible: true, data: { blocks: [{ type: 'paragraph', data: { text: introMessage } }] } });
                    break;
                case 'event-details':
                    sections.push({ id, type: 'event-details', isVisible: true, data: { title: 'Event Details', showVenue: true, showDate: true } });
                    break;
                case 'pricing':
                    sections.push({ id, type: 'pricing', isVisible: true, data: { packageId: inquiry.selected_package_id || null, items: [], showLineItems: true, showTotal: true, allowAddons: false } });
                    break;
                case 'package-details':
                    sections.push({ id, type: 'package-details', isVisible: true, data: { title: 'Your Package', showDescription: true, showItems: true } });
                    break;
                case 'films':
                    sections.push({ id, type: 'films', isVisible: true, data: { title: 'Your Films', showDuration: true } });
                    break;
                case 'schedule':
                    sections.push({ id, type: 'schedule', isVisible: true, data: { ownerType: 'inquiry', ownerId: inquiry.id, title: 'Your Day Timeline', showDetails: true } });
                    break;
                case 'subjects':
                    sections.push({ id, type: 'subjects', isVisible: true, data: { title: 'Key People', showRealNames: true } });
                    break;
                case 'locations':
                    sections.push({ id, type: 'locations', isVisible: true, data: { title: 'Locations', showAddress: true } });
                    break;
                case 'crew':
                    sections.push({ id, type: 'crew', isVisible: true, data: { title: 'Your Team' } });
                    break;
                case 'equipment':
                    sections.push({ id, type: 'equipment', isVisible: true, data: { title: 'Equipment' } });
                    break;
                case 'media':
                    sections.push({ id, type: 'media', isVisible: true, data: { items: [], layout: 'featured' } });
                    break;
                case 'terms':
                    sections.push({ id, type: 'terms', isVisible: true, data: { title: 'Terms & Conditions', termsText: defaults.termsText || '' } });
                    break;
            }
        }
        return sections;
    }

    private buildFallbackSections(inquiry: any, heroTitle: string, introMessage: string, eventDate: Date | null, defaults: any): any[] {
        const id = () => randomUUID().slice(0, 9);
        return [
            { id: id(), type: 'hero', isVisible: true, data: { title: heroTitle, subtitle: eventDate ? new Date(eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '', backgroundImageUrl: '' } },
            { id: id(), type: 'text', isVisible: true, data: { blocks: [{ type: 'paragraph', data: { text: introMessage } }] } },
            { id: id(), type: 'event-details', isVisible: true, data: { title: 'Event Details', showVenue: true, showDate: true } },
            { id: id(), type: 'pricing', isVisible: true, data: { packageId: inquiry.selected_package_id || null, items: [], showLineItems: true, showTotal: true, allowAddons: false } },
            { id: id(), type: 'package-details', isVisible: true, data: { title: 'Your Package', showDescription: true, showItems: true } },
            { id: id(), type: 'films', isVisible: true, data: { title: 'Your Films', showDuration: true } },
            { id: id(), type: 'schedule', isVisible: true, data: { ownerType: 'inquiry', ownerId: inquiry.id, title: 'Your Day Timeline', showDetails: true } },
            { id: id(), type: 'subjects', isVisible: true, data: { title: 'Key People', showRealNames: true } },
            { id: id(), type: 'locations', isVisible: true, data: { title: 'Locations', showAddress: true } },
            { id: id(), type: 'terms', isVisible: true, data: { title: 'Terms & Conditions', termsText: defaults.termsText || '' } },
        ];
    }

    async update(id: number, inquiryId: number, updateProposalDto: UpdateProposalDto, brandId: number) {
        // First verify the inquiry belongs to the brand and the proposal exists
        const existingProposal = await this.findOne(id, inquiryId, brandId);

        if (!existingProposal) {
            throw new NotFoundException(`Proposal with ID ${id} not found`);
        }

        return this.prisma.proposals.update({
            where: { id },
            data: {
                ...updateProposalDto,
                content: updateProposalDto.content as Prisma.InputJsonValue,
                updated_at: new Date(),
            },
            include: {
                inquiry: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                },
                project: {
                    select: {
                        id: true,
                        project_name: true,
                    },
                },
            },
        });
    }

    async remove(id: number, inquiryId: number, brandId: number) {
        // First verify the inquiry belongs to the brand and the proposal exists
        const existingProposal = await this.findOne(id, inquiryId, brandId);

        if (!existingProposal) {
            throw new NotFoundException(`Proposal with ID ${id} not found`);
        }

        await this.prisma.proposals.delete({
            where: { id },
        });

        return { message: 'Proposal deleted successfully' };
    }

    async sendProposal(id: number, inquiryId: number, brandId: number) {
        // First verify the proposal exists and belongs to the inquiry/brand
        const proposal = await this.findOne(id, inquiryId, brandId);

        if (proposal.status === 'Sent') {
            throw new ForbiddenException('Proposal has already been sent');
        }

        const updated = await this.prisma.proposals.update({
            where: { id },
            data: {
                status: 'Sent',
                sent_at: new Date(),
            },
            include: {
                inquiry: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                },
                project: {
                    select: {
                        id: true,
                        project_name: true,
                    },
                },
            },
        });

        await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Send Proposal');

        return updated;
    }

    async generateShareToken(id: number, inquiryId: number, brandId: number): Promise<string> {
        const proposal = await this.findOne(id, inquiryId, brandId);

        // Return existing token if already generated
        if (proposal.share_token) {
            return proposal.share_token;
        }

        const token = randomUUID();
        await this.prisma.proposals.update({
            where: { id },
            data: { share_token: token },
        });

        return token;
    }

    async findByShareToken(token: string) {
        const proposal = await this.prisma.proposals.findUnique({
            where: { share_token: token },
            include: {
                inquiry: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                        estimates: {
                            include: {
                                items: true,
                            },
                            orderBy: [
                                { total_amount: 'desc' },
                                { is_primary: 'desc' },
                                { created_at: 'desc' },
                            ],
                            take: 1,
                        },
                        selected_package: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                base_price: true,
                                currency: true,
                                contents: true,
                            },
                        },
                        // Schedule: event days with activities, moments
                        schedule_event_days: {
                            orderBy: { order_index: 'asc' },
                            include: {
                                activities: {
                                    orderBy: { order_index: 'asc' },
                                    select: {
                                        id: true,
                                        name: true,
                                        description: true,
                                        color: true,
                                        icon: true,
                                        start_time: true,
                                        end_time: true,
                                        duration_minutes: true,
                                        order_index: true,
                                        notes: true,
                                        moments: {
                                            orderBy: { order_index: 'asc' },
                                            select: {
                                                id: true,
                                                name: true,
                                                order_index: true,
                                                duration_seconds: true,
                                                is_required: true,
                                            },
                                        },
                                    },
                                },
                                subjects: {
                                    orderBy: { order_index: 'asc' },
                                    select: {
                                        id: true,
                                        name: true,
                                        real_name: true,
                                        count: true,
                                        category: true,
                                        order_index: true,
                                    },
                                },
                                location_slots: {
                                    orderBy: { order_index: 'asc' },
                                    select: {
                                        id: true,
                                        name: true,
                                        address: true,
                                        order_index: true,
                                        location: {
                                            select: {
                                                name: true,
                                                address_line1: true,
                                                city: true,
                                                state: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        // Films / deliverables
                        schedule_films: {
                            orderBy: { order_index: 'asc' },
                            select: {
                                id: true,
                                order_index: true,
                                film: {
                                    select: {
                                        id: true,
                                        name: true,
                                        film_type: true,
                                        target_duration_min: true,
                                        target_duration_max: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!proposal) {
            throw new NotFoundException('Proposal not found');
        }

        // Fetch brand info through the inquiry contact
        const contact = await this.prisma.contacts.findFirst({
            where: { id: proposal.inquiry.contact_id },
            select: { brand_id: true },
        });

        const brand = contact?.brand_id
            ? await this.prisma.brands.findUnique({
                where: { id: contact.brand_id },
                select: {
                    id: true,
                    name: true,
                    display_name: true,
                    description: true,
                    website: true,
                    email: true,
                    phone: true,
                    address_line1: true,
                    address_line2: true,
                    city: true,
                    state: true,
                    country: true,
                    postal_code: true,
                    logo_url: true,
                },
            })
            : null;

        return { ...proposal, brand };
    }

    async respondToProposal(token: string, response: string, message?: string) {
        const validResponses = ['Accepted', 'ChangesRequested'];
        if (!validResponses.includes(response)) {
            throw new BadRequestException('Invalid response. Must be "Accepted" or "ChangesRequested".');
        }

        const proposal = await this.prisma.proposals.findUnique({
            where: { share_token: token },
            include: {
                inquiry: {
                    include: {
                        contact: { select: { first_name: true, last_name: true, email: true } },
                    },
                },
            },
        });

        if (!proposal) {
            throw new NotFoundException('Proposal not found');
        }

        if (proposal.status !== 'Sent') {
            throw new ForbiddenException('This proposal cannot be responded to in its current state.');
        }

        const updated = await this.prisma.proposals.update({
            where: { id: proposal.id },
            data: {
                client_response: response,
                client_response_at: new Date(),
                client_response_message: message || null,
                status: response === 'Accepted' ? 'Accepted' : 'Sent',
            },
        });

        if (response === 'Accepted') {
            const inquiryId = proposal.inquiry_id;
            const contact = proposal.inquiry?.contact;

            // Find the most recent draft contract to auto-send
            const draftContract = await this.prisma.contracts.findFirst({
                where: { inquiry_id: inquiryId, status: 'Draft' },
                orderBy: { id: 'desc' },
            });

            if (draftContract && contact?.email) {
                const signerName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Client';

                // Replace signers with contact as sole client signer
                await this.prisma.contract_signers.deleteMany({ where: { contract_id: draftContract.id } });
                await this.prisma.contract_signers.create({
                    data: { contract_id: draftContract.id, name: signerName, email: contact.email, role: 'client' },
                });

                await this.prisma.contracts.update({
                    where: { id: draftContract.id },
                    data: { status: 'Sent', sent_at: new Date() },
                });

                await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Contract Sent');
            }
        }

        return updated;
    }
}
