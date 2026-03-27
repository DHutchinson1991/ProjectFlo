import { Injectable } from '@nestjs/common';
import type { PortalInquiry } from './client-portal-data.service';

@Injectable()
export class ClientPortalSectionsService {
    /**
     * Assemble the full public portal payload from pre-fetched inquiry data.
     */
    buildPortalPayload(
        inquiry: PortalInquiry,
        packageFilms: { id: number; name: string }[],
        brand: Record<string, unknown> | null,
    ) {
        const submission = inquiry.inquiry_wizard_submissions[0] ?? null;
        const proposal = inquiry.proposals[0] ?? null;
        const contract = inquiry.contracts[0] ?? null;
        const estimate = inquiry.estimates[0] ?? null;

        const inquiryReview = this.buildInquiryReview(submission);
        const sections = this.buildSections(inquiry, inquiryReview, packageFilms, proposal, contract, estimate);

        const firstLocationSlot = (inquiry.schedule_event_days ?? [])
            .flatMap((d) => d.location_slots || [])
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))[0];

        return {
            inquiry_id: inquiry.id,
            status: inquiry.status,
            event_date: inquiry.wedding_date,
            event_type: inquiry.event_type?.name ?? null,
            event_type_id: inquiry.event_type?.id ?? null,
            venue: firstLocationSlot?.location?.name ?? firstLocationSlot?.name ?? null,
            venue_address: firstLocationSlot?.location?.address_line1 ?? firstLocationSlot?.address ?? null,
            is_contract_signed: contract?.status === 'Signed',
            contact: {
                first_name: inquiry.contact.first_name,
                last_name: inquiry.contact.last_name,
            },
            brand,
            sections,
        };
    }

    private buildInquiryReview(submission: PortalInquiry['inquiry_wizard_submissions'][0] | null) {
        if (!submission) return null;

        const questions = submission.template?.questions ?? [];
        const responses = (submission.responses ?? {}) as Record<string, unknown>;
        const stepsConfig = (submission.template?.steps_config ?? []) as Array<{
            key: string;
            label: string;
            description?: string;
        }>;

        return {
            submission_id: submission.id,
            template_name: submission.template?.name ?? 'Questionnaire',
            submitted_at: submission.submitted_at,
            steps: stepsConfig
                .map((step) => ({
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
                }))
                .filter((step) => step.answers.length > 0),
        };
    }

    private buildSections(
        inquiry: PortalInquiry,
        inquiryReview: ReturnType<ClientPortalSectionsService['buildInquiryReview']>,
        packageFilms: { id: number; name: string }[],
        proposal: PortalInquiry['proposals'][0] | null,
        contract: PortalInquiry['contracts'][0] | null,
        estimate: PortalInquiry['estimates'][0] | null,
    ) {
        return {
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
                      status: (() => {
                          if (proposal.status === 'Accepted') return 'accepted' as const;
                          if (proposal.client_response === 'ChangesRequested' || proposal.status === 'ChangesRequested')
                              return 'changes_requested' as const;
                          return 'review_pending' as const;
                      })(),
                      data: {
                          proposal_status: proposal.status,
                          share_token: proposal.share_token,
                          title: proposal.title ?? null,
                          content: proposal.content ?? null,
                          client_response: proposal.client_response ?? null,
                          client_response_at: proposal.client_response_at ?? null,
                          client_response_message: proposal.client_response_message ?? null,
                          event_days: inquiry.schedule_event_days,
                          films: inquiry.schedule_films,
                      },
                  }
                : null,
            contract: contract
                ? {
                      status: contract.status === 'Signed' ? ('complete' as const) : ('available' as const),
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
    }
}
