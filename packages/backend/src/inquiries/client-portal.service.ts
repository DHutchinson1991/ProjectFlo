import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClientPortalService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Generate (or return existing) portal token for an inquiry
     */
    async getOrCreatePortalToken(inquiryId: number, brandId: number): Promise<string> {
        const inquiry = await this.prisma.inquiries.findFirst({
            where: { id: inquiryId, contact: { brand_id: brandId } },
            select: { id: true, portal_token: true },
        });
        if (!inquiry) throw new NotFoundException('Inquiry not found');

        if (inquiry.portal_token) return inquiry.portal_token;

        const token = randomUUID();
        await this.prisma.inquiries.update({
            where: { id: inquiryId },
            data: { portal_token: token },
        });
        return token;
    }

    /**
     * Public: fetch the full portal payload for a given token.
     * Returns phase-gated data — sections are included only when the
     * admin has progressed the inquiry to that stage.
     */
    async getPortalByToken(token: string) {
        const inquiry = await this.prisma.inquiries.findUnique({
            where: { portal_token: token },
            include: {
                contact: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone_number: true,
                        brand_id: true,
                    },
                },
                needs_assessment_submissions: {
                    include: {
                        template: {
                            include: {
                                questions: { orderBy: { order_index: 'asc' } },
                            },
                        },
                    },
                    orderBy: { id: 'desc' },
                    take: 1,
                },
                proposals: {
                    where: { status: { in: ['Sent', 'Accepted', 'ChangesRequested'] } },
                    orderBy: { id: 'desc' },
                    take: 1,
                },
                contracts: {
                    where: { status: { in: ['Sent', 'Signed'] } },
                    orderBy: { id: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        signing_token: true,
                        signed_date: true,
                        sent_at: true,
                        signers: {
                            select: {
                                id: true,
                                name: true,
                                role: true,
                                status: true,
                                signed_at: true,
                            },
                        },
                    },
                },
                estimates: {
                    where: { status: { in: ['Sent', 'Approved', 'Accepted'] } },
                    orderBy: [{ is_primary: 'desc' }, { id: 'desc' }],
                    take: 1,
                    select: {
                        id: true,
                        estimate_number: true,
                        title: true,
                        status: true,
                        total_amount: true,
                        tax_rate: true,
                        issue_date: true,
                        expiry_date: true,
                        notes: true,
                        deposit_required: true,
                        payment_method: true,
                        items: {
                            select: {
                                id: true,
                                description: true,
                                quantity: true,
                                unit_price: true,
                                unit: true,
                                category: true,
                            },
                            orderBy: { id: 'asc' },
                        },
                        payment_milestones: {
                            select: {
                                id: true,
                                label: true,
                                amount: true,
                                due_date: true,
                                status: true,
                                order_index: true,
                            },
                            orderBy: { order_index: 'asc' },
                        },
                    },
                },
                invoices: {
                    where: { status: { notIn: ['Draft', 'Cancelled', 'Voided'] } },
                    orderBy: { due_date: 'asc' },
                    select: {
                        id: true,
                        invoice_number: true,
                        status: true,
                        amount: true,
                        due_date: true,
                        issue_date: true,
                        amount_paid: true,
                    },
                },
                selected_package: {
                    select: {
                        id: true,
                        name: true,
                        base_price: true,
                        currency: true,
                        description: true,
                        contents: true,
                    },
                },
                event_type: { select: { id: true, name: true } },
            },
        });

        if (!inquiry) {
            throw new NotFoundException('Portal not found');
        }

        // If package has contents with film IDs, resolve names
        let packageFilms: { id: number; name: string }[] = [];
        const pkgContents = inquiry.selected_package?.contents as
            | { films?: number[] }
            | null;
        if (pkgContents?.films?.length) {
            const films = await this.prisma.film.findMany({
                where: { id: { in: pkgContents.films } },
                select: { id: true, name: true },
            });
            packageFilms = films;
        }

        // Fetch brand info
        const brand = await this.prisma.brands.findUnique({
            where: { id: inquiry.contact.brand_id! },
            select: {
                id: true,
                name: true,
                display_name: true,
                description: true,
                website: true,
                email: true,
                phone: true,
                address_line1: true,
                city: true,
                state: true,
                country: true,
                postal_code: true,
                logo_url: true,
                currency: true,
            },
        });

        // Determine section availability
        const submission = inquiry.needs_assessment_submissions[0] ?? null;
        const proposal = inquiry.proposals[0] ?? null;
        const contract = inquiry.contracts[0] ?? null;
        const estimate = inquiry.estimates[0] ?? null;

        // Build the inquiry review data
        let inquiryReview: {
            submission_id: number;
            template_name: string;
            submitted_at: Date;
            steps: { key: string; label: string; description: string | null; answers: { prompt: string; field_type: string; value: unknown }[] }[];
        } | null = null;
        if (submission) {
            const questions = submission.template?.questions ?? [];
            const responses = (submission.responses ?? {}) as Record<string, unknown>;
            const stepsConfig = (submission.template?.steps_config ?? []) as Array<{
                key: string;
                label: string;
                description?: string;
            }>;

            inquiryReview = {
                submission_id: submission.id,
                template_name: submission.template?.name ?? 'Questionnaire',
                submitted_at: submission.submitted_at,
                steps: stepsConfig.map((step) => ({
                    key: step.key,
                    label: step.label,
                    description: step.description ?? null,
                    answers: questions
                        .filter((q) => q.category === step.key)
                        .map((q) => {
                            const key = q.field_key || `question_${q.id}`;
                            return {
                                field_key: key,
                                prompt: q.prompt,
                                field_type: q.field_type,
                                value: responses[key] ?? null,
                                options: q.options ?? null,
                            };
                        })
                        .filter((a) => a.value !== null && a.value !== ''),
                })).filter((step) => step.answers.length > 0),
            };
        }

        // Build sections object — each section is null when not yet available
        const sections = {
            questionnaire: inquiryReview
                ? { status: 'complete' as const, data: inquiryReview }
                : null,
            package: inquiry.selected_package
                ? {
                      status: 'complete' as const,
                      data: {
                          id: inquiry.selected_package.id,
                          name: inquiry.selected_package.name,
                          base_price: inquiry.selected_package.base_price,
                          currency: inquiry.selected_package.currency,
                          description: inquiry.selected_package.description,
                          films: packageFilms,
                      },
                  }
                : null,
            estimate: estimate
                ? {
                      status: 'available' as const,
                      data: {
                          id: estimate.id,
                          estimate_number: estimate.estimate_number,
                          title: estimate.title,
                          status: estimate.status,
                          total_amount: estimate.total_amount,
                          tax_rate: estimate.tax_rate,
                          issue_date: estimate.issue_date,
                          expiry_date: estimate.expiry_date,
                          notes: estimate.notes,
                          deposit_required: estimate.deposit_required,
                          payment_method: estimate.payment_method,
                          items: estimate.items,
                          payment_milestones: estimate.payment_milestones,
                      },
                  }
                : null,
            proposal: proposal
                ? {
                      status:
                          proposal.status === 'Accepted'
                              ? ('complete' as const)
                              : ('available' as const),
                      data: {
                          proposal_status: proposal.status,
                          share_token: proposal.share_token,
                          client_response: proposal.client_response ?? null,
                      },
                  }
                : null,
            contract: contract
                ? {
                      status:
                          contract.status === 'Signed'
                              ? ('complete' as const)
                              : ('available' as const),
                      data: {
                          title: contract.title,
                          contract_status: contract.status,
                          signing_token: contract.signing_token,
                          signed_date: contract.signed_date,
                          sent_at: contract.sent_at,
                          signers: contract.signers,
                      },
                  }
                : null,
            invoices:
                inquiry.invoices.length > 0
                    ? {
                          status: 'available' as const,
                          data: inquiry.invoices.map((inv) => ({
                              id: inv.id,
                              invoice_number: inv.invoice_number,
                              status: inv.status,
                              total_amount: inv.amount,
                              due_date: inv.due_date,
                              paid_date: null as string | null,
                              issued_date: inv.issue_date,
                          })),
                      }
                    : null,
            welcome_pack: inquiry.welcome_sent_at
                ? { status: 'complete' as const, data: { sent_at: inquiry.welcome_sent_at } }
                : null,
        };

        return {
            inquiry_id: inquiry.id,
            status: inquiry.status,
            event_date: inquiry.wedding_date,
            event_type: inquiry.event_type?.name ?? null,
            venue: inquiry.venue_details ?? null,
            venue_address: inquiry.venue_address ?? null,
            is_contract_signed: contract?.status === 'Signed',
            contact: {
                first_name: inquiry.contact.first_name,
                last_name: inquiry.contact.last_name,
            },
            brand,
            sections,
        };
    }

    async getPackageOptions(token: string) {
        const inquiry = await this.prisma.inquiries.findFirst({
            where: { portal_token: token },
            select: { id: true, contact: { select: { brand_id: true } } },
        });

        if (!inquiry) {
            throw new NotFoundException('Portal not found');
        }

        const packages = await this.prisma.service_packages.findMany({
            where: { brand_id: inquiry.contact.brand_id!, is_active: true },
            select: {
                id: true,
                name: true,
                description: true,
                category: true,
                base_price: true,
                currency: true,
                contents: true,
            },
            orderBy: { base_price: 'asc' },
        });

        return { packages };
    }

    async submitPackageRequest(
        token: string,
        data: { selected_package_id?: number; customisations?: Prisma.InputJsonValue; notes?: string },
    ) {
        const inquiry = await this.prisma.inquiries.findFirst({
            where: { portal_token: token },
            select: { id: true, contact: { select: { brand_id: true } } },
        });

        if (!inquiry) {
            throw new NotFoundException('Portal not found');
        }

        const request = await this.prisma.package_requests.create({
            data: {
                inquiry_id: inquiry.id,
                selected_package_id: data.selected_package_id ?? null,
                customisations: data.customisations ?? Prisma.DbNull,
                notes: data.notes ?? null,
            },
        });

        await this.prisma.activity_logs.create({
            data: {
                inquiry_id: inquiry.id,
                type: 'package_request',
                description: data.selected_package_id
                    ? `Client requested package #${data.selected_package_id}`
                    : 'Client submitted custom package request',
                metadata: {
                    source: 'portal',
                    selected_package_id: data.selected_package_id ?? null,
                    has_customisations: !!data.customisations,
                } as Prisma.InputJsonValue,
            },
        });

        return request;
    }
}
