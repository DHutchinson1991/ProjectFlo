import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { CreateBrandSettingDto } from './dto/create-brand-setting.dto';
import { UpdateBrandSettingDto } from './dto/update-brand-setting.dto';
import { AddUserToBrandDto } from './dto/add-user-to-brand.dto';

@Injectable()
export class BrandsService {
    constructor(private prisma: PrismaService) { }

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

        return brand;
    }

    async update(id: number, updateBrandDto: UpdateBrandDto) {
        await this.findOne(id);

        return this.prisma.brands.update({
            where: { id },
            data: updateBrandDto,
        });
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
