/**
 * Seed default contract clauses for all brands.
 *
 * Usage:
 *   cd packages/backend
 *   node scripts/seed-contract-clauses.js
 *
 * Pass optional country code: node scripts/seed-contract-clauses.js US
 * Defaults to "GB".
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const countryCode = process.argv[2] || 'GB';

function getDefaultClauses(code) {
  const common = [
    {
      name: 'Payment Terms',
      description: 'Clauses related to deposits, payment schedules, and refund policies.',
      order_index: 0,
      clauses: [
        { title: 'Booking Deposit', body: 'A non-refundable booking deposit of 25% of the total fee is required to secure the date. The remaining balance is due no later than 14 days before the event date.', clause_type: 'STANDARD', order_index: 0 },
        { title: 'Late Payment', body: 'Invoices not paid within the agreed payment terms will incur a late payment fee of 2% per month on the outstanding balance.', clause_type: 'STANDARD', order_index: 1 },
        { title: 'Instalment Plan', body: 'The total fee may be paid in equal monthly instalments, with the final payment due no later than 14 days before the event. A payment schedule will be provided upon booking.', clause_type: 'EXTRA', order_index: 2 },
      ],
    },
    {
      name: 'Cancellation & Rescheduling',
      description: 'Terms for cancellation notices and rescheduling fees.',
      order_index: 1,
      clauses: [
        { title: 'Cancellation by Client', body: 'If the Client cancels more than 90 days before the event, the booking deposit is forfeited. Cancellations within 90 days of the event will incur a charge of 50% of the total fee. Cancellations within 30 days will incur the full fee.', clause_type: 'STANDARD', order_index: 0 },
        { title: 'Cancellation by Provider', body: 'In the unlikely event that the Provider must cancel, all payments received will be refunded in full. The Provider will make reasonable efforts to recommend a suitable replacement.', clause_type: 'STANDARD', order_index: 1 },
        { title: 'Rescheduling', body: 'One date change is permitted without charge if requested at least 60 days before the original event date, subject to availability. Additional changes may incur an administrative fee.', clause_type: 'EXTRA', order_index: 2 },
      ],
    },
    {
      name: 'Scope of Work',
      description: 'Defines what is included in the agreed service.',
      order_index: 2,
      clauses: [
        { title: 'Services Provided', body: 'The Provider will deliver the services as outlined in the accompanying proposal or package description. Any additional services requested after signing must be agreed in writing and may incur additional charges.', clause_type: 'STANDARD', order_index: 0 },
        { title: 'Timeline & Deliverables', body: 'The Provider will deliver the final product(s) within the timeframe specified in the proposal. The Client acknowledges that timelines are estimates and may vary depending on project complexity.', clause_type: 'STANDARD', order_index: 1 },
      ],
    },
    {
      name: 'Liability & Insurance',
      description: 'Limitations of liability and insurance provisions.',
      order_index: 3,
      clauses: [
        { title: 'Limitation of Liability', body: "The Provider's total liability under this agreement shall not exceed the total fee paid by the Client. The Provider shall not be liable for any indirect, incidental, or consequential damages.", clause_type: 'STANDARD', order_index: 0 },
        { title: 'Professional Indemnity', body: 'The Provider maintains professional indemnity insurance and public liability insurance adequate for the scope of work. Copies of insurance certificates are available upon request.', clause_type: 'EXTRA', order_index: 1 },
      ],
    },
    {
      name: 'Intellectual Property',
      description: 'Ownership and usage rights for creative work.',
      order_index: 4,
      clauses: [
        { title: 'Copyright & Ownership', body: 'All creative work produced under this agreement remains the intellectual property of the Provider. The Client is granted a non-exclusive, perpetual licence to use the deliverables for personal, non-commercial purposes unless otherwise agreed.', clause_type: 'STANDARD', order_index: 0 },
        { title: 'Portfolio & Marketing Use', body: 'The Provider reserves the right to use images, footage, or work samples from this project for portfolio, marketing, and social media purposes unless the Client opts out in writing.', clause_type: 'STANDARD', order_index: 1 },
        { title: 'Commercial Licence', body: 'A commercial use licence may be purchased separately, granting the Client rights to use deliverables in advertising, resale, or other commercial activities.', clause_type: 'EXTRA', order_index: 2 },
      ],
    },
    {
      name: 'Force Majeure',
      description: 'Provisions for events outside reasonable control.',
      order_index: 5,
      clauses: [
        { title: 'Force Majeure', body: 'Neither party shall be held liable for failure to perform obligations under this agreement due to circumstances beyond their reasonable control, including but not limited to natural disasters, pandemics, government restrictions, or severe weather. Both parties agree to negotiate in good faith to reschedule or adjust the services.', clause_type: 'STANDARD', order_index: 0 },
      ],
    },
    {
      name: 'Confidentiality',
      description: 'Data protection and privacy obligations.',
      order_index: 6,
      clauses: [
        { title: 'Confidentiality', body: 'Both parties agree to keep confidential any personal or business information shared during the course of this agreement. This obligation survives termination of this agreement.', clause_type: 'STANDARD', order_index: 0 },
      ],
    },
    {
      name: 'General Provisions',
      description: 'Dispute resolution, governing law, and other standard terms.',
      order_index: 7,
      clauses: [
        { title: 'Entire Agreement', body: 'This contract, together with the accompanying proposal or package description, constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements.', clause_type: 'STANDARD', order_index: 0 },
        { title: 'Amendments', body: 'Any amendments to this agreement must be made in writing and signed by both parties.', clause_type: 'STANDARD', order_index: 1 },
      ],
    },
  ];

  if (code === 'GB') {
    common[7].clauses.push({ title: 'Governing Law', body: 'This agreement shall be governed by and construed in accordance with the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.', clause_type: 'STANDARD', order_index: 2 });
    common[6].clauses.push({ title: 'Data Protection (UK GDPR)', body: 'The Provider will process personal data in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018. Personal data will only be used for purposes related to this agreement and will not be shared with third parties without consent.', clause_type: 'STANDARD', order_index: 1 });
  } else if (code === 'US') {
    common[7].clauses.push({ title: 'Governing Law', body: 'This agreement shall be governed by and construed in accordance with the laws of the State in which the Provider is registered, without regard to its conflict of law provisions.', clause_type: 'STANDARD', order_index: 2 });
    common[7].clauses.push({ title: 'Dispute Resolution', body: 'Any disputes arising under this agreement shall first be resolved through mediation. If mediation fails, disputes shall be resolved by binding arbitration in accordance with the rules of the American Arbitration Association.', clause_type: 'EXTRA', order_index: 3 });
  } else {
    common[7].clauses.push({ title: 'Governing Law', body: 'This agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which the Provider operates.', clause_type: 'STANDARD', order_index: 2 });
  }

  return common;
}

async function main() {
  console.log(`\n🔖 Seeding default contract clauses (country: ${countryCode})…\n`);

  const brands = await prisma.brands.findMany({ where: { is_active: true } });
  console.log(`Found ${brands.length} active brand(s).\n`);

  for (const brand of brands) {
    // Skip if this brand already has clause categories
    const existing = await prisma.contract_clause_categories.count({ where: { brand_id: brand.id } });
    if (existing > 0) {
      console.log(`  ⏭  Brand "${brand.name}" (${brand.id}) already has ${existing} categories — skipping.`);
      continue;
    }

    const defaults = getDefaultClauses(countryCode);
    let catCount = 0;
    let clauseCount = 0;

    for (const cat of defaults) {
      const created = await prisma.contract_clause_categories.create({
        data: {
          brand_id: brand.id,
          name: cat.name,
          description: cat.description,
          order_index: cat.order_index,
          country_code: countryCode,
          is_default: true,
        },
      });
      catCount++;

      for (const clause of cat.clauses) {
        await prisma.contract_clauses.create({
          data: {
            brand_id: brand.id,
            category_id: created.id,
            title: clause.title,
            body: clause.body,
            clause_type: clause.clause_type,
            country_code: countryCode,
            is_default: true,
            order_index: clause.order_index,
          },
        });
        clauseCount++;
      }
    }

    console.log(`  ✅ Brand "${brand.name}" (${brand.id}): ${catCount} categories, ${clauseCount} clauses.`);
  }

  console.log('\n✅ Done!\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
