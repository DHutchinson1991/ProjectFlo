import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../platform/prisma/prisma.service";

const DEFAULT_SLOT_TIERS = ["Budget", "Basic", "Standard", "Premium"] as const;

export async function provisionEngagement(prisma: PrismaService, brandId: number) {
  await prisma.$transaction(async (tx) => {
    const engagementRolesData = [
      { role_name: "Partner 1", order_index: 0, is_core: true, never_group: true, is_group: false },
      { role_name: "Partner 2", order_index: 1, is_core: true, never_group: true, is_group: false },
      { role_name: "Friends", order_index: 2, is_core: false, never_group: false, is_group: true },
      { role_name: "Family", order_index: 3, is_core: false, never_group: false, is_group: true },
    ];

    const engagementSubjectRoles: Array<{ id: number; is_core: boolean }> = [];
    for (const roleData of engagementRolesData) {
      const role = await tx.subjectRole.create({ data: { brand_id: brandId, ...roleData } });
      engagementSubjectRoles.push({ id: role.id, is_core: roleData.is_core });
    }

    const days = await createEngagementDayTemplates(tx, brandId);

    const eventType = await tx.eventType.create({
      data: {
        brand_id: brandId,
        name: "Engagement",
        description: "Engagement shoots and celebration coverage",
        icon: "💍",
        color: "#8b5cf6",
        default_duration_hours: 4,
        default_start_time: "14:00",
        typical_guest_count: 30,
        is_system: false,
        is_active: true,
        order_index: 2,
      },
    });

    for (let index = 0; index < days.length; index += 1) {
      await tx.eventTypeDay.create({
        data: {
          event_type_id: eventType.id,
          event_day_template_id: days[index].id,
          order_index: index,
          is_default: index === 0,
        },
      });
    }

    for (let index = 0; index < engagementSubjectRoles.length; index += 1) {
      await tx.eventTypeSubject.create({
        data: {
          event_type_id: eventType.id,
          subject_role_id: engagementSubjectRoles[index].id,
          order_index: index,
          is_default: engagementSubjectRoles[index].is_core,
        },
      });
    }

    const category = await tx.service_package_categories.create({
      data: {
        brand_id: brandId,
        name: "Engagement",
        description: "Engagement videography packages",
        order_index: 2,
        is_active: true,
        event_type_id: eventType.id,
      },
    });

    const engagementSet = await tx.package_sets.create({
      data: {
        brand_id: brandId,
        name: "Engagement Packages",
        description: "Our engagement photography & videography packages",
        emoji: "💍",
        category_id: category.id,
        event_type_id: eventType.id,
        is_active: true,
        order_index: 2,
      },
    });

    for (let index = 0; index < DEFAULT_SLOT_TIERS.length; index += 1) {
      await tx.package_set_slots.create({
        data: {
          package_set_id: engagementSet.id,
          slot_label: DEFAULT_SLOT_TIERS[index],
          order_index: index,
        },
      });
    }
  });
}

