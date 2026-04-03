import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { randomUUID } from 'crypto';

/** Standalone intro-message generator — usable outside the service class.
 *  Returns `greeting|body` — the pipe separates the salutation from the message. */
export function generateIntroMessageFromTemplate(eventType: string, firstName: string): string {
    switch (eventType.toLowerCase()) {
        case 'wedding':
            return `Dear ${firstName},|Thank you for considering us to capture your wedding day. We're truly honoured and excited to be part of this incredible chapter in your love story — and we can't wait to bring your vision to life.`;
        case 'birthday':
            return `Dear ${firstName},|We're thrilled to help make your birthday celebration one to remember. Every special moment deserves to be captured beautifully, and we'd love to do exactly that for you.`;
        case 'corporate':
            return `Dear ${firstName},|Thank you for considering us for your corporate event. We understand the importance of professional, polished content and we're ready to deliver exactly that.`;
        case 'anniversary':
            return `Dear ${firstName},|Congratulations on this wonderful milestone. We'd love to help you celebrate and capture the magic of your anniversary in a way you'll treasure forever.`;
        default:
            return `Dear ${firstName},|Thank you for choosing us for your upcoming ${eventType.toLowerCase()}. We can't wait to create something truly memorable for you.`;
    }
}

interface ProposalDefaults {
    introMessageTemplate?: string;
    heroTitleTemplate?: string;
    heroSubtitleTemplate?: string;
    heroBackgroundUrl?: string;
    sections?: Array<{ type: string; enabled?: boolean }>;
    termsText?: string;
    theme?: string;
    tagline?: string;
    aboutText?: string;
    socialLinks?: unknown;
    contactDisplay?: unknown;
}

export interface ProposalInquiryInput {
    id: number;
    wedding_date?: Date | null;
    selected_package_id?: number | null;
    contact?: { first_name?: string | null; last_name?: string | null; email?: string } | null;
    event_type?: { name?: string } | null;
}

@Injectable()
export class ProposalContentGeneratorService {
    constructor(private readonly prisma: PrismaService) {}

    generateTitle(inquiry: ProposalInquiryInput): string {
        const firstName = inquiry.contact?.first_name || '';
        const lastName = inquiry.contact?.last_name || '';
        const eventType = inquiry.event_type?.name || 'Event';
        return `${eventType} Proposal – ${firstName} ${lastName}`.trim();
    }

    async generateProposalContent(inquiry: ProposalInquiryInput, brandId: number): Promise<Record<string, unknown>> {
        let defaults: ProposalDefaults = {};
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
        const sections = this.buildSectionsFromDefaults(defaults, inquiry, heroTitle, introMessage, eventDate ?? null);

        return {
            theme: defaults.theme || 'cinematic-dark',
            meta: { branding: { tagline: defaults.tagline, aboutText: defaults.aboutText, socialLinks: defaults.socialLinks, contactDisplay: defaults.contactDisplay } },
            sections,
        };
    }

    private generateHeroTitle(eventType: string, firstName: string, lastName: string, defaults: ProposalDefaults): string {
        const heroTemplate = defaults.heroTitleTemplate;
        switch (eventType.toLowerCase()) {
            case 'wedding': return `Mr & Mrs ${lastName}`;
            case 'birthday': return `${firstName}'s Birthday Celebration`;
            case 'corporate': return `${firstName} ${lastName} – Corporate Event`;
            case 'anniversary': return `The ${lastName} Anniversary`;
            case 'engagement': return `${firstName} & Partner's Engagement`;
            case 'bar mitzvah':
            case 'bat mitzvah': return `${firstName}'s ${eventType}`;
            default:
                if (heroTemplate) {
                    return this.resolveTemplate(heroTemplate, { client_name: `${firstName} ${lastName}`, first_name: firstName, last_name: lastName, event_type: eventType });
                }
                return `${firstName}'s ${eventType}`;
        }
    }

    private generateIntroMessage(eventType: string, firstName: string, _lastName: string, defaults: ProposalDefaults): string {
        const template = defaults.introMessageTemplate;
        if (template) {
            return this.resolveTemplate(template, { first_name: firstName, last_name: _lastName, event_type: eventType });
        }
        return generateIntroMessageFromTemplate(eventType, firstName);
    }

