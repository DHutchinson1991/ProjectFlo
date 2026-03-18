/**
 * migrate-na-template-questions.js
 *
 * Migrates ALL existing needs assessment templates to include the new
 * contact-role, partner-name, and per-location questions added in the
 * March 2026 update.
 *
 * Changes applied per template:
 *   1. Rename  venue_details → ceremony_location (prompt + field_key updated)
 *   2. Add     contact_role        (after contact_phone, in 'contact' category)
 *   3. Add     partner_name        (after contact_role,  in 'contact' category)
 *   4. Add     bridal_prep_location (after ceremony_location, in 'event' category)
 *   5. Add     groom_prep_location  (after bridal_prep_location)
 *   6. Add     reception_location   (after groom_prep_location)
 *   7. Renumber all questions sequentially (order_index 1, 2, 3 …)
 *
 * Already-present field_keys are skipped so re-running is safe.
 *
 * Usage (from packages/backend):
 *   node scripts/migrate-na-template-questions.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─── New question definitions ────────────────────────────────────────────────
// insertAfter: the field_key of the question this should be placed immediately after.
// If that key is not found the question is appended at the end of its category group.

const NEW_QUESTIONS = [
  {
    field_key: 'contact_role',
    insertAfter: 'contact_phone',
    payload: {
      prompt: 'Your role in the wedding',
      field_type: 'select',
      required: false,
      options: { values: ['Bride', 'Groom', 'Partner', 'Prefer not to say'] },
      help_text: 'This helps us personalise your experience.',
      category: 'contact',
    },
  },
  {
    field_key: 'partner_name',
    insertAfter: 'contact_role',
    payload: {
      prompt: "Your partner's name",
      field_type: 'text',
      required: false,
      help_text: 'Leave blank if you prefer not to say or are still deciding.',
      category: 'contact',
    },
  },
  {
    field_key: 'bridal_prep_location',
    insertAfter: 'ceremony_location',
    payload: {
      prompt: 'Bridal preparation venue',
      field_type: 'text',
      required: false,
      help_text: 'e.g. hotel, home — leave blank if unknown.',
      category: 'event',
    },
  },
  {
    field_key: 'groom_prep_location',
    insertAfter: 'bridal_prep_location',
    payload: {
      prompt: 'Groom / partner preparation venue',
      field_type: 'text',
      required: false,
      help_text: 'Leave blank if unknown or prefer not to say.',
      category: 'event',
    },
  },
  {
    field_key: 'reception_location',
    insertAfter: 'groom_prep_location',
    payload: {
      prompt: 'Reception venue',
      field_type: 'text',
      required: false,
      help_text: 'Leave blank if same as ceremony or TBC.',
      category: 'event',
    },
  },
];

// ─── Per-template migration ───────────────────────────────────────────────────

async function migrateTemplate(template) {
  console.log(`\n  Template: "${template.name}" (ID: ${template.id})`);

  // Sort questions by current order_index
  const sorted = [...template.questions].sort((a, b) => a.order_index - b.order_index);
  const existingKeys = new Set(sorted.map(q => q.field_key));

  // ── Step 1: Rename venue_details → ceremony_location ────────────────────
  const venueQ = sorted.find(q => q.field_key === 'venue_details');
  if (venueQ && !existingKeys.has('ceremony_location')) {
    await prisma.needs_assessment_questions.update({
      where: { id: venueQ.id },
      data: {
        field_key: 'ceremony_location',
        prompt: 'Ceremony venue name',
        help_text: 'Where is your ceremony being held? Leave blank if TBC.',
      },
    });
    venueQ.field_key = 'ceremony_location';
    venueQ.prompt = 'Ceremony venue name';
    existingKeys.delete('venue_details');
    existingKeys.add('ceremony_location');
    console.log('    ✓ Renamed venue_details → ceremony_location');
  } else if (existingKeys.has('ceremony_location')) {
    console.log('    ⏭  ceremony_location already exists');
  }

  // Work on a mutable copy of the sorted list.
  // New entries are marked with _isNew so we can tell creates from updates.
  const working = sorted.map(q => ({ ...q, _isNew: false }));

  // ── Step 2: Insert missing questions at the right positions ─────────────
  for (const def of NEW_QUESTIONS) {
    if (existingKeys.has(def.field_key)) {
      console.log(`    ⏭  ${def.field_key} already exists`);
      continue;
    }

    const insertAfterIdx = working.findIndex(q => q.field_key === def.insertAfter);
    const position = insertAfterIdx >= 0 ? insertAfterIdx + 1 : working.length;

    working.splice(position, 0, {
      field_key: def.field_key,
      _isNew: true,
      _payload: def.payload,
    });

    existingKeys.add(def.field_key);
    console.log(`    + Inserting ${def.field_key} after ${def.insertAfter ?? 'end'}`);
  }

  // ── Step 3: Renumber all questions sequentially ──────────────────────────
  const ops = [];
  for (let i = 0; i < working.length; i++) {
    const q = working[i];
    const newIndex = i + 1;

    if (q._isNew) {
      ops.push(
        prisma.needs_assessment_questions.create({
          data: {
            template_id: template.id,
            order_index: newIndex,
            field_key: q.field_key,
            ...q._payload,
            options: q._payload.options ?? undefined,
            help_text: q._payload.help_text ?? undefined,
          },
        }),
      );
    } else if (q.order_index !== newIndex) {
      ops.push(
        prisma.needs_assessment_questions.update({
          where: { id: q.id },
          data: { order_index: newIndex },
        }),
      );
    }
  }

  if (ops.length > 0) {
    await Promise.all(ops);
  }

  const added = working.filter(q => q._isNew).length;
  console.log(`    ✓ Done (${working.length} questions total, ${added} added)`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log(' NA Template Migration — contact role + locations   ');
  console.log('═══════════════════════════════════════════════════\n');

  const templates = await prisma.needs_assessment_templates.findMany({
    include: { questions: true },
    orderBy: { id: 'asc' },
  });

  if (templates.length === 0) {
    console.log('No templates found. Nothing to migrate.');
    return;
  }

  console.log(`Found ${templates.length} template(s):`);

  for (const template of templates) {
    await migrateTemplate(template);
  }

  console.log('\n✅  Migration complete!\n');
}

main()
  .catch(err => {
    console.error('\n❌  Migration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
