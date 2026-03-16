/**
 * Update clause body text to use dynamic policy variables instead of hardcoded values.
 * Run from packages/backend: node scripts/update-clause-policy-vars.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const UPDATES = [
  {
    title: 'Booking Deposit',
    body: 'A non-refundable booking deposit of {{payment.deposit_amount}} is required to secure the date. Payment is due upon signing this agreement via {{brand.payment_method}}. The remaining balance is due no later than {{payment.final_balance_timing}} ({{event.date_short}}).\n\nPayment Schedule: {{payment.schedule_summary}}\n\nPayment Details:\n{{brand.bank_name}}\nAccount Name: {{brand.bank_account_name}}\nSort Code: {{brand.bank_sort_code}}\nAccount Number: {{brand.bank_account_number}}',
  },
  {
    title: 'Late Payment',
    body: 'Invoices not paid within {{brand.payment_terms}} of the due date will incur a late payment fee of {{brand.late_fee_percent}} per month on the outstanding balance.',
  },
  {
    title: 'Instalment Plan',
    body: 'The total fee of {{estimate.total}} may be paid in {{payment.instalment_count}} instalments as outlined in the payment schedule, with the final payment due no later than {{payment.final_balance_timing}}. A payment schedule will be provided upon booking.',
  },
  {
    title: 'Cancellation by Client',
    body: 'If {{client.full_name}} cancels more than {{brand.cancellation_tier1_days}} days before the event ({{event.date}}), the booking deposit is forfeited. Cancellations within {{brand.cancellation_tier1_days}} days of the event will incur a charge of {{brand.cancellation_tier1_percent}} of the total fee ({{estimate.total}}). Cancellations within {{brand.cancellation_tier2_days}} days will incur the full fee.',
  },
];

async function main() {
  console.log('Updating clause body text with policy variables...\n');
  let updated = 0;
  let skipped = 0;

  for (const { title, body } of UPDATES) {
    const clauses = await prisma.contract_clauses.findMany({ where: { title } });
    for (const clause of clauses) {
      if (clause.body === body) {
        console.log(`  ⏭  "${title}" (id=${clause.id}) — already up to date`);
        skipped++;
        continue;
      }
      await prisma.contract_clauses.update({ where: { id: clause.id }, data: { body } });
      console.log(`  ✅ "${title}" (id=${clause.id}) — updated`);
      updated++;
    }
  }

  console.log(`\nDone: ${updated} updated, ${skipped} already current.`);
}

main()
  .catch((e) => { console.error('Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