async function createEngagementDayTemplates(tx: Prisma.TransactionClient, brandId: number) {
  const templates = [
    {
      name: "Engagement Portrait Session",
      description: "Couple portrait session — lifestyle, golden hour, detail shots",
      order_index: 0,
      presets: [
        { name: "Location Portraits", color: "#0ea5e9", default_start_time: "15:00", default_duration_minutes: 60, order_index: 0, moments: [
          { name: "Arrival & Settling In", duration_seconds: 300, is_key_moment: false, order_index: 0 },
          { name: "Formal Poses", duration_seconds: 900, is_key_moment: false, order_index: 1 },
          { name: "Walking Together", duration_seconds: 600, is_key_moment: true, order_index: 2 },
          { name: "Close-Up Portraits", duration_seconds: 900, is_key_moment: true, order_index: 3 },
        ] },
        { name: "Lifestyle Footage", color: "#10b981", default_start_time: "16:00", default_duration_minutes: 45, order_index: 1, moments: [
          { name: "Casual Candids", duration_seconds: 900, is_key_moment: false, order_index: 0 },
          { name: "Activity Together", duration_seconds: 900, is_key_moment: true, order_index: 1 },
          { name: "Laughter", duration_seconds: 600, is_key_moment: true, order_index: 2 },
        ] },
        { name: "Interview / Story", color: "#8b5cf6", default_start_time: "16:45", default_duration_minutes: 30, order_index: 2, moments: [
          { name: "How We Met", duration_seconds: 600, is_key_moment: true, order_index: 0 },
          { name: "Proposal Story", duration_seconds: 600, is_key_moment: true, order_index: 1 },
          { name: "Future Plans", duration_seconds: 480, is_key_moment: true, order_index: 2 },
        ] },
        { name: "Golden Hour", color: "#f59e0b", default_start_time: "17:30", default_duration_minutes: 45, order_index: 3, moments: [
          { name: "Warm Light Portraits", duration_seconds: 1200, is_key_moment: true, order_index: 0 },
          { name: "Silhouette Shots", duration_seconds: 600, is_key_moment: true, order_index: 1 },
          { name: "Final Moments", duration_seconds: 600, is_key_moment: false, order_index: 2 },
        ] },
        { name: "Ring & Detail Shots", color: "#ec4899", default_start_time: "15:30", default_duration_minutes: 20, order_index: 4, moments: [
          { name: "Ring Close-Ups", duration_seconds: 300, is_key_moment: true, order_index: 0 },
          { name: "Outfit Details", duration_seconds: 300, is_key_moment: false, order_index: 1 },
          { name: "Personal Items", duration_seconds: 300, is_key_moment: false, order_index: 2 },
        ] },
      ],
    },
    {
      name: "Engagement Party",
      description: "Celebration gathering with friends and family",
      order_index: 1,
      presets: [
        { name: "Guest Arrival & Drinks", color: "#f97316", default_start_time: "17:00", default_duration_minutes: 45, order_index: 0, moments: [
          { name: "Welcome Atmosphere", duration_seconds: 600, is_key_moment: false, order_index: 0 },
          { name: "Couple Greets Guests", duration_seconds: 1200, is_key_moment: true, order_index: 1 },
        ] },
        { name: "Couple Entrance", color: "#8b5cf6", default_start_time: "18:00", default_duration_minutes: 15, order_index: 1, moments: [
          { name: "Formal Announcement", duration_seconds: 120, is_key_moment: true, order_index: 0 },
          { name: "Crowd Reaction", duration_seconds: 300, is_key_moment: true, order_index: 1 },
        ] },
        { name: "Speeches & Toasts", color: "#a855f7", default_start_time: "18:30", default_duration_minutes: 30, order_index: 2, moments: [
          { name: "Parents & Friends Toast", duration_seconds: 900, is_key_moment: true, order_index: 0 },
          { name: "Couple Speech", duration_seconds: 600, is_key_moment: true, order_index: 1 },
        ] },
        { name: "Dinner & Candids", color: "#14b8a6", default_start_time: "19:00", default_duration_minutes: 90, order_index: 3, moments: [
          { name: "Food Service", duration_seconds: 2400, is_key_moment: false, order_index: 0 },
          { name: "Table Candids", duration_seconds: 900, is_key_moment: false, order_index: 1 },
          { name: "Genuine Laughter", duration_seconds: 600, is_key_moment: true, order_index: 2 },
        ] },
        { name: "Dancing & Send Off", color: "#d946ef", default_start_time: "21:00", default_duration_minutes: 45, order_index: 4, moments: [
          { name: "Casual Dancing", duration_seconds: 1800, is_key_moment: false, order_index: 0 },
          { name: "Final Embrace", duration_seconds: 300, is_key_moment: true, order_index: 1 },
        ] },
      ],
    },
    {
      name: "Proposal Re-enactment",
      description: "Creative re-capture of the proposal moment",
      order_index: 2,
      presets: [
        { name: "Setting the Scene", color: "#0ea5e9", default_start_time: "14:00", default_duration_minutes: 30, order_index: 0, moments: [
          { name: "Location Staging", duration_seconds: 900, is_key_moment: false, order_index: 0 },
          { name: "Nervous Anticipation", duration_seconds: 600, is_key_moment: true, order_index: 1 },
        ] },
        { name: "The Proposal", color: "#ec4899", default_start_time: "14:30", default_duration_minutes: 15, order_index: 1, moments: [
          { name: "Getting Down on One Knee", duration_seconds: 60, is_key_moment: true, order_index: 0 },
          { name: "Ring Reveal", duration_seconds: 120, is_key_moment: true, order_index: 1 },
          { name: "Reaction", duration_seconds: 300, is_key_moment: true, order_index: 2 },
        ] },
        { name: "Celebration Shots", color: "#f59e0b", default_start_time: "14:45", default_duration_minutes: 30, order_index: 2, moments: [
          { name: "Couple Embracing", duration_seconds: 600, is_key_moment: true, order_index: 0 },
          { name: "Happy Tears", duration_seconds: 300, is_key_moment: true, order_index: 1 },
          { name: "Ring On Finger", duration_seconds: 300, is_key_moment: true, order_index: 2 },
        ] },
      ],
    },
  ];

  const created: Array<{ id: number }> = [];
  for (const template of templates) {
    const { presets, ...dayData } = template;
    const existing = await tx.eventDay.findFirst({ where: { brand_id: brandId, name: dayData.name } });
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
