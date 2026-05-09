import { PrismaClient } from '@prisma/client';
import { buildMomentSubjectSeeds, normalizeSeedKey } from '../prisma/seeds/moonrise-wedding-blueprint-templates.seed';

const prisma = new PrismaClient();

async function main() {
  const templateKeys = ['standard-uk-wedding', 'punjabi-3day-wedding', 'catholic-ceremony-17'];

  const blueprints = await prisma.dayBlueprint.findMany({
    where: {
      key: { in: templateKeys },
      brand: { name: 'Moonrise Films' },
    },
    include: {
      versions: {
        include: {
          subject_roles: { include: { subject_role: true }, orderBy: { order_index: 'asc' } },
          space_slots: { orderBy: { order_index: 'asc' } },
          days: {
            include: {
              activities: {
                include: {
                  activity_locations: true,
                  moments: {
                    include: {
                      actions: true,
                      placements: true,
                    },
                    orderBy: { order_index: 'asc' },
                  },
                },
                orderBy: { order_index: 'asc' },
              },
            },
            orderBy: { order_index: 'asc' },
          },
        },
      },
    },
  });

  let actionsCreated = 0;
  let placementsCreated = 0;
  let momentsTouched = 0;

  for (const blueprint of blueprints) {
    for (const version of blueprint.versions) {
      const roleIdsByKey = new Map<string, number>();
      for (const link of version.subject_roles) {
        const key = normalizeSeedKey(link.subject_role?.role_name ?? `role_${link.subject_role_id}`);
        roleIdsByKey.set(key, link.subject_role_id);
        if (key === 'maid_of_honour') roleIdsByKey.set('maid_of_honor', link.subject_role_id);
      }

      for (const day of version.days) {
        for (const activity of day.activities) {
          const primaryLocationRoleId = activity.activity_locations.find((row) => row.is_primary)?.day_blueprint_location_role_id
            ?? activity.activity_locations[0]?.day_blueprint_location_role_id
            ?? null;
          const activitySlot = primaryLocationRoleId
            ? version.space_slots.find((slot) => slot.day_blueprint_location_role_id === primaryLocationRoleId) ?? null
            : version.space_slots[0] ?? null;

          for (const moment of activity.moments) {
            const assignments = buildMomentSubjectSeeds(activity.name, moment.name)
              .map((assignment) => ({
                assignment,
                subjectRoleId: roleIdsByKey.get(assignment.roleKey),
              }))
              .filter((row): row is { assignment: ReturnType<typeof buildMomentSubjectSeeds>[number]; subjectRoleId: number } => row.subjectRoleId != null);

            if (assignments.length === 0) continue;

            let touched = false;
            const existingActionRoleIds = new Set((moment.actions ?? []).map((row) => row.subject_role_id));
            const existingPlacementRoleIds = new Set((moment.placements ?? []).map((row) => row.subject_role_id));

            for (const row of assignments) {
              if (!existingActionRoleIds.has(row.subjectRoleId)) {
                await prisma.dayBlueprintMomentAction.create({
                  data: {
                    day_blueprint_moment_id: moment.id,
                    subject_role_id: row.subjectRoleId,
                    action_text: row.assignment.actionText,
                    notes: row.assignment.notes,
                    order_index: existingActionRoleIds.size,
                  },
                });
                existingActionRoleIds.add(row.subjectRoleId);
                actionsCreated += 1;
                touched = true;
              }

              if (activitySlot && !existingPlacementRoleIds.has(row.subjectRoleId)) {
                await prisma.dayBlueprintMomentPlacement.create({
                  data: {
                    day_blueprint_moment_id: moment.id,
                    day_blueprint_space_slot_id: activitySlot.id,
                    subject_role_id: row.subjectRoleId,
                    order_index: existingPlacementRoleIds.size,
                  },
                });
                existingPlacementRoleIds.add(row.subjectRoleId);
                placementsCreated += 1;
                touched = true;
              }
            }

            if (touched) momentsTouched += 1;
          }
        }
      }
    }
  }

  console.log(`[BackfillWeddingTemplateMomentSubjects] Moments touched: ${momentsTouched}`);
  console.log(`[BackfillWeddingTemplateMomentSubjects] Actions created: ${actionsCreated}`);
  console.log(`[BackfillWeddingTemplateMomentSubjects] Placements created: ${placementsCreated}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
