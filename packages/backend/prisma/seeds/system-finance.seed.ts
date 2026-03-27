// System Finance Seed — Payment Brackets + Contract Clauses
// Run after system-platform (job-roles must exist for brackets).
import { PrismaClient } from '@prisma/client';
import { createSeedLogger, SeedType, SeedSummary, sumSummaries } from '../utils/seed-logger';

let prisma: PrismaClient;
const logger = createSeedLogger(SeedType.SYSTEM);

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT BRACKETS
// ─────────────────────────────────────────────────────────────────────────────

// T1–T5: UK NLW base (£12.21) + £1.25/hr increments
const T: Record<number, { hourly_rate: number; day_rate: number; overtime_rate: number }> = {
    1: { hourly_rate: 12.21, day_rate: parseFloat((12.21 * 8).toFixed(2)), overtime_rate: parseFloat((12.21 * 1.5).toFixed(2)) },
    2: { hourly_rate: 13.46, day_rate: parseFloat((13.46 * 8).toFixed(2)), overtime_rate: parseFloat((13.46 * 1.5).toFixed(2)) },
    3: { hourly_rate: 14.71, day_rate: parseFloat((14.71 * 8).toFixed(2)), overtime_rate: parseFloat((14.71 * 1.5).toFixed(2)) },
    4: { hourly_rate: 15.96, day_rate: parseFloat((15.96 * 8).toFixed(2)), overtime_rate: parseFloat((15.96 * 1.5).toFixed(2)) },
    5: { hourly_rate: 17.21, day_rate: parseFloat((17.21 * 8).toFixed(2)), overtime_rate: parseFloat((17.21 * 1.5).toFixed(2)) },
};

const TIERS: Record<string, { name: string; display_name: string; level: number; hourly_rate: number; day_rate: number; overtime_rate: number; color: string; description: string }[]> = {
    creative: [
        { name: 'junior',  display_name: 'Junior',      level: 1, ...T[1], color: '#66BB6A', description: 'Entry-level, assisting senior crew' },
        { name: 'mid',     display_name: 'Mid-Level',    level: 2, ...T[2], color: '#42A5F5', description: 'Independently competent' },
        { name: 'senior',  display_name: 'Senior',       level: 3, ...T[3], color: '#AB47BC', description: 'Lead creative, mentors juniors' },
        { name: 'lead',    display_name: 'Lead / Head',  level: 4, ...T[4], color: '#FF7043', description: 'Department lead, full creative ownership' },
    ],
    technical: [
        { name: 'trainee', display_name: 'Trainee',          level: 1, ...T[1], color: '#78909C', description: 'In training, shadowing experienced crew' },
        { name: 'junior',  display_name: 'Junior',           level: 2, ...T[2], color: '#66BB6A', description: 'Entry-level operator' },
        { name: 'mid',     display_name: 'Mid-Level',        level: 3, ...T[3], color: '#42A5F5', description: 'Solid all-round operator' },
        { name: 'senior',  display_name: 'Senior',           level: 4, ...T[4], color: '#AB47BC', description: 'Expert operator, complex setups' },
        { name: 'lead',    display_name: 'Lead / Principal', level: 5, ...T[5], color: '#FF7043', description: 'Technical lead, oversees full kit & crew' },
    ],
    production: [
        { name: 'assistant', display_name: 'Assistant', level: 1, ...T[1], color: '#78909C', description: 'Production assistant' },
        { name: 'junior',    display_name: 'Junior',    level: 2, ...T[2], color: '#66BB6A', description: 'Junior producer / coordinator' },
        { name: 'mid',       display_name: 'Mid-Level', level: 3, ...T[3], color: '#42A5F5', description: 'Experienced producer' },
        { name: 'senior',    display_name: 'Senior',    level: 4, ...T[4], color: '#AB47BC', description: 'Senior producer, client-facing lead' },
        { name: 'executive', display_name: 'Executive', level: 5, ...T[5], color: '#FF7043', description: 'Executive producer, full project ownership' },
    ],
    'post-production': [
        { name: 'junior', display_name: 'Junior',             level: 1, ...T[1], color: '#66BB6A', description: 'Assist edits, basic assembly' },
        { name: 'mid',    display_name: 'Mid-Level',          level: 2, ...T[2], color: '#42A5F5', description: 'Independent editor, standard deliverables' },
        { name: 'senior', display_name: 'Senior',             level: 3, ...T[3], color: '#AB47BC', description: 'Senior editor, complex multi-cam / VFX' },
        { name: 'lead',   display_name: 'Lead / Supervising', level: 4, ...T[4], color: '#FF7043', description: 'Post-production supervisor' },
    ],
    _default: [
        { name: 'junior', display_name: 'Junior',    level: 1, ...T[1], color: '#66BB6A', description: 'Entry-level' },
        { name: 'mid',    display_name: 'Mid-Level', level: 2, ...T[2], color: '#42A5F5', description: 'Independent contributor' },
        { name: 'senior', display_name: 'Senior',    level: 3, ...T[3], color: '#AB47BC', description: 'Expert level' },
        { name: 'lead',   display_name: 'Lead',      level: 4, ...T[4], color: '#FF7043', description: 'Team lead' },
    ],
};

