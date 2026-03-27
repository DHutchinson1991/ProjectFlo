import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../platform/prisma/prisma.service";
import { WEDDING_ROLES_DATA, WEDDING_DAY_TEMPLATES, WeddingDayTemplate } from "./wedding-data";

const DEFAULT_SLOT_TIERS = ["Budget", "Basic", "Standard", "Premium"] as const;

export async function provisionWedding(prisma: PrismaService, brandId: number) {
  await prisma.$transaction(async (tx) => {
    const weddingSubjectRoles: Array<{ id: number; is_core: boolean }> = [];
    for (const roleData of WEDDING_ROLES_DATA) {
      const role = await tx.subjectRole.create({ data: { brand_id: brandId, ...roleData } });
      weddingSubjectRoles.push({ id: role.id, is_core: roleData.is_core });
    }

    const days = await createWeddingDayTemplates(tx, brandId);

    const eventType = await tx.eventType.create({
      data: {
        brand_id: brandId,
        name: "Wedding",
        description: "Full wedding day coverage",
        icon: "💒",
        color: "#ec4899",
        default_duration_hours: 10,
        default_start_time: "08:00",
        typical_guest_count: 150,
        is_system: false,
        is_active: true,
        order_index: 0,
      },
    });

    for (let index = 0; index < days.length; index += 1) {
      await tx.eventTypeDay.create({
        data: {
          event_type_id: eventType.id,
          event_day_template_id: days[index].id,
          order_index: index,
          is_default: index < 3,
        },
      });
    }

    for (let index = 0; index < weddingSubjectRoles.length; index += 1) {
      await tx.eventTypeSubject.create({
        data: {
          event_type_id: eventType.id,
          subject_role_id: weddingSubjectRoles[index].id,
          order_index: index,
          is_default: weddingSubjectRoles[index].is_core,
        },
      });
    }

    const category = await tx.service_package_categories.create({
      data: {
        brand_id: brandId,
        name: "Wedding",
        description: "Wedding videography packages",
        order_index: 0,
        is_active: true,
        event_type_id: eventType.id,
      },
    });

    const weddingSet = await tx.package_sets.create({
      data: {
        brand_id: brandId,
        name: "Wedding Packages",
        description: "Our wedding videography packages",
        emoji: "💒",
        category_id: category.id,
        event_type_id: eventType.id,
        is_active: true,
        order_index: 0,
      },
    });

    for (let index = 0; index < DEFAULT_SLOT_TIERS.length; index += 1) {
      await tx.package_set_slots.create({
        data: {
          package_set_id: weddingSet.id,
          slot_label: DEFAULT_SLOT_TIERS[index],
          order_index: index,
        },
      });
    }
  });
}

async function createWeddingDayTemplates(tx: Prisma.TransactionClient, brandId: number) {
  const created: Array<{ id: number }> = [];
  for (const template of WEDDING_DAY_TEMPLATES) {
    const { presets, ...dayData } = template;
    const existing = await tx.eventDay.findFirst({
      where: { brand_id: brandId, name: dayData.name },
    });
    if (existing) {
      created.push(existing);
      continue;
    }

    const day = await tx.eventDay.create({
      data: {
        brand_id: brandId,
        name: dayData.name,
        description: dayData.description,
        order_index: dayData.order_index,
        is_active: true,
        activity_presets: {
          create: presets.map(({ moments, ...preset }) => ({
            ...preset,
            is_active: true,
            moments: { create: moments },
          })),
        },
      },
    });
    created.push(day);
  }

  return created;
}
