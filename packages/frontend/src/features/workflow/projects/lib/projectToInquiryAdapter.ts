/**
 * Project-to-Inquiry adapter.
 *
 * Many financial cards (ProposalsCard, ContractsCard, QuotesCard, InvoicesCard,
 * EstimatesCard) accept an `inquiry: Inquiry` prop but only use `inquiry.id` to
 * fetch data via hooks. Since converted projects retain their `inquiry_id`, we
 * can construct a minimal inquiry-like object so these cards work on projects
 * without modification.
 */

import type { Project } from '../types/project.types';

/**
 * Builds a minimal inquiry-shaped object from a Project, suitable for passing
 * to financial cards that only read `inquiry.id`, `inquiry.contact`, and
 * optional inline arrays.
 */
export function projectToInquiryAdapter(project: Project) {
    if (!project.inquiry_id) return null;

    return {
        id: project.inquiry_id,
        source: 'Manual' as const,
        status: 'Booked' as const,
        contact: project.contact ?? project.client?.contact ?? {
            first_name: '',
            last_name: '',
            email: '',
        },
        contact_id: project.contact_id ?? project.client_id,
        brand_id: project.brand_id ?? 0,
        created_at: new Date(project.created_at),
        updated_at: new Date(project.updated_at),
        event_date: project.wedding_date ? new Date(project.wedding_date) : null,
        estimates: project.estimates ?? [],
        quotes: project.quotes ?? [],
        proposals: project.proposals ?? [],
        contracts: project.contracts ?? [],
        invoices: project.invoices ?? [],
    };
}
