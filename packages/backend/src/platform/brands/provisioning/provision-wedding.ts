import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../platform/prisma/prisma.service";
import { WEDDING_ROLES_DATA, WEDDING_DAY_TEMPLATES, WeddingDayTemplate } from "./wedding-data";

const DEFAULT_SLOT_TIERS = ["Budget", "Basic", "Standard", "Premium"] as const;

export async function provisionWedding(prisma: PrismaService, brandId: number) {
  await prisma.$transaction(async (tx) => {
    const weddingSubjectRoles: Array<{ id: number; role_name: string }> = [];
    for (const roleData of WEDDING_ROLES_DATA) {
      const role = await tx.subjectRole.upsert({
        where: {
          brand_id_role_name: {
            brand_id: brandId,
            role_name: roleData.role_name,
          },
        },
        create: { brand_id: brandId, ...roleData },
        update: {
          is_group: roleData.is_group,
          never_group: roleData.never_group,
          order_index: roleData.order_index,
        },
      });
      weddingSubjectRoles.push({ id: role.id, role_name: role.role_name });
    }

    const days = await createWeddingDayTemplates(tx, brandId);

    const template = await tx.packageTemplate.upsert({
      where: {
        brand_id_name: {
          brand_id: brandId,
          name: "Wedding",
        },
      },
      create: {
        brand_id: brandId,
        name: "Wedding",
        description: "Full wedding day coverage",
        icon: "\uD83D\uDC92",
        color: "#ec4899",
        event_category: "Wedding",
        total_duration_hours: 10,
        event_start_time: "08:00",
        typical_guest_count: 150,
        is_system_seeded: false,
        is_active: true,
        order_index: 0,
      },
      update: {
        description: "Full wedding day coverage",
        icon: "\uD83D\uDC92",
        color: "#ec4899",
        event_category: "Wedding",
        total_duration_hours: 10,
        event_start_time: "08:00",
        typical_guest_count: 150,
        is_system_seeded: false,
        is_active: true,
        order_index: 0,
      },
    });

    for (let index = 0; index < days.length; index += 1) {
      await tx.packageTemplateDay.upsert({
        where: {
          package_template_id_event_day_template_id: {
            package_template_id: template.id,
            event_day_template_id: days[index].id,
          },
        },
        create: {
          package_template_id: template.id,
          event_day_template_id: days[index].id,
          order_index: index,
          is_default: index < 3,
        },
        update: {
          order_index: index,
          is_default: index < 3,
        },
      });
    }

    for (let index = 0; index < weddingSubjectRoles.length; index += 1) {
      await tx.packageTemplateSubject.upsert({
        where: {
          package_template_id_order_index: {
            package_template_id: template.id,
            order_index: index,
          },
        },
        create: {
          package_template_id: template.id,
          name: weddingSubjectRoles[index].role_name,
          subject_role_id: weddingSubjectRoles[index].id,
          order_index: index,
        },
        update: {
          name: weddingSubjectRoles[index].role_name,
          subject_role_id: weddingSubjectRoles[index].id,
        },
      });
    }

    const weddingSet = await tx.package_sets.upsert({
      where: {
        brand_id_name: {
          brand_id: brandId,
          name: "Wedding Packages",
        },
      },
      create: {
        brand_id: brandId,
        name: "Wedding Packages",
        description: "Our wedding videography packages",
        emoji: "\uD83D\uDC92",
        event_category: "Wedding",
        is_active: true,
        order_index: 0,
      },
      update: {
        description: "Our wedding videography packages",
        emoji: "\uD83D\uDC92",
        event_category: "Wedding",
        is_active: true,
        order_index: 0,
      },
    });

    for (let index = 0; index < DEFAULT_SLOT_TIERS.length; index += 1) {
      const existingSlot = await tx.package_set_slots.findFirst({
        where: {
          package_set_id: weddingSet.id,
          slot_label: DEFAULT_SLOT_TIERS[index],
        },
      });

      if (existingSlot) {
        await tx.package_set_slots.update({
          where: { id: existingSlot.id },
          data: { order_index: index },
        });
        continue;
      }

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
