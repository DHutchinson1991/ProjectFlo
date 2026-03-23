import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { CreateBrandSettingDto } from './dto/create-brand-setting.dto';
import { UpdateBrandSettingDto } from './dto/update-brand-setting.dto';
import { AddUserToBrandDto } from './dto/add-user-to-brand.dto';
import { BrandProvisioningService, ServiceTypeKey } from './brand-provisioning.service';

@Injectable()
export class BrandsService {
    constructor(
        private prisma: PrismaService,
        private provisioning: BrandProvisioningService,
    ) { }

    // Brand CRUD operations
    async create(createBrandDto: CreateBrandDto) {
        return this.prisma.brands.create({
            data: createBrandDto,
        });
    }

    async findAll() {
        return this.prisma.brands.findMany({
            where: { is_active: true },
            include: {
                user_brands: {
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
                user_brands: {
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

        // Self-heal: sync service_types from existing event types
        const currentTypes: string[] = (brand as any).service_types ?? [];
        const eventTypes = await this.prisma.eventType.findMany({
            where: { brand_id: id, is_active: true },
            select: { name: true },
        });
        const NAME_TO_KEY: Record<string, string> = { Wedding: 'WEDDING', Birthday: 'BIRTHDAY', Engagement: 'ENGAGEMENT' };
        const derivedKeys = eventTypes
            .map((et) => NAME_TO_KEY[et.name])
            .filter((k): k is string => !!k);
        const missingFromArray = derivedKeys.filter((k) => !currentTypes.includes(k));
        if (missingFromArray.length > 0) {
            const merged = [...currentTypes, ...missingFromArray];
            await this.prisma.brands.update({ where: { id }, data: { service_types: merged } });
            (brand as any).service_types = merged;
        }

        return brand;
    }

    async update(id: number, updateBrandDto: UpdateBrandDto) {
        const existing = await this.findOne(id);

        const { service_types: newServiceTypes, ...rest } = updateBrandDto;

        const updated = await this.prisma.brands.update({
            where: { id },
            data: newServiceTypes !== undefined
                ? { ...rest, service_types: newServiceTypes }
                : rest,
        });

        // Provision all requested service types (idempotent — existing ones just ensure category/set)
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

    // User-Brand relationship operations
    async addUserToBrand(brandId: number, userId: number, addUserDto: AddUserToBrandDto) {
        await this.findOne(brandId);

        // Check if user exists
        const user = await this.prisma.contributors.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        // Check if relationship already exists
        const existingRelation = await this.prisma.user_brands.findUnique({
            where: {
                user_id_brand_id: {
                    user_id: userId,
                    brand_id: brandId,
                },
            },
        });

        if (existingRelation) {
            throw new BadRequestException('User is already associated with this brand');
        }

        return this.prisma.user_brands.create({
            data: {
                user_id: userId,
                brand_id: brandId,
                role: addUserDto.role,
                is_active: addUserDto.is_active ?? true,
            },
        });
    }

    async removeUserFromBrand(brandId: number, userId: number) {
        const relation = await this.prisma.user_brands.findUnique({
            where: {
                user_id_brand_id: {
                    user_id: userId,
                    brand_id: brandId,
                },
            },
        });

        if (!relation) {
            throw new NotFoundException('User-Brand relationship not found');
        }

        return this.prisma.user_brands.delete({
            where: {
                user_id_brand_id: {
                    user_id: userId,
                    brand_id: brandId,
                },
            },
        });
    }

    async getUserBrands(userId: number) {
        // First check if the user is a Global Admin
        const user = await this.prisma.contributors.findUnique({
            where: { id: userId },
            include: {
                contact: true,
                role: true,
            },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        // If user is Global Admin, return all brands
        if (user.role?.name === 'Global Admin') {
            const allBrands = await this.prisma.brands.findMany({
                where: { is_active: true },
                include: {
                    _count: {
                        select: {
                            projects: true,
                            contacts: true,
                            filmLibrary: true,
                        },
                    },
                },
            });

            // Format the response to match the expected UserBrand structure
            return allBrands.map(brand => ({
                id: 0, // Placeholder ID for user_brands record
                user_id: userId,
                brand_id: brand.id,
                role: 'Global Admin',
                is_active: true,
                joined_at: new Date(),
                brand: brand,
            }));
        }

        // For regular users, return only their associated brands
        return this.prisma.user_brands.findMany({
            where: {
                user_id: userId,
                is_active: true,
            },
            include: {
                brand: {
                    include: {
                        _count: {
                            select: {
                                projects: true,
                                contacts: true,
                                filmLibrary: true,
                            },
                        },
                    },
                },
            },
        });
    }

    // Brand Settings operations
    async createSetting(brandId: number, createSettingDto: CreateBrandSettingDto) {
        await this.findOne(brandId);

        return this.prisma.brand_settings.create({
            data: {
                ...createSettingDto,
                brand_id: brandId,
            },
        });
    }

    async getSettings(brandId: number, category?: string) {
        await this.findOne(brandId);

        return this.prisma.brand_settings.findMany({
            where: {
                brand_id: brandId,
                is_active: true,
                ...(category && { category }),
            },
            orderBy: [
                { category: 'asc' },
                { key: 'asc' },
            ],
        });
    }

    async getSetting(brandId: number, key: string) {
        await this.findOne(brandId);

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
        await this.findOne(brandId);
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
        await this.findOne(brandId);
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

    // ─── Meeting Settings (structured batch helpers) ─────────────────────
    readonly MEETING_SETTING_KEYS = [
        'discovery_call_duration_minutes',
        'discovery_call_description',
        'discovery_call_available_days',
        'discovery_call_available_from',
        'discovery_call_available_to',
        'discovery_call_google_meet_link',
    ] as const;

    async getMeetingSettings(brandId: number) {
        await this.findOne(brandId);
        const rows = await this.prisma.brand_settings.findMany({
            where: { brand_id: brandId, category: 'meetings' },
        });
        const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
        return {
            duration_minutes: map['discovery_call_duration_minutes'] ? parseInt(map['discovery_call_duration_minutes']) : 20,
            description: map['discovery_call_description'] ?? '',
            available_days: map['discovery_call_available_days'] ? JSON.parse(map['discovery_call_available_days']) : [1, 2, 3, 4, 5],
            available_from: map['discovery_call_available_from'] ?? '09:00',
            available_to: map['discovery_call_available_to'] ?? '17:00',
            google_meet_link: map['discovery_call_google_meet_link'] ?? '',
        };
    }

    async upsertMeetingSettings(brandId: number, data: {
        duration_minutes?: number;
        description?: string;
        available_days?: number[];
        available_from?: string;
        available_to?: string;
        google_meet_link?: string;
    }) {
        await this.findOne(brandId);
        const entries: { key: string; value: string }[] = [
            ...(data.duration_minutes !== undefined ? [{ key: 'discovery_call_duration_minutes', value: String(data.duration_minutes) }] : []),
            ...(data.description !== undefined ? [{ key: 'discovery_call_description', value: data.description }] : []),
            ...(data.available_days !== undefined ? [{ key: 'discovery_call_available_days', value: JSON.stringify(data.available_days) }] : []),
            ...(data.available_from !== undefined ? [{ key: 'discovery_call_available_from', value: data.available_from }] : []),
            ...(data.available_to !== undefined ? [{ key: 'discovery_call_available_to', value: data.available_to }] : []),
            ...(data.google_meet_link !== undefined ? [{ key: 'discovery_call_google_meet_link', value: data.google_meet_link }] : []),
        ];
        for (const entry of entries) {
            await this.prisma.brand_settings.upsert({
                where: { brand_id_key: { brand_id: brandId, key: entry.key } },
                create: { brand_id: brandId, key: entry.key, value: entry.value, category: 'meetings' },
                update: { value: entry.value },
            });
        }
        return this.getMeetingSettings(brandId);
    }

    // ─── Welcome / Inquiry Page Settings (structured batch helpers) ────
    readonly WELCOME_SETTING_KEYS = [
        'welcome_headline',
        'welcome_subtitle',
        'welcome_cta_text',
        'welcome_trust_badges',
        'welcome_social_proof_text',
        'welcome_social_proof_count',
        'welcome_social_proof_start',
        'welcome_social_links',
        'welcome_testimonials',
        'welcome_time_estimate',
    ] as const;

    async getWelcomeSettings(brandId: number) {
        await this.findOne(brandId);
        const rows = await this.prisma.brand_settings.findMany({
            where: { brand_id: brandId, category: 'welcome' },
        });
        const map = Object.fromEntries(rows.map(r => [r.key, r.value]));

        // Social proof count = manual starting number + completed jobs count
        const startNumber = map['welcome_social_proof_start']
            ? parseInt(map['welcome_social_proof_start'])
            : 0;
        const liveCount = await this.prisma.projects.count({
            where: {
                brand_id: brandId,
                phase: 'Delivery',
            },
        });

        return {
            headline: map['welcome_headline'] ?? '',
            subtitle: map['welcome_subtitle'] ?? '',
            cta_text: map['welcome_cta_text'] ?? 'Plan My Day',
            trust_badges: map['welcome_trust_badges']
                ? JSON.parse(map['welcome_trust_badges'])
                : [
                    { icon: '✨', text: 'Personalised quote' },
                    { icon: '📅', text: 'Same-day response' },
                    { icon: '🎬', text: 'No commitment' },
                ],
            social_proof_text: map['welcome_social_proof_text'] ?? 'happy customers',
            social_proof_count: startNumber + liveCount,
            social_proof_start: startNumber,
            social_links: map['welcome_social_links']
                ? JSON.parse(map['welcome_social_links'])
                : [],
            testimonials: map['welcome_testimonials']
                ? JSON.parse(map['welcome_testimonials'])
                : [],
            time_estimate: map['welcome_time_estimate'] ?? '~2 min',
        };
    }

    async upsertWelcomeSettings(brandId: number, data: {
        headline?: string;
        subtitle?: string;
        cta_text?: string;
        trust_badges?: Array<{ icon: string; text: string }>;
        social_proof_text?: string;
        social_proof_start?: number;
        social_links?: Array<{ platform: string; url: string }>;
        testimonials?: Array<{ name: string; text: string; rating: number; image_url: string }>;
        time_estimate?: string;
    }) {
        await this.findOne(brandId);
        const entries: { key: string; value: string }[] = [
            ...(data.headline !== undefined ? [{ key: 'welcome_headline', value: data.headline }] : []),
            ...(data.subtitle !== undefined ? [{ key: 'welcome_subtitle', value: data.subtitle }] : []),
            ...(data.cta_text !== undefined ? [{ key: 'welcome_cta_text', value: data.cta_text }] : []),
            ...(data.trust_badges !== undefined ? [{ key: 'welcome_trust_badges', value: JSON.stringify(data.trust_badges) }] : []),
            ...(data.social_proof_text !== undefined ? [{ key: 'welcome_social_proof_text', value: data.social_proof_text }] : []),
            ...(data.social_proof_start !== undefined ? [{ key: 'welcome_social_proof_start', value: String(data.social_proof_start) }] : []),
            ...(data.social_links !== undefined ? [{ key: 'welcome_social_links', value: JSON.stringify(data.social_links) }] : []),
            ...(data.testimonials !== undefined ? [{ key: 'welcome_testimonials', value: JSON.stringify(data.testimonials) }] : []),
            ...(data.time_estimate !== undefined ? [{ key: 'welcome_time_estimate', value: data.time_estimate }] : []),
        ];
        for (const entry of entries) {
            await this.prisma.brand_settings.upsert({
                where: { brand_id_key: { brand_id: brandId, key: entry.key } },
                create: { brand_id: brandId, key: entry.key, value: entry.value, category: 'welcome' },
                update: { value: entry.value },
            });
        }
        return this.getWelcomeSettings(brandId);
    }

    // Helper methods for brand context
    async getBrandContext(userId: number, brandId: number) {
        const userBrand = await this.prisma.user_brands.findUnique({
            where: {
                user_id_brand_id: {
                    user_id: userId,
                    brand_id: brandId,
                },
            },
            include: {
                brand: {
                    include: {
                        brand_settings: true,
                    },
                },
            },
        });

        if (!userBrand) {
            throw new NotFoundException('User is not associated with this brand');
        }

        return userBrand;
    }

    async switchBrandContext(userId: number, brandId: number) {
        const userBrand = await this.getBrandContext(userId, brandId);

        if (!userBrand.is_active) {
            throw new BadRequestException('User access to this brand is not active');
        }

        return {
            brand: userBrand.brand,
            role: userBrand.role,
            permissions: await this.getBrandPermissions(userBrand.role),
        };
    }

    private async getBrandPermissions(role: string) {
        // Define role-based permissions
        const permissions = {
            Owner: ['*'], // All permissions
            Admin: [
                'brand.read',
                'brand.update',
                'brand.settings.read',
                'brand.settings.update',
                'users.read',
                'users.invite',
                'users.manage',
                'projects.read',
                'projects.create',
                'projects.update',
                'projects.delete',
            ],
            Manager: [
                'brand.read',
                'brand.settings.read',
                'users.read',
                'projects.read',
                'projects.create',
                'projects.update',
            ],
            Member: [
                'brand.read',
                'projects.read',
                'projects.update',
            ],
        };

        return permissions[role] || permissions.Member;
    }
}
