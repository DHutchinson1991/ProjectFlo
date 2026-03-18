const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleResponses = [
  {
    contact_first_name: 'Jessica',
    contact_last_name: 'Miller',
    contact_email: 'jessica.miller@email.com',
    contact_phone: '+1 (555) 543-2109',
    wedding_date: '2026-02-22',
    venue_details: 'Sunset Bay Resort',
    priority_level: 'High',
    budget_range: '$6k-$8k',
    budget_flexible: 'Some flexibility',
    coverage_hours: '8-10 hours',
    deliverables: ['Highlight film', 'Full ceremony', 'Speeches'],
    add_ons: ['Second shooter'],
    decision_timeline: '1-2 weeks',
    booking_date: '2026-02-10',
    stakeholders: 'Bride, Groom, Mother of Bride',
    preferred_contact_method: 'Email',
    preferred_contact_time: 'Weekday evenings',
    notes: 'Looking for cinematic style.'
  },
  {
    contact_first_name: 'Ava',
    contact_last_name: 'Torres',
    contact_email: 'ava.torres@email.com',
    contact_phone: '+1 (555) 221-3388',
    wedding_date: '2026-05-12',
    venue_details: 'Riverside Hotel',
    priority_level: 'Medium',
    budget_range: '$4k-$6k',
    budget_flexible: 'Fixed',
    coverage_hours: '6-8 hours',
    deliverables: ['Highlight film', 'Social clips'],
    add_ons: ['Drone coverage'],
    decision_timeline: '1 month',
    booking_date: '2026-03-01',
    stakeholders: 'Bride, Groom',
    preferred_contact_method: 'Text',
    preferred_contact_time: 'Mornings',
    notes: 'Prefers warm tones.'
  },
  {
    contact_first_name: 'Noah',
    contact_last_name: 'Grant',
    contact_email: 'noah.grant@email.com',
    contact_phone: '+1 (555) 118-4499',
    wedding_date: '2026-08-19',
    venue_details: 'Hilltop Gardens',
    priority_level: 'Low',
    budget_range: '$2k-$4k',
    budget_flexible: 'Some flexibility',
    coverage_hours: '4-6 hours',
    deliverables: ['Highlight film'],
    add_ons: ['Same-day edit'],
    decision_timeline: 'Just exploring',
    booking_date: '2026-04-10',
    stakeholders: 'Planner, Couple',
    preferred_contact_method: 'Phone',
    preferred_contact_time: 'Afternoons',
    notes: 'Needs quote quickly.'
  },
  {
    contact_first_name: 'Sophia',
    contact_last_name: 'Reed',
    contact_email: 'sophia.reed@email.com',
    contact_phone: '+1 (555) 882-1100',
    wedding_date: '2026-11-02',
    venue_details: 'Oceanview Chapel',
    priority_level: 'High',
    budget_range: '$8k+',
    budget_flexible: 'Flexible',
    coverage_hours: 'Full day',
    deliverables: ['Highlight film', 'Raw footage', 'Social clips'],
    add_ons: ['Drone coverage', 'Live stream'],
    decision_timeline: 'ASAP',
    booking_date: '2026-02-20',
    stakeholders: 'Bride, Groom, Planner',
    preferred_contact_method: 'Zoom',
    preferred_contact_time: 'Weekends',
    notes: 'Luxury cinematic package.'
  },
  {
    contact_first_name: 'Liam',
    contact_last_name: 'Chen',
    contact_email: 'liam.chen@email.com',
    contact_phone: '+1 (555) 771-2201',
    wedding_date: '2026-09-15',
    venue_details: 'City Loft',
    priority_level: 'Medium',
    budget_range: '$4k-$6k',
    budget_flexible: 'Some flexibility',
    coverage_hours: '6-8 hours',
    deliverables: ['Highlight film', 'Speeches'],
    add_ons: [],
    decision_timeline: '1-2 weeks',
    booking_date: '2026-03-20',
    stakeholders: 'Bride, Groom',
    preferred_contact_method: 'Email',
    preferred_contact_time: 'Evenings',
    notes: 'Interested in documentary edit.'
  }
];

async function main() {
  const template = await prisma.needs_assessment_templates.findFirst({
    where: { is_active: true },
    include: { questions: true },
  });

  if (!template) {
    throw new Error('No active needs assessment template found.');
  }

  const inquiries = await prisma.inquiries.findMany({
    where: { archived_at: null },
    include: { contact: true },
    take: 3,
    orderBy: { id: 'desc' },
  });

  const brandId = template.brand_id;

  const submissions = [];

  for (let i = 0; i < sampleResponses.length; i += 1) {
    const response = sampleResponses[i];
    const inquiry = inquiries[i];

    submissions.push(
      prisma.needs_assessment_submissions.create({
        data: {
          brand_id: brandId,
          template_id: template.id,
          inquiry_id: inquiry?.id ?? null,
          contact_id: inquiry?.contact_id ?? null,
          status: inquiry ? 'linked' : 'submitted',
          responses: response,
        },
      })
    );
  }

  await prisma.$transaction(submissions);

  console.log('Seeded needs assessment submissions:', submissions.length);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
