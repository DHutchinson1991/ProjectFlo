import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { provisionBirthday } from "./provisioning/provision-birthday";
import { provisionEngagement } from "./provisioning/provision-engagement";
import { provisionWedding } from "./provisioning/provision-wedding";

export type ServiceTypeKey = "WEDDING" | "BIRTHDAY" | "ENGAGEMENT";

@Injectable()
export class BrandProvisioningService {
  private readonly logger = new Logger(BrandProvisioningService.name);

  constructor(private readonly prisma: PrismaService) { }

  async provision(brandId: number, serviceTypes: ServiceTypeKey[]): Promise<string[]> {
    const provisioned: string[] = [];

    for (const key of serviceTypes) {
      const existingEventType = await this.prisma.eventType.findFirst({
        where: {
          brand_id: brandId,
          name: this.getEventTypeName(key),
        },
      });

      if (existingEventType) {
        await this.ensurePackageCategoryAndSet(brandId, existingEventType.id, key);
        this.logger.log(`Brand ${brandId}: ${key} already provisioned, ensured category/set`);
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

  private async ensurePackageCategoryAndSet(
    brandId: number,
    eventTypeId: number,
    key: ServiceTypeKey,
  ) {
    const name = this.getEventTypeName(key);

    let category = await this.prisma.service_package_categories.findFirst({
      where: {
        brand_id: brandId,
        event_type_id: eventTypeId,
      },
    });

    if (!category) {
      category = await this.prisma.service_package_categories.findFirst({
        where: {
          brand_id: brandId,
          name: { contains: name, mode: "insensitive" },
          event_type_id: null,
        },
      });

      if (category) {
        await this.prisma.service_package_categories.update({
          where: { id: category.id },
          data: { event_type_id: eventTypeId },
        });
      } else {
        category = await this.prisma.service_package_categories.create({
          data: {
            brand_id: brandId,
            name,
            description: `${name} packages`,
            order_index: 0,
            is_active: true,
            event_type_id: eventTypeId,
          },
        });
      }
    }

    const setCount = await this.prisma.package_sets.count({
      where: {
        brand_id: brandId,
        event_type_id: eventTypeId,
      },
    });

    if (setCount === 0) {
      const set = await this.prisma.package_sets.create({
        data: {
          brand_id: brandId,
          name: `${name} Packages`,
          description: `Our ${name.toLowerCase()} packages`,
          emoji: this.getEventTypeEmoji(key),
          category_id: category.id,
          event_type_id: eventTypeId,
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
  }

  private getEventTypeName(key: ServiceTypeKey) {
    const names: Record<ServiceTypeKey, string> = {
      WEDDING: "Wedding",
      BIRTHDAY: "Birthday",
      ENGAGEMENT: "Engagement",
    };

    return names[key];
  }

  private getEventTypeEmoji(key: ServiceTypeKey) {
    const emojis: Record<ServiceTypeKey, string> = {
      WEDDING: "💒",
      BIRTHDAY: "🎂",
      ENGAGEMENT: "💍",
    };

    return emojis[key];
  }
}
