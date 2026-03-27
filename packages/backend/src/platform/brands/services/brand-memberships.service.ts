import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../platform/prisma/prisma.service";
import { AddUserToBrandDto } from "../dto/add-user-to-brand.dto";

@Injectable()
export class BrandMembershipsService {
  constructor(private readonly prisma: PrismaService) { }

  async addUserToBrand(brandId: number, userId: number, addUserDto: AddUserToBrandDto) {
    await this.ensureBrandExists(brandId);

    const user = await this.prisma.crewMember.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const existingRelation = await this.prisma.brandMember.findUnique({
      where: {
        crew_member_id_brand_id: {
          crew_member_id: userId,
          brand_id: brandId,
        },
      },
    });

    if (existingRelation) {
      throw new BadRequestException("User is already associated with this brand");
    }

    return this.prisma.brandMember.create({
      data: {
        crew_member_id: userId,
        brand_id: brandId,
        is_active: addUserDto.is_active ?? true,
      },
    });
  }

  async removeUserFromBrand(brandId: number, userId: number) {
    const relation = await this.prisma.brandMember.findUnique({
      where: {
        crew_member_id_brand_id: {
          crew_member_id: userId,
          brand_id: brandId,
        },
      },
    });

    if (!relation) {
      throw new NotFoundException("User-Brand relationship not found");
    }

    return this.prisma.brandMember.delete({
      where: {
        crew_member_id_brand_id: {
          crew_member_id: userId,
          brand_id: brandId,
        },
      },
    });
  }

  async getUserBrands(userId: number) {
    const user = await this.prisma.crewMember.findUnique({
      where: { id: userId },
      include: {
        contact: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.role?.name === "Global Admin") {
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

      return allBrands.map((brand) => ({
        id: 0,
        user_id: userId,
        brand_id: brand.id,
        role: "Global Admin",
        is_active: true,
        joined_at: new Date(),
        brand,
      }));
    }

    return this.prisma.brandMember.findMany({
      where: {
        crew_member_id: userId,
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

  async getBrandContext(userId: number, brandId: number) {
    const userBrand = await this.prisma.brandMember.findUnique({
      where: {
        crew_member_id_brand_id: {
          crew_member_id: userId,
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
      throw new NotFoundException("User is not associated with this brand");
    }

    return userBrand;
  }

  async switchBrandContext(userId: number, brandId: number) {
    const userBrand = await this.getBrandContext(userId, brandId);

    if (!userBrand.is_active) {
      throw new BadRequestException("User access to this brand is not active");
    }

    return {
      brand: userBrand.brand,
      role: this.resolveBrandRole(userBrand.crew_member_id),
      permissions: this.getBrandPermissions(this.resolveBrandRole(userBrand.crew_member_id)),
    };
  }

  private async ensureBrandExists(brandId: number) {
    const brand = await this.prisma.brands.findUnique({
      where: { id: brandId },
      select: { id: true },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${brandId} not found`);
    }
  }

  private getBrandPermissions(role: string) {
    const permissions = {
      Owner: ["*"],
      Admin: [
        "brand.read",
        "brand.update",
        "brand.settings.read",
        "brand.settings.update",
        "users.read",
        "users.invite",
        "users.manage",
        "projects.read",
        "projects.create",
        "projects.update",
        "projects.delete",
      ],
      Manager: [
        "brand.read",
        "brand.settings.read",
        "users.read",
        "projects.read",
        "projects.create",
        "projects.update",
      ],
      Member: ["brand.read", "projects.read", "projects.update"],
    };

    return permissions[role as keyof typeof permissions] ?? permissions.Member;
  }

  private resolveBrandRole(userId: number): string {
    // Membership role now comes from contributor.role relation, not brand_memberships.
    return this.prisma ? 'Member' : 'Member';
  }
}
