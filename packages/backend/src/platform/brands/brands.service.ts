import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AddUserToBrandDto } from "./dto/add-user-to-brand.dto";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { CreateBrandSettingDto } from "./dto/create-brand-setting.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";
import { UpdateBrandSettingDto } from "./dto/update-brand-setting.dto";
import { BrandProvisioningService, ServiceTypeKey } from "./brand-provisioning.service";
import { BrandMembershipsService } from "./services/brand-memberships.service";
import { BrandSettingsService } from "./services/brand-settings.service";

@Injectable()
export class BrandsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly provisioning: BrandProvisioningService,
    private readonly membershipsService: BrandMembershipsService,
    private readonly settingsService: BrandSettingsService,
  ) { }

  async create(createBrandDto: CreateBrandDto) {
    return this.prisma.brands.create({
      data: createBrandDto,
    });
  }

  async findAll() {
    return this.prisma.brands.findMany({
      where: { is_active: true },
      include: {
        brand_memberships: {
          include: {
            user: {
              include: {
                contact: true,
              },
            },
          },
        },
        _count: {
          select: {
            projects: true,
            contacts: true,
            filmLibrary: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const brand = await this.prisma.brands.findUnique({
      where: { id },
      include: {
        brand_memberships: {
          include: {
            user: {
              include: {
                contact: true,
              },
            },
          },
        },
        brand_settings: true,
        _count: {
          select: {
            projects: true,
            contacts: true,
            filmLibrary: true,
          },
        },
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    const currentTypes = brand.service_types ?? [];
    const eventTypes = await this.prisma.eventType.findMany({
      where: { brand_id: id, is_active: true },
      select: { name: true },
    });
    const nameToKey: Record<string, string> = {
      Wedding: "WEDDING",
      Birthday: "BIRTHDAY",
      Engagement: "ENGAGEMENT",
    };
    const derivedKeys = eventTypes
      .map((eventType) => nameToKey[eventType.name])
      .filter((key): key is string => Boolean(key));
    const missingFromArray = derivedKeys.filter((key) => !currentTypes.includes(key));

    if (missingFromArray.length > 0) {
      const merged = [...currentTypes, ...missingFromArray];
      await this.prisma.brands.update({
        where: { id },
        data: { service_types: merged },
      });
      brand.service_types = merged;
    }

    return brand;
  }

  async update(id: number, updateBrandDto: UpdateBrandDto) {
    await this.findOne(id);

    const { service_types: newServiceTypes, ...rest } = updateBrandDto;

    const updated = await this.prisma.brands.update({
      where: { id },
      data: newServiceTypes !== undefined
        ? { ...rest, service_types: newServiceTypes }
        : rest,
    });

    if (newServiceTypes && newServiceTypes.length > 0) {
      await this.provisioning.provision(id, newServiceTypes as ServiceTypeKey[]);
    }

    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.brands.update({
      where: { id },
      data: { is_active: false },
    });
  }

  addUserToBrand(brandId: number, userId: number, addUserDto: AddUserToBrandDto) {
    return this.membershipsService.addUserToBrand(brandId, userId, addUserDto);
  }

  removeUserFromBrand(brandId: number, userId: number) {
    return this.membershipsService.removeUserFromBrand(brandId, userId);
  }

  getUserBrands(userId: number) {
    return this.membershipsService.getUserBrands(userId);
  }

  createSetting(brandId: number, createSettingDto: CreateBrandSettingDto) {
    return this.settingsService.createSetting(brandId, createSettingDto);
  }

  getSettings(brandId: number, category?: string) {
    return this.settingsService.getSettings(brandId, category);
  }

  getSetting(brandId: number, key: string) {
    return this.settingsService.getSetting(brandId, key);
  }

  updateSetting(brandId: number, key: string, updateSettingDto: UpdateBrandSettingDto) {
    return this.settingsService.updateSetting(brandId, key, updateSettingDto);
  }

  deleteSetting(brandId: number, key: string) {
    return this.settingsService.deleteSetting(brandId, key);
  }

  getMeetingSettings(brandId: number) {
    return this.settingsService.getMeetingSettings(brandId);
  }

  upsertMeetingSettings(
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
    return this.settingsService.upsertMeetingSettings(brandId, data);
  }

  getWelcomeSettings(brandId: number) {
    return this.settingsService.getWelcomeSettings(brandId);
  }

  upsertWelcomeSettings(
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
    return this.settingsService.upsertWelcomeSettings(brandId, data);
  }

  getBrandContext(userId: number, brandId: number) {
    return this.membershipsService.getBrandContext(userId, brandId);
  }

  switchBrandContext(userId: number, brandId: number) {
    return this.membershipsService.switchBrandContext(userId, brandId);
  }
}
