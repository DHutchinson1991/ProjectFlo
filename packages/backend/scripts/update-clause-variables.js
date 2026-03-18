/**
 * Update existing clause body text to include template variables.
 * Matches clauses by title within their category and updates the body.
 * Run from packages/backend: node scripts/update-clause-variables.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Map of category name -> { clause title -> new body }
const CLAUSE_UPDATES = {
  'Payment Terms': {
    'Booking Deposit':
      'A non-refundable booking deposit is required to secure the date. Payment is due upon signing this agreement via {{brand.payment_method}}. The remaining balance is due no later than 14 days before the event date ({{event.date_short}}).\n\nPayment Schedule: {{payment.schedule_summary}}\n\nPayment Details:\n{{brand.bank_name}}\nAccount Name: {{brand.bank_account_name}}\nSort Code: {{brand.bank_sort_code}}\nAccount Number: {{brand.bank_account_number}}',
    'Late Payment':
      'Invoices not paid within {{brand.payment_terms}} of the due date will incur a late payment fee of 2% per month on the outstanding balance.',
    'Instalment Plan':
      'The total fee of {{estimate.total}} may be paid in equal monthly instalments, with the final payment due no later than 14 days before the event. A payment schedule will be provided upon booking.',
  },
  'Cancellation & Rescheduling': {
    'Cancellation by Client':
      'If {{client.full_name}} cancels more than 90 days before the event ({{event.date}}), the booking deposit is forfeited. Cancellations within 90 days of the event will incur a charge of 50% of the total fee ({{estimate.total}}). Cancellations within 30 days will incur the full fee.',
    'Cancellation by Provider':
      'In the unlikely event that {{brand.name}} must cancel, all payments received will be refunded in full. {{brand.name}} will make reasonable efforts to recommend a suitable replacement.',
  },
  'Scope of Work': {
    'Services Provided':
      '{{brand.name}} will deliver the services as outlined in the accompanying proposal ({{estimate.number}}) and package description ({{package.name}}). Any additional services requested after signing must be agreed in writing and may incur additional charges.',
    'Timeline & Deliverables':
      '{{brand.name}} will deliver the final product(s) within the timeframe specified in the proposal. {{client.full_name}} acknowledges that timelines are estimates and may vary depending on project complexity.\n\nEvent Date: {{event.date}}\nVenue: {{event.venue}}\nFilms: {{films.list}}',
  },
  'Liability & Insurance': {
    'Limitation of Liability':
      "{{brand.name}}'s total liability under this agreement shall not exceed the total fee paid by {{client.full_name}} ({{estimate.total}}). {{brand.name}} shall not be liable for any indirect, incidental, or consequential damages.",
    'Professional Indemnity':
      '{{brand.name}} maintains professional indemnity insurance and public liability insurance adequate for the scope of work. Copies of insurance certificates are available upon request.',
  },
  'Intellectual Property': {
    'Copyright & Ownership':
      'All creative work produced under this agreement remains the intellectual property of {{brand.name}}. {{client.full_name}} is granted a non-exclusive, perpetual licence to use the deliverables for personal, non-commercial purposes unless otherwise agreed.',
    'Portfolio & Marketing Use':
      '{{brand.name}} reserves the right to use images, footage, or work samples from this project for portfolio, marketing, and social media purposes unless {{client.full_name}} opts out in writing.',
  },
  'General Provisions': {
    'Entire Agreement':
      'This contract, together with estimate {{estimate.number}} and the {{package.name}} package description, constitutes the entire agreement between {{client.full_name}} and {{brand.name}} and supersedes all prior negotiations, representations, or agreements.',
  },
  'Talent Release Form': {
    'Grant of Rights':
      'I, the undersigned ("Talent"), hereby grant {{brand.name}} and its assigns the irrevocable right and permission to use my name, likeness, image, voice, appearance, and performance (collectively "Likeness") in connection with the production titled "{{event.type}}" filmed on or around {{event.date}}. This grant includes the right to photograph, record, edit, modify, and reproduce my Likeness in any media now known or hereafter devised, throughout the world, in perpetuity.',
    'Compensation & Consideration':
      'Talent acknowledges that participation in this production is provided voluntarily or for the agreed compensation of {{estimate.total}}. Talent agrees that this consideration is adequate and sufficient for the rights granted herein.',
    'No Obligation to Use':
      "{{brand.name}} is under no obligation to use the Talent's Likeness or to produce, distribute, or otherwise exploit any production in which the Talent appears. No further compensation shall be due regardless of use or non-use.",
    'Release & Waiver of Claims':
      "Talent hereby releases, discharges, and holds harmless {{brand.name}}, its officers, employees, agents, and assigns from any and all claims, demands, or causes of action arising out of or in connection with the use of the Talent's Likeness, including but not limited to claims for defamation, invasion of privacy, right of publicity, or infringement of moral rights.",
  },
  'Location Release Agreement': {
    'Property Access & Permission':
      'The undersigned property owner/authorised representative ("Owner") hereby grants {{brand.name}} permission to enter and use the property located at {{event.venue}} (the "Property") for the purpose of filming, photographing, and recording in connection with a production on or around {{event.date}}.',
    'Filming Dates & Times':
      'Access to the Property is granted for the dates and times specified in the production schedule: {{event.days}}. Any additional time required must be agreed upon in writing between the parties. {{brand.name}} shall arrive for setup no earlier than the agreed start time and vacate the premises within 1 hour after the scheduled end time.',
    'Property Damage & Insurance':
      '{{brand.name}} shall exercise reasonable care while on the Property and shall be responsible for repairing or compensating the Owner for any damage to the Property caused directly by the production crew or equipment during the filming period. {{brand.name}} maintains public liability insurance adequate to cover any such damage.',
    'Usage Rights':
      'Owner grants {{brand.name}} the right to use all footage, photographs, and recordings made at the Property in any and all media now known or hereafter devised, throughout the world, in perpetuity. Owner waives any right to inspect or approve the manner in which the Property is depicted in the final production.',
    'Hold Harmless & Indemnification':
      'Owner agrees to hold harmless and indemnify {{brand.name}} from any claims or liabilities arising from the condition of the Property or pre-existing hazards, provided that {{brand.name}} is not negligent. {{brand.name}} shall hold harmless and indemnify the Owner from any claims arising directly from the filming activities.',
    'Restoration of Property':
      '{{brand.name}} agrees to restore the Property to substantially the same condition as it was prior to filming, normal wear and tear excepted. Any temporary modifications (furniture rearrangement, lighting adjustments, etc.) shall be reversed upon completion of the shoot.',
  },
};

async function main() {
  console.log('Updating clause body text with template variables...\n');

  // Get all categories with their clauses
  const categories = await prisma.contract_clause_categories.findMany({
    include: { clauses: true },
  });

  let updated = 0;
  let skipped = 0;

  for (const cat of categories) {
    const clauseMap = CLAUSE_UPDATES[cat.name];
    if (!clauseMap) continue;

    for (const clause of cat.clauses) {
      const newBody = clauseMap[clause.title];
      if (!newBody) continue;

      if (clause.body === newBody) {
        console.log(`  ⏭  "${clause.title}" — already up to date`);
        skipped++;
        continue;
      }

      await prisma.contract_clauses.update({
        where: { id: clause.id },
        data: { body: newBody },
      });
      console.log(`  ✅ "${clause.title}" — updated`);
      updated++;
    }
  }

  console.log(`\nDone: ${updated} updated, ${skipped} already current.`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
