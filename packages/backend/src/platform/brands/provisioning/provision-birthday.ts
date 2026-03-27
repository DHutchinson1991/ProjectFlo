import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../platform/prisma/prisma.service";

const DEFAULT_SLOT_TIERS = ["Budget", "Basic", "Standard", "Premium"] as const;

export async function provisionBirthday(prisma: PrismaService, brandId: number) {
  await prisma.$transaction(async (tx) => {
    const birthdayRolesData = [
      { role_name: "Birthday Person", order_index: 0, is_core: true, never_group: true, is_group: false },
      { role_name: "Partner", order_index: 1, is_core: true, never_group: true, is_group: false },
      { role_name: "Parents", order_index: 2, is_core: false, never_group: false, is_group: true },
      { role_name: "Close Friends", order_index: 3, is_core: false, never_group: false, is_group: true },
      { role_name: "Guests", order_index: 4, is_core: false, never_group: false, is_group: true },
    ];

    const birthdaySubjectRoles: Array<{ id: number; is_core: boolean }> = [];
    for (const roleData of birthdayRolesData) {
      const role = await tx.subjectRole.create({ data: { brand_id: brandId, ...roleData } });
      birthdaySubjectRoles.push({ id: role.id, is_core: roleData.is_core });
    }

    const days = await createBirthdayDayTemplates(tx, brandId);

    const eventType = await tx.eventType.create({
      data: {
        brand_id: brandId,
        name: "Birthday",
        description: "Birthday party and celebration coverage",
        icon: "🎂",
        color: "#f59e0b",
        default_duration_hours: 5,
        default_start_time: "16:00",
        typical_guest_count: 50,
        is_system: false,
        is_active: true,
        order_index: 1,
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

    for (let index = 0; index < birthdaySubjectRoles.length; index += 1) {
      await tx.eventTypeSubject.create({
        data: {
          event_type_id: eventType.id,
          subject_role_id: birthdaySubjectRoles[index].id,
          order_index: index,
          is_default: birthdaySubjectRoles[index].is_core,
        },
      });
    }

    const category = await tx.service_package_categories.create({
      data: {
        brand_id: brandId,
        name: "Birthday",
        description: "Birthday videography packages",
        order_index: 1,
        is_active: true,
        event_type_id: eventType.id,
      },
    });

    const birthdaySet = await tx.package_sets.create({
      data: {
        brand_id: brandId,
        name: "Birthday Packages",
        description: "Our birthday celebration packages",
        emoji: "🎂",
        category_id: category.id,
        event_type_id: eventType.id,
        is_active: true,
        order_index: 1,
      },
    });

    for (let index = 0; index < DEFAULT_SLOT_TIERS.length; index += 1) {
      await tx.package_set_slots.create({
        data: {
          package_set_id: birthdaySet.id,
          slot_label: DEFAULT_SLOT_TIERS[index],
          order_index: index,
        },
      });
    }
  });
}

async function createBirthdayDayTemplates(tx: Prisma.TransactionClient, brandId: number) {
  const templates = [
    {
      name: "Birthday Day",
      description: "The main birthday party — arrival, cake, speeches, dancing",
      order_index: 0,
      presets: [
        { name: "Guest Arrival & Drinks", color: "#f97316", default_start_time: "16:00", default_duration_minutes: 45, order_index: 0, moments: [
          { name: "First Guests Arrive", duration_seconds: 600, is_key_moment: false, order_index: 0 },
          { name: "Welcome Drinks", duration_seconds: 1200, is_key_moment: false, order_index: 1 },
          { name: "Mingling", duration_seconds: 1800, is_key_moment: false, order_index: 2 },
        ] },
        { name: "Cake & Candles", color: "#ec4899", default_start_time: "18:00", default_duration_minutes: 20, order_index: 1, moments: [
          { name: "Candle Lighting", duration_seconds: 300, is_key_moment: false, order_index: 0 },
          { name: "Happy Birthday Singing", duration_seconds: 120, is_key_moment: true, order_index: 1 },
          { name: "Blowing Out Candles", duration_seconds: 60, is_key_moment: true, order_index: 2 },
          { name: "Cake Cutting", duration_seconds: 300, is_key_moment: true, order_index: 3 },
        ] },
        { name: "Speeches & Toasts", color: "#8b5cf6", default_start_time: "18:30", default_duration_minutes: 30, order_index: 2, moments: [
          { name: "Welcome Speech", duration_seconds: 300, is_key_moment: false, order_index: 0 },
          { name: "Heartfelt Messages", duration_seconds: 900, is_key_moment: true, order_index: 1 },
          { name: "Birthday Tribute", duration_seconds: 600, is_key_moment: true, order_index: 2 },
        ] },
        { name: "Emotional Reactions", color: "#14b8a6", default_start_time: "18:30", default_duration_minutes: 20, order_index: 3, moments: [
          { name: "Genuine Reactions", duration_seconds: 600, is_key_moment: true, order_index: 0 },
          { name: "Hugs & Congratulations", duration_seconds: 600, is_key_moment: true, order_index: 1 },
        ] },
        { name: "Group Dancing", color: "#d946ef", default_start_time: "19:30", default_duration_minutes: 60, order_index: 4, moments: [
          { name: "First Dance Moment", duration_seconds: 300, is_key_moment: true, order_index: 0 },
          { name: "Floor Fills", duration_seconds: 1800, is_key_moment: true, order_index: 1 },
          { name: "Candid Dance Moments", duration_seconds: 900, is_key_moment: false, order_index: 2 },
        ] },
        { name: "Candid Party Coverage", color: "#0ea5e9", default_start_time: "17:00", default_duration_minutes: 90, order_index: 5, moments: [
          { name: "Table Candids", duration_seconds: 1200, is_key_moment: false, order_index: 0 },
          { name: "Friend Group Shots", duration_seconds: 900, is_key_moment: false, order_index: 1 },
          { name: "General Atmosphere", duration_seconds: 1800, is_key_moment: false, order_index: 2 },
        ] },
        { name: "Departure & Send Off", color: "#10b981", default_start_time: "22:00", default_duration_minutes: 20, order_index: 6, moments: [
          { name: "End of Night", duration_seconds: 600, is_key_moment: false, order_index: 0 },
          { name: "Final Group Photo", duration_seconds: 300, is_key_moment: true, order_index: 1 },
          { name: "Birthday Person Departs", duration_seconds: 300, is_key_moment: true, order_index: 2 },
        ] },
      ],
    },
    {
      name: "Pre-Party Setup",
      description: "Venue decoration and supplier arrivals before guests arrive",
      order_index: 1,
      presets: [
        { name: "Venue Decoration", color: "#f59e0b", default_start_time: "12:00", default_duration_minutes: 90, order_index: 0, moments: [
          { name: "Setting Up", duration_seconds: 1800, is_key_moment: false, order_index: 0 },
          { name: "Venue Transformation", duration_seconds: 1200, is_key_moment: true, order_index: 1 },
        ] },
        { name: "Supplier Arrivals", color: "#06b6d4", default_start_time: "14:00", default_duration_minutes: 60, order_index: 1, moments: [
          { name: "Florist / Decorator Arrives", duration_seconds: 600, is_key_moment: false, order_index: 0 },
          { name: "Catering Setup", duration_seconds: 1800, is_key_moment: false, order_index: 1 },
          { name: "Lighting Check", duration_seconds: 600, is_key_moment: false, order_index: 2 },
        ] },
        { name: "Final Walk-Through", color: "#8b5cf6", default_start_time: "15:30", default_duration_minutes: 30, order_index: 2, moments: [
          { name: "Venue Inspection", duration_seconds: 900, is_key_moment: true, order_index: 0 },
          { name: "Table Settings Shot", duration_seconds: 600, is_key_moment: false, order_index: 1 },
        ] },
      ],
    },
    {
      name: "After Party",
      description: "Continuation with close friends after the main event",
      order_index: 2,
      presets: [
        { name: "Small Group Candids", color: "#10b981", default_start_time: "22:30", default_duration_minutes: 45, order_index: 0, moments: [
          { name: "Close Circle Winding Down", duration_seconds: 1200, is_key_moment: false, order_index: 0 },
          { name: "Candid Conversations", duration_seconds: 900, is_key_moment: false, order_index: 1 },
        ] },
        { name: "Final Moments", color: "#ec4899", default_start_time: "23:30", default_duration_minutes: 20, order_index: 1, moments: [
          { name: "Last Shots", duration_seconds: 600, is_key_moment: false, order_index: 0 },
          { name: "Farewell Hugs", duration_seconds: 300, is_key_moment: true, order_index: 1 },
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