async function seedPaymentBrackets(): Promise<SeedSummary> {
    logger.startTimer('payment-brackets');

    const roles = await prisma.job_roles.findMany({ where: { is_active: true }, orderBy: { name: 'asc' } });
    logger.processing(`Seeding payment brackets for ${roles.length} active job roles...`);

    let created = 0;
    let updated = 0;

    for (const role of roles) {
        const category = (role.category || '').toLowerCase();
        const tiers = TIERS[category] ?? TIERS._default;
        const roleLabel = role.display_name || role.name;

        for (const tier of tiers) {
            const displayName = `${tier.display_name} ${roleLabel}`;
            const existing = await prisma.payment_brackets.findUnique({
                where: { job_role_id_name: { job_role_id: role.id, name: tier.name } },
            });

            if (existing) {
                await prisma.payment_brackets.update({
                    where: { job_role_id_name: { job_role_id: role.id, name: tier.name } },
                    data: { hourly_rate: tier.hourly_rate, day_rate: tier.day_rate, overtime_rate: tier.overtime_rate, level: tier.level, display_name: displayName, description: tier.description, color: tier.color },
                });
                updated++;
                logger.created(`"${displayName}" — ${tier.hourly_rate.toFixed(2)}/hr (updated)`, undefined, 'verbose');
            } else {
                await prisma.payment_brackets.create({ data: { job_role_id: role.id, name: tier.name, display_name: displayName, level: tier.level, hourly_rate: tier.hourly_rate, day_rate: tier.day_rate, overtime_rate: tier.overtime_rate, description: tier.description, color: tier.color, is_active: true } });
                created++;
                logger.created(`"${displayName}" — ${tier.hourly_rate.toFixed(2)}/hr`, undefined, 'verbose');
            }
        }
    }

    const total = roles.reduce((sum, r) => sum + (TIERS[(r.category || '').toLowerCase()] ?? TIERS._default).length, 0);
    logger.smartSummary('Payment brackets', created, updated, total);
    logger.endTimer('payment-brackets', 'Payment brackets');
    return { created, updated, skipped: 0, total };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT CLAUSES  (brand-scoped — silently skips if no brands exist yet)
// ─────────────────────────────────────────────────────────────────────────────
function getDefaultClauses(code: string) {
    const common = [
        {
            name: 'Payment Terms', description: 'Clauses related to deposits, payment schedules, and refund policies.', order_index: 0,
            clauses: [
                { title: 'Booking Deposit',  body: 'A non-refundable booking deposit of 25% of the total fee is required to secure the date. The remaining balance is due no later than 14 days before the event date.', clause_type: 'STANDARD', order_index: 0 },
                { title: 'Late Payment',     body: 'Invoices not paid within the agreed payment terms will incur a late payment fee of 2% per month on the outstanding balance.', clause_type: 'STANDARD', order_index: 1 },
                { title: 'Instalment Plan',  body: 'The total fee may be paid in equal monthly instalments, with the final payment due no later than 14 days before the event. A payment schedule will be provided upon booking.', clause_type: 'EXTRA', order_index: 2 },
            ],
        },
        {
            name: 'Cancellation & Rescheduling', description: 'Terms for cancellation notices and rescheduling fees.', order_index: 1,
            clauses: [
                { title: 'Cancellation by Client',   body: 'If the Client cancels more than 90 days before the event, the booking deposit is forfeited. Cancellations within 90 days of the event will incur a charge of 50% of the total fee. Cancellations within 30 days will incur the full fee.', clause_type: 'STANDARD', order_index: 0 },
                { title: 'Cancellation by Provider', body: 'In the unlikely event that the Provider must cancel, all payments received will be refunded in full. The Provider will make reasonable efforts to recommend a suitable replacement.', clause_type: 'STANDARD', order_index: 1 },
                { title: 'Rescheduling',             body: 'One date change is permitted without charge if requested at least 60 days before the original event date, subject to availability. Additional changes may incur an administrative fee.', clause_type: 'EXTRA', order_index: 2 },
            ],
        },
        {
            name: 'Scope of Work', description: 'Defines what is included in the agreed service.', order_index: 2,
            clauses: [
                { title: 'Services Provided',       body: 'The Provider will deliver the services as outlined in the accompanying proposal or package description. Any additional services requested after signing must be agreed in writing and may incur additional charges.', clause_type: 'STANDARD', order_index: 0 },
                { title: 'Timeline & Deliverables', body: 'The Provider will deliver the final product(s) within the timeframe specified in the proposal. The Client acknowledges that timelines are estimates and may vary depending on project complexity.', clause_type: 'STANDARD', order_index: 1 },
            ],
        },
        {
            name: 'Liability & Insurance', description: 'Limitations of liability and insurance provisions.', order_index: 3,
            clauses: [
                { title: 'Limitation of Liability', body: "The Provider's total liability under this agreement shall not exceed the total fee paid by the Client. The Provider shall not be liable for any indirect, incidental, or consequential damages.", clause_type: 'STANDARD', order_index: 0 },
                { title: 'Professional Indemnity',  body: 'The Provider maintains professional indemnity insurance and public liability insurance adequate for the scope of work. Copies of insurance certificates are available upon request.', clause_type: 'EXTRA', order_index: 1 },
            ],
        },
        {
            name: 'Intellectual Property', description: 'Ownership and usage rights for creative work.', order_index: 4,
            clauses: [
                { title: 'Copyright & Ownership',      body: 'All creative work produced under this agreement remains the intellectual property of the Provider. The Client is granted a non-exclusive, perpetual licence to use the deliverables for personal, non-commercial purposes unless otherwise agreed.', clause_type: 'STANDARD', order_index: 0 },
                { title: 'Portfolio & Marketing Use',   body: 'The Provider reserves the right to use images, footage, or work samples from this project for portfolio, marketing, and social media purposes unless the Client opts out in writing.', clause_type: 'STANDARD', order_index: 1 },
                { title: 'Commercial Licence',          body: 'A commercial use licence may be purchased separately, granting the Client rights to use deliverables in advertising, resale, or other commercial activities.', clause_type: 'EXTRA', order_index: 2 },
            ],
        },
        {
            name: 'Force Majeure', description: 'Provisions for events outside reasonable control.', order_index: 5,
            clauses: [
                { title: 'Force Majeure', body: 'Neither party shall be held liable for failure to perform obligations under this agreement due to circumstances beyond their reasonable control, including but not limited to natural disasters, pandemics, government restrictions, or severe weather. Both parties agree to negotiate in good faith to reschedule or adjust the services.', clause_type: 'STANDARD', order_index: 0 },
            ],
        },
        {
            name: 'Confidentiality', description: 'Data protection and privacy obligations.', order_index: 6,
            clauses: [
                { title: 'Confidentiality', body: 'Both parties agree to keep confidential any personal or business information shared during the course of this agreement. This obligation survives termination of this agreement.', clause_type: 'STANDARD', order_index: 0 },
            ],
        },
        {
            name: 'General Provisions', description: 'Dispute resolution, governing law, and other standard terms.', order_index: 7,
            clauses: [
                { title: 'Entire Agreement', body: 'This contract, together with the accompanying proposal or package description, constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements.', clause_type: 'STANDARD', order_index: 0 },
                { title: 'Amendments',       body: 'Any amendments to this agreement must be made in writing and signed by both parties.', clause_type: 'STANDARD', order_index: 1 },
            ],
        },
    ];

    if (code === 'GB') {
        common[7].clauses.push({ title: 'Governing Law', body: 'This agreement shall be governed by and construed in accordance with the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.', clause_type: 'STANDARD', order_index: 2 });
        common[6].clauses.push({ title: 'Data Protection (UK GDPR)', body: 'The Provider will process personal data in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018. Personal data will only be used for purposes related to this agreement and will not be shared with third parties without consent.', clause_type: 'STANDARD', order_index: 1 });
    } else if (code === 'US') {
        common[7].clauses.push({ title: 'Governing Law',      body: 'This agreement shall be governed by and construed in accordance with the laws of the State in which the Provider is registered, without regard to its conflict of law provisions.', clause_type: 'STANDARD', order_index: 2 });
        common[7].clauses.push({ title: 'Dispute Resolution', body: 'Any disputes arising under this agreement shall first be resolved through mediation. If mediation fails, disputes shall be resolved by binding arbitration in accordance with the rules of the American Arbitration Association.', clause_type: 'EXTRA', order_index: 3 });
    } else {
        common[7].clauses.push({ title: 'Governing Law', body: 'This agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which the Provider operates.', clause_type: 'STANDARD', order_index: 2 });
    }
    return common;
}

async function seedContractClauses(countryCode = 'GB'): Promise<SeedSummary> {
    logger.startTimer('contract-clauses');
    logger.processing('Seeding default contract clauses...');

    const brands = await prisma.brands.findMany({ where: { is_active: true } });
    if (brands.length === 0) {
        logger.info('No active brands found — skipping contract clauses (run brand seeds first)', 'normal');
        return { created: 0, updated: 0, skipped: 0, total: 0 };
    }

    let created = 0;
    let skipped = 0;

    for (const brand of brands) {
        const existing = await prisma.contract_clause_categories.count({ where: { brand_id: brand.id } });
        if (existing > 0) {
            logger.skipped(`Brand "${brand.name}"`, `already has ${existing} clause categories`);
            skipped++;
            continue;
        }

        const defaults = getDefaultClauses(countryCode);
        for (const cat of defaults) {
            const created_cat = await prisma.contract_clause_categories.create({
                data: { brand_id: brand.id, name: cat.name, description: cat.description, order_index: cat.order_index, country_code: countryCode, is_default: true },
            });
            for (const clause of cat.clauses) {
                await prisma.contract_clauses.create({
                    data: { brand_id: brand.id, category_id: created_cat.id, title: clause.title, body: clause.body, clause_type: clause.clause_type, country_code: countryCode, is_default: true, order_index: clause.order_index },
                });
                created++;
            }
        }
        logger.created(`Contract clauses for "${brand.name}"`);
    }

    logger.smartSummary('Contract clauses', created, 0, created + skipped);
    logger.endTimer('contract-clauses', 'Contract clauses');
    return { created, updated: 0, skipped, total: created + skipped };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
async function main(db: PrismaClient): Promise<SeedSummary> {
    prisma = db;
    logger.sectionHeader('System Finance');
    logger.startTimer('system-finance');

    const s1 = await seedPaymentBrackets();
    logger.sectionDivider('Contract Clauses');
    const s2 = await seedContractClauses();

    const total = sumSummaries(s1, s2);
    logger.success(`System Finance done — Created: ${total.created}, Updated: ${total.updated}`);
    logger.endTimer('system-finance', 'System Finance');
    return total;
}

export default main;
