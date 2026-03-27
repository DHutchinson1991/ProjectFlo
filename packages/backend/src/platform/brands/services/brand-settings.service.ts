import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../platform/prisma/prisma.service";
import {
  MEETING_SETTING_KEYS,
  WELCOME_SETTING_KEYS,
} from "../constants/brand-settings.constants";
import { CreateBrandSettingDto } from "../dto/create-brand-setting.dto";
import { UpdateBrandSettingDto } from "../dto/update-brand-setting.dto";

@Injectable()
export class BrandSettingsService {
  constructor(private readonly prisma: PrismaService) { }

  async createSetting(brandId: number, createSettingDto: CreateBrandSettingDto) {
    await this.ensureBrandExists(brandId);

    return this.prisma.brand_settings.create({
      data: {
        ...createSettingDto,
        brand_id: brandId,
      },
    });
  }

  async getSettings(brandId: number, category?: string) {
    await this.ensureBrandExists(brandId);

    return this.prisma.brand_settings.findMany({
      where: {
        brand_id: brandId,
        is_active: true,
        ...(category ? { category } : {}),
      },
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });
  }

  async getSetting(brandId: number, key: string) {
    await this.ensureBrandExists(brandId);

    const setting = await this.prisma.brand_settings.findUnique({
      where: {
        brand_id_key: {
          brand_id: brandId,
          key,
        },
      },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found for brand ${brandId}`);
    }

    return setting;
  }

  async updateSetting(brandId: number, key: string, updateSettingDto: UpdateBrandSettingDto) {
    await this.getSetting(brandId, key);

    return this.prisma.brand_settings.update({
      where: {
        brand_id_key: {
          brand_id: brandId,
          key,
        },
      },
      data: updateSettingDto,
    });
  }

  async deleteSetting(brandId: number, key: string) {
    await this.getSetting(brandId, key);

    return this.prisma.brand_settings.delete({
      where: {
        brand_id_key: {
          brand_id: brandId,
          key,
        },
      },
    });
  }

  async getMeetingSettings(brandId: number) {
    await this.ensureBrandExists(brandId);

    const rows = await this.prisma.brand_settings.findMany({
      where: { brand_id: brandId, category: "meetings" },
    });
    const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));

    return {
      duration_minutes: map[MEETING_SETTING_KEYS[0]] ? parseInt(map[MEETING_SETTING_KEYS[0]], 10) : 20,
      description: map[MEETING_SETTING_KEYS[1]] ?? "",
      available_days: map[MEETING_SETTING_KEYS[2]] ? JSON.parse(map[MEETING_SETTING_KEYS[2]]) : [1, 2, 3, 4, 5],
      available_from: map[MEETING_SETTING_KEYS[3]] ?? "09:00",
      available_to: map[MEETING_SETTING_KEYS[4]] ?? "17:00",
      google_meet_link: map[MEETING_SETTING_KEYS[5]] ?? "",
    };
  }

  async upsertMeetingSettings(
    brandId: number,
    data: {
      duration_minutes?: number;
      description?: string;
      available_days?: number[];
      available_from?: string;
      available_to?: string;
      google_meet_link?: string;
    },
  ) {
    await this.ensureBrandExists(brandId);

    const entries: Array<{ key: string; value: string }> = [
      ...(data.duration_minutes !== undefined
        ? [{ key: MEETING_SETTING_KEYS[0], value: String(data.duration_minutes) }]
        : []),
      ...(data.description !== undefined
        ? [{ key: MEETING_SETTING_KEYS[1], value: data.description }]
        : []),
      ...(data.available_days !== undefined
        ? [{ key: MEETING_SETTING_KEYS[2], value: JSON.stringify(data.available_days) }]
        : []),
      ...(data.available_from !== undefined
        ? [{ key: MEETING_SETTING_KEYS[3], value: data.available_from }]
        : []),
      ...(data.available_to !== undefined
        ? [{ key: MEETING_SETTING_KEYS[4], value: data.available_to }]
        : []),
      ...(data.google_meet_link !== undefined
        ? [{ key: MEETING_SETTING_KEYS[5], value: data.google_meet_link }]
        : []),
    ];

    await this.upsertCategoryEntries(brandId, "meetings", entries);

    return this.getMeetingSettings(brandId);
  }

  async getWelcomeSettings(brandId: number) {
    await this.ensureBrandExists(brandId);

    const rows = await this.prisma.brand_settings.findMany({
      where: { brand_id: brandId, category: "welcome" },
    });
    const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));

    const startNumber = map[WELCOME_SETTING_KEYS[6]]
      ? parseInt(map[WELCOME_SETTING_KEYS[6]], 10)
      : 0;
    const liveCount = await this.prisma.projects.count({
      where: {
        brand_id: brandId,
        phase: "Delivery",
      },
    });

    return {
      headline: map[WELCOME_SETTING_KEYS[0]] ?? "",
      subtitle: map[WELCOME_SETTING_KEYS[1]] ?? "",
      cta_text: map[WELCOME_SETTING_KEYS[2]] ?? "Plan My Day",
      trust_badges: map[WELCOME_SETTING_KEYS[3]]
        ? JSON.parse(map[WELCOME_SETTING_KEYS[3]])
        : [
            { icon: "✨", text: "Personalised quote" },
            { icon: "📅", text: "Same-day response" },
            { icon: "🎬", text: "No commitment" },
          ],
      social_proof_text: map[WELCOME_SETTING_KEYS[4]] ?? "happy customers",
      social_proof_count: startNumber + liveCount,
      social_proof_start: startNumber,
      social_links: map[WELCOME_SETTING_KEYS[7]] ? JSON.parse(map[WELCOME_SETTING_KEYS[7]]) : [],
      testimonials: map[WELCOME_SETTING_KEYS[8]] ? JSON.parse(map[WELCOME_SETTING_KEYS[8]]) : [],
      time_estimate: map[WELCOME_SETTING_KEYS[9]] ?? "~2 min",
    };
  }

  async upsertWelcomeSettings(
    brandId: number,
    data: {
      headline?: string;
      subtitle?: string;
      cta_text?: string;
      trust_badges?: Array<{ icon: string; text: string }>;
      social_proof_text?: string;
      social_proof_start?: number;
      social_links?: Array<{ platform: string; url: string }>;
      testimonials?: Array<{ name: string; text: string; rating: number; image_url: string }>;
      time_estimate?: string;
    },
  ) {
    await this.ensureBrandExists(brandId);

    const entries: Array<{ key: string; value: string }> = [
      ...(data.headline !== undefined ? [{ key: WELCOME_SETTING_KEYS[0], value: data.headline }] : []),
      ...(data.subtitle !== undefined ? [{ key: WELCOME_SETTING_KEYS[1], value: data.subtitle }] : []),
      ...(data.cta_text !== undefined ? [{ key: WELCOME_SETTING_KEYS[2], value: data.cta_text }] : []),
      ...(data.trust_badges !== undefined
        ? [{ key: WELCOME_SETTING_KEYS[3], value: JSON.stringify(data.trust_badges) }]
        : []),
      ...(data.social_proof_text !== undefined
        ? [{ key: WELCOME_SETTING_KEYS[4], value: data.social_proof_text }]
        : []),
      ...(data.social_proof_start !== undefined
        ? [{ key: WELCOME_SETTING_KEYS[6], value: String(data.social_proof_start) }]
        : []),
      ...(data.social_links !== undefined
        ? [{ key: WELCOME_SETTING_KEYS[7], value: JSON.stringify(data.social_links) }]
        : []),
      ...(data.testimonials !== undefined
        ? [{ key: WELCOME_SETTING_KEYS[8], value: JSON.stringify(data.testimonials) }]
        : []),
      ...(data.time_estimate !== undefined
        ? [{ key: WELCOME_SETTING_KEYS[9], value: data.time_estimate }]
        : []),
    ];

    await this.upsertCategoryEntries(brandId, "welcome", entries);

    return this.getWelcomeSettings(brandId);
  }

  private async ensureBrandExists(brandId: number) {
    const brand = await this.prisma.brands.findUnique({ where: { id: brandId }, select: { id: true } });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${brandId} not found`);
    }
  }

  private async upsertCategoryEntries(
    brandId: number,
    category: string,
    entries: Array<{ key: string; value: string }>,
  ) {
    for (const entry of entries) {
      await this.prisma.brand_settings.upsert({
        where: { brand_id_key: { brand_id: brandId, key: entry.key } },
        create: { brand_id: brandId, key: entry.key, value: entry.value, category },
        update: { value: entry.value },
      });
    }
  }
}
