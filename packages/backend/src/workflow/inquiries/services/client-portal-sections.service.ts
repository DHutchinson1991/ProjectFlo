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

        const pkg = inquiry.selected_package;
        let packageDisplay: string | undefined;
        if (pkg) {
            const parts = [pkg.name];
            if (pkg.description) parts.push(pkg.description);

            // Compute stats from relations
            const c = (pkg as any)._count ?? {};
            const crewSlots: any[] = (pkg as any).package_crew_slots ?? [];
            const uniqueCrew = new Set<number>();
            let cameraCount = 0;
            let audioCount = 0;
            for (const slot of crewSlots) {
                if (slot.crew_id) uniqueCrew.add(slot.crew_id);
                for (const eq of slot.equipment ?? []) {
                    if (eq.equipment?.category === 'CAMERA') cameraCount++;
                    else if (eq.equipment?.category === 'AUDIO') audioCount++;
                }
            }

            // Each stat on its own line (prefix with STAT: for frontend parsing)
            if (c.package_event_days) parts.push(`STAT:Event Days:${c.package_event_days}`);
            if (uniqueCrew.size) parts.push(`STAT:Crew:${uniqueCrew.size}`);
            if (cameraCount) parts.push(`STAT:Cameras:${cameraCount}`);
            if (audioCount) parts.push(`STAT:Audio:${audioCount}`);
            if (c.package_event_day_locations) parts.push(`STAT:Locations:${c.package_event_day_locations}`);
            for (const f of packageFilms) {
                parts.push(`STAT:Films:${f.name}`);
            }
            packageDisplay = parts.join('\n');
        }

        const inquiryReview = this.buildInquiryReview(submission, {
            selected_package: packageDisplay,
        });
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
            payment_schedule: inquiry.preferred_payment_schedule
                ? {
                      id: inquiry.preferred_payment_schedule.id,
                      name: inquiry.preferred_payment_schedule.name,
                      rules: (inquiry.preferred_payment_schedule.rules ?? []).map((r) => ({
                          label: r.label,
                          amount_type: r.amount_type,
                          amount_value: Number(r.amount_value),
                          trigger_type: r.trigger_type,
                          trigger_days: r.trigger_days,
                      })),
                  }
                : null,
            brand,
            sections,
        };
    }

    /* Keys that should never be shown in the portal (internal / transient) */
    private static readonly HIDDEN_KEYS = new Set([
        '_builder_initialized', 'builder_step', 'package_path',
        'venue_name', 'venue_lat', 'venue_lng', 'venue_region', 'venue_details',
        'lead_source', 'lead_source_details',
        'discovery_call_interest',
        'payment_schedule_template_id',
    ]);

    /* Keys the client must NOT edit (changing them would break downstream data) */
    private static readonly READ_ONLY_KEYS = new Set([
        'event_type', 'wedding_date_approx',
        'couple_type', 'contact_role', 'contact_role_custom', 'partner_role',
        'selected_package',
        'builder_activities', 'builder_films', 'operator_count', 'camera_count',
        'discovery_call_date', 'discovery_call_time', 'discovery_call_method',
    ]);

    /* Human-readable labels for wizard fields not in the template questions */
    private static readonly FALLBACK_LABELS: Record<string, { prompt: string; category: string }> = {
        event_type: { prompt: 'Event type', category: 'event' },
        wedding_date_approx: { prompt: 'Approximate date', category: 'event' },
        guest_count: { prompt: 'Guest count', category: 'event' },
        venue_name: { prompt: 'Venue', category: 'event' },
        venue_address: { prompt: 'Venue address', category: 'event' },
        couple_type: { prompt: 'Couple type', category: 'contact' },
        partner_first_name: { prompt: "Partner's first name", category: 'contact' },
        partner_last_name: { prompt: "Partner's last name", category: 'contact' },
        partner_role: { prompt: "Partner's role", category: 'contact' },
        contact_role_custom: { prompt: 'Role (other)', category: 'contact' },
        bride_first_name: { prompt: "Bride's first name", category: 'contact' },
        bride_last_name: { prompt: "Bride's last name", category: 'contact' },
        groom_first_name: { prompt: "Groom's first name", category: 'contact' },
        groom_last_name: { prompt: "Groom's last name", category: 'contact' },
        bride2_first_name: { prompt: "Second bride's first name", category: 'contact' },
        bride2_last_name: { prompt: "Second bride's last name", category: 'contact' },
        groom2_first_name: { prompt: "Second groom's first name", category: 'contact' },
        groom2_last_name: { prompt: "Second groom's last name", category: 'contact' },
        is_birthday_person: { prompt: 'Are you the birthday person?', category: 'contact' },
        birthday_person_name: { prompt: 'Birthday person name', category: 'contact' },
        birthday_relation: { prompt: 'Relationship to birthday person', category: 'contact' },
        special_requests: { prompt: 'Special requests', category: 'reach' },
        selected_package: { prompt: 'Selected package', category: 'package' },
        builder_activities: { prompt: 'Coverage activities', category: 'coverage' },
        builder_films: { prompt: 'Film selections', category: 'coverage' },
        operator_count: { prompt: 'Operators', category: 'coverage' },
        camera_count: { prompt: 'Cameras', category: 'coverage' },
        payment_schedule_template_id: { prompt: 'Payment schedule', category: 'budget' },
        discovery_call_interest: { prompt: 'Interested in discovery call', category: 'call' },
        discovery_call_date: { prompt: 'Call date', category: 'call' },
        discovery_call_time: { prompt: 'Call time', category: 'call' },
        discovery_call_method: { prompt: 'Call method', category: 'call' },
    };

    /* Step labels for fallback categories not in the template's steps_config */
    private static readonly FALLBACK_STEP_LABELS: Record<string, string> = {
        contact: 'You',
        event: 'Your Event',
        coverage: 'Coverage',
        budget: 'Budget',
        package: 'Package',
        reach: 'Reach You',
        call: 'Discovery Call',
        other: 'Other Details',
    };

    private buildInquiryReview(
        submission: PortalInquiry['inquiry_wizard_submissions'][0] | null,
        valueOverrides: Record<string, string | undefined> = {},
    ) {
        if (!submission) return null;

        const questions = submission.template?.questions ?? [];
        const responses = (submission.responses ?? {}) as Record<string, unknown>;

        // Apply overrides (e.g. resolve package ID → name)
        for (const [key, val] of Object.entries(valueOverrides)) {
            if (val !== undefined && key in responses) responses[key] = val;
        }
        const stepsConfig = (submission.template?.steps_config ?? []) as Array<{
            key: string;
            label: string;
            description?: string;
        }>;

        /* Track which response keys are covered by template questions */
        const coveredKeys = new Set<string>();

        const steps = stepsConfig
            .map((step) => ({
                key: step.key,
                label: step.label,
                description: step.description ?? null,
                answers: questions
                    .filter((q) => q.category === step.key)
                    .map((q) => {
                        const key = q.field_key || `question_${q.id}`;
                        coveredKeys.add(key);
                        return {
                            field_key: key,
                            prompt: q.prompt,
                            field_type: q.field_type,
                            value: responses[key] ?? null,
                            options: q.options ?? null,
                            readOnly: ClientPortalSectionsService.READ_ONLY_KEYS.has(key),
                        };
                    })
                    .filter((a) => a.value !== null && a.value !== ''),
            }))
            .filter((step) => step.answers.length > 0);

        /* Gather remaining response keys not covered by template questions */
        const stepKeySet = new Set(stepsConfig.map((s) => s.key));
        const extraByCategory = new Map<string, typeof steps[number]['answers']>();

        for (const [key, value] of Object.entries(responses)) {
            if (coveredKeys.has(key)) continue;
            if (ClientPortalSectionsService.HIDDEN_KEYS.has(key)) continue;
            if (value === null || value === '' || value === undefined) continue;

            const fallback = ClientPortalSectionsService.FALLBACK_LABELS[key];
            const category = fallback?.category ?? 'other';
            const prompt = fallback?.prompt ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

            if (!extraByCategory.has(category)) extraByCategory.set(category, []);
            extraByCategory.get(category)!.push({
                field_key: key,
                prompt,
                field_type: 'text',
                value,
                options: null,
                readOnly: ClientPortalSectionsService.READ_ONLY_KEYS.has(key),
            });
        }

        /* Merge extras into existing steps or create new steps */
        for (const [category, answers] of extraByCategory) {
            const existing = steps.find((s) => s.key === category);
            if (existing) {
                existing.answers.push(...answers);
            } else {
                steps.push({
                    key: category,
                    label: ClientPortalSectionsService.FALLBACK_STEP_LABELS[category] ?? category,
                    description: null,
                    answers,
                });
            }
        }

        return {
            submission_id: submission.id,
            template_name: submission.template?.name ?? 'Questionnaire',
            submitted_at: submission.submitted_at,
            steps,
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
                          section_notes: proposal.section_notes ?? [],
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
                              title: inv.title,
                              status: inv.status,
                              subtotal: inv.subtotal,
                              tax_rate: inv.tax_rate,
                              total_amount: inv.amount,
                              amount_paid: inv.amount_paid,
                              due_date: inv.due_date,
                              issued_date: inv.issue_date,
                              paid_date: inv.status === 'Paid' ? (inv.payments[0]?.payment_date ?? null) : null,
                              currency: inv.currency,
                              notes: inv.notes,
                              terms: inv.terms,
                              payment_method: inv.payment_method,
                              milestone: inv.milestone,
                              items: inv.items,
                              payments: inv.payments,
                          })),
                      }
                    : null,
            welcome_pack: inquiry.welcome_sent_at
                ? { status: 'complete' as const, data: { sent_at: inquiry.welcome_sent_at } }
                : null,
        };
    }
}