    private resolveTemplate(template: string, vars: Record<string, string>): string {
        return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `{${key}}`);
    }

    private buildSectionsFromDefaults(defaults: ProposalDefaults, inquiry: ProposalInquiryInput, heroTitle: string, introMessage: string, eventDate: Date | null): Record<string, unknown>[] {
        const enabledSections = (defaults.sections || []).filter(s => s.enabled);
        if (enabledSections.length === 0) {
            return this.buildFallbackSections(inquiry, heroTitle, introMessage, eventDate, defaults);
        }
        const id = () => randomUUID().slice(0, 9);
        const sections: Record<string, unknown>[] = [];
        for (const sectionDef of enabledSections) {
            const sId = id();
            const dateStr = eventDate ? new Date(eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
            switch (sectionDef.type) {
                case 'hero': sections.push({ id: sId, type: 'hero', isVisible: true, data: { title: heroTitle, subtitle: dateStr || defaults.heroSubtitleTemplate || '', backgroundImageUrl: defaults.heroBackgroundUrl || '' } }); break;
                case 'text': sections.push({ id: sId, type: 'text', isVisible: true, data: { blocks: [{ type: 'paragraph', data: { text: introMessage } }] } }); break;
                case 'event-details': sections.push({ id: sId, type: 'event-details', isVisible: true, data: { title: 'Event Details', showVenue: true, showDate: true } }); break;
                case 'pricing': sections.push({ id: sId, type: 'pricing', isVisible: true, data: { packageId: inquiry.selected_package_id || null, items: [], showLineItems: true, showTotal: true, allowAddons: false } }); break;
                case 'package-details': sections.push({ id: sId, type: 'package-details', isVisible: true, data: { title: 'Your Package', showDescription: true, showItems: true } }); break;
                case 'films': sections.push({ id: sId, type: 'films', isVisible: true, data: { title: 'Your Films', showDuration: true } }); break;
                case 'schedule': sections.push({ id: sId, type: 'schedule', isVisible: true, data: { ownerType: 'inquiry', ownerId: inquiry.id, title: 'Your Timeline', showDetails: true } }); break;
                case 'subjects': sections.push({ id: sId, type: 'subjects', isVisible: true, data: { title: 'Key People', showRealNames: true } }); break;
                case 'locations': sections.push({ id: sId, type: 'locations', isVisible: true, data: { title: 'Locations', showAddress: true } }); break;
                case 'crew': sections.push({ id: sId, type: 'crew', isVisible: true, data: { title: 'Your Team' } }); break;
                case 'equipment': sections.push({ id: sId, type: 'equipment', isVisible: true, data: { title: 'Equipment' } }); break;
                case 'media': sections.push({ id: sId, type: 'media', isVisible: true, data: { items: [], layout: 'featured' } }); break;
                case 'terms': sections.push({ id: sId, type: 'terms', isVisible: true, data: { title: 'Terms & Conditions', termsText: defaults.termsText || '' } }); break;
            }
        }
        return sections;
    }

    private buildFallbackSections(inquiry: ProposalInquiryInput, heroTitle: string, introMessage: string, eventDate: Date | null, defaults: ProposalDefaults): Record<string, unknown>[] {
        const id = () => randomUUID().slice(0, 9);
        const dateStr = eventDate ? new Date(eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
        return [
            { id: id(), type: 'hero', isVisible: true, data: { title: heroTitle, subtitle: dateStr, backgroundImageUrl: '' } },
            { id: id(), type: 'text', isVisible: true, data: { blocks: [{ type: 'paragraph', data: { text: introMessage } }] } },
            { id: id(), type: 'event-details', isVisible: true, data: { title: 'Event Details', showVenue: true, showDate: true } },
            { id: id(), type: 'pricing', isVisible: true, data: { packageId: inquiry.selected_package_id || null, items: [], showLineItems: true, showTotal: true, allowAddons: false } },
            { id: id(), type: 'package-details', isVisible: true, data: { title: 'Your Package', showDescription: true, showItems: true } },
            { id: id(), type: 'films', isVisible: true, data: { title: 'Your Films', showDuration: true } },
            { id: id(), type: 'schedule', isVisible: true, data: { ownerType: 'inquiry', ownerId: inquiry.id, title: 'Your Timeline', showDetails: true } },
            { id: id(), type: 'subjects', isVisible: true, data: { title: 'Key People', showRealNames: true } },
            { id: id(), type: 'locations', isVisible: true, data: { title: 'Locations', showAddress: true } },
            { id: id(), type: 'terms', isVisible: true, data: { title: 'Terms & Conditions', termsText: defaults.termsText || '' } },
        ];
    }
}
