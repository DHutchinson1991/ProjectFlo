/**
 * Backfill: ensure every brand-scoped Wedding PackageTemplate has an
 * Officiant SubjectRole linked via PackageTemplateSubject, so newly-created
 * wedding packages include Officiant by default alongside Bride/Groom/etc.
 *
 * Idempotent — safe to re-run.
 *
 * Usage:
 *   pnpm --filter backend exec tsx scripts/backfill-wedding-officiant.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.packageTemplate.findMany({
    where: { event_category: 'Wedding', brand_id: { not: null } },
    include: { subjects: { include: { subject_role: true } } },
  });

  let created = 0;
  let skipped = 0;

  for (const template of templates) {
    const brandId = template.brand_id!;
    const alreadyLinked = template.subjects.some(
      (s) => s.subject_role?.role_name?.toLowerCase() === 'officiant',
    );
    if (alreadyLinked) {
      skipped++;
      console.log(`[skip] template=${template.id} brand=${brandId} already has Officiant`);
      continue;
    }

    const role = await prisma.subjectRole.upsert({
      where: { brand_id_role_name: { brand_id: brandId, role_name: 'Officiant' } },
      create: {
        brand_id: brandId,
        role_name: 'Officiant',
        description: 'Officiant or registrar',
        is_group: false,
        never_group: true,
        order_index: 13,
      },
      update: { is_group: false, never_group: true },
    });

    const maxOrder = template.subjects.reduce(
      (m, s) => Math.max(m, s.order_index ?? 0),
      -1,
    );
    const nextOrder = maxOrder + 1;

    await prisma.packageTemplateSubject.upsert({
      where: {
        package_template_id_order_index: {
          package_template_id: template.id,
          order_index: nextOrder,
        },
      },
      create: {
        package_template_id: template.id,
        name: role.role_name,
        subject_role_id: role.id,
        order_index: nextOrder,
      },
      update: { name: role.role_name, subject_role_id: role.id },
    });

    console.log(`[ok]   template=${template.id} brand=${brandId} linked Officiant (order=${nextOrder})`);
    created++;
  }

  console.log(`\nDone. linked=${created} skipped=${skipped} total=${templates.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
