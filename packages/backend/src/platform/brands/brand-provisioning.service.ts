import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { provisionBirthday } from "./provisioning/provision-birthday";
import { provisionEngagement } from "./provisioning/provision-engagement";
import { provisionWedding } from "./provisioning/provision-wedding";

export type ServiceTypeKey = "WEDDING" | "BIRTHDAY" | "ENGAGEMENT";

@Injectable()
export class BrandProvisioningService {
  private readonly logger = new Logger(BrandProvisioningService.name);

  constructor(private readonly prisma: PrismaService) {}

  async provision(brandId: number, serviceTypes: ServiceTypeKey[]): Promise<string[]> {
    const provisioned: string[] = [];

    for (const key of serviceTypes) {
      const existing = await this.prisma.packageTemplate.findFirst({
        where: {
          brand_id: brandId,
          event_category: this.getEventCategory(key),
        },
      });

      if (existing) {
        await this.ensurePackageSet(brandId, key);
        this.logger.log(`Brand ${brandId}: ${key} already provisioned, ensured set`);
        continue;
      }

      switch (key) {
        case "WEDDING":
          await provisionWedding(this.prisma, brandId);
          break;
        case "BIRTHDAY":
          await provisionBirthday(this.prisma, brandId);
          break;
        case "ENGAGEMENT":
          await provisionEngagement(this.prisma, brandId);
          break;
      }

      provisioned.push(key);
      this.logger.log(`Brand ${brandId}: ${key} provisioned`);
    }

    return provisioned;
  }

  private async ensurePackageSet(brandId: number, key: ServiceTypeKey) {
    const name = this.getEventCategory(key);

    const setCount = await this.prisma.package_sets.count({
      where: { brand_id: brandId, event_category: name },
    });

    if (setCount > 0) return;

    const set = await this.prisma.package_sets.create({
      data: {
        brand_id: brandId,
        name: `${name} Packages`,
        description: `Our ${name.toLowerCase()} packages`,
        emoji: this.getEventCategoryEmoji(key),
        event_category: name,
        is_active: true,
        order_index: 0,
      },
    });

    await this.prisma.$transaction([
      this.prisma.package_set_slots.create({
        data: { package_set_id: set.id, slot_label: "Budget", order_index: 0 },
      }),
      this.prisma.package_set_slots.create({
        data: { package_set_id: set.id, slot_label: "Basic", order_index: 1 },
      }),
      this.prisma.package_set_slots.create({
        data: { package_set_id: set.id, slot_label: "Standard", order_index: 2 },
      }),
      this.prisma.package_set_slots.create({
        data: { package_set_id: set.id, slot_label: "Premium", order_index: 3 },
      }),
    ]);
  }

  private getEventCategory(key: ServiceTypeKey): string {
    const names: Record<ServiceTypeKey, string> = {
      WEDDING: "Wedding",
      BIRTHDAY: "Birthday",
      ENGAGEMENT: "Engagement",
    };
    return names[key];
  }

  private getEventCategoryEmoji(key: ServiceTypeKey): string {
    const emojis: Record<ServiceTypeKey, string> = {
      WEDDING: "\uD83D\uDC92",
      BIRTHDAY: "\uD83C\uDF82",
      ENGAGEMENT: "\uD83D\uDC8D",
    };
    return emojis[key];
  }
}
