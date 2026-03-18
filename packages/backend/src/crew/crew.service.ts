import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CrewService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Crew Member Management ───────────────────────────────────────

  /**
   * Get all crew members for a brand (contributors where is_crew = true)
   * Includes contact info, job roles, and skill rates
   */
  async getCrewByBrand(brandId: number) {
    return this.prisma.contributors.findMany({
      where: {
        is_crew: true,
        archived_at: null,
        user_brands: {
          some: { brand_id: brandId, is_active: true },
        },
      },
      include: {
        contact: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_number: true,
            company_name: true,
          },
        },
        role: { select: { id: true, name: true } },
        contributor_job_roles: {
          include: {
            job_role: {
              select: { id: true, name: true, display_name: true, category: true },
            },
          },
          orderBy: [{ is_primary: 'desc' }, { assigned_at: 'asc' }],
        },
        user_brands: {
          where: { brand_id: brandId },
          select: { role: true },
        },
      },
      orderBy: { contact: { first_name: 'asc' } },
    });
  }

  /**
   * Get all contributors (crew and non-crew) for a brand.
   * Useful for "promote to crew" flows.
   */
  async getAllContributorsByBrand(brandId: number) {
    return this.prisma.contributors.findMany({
      where: {
        archived_at: null,
        user_brands: {
          some: { brand_id: brandId, is_active: true },
        },
      },
      include: {
        contact: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_number: true,
          },
        },
        role: { select: { id: true, name: true } },
        contributor_job_roles: {
          include: {
            job_role: {
              select: { id: true, name: true, display_name: true, category: true },
            },
          },
        },
      },
      orderBy: { contact: { first_name: 'asc' } },
    });
  }

  /**
   * Get a single crew member by ID with full details
   */
  async getCrewMemberById(id: number) {
    const member = await this.prisma.contributors.findUnique({
      where: { id },
      include: {
        contact: true,
        role: true,
        contributor_job_roles: {
          include: {
            job_role: true,
          },
          orderBy: [{ is_primary: 'desc' }, { assigned_at: 'asc' }],
        },
        contributor_skill_rates: {
          include: { task_template: true },
        },
        package_crew_assignments: {
          include: {
            package: { select: { id: true, name: true } },
            event_day: { select: { id: true, name: true } },
            job_role: { select: { id: true, name: true, display_name: true } },
          },
          orderBy: { created_at: 'desc' },
          take: 20,
        },
        user_brands: {
          include: { brand: { select: { id: true, name: true, display_name: true } } },
        },
      },
    });

    if (!member) throw new NotFoundException('Crew member not found');
    return member;
  }

  /**
   * Toggle crew status for a contributor
   * If setting is_crew = true, ensures an active user_brands entry exists for the brand
   */
  async setCrewStatus(
    contributorId: number,
    dto: { is_crew: boolean; crew_color?: string | null; bio?: string | null },
    brandId?: number,
  ) {
    const existing = await this.prisma.contributors.findUnique({
      where: { id: contributorId },
    });
    if (!existing) throw new NotFoundException('Contributor not found');

    // If setting crew status to true and we have a brand ID, ensure user_brands relationship exists
    if (dto.is_crew && brandId) {
      console.log(`🔧 Setting up crew relationship: contributorId=${contributorId}, brandId=${brandId}`);
      const result = await this.prisma.user_brands.upsert({
        where: {
          user_id_brand_id: {
            user_id: contributorId,
            brand_id: brandId,
          },
        },
        update: { is_active: true },
        create: {
          user_id: contributorId,
          brand_id: brandId,
          is_active: true,
          role: 'Crew',
        },
      });
      console.log(`✅ Crew relationship created/updated:`, result);
    }

    return this.prisma.contributors.update({
      where: { id: contributorId },
      data: {
        is_crew: dto.is_crew,
        crew_color: dto.crew_color !== undefined ? dto.crew_color : undefined,
        bio: dto.bio !== undefined ? dto.bio : undefined,
      },
      include: {
        contact: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_number: true,
          },
        },
        role: { select: { id: true, name: true } },
        contributor_job_roles: {
          include: {
            job_role: {
              select: { id: true, name: true, display_name: true, category: true },
            },
          },
        },
      },
    });
  }

  /**
   * Update crew-specific fields (color, bio)
   */
  async updateCrewProfile(
    contributorId: number,
    dto: { crew_color?: string | null; bio?: string | null; default_hourly_rate?: number },
  ) {
    const existing = await this.prisma.contributors.findUnique({
      where: { id: contributorId },
    });
    if (!existing) throw new NotFoundException('Contributor not found');

    return this.prisma.contributors.update({
      where: { id: contributorId },
      data: {
        crew_color: dto.crew_color !== undefined ? dto.crew_color : undefined,
        bio: dto.bio !== undefined ? dto.bio : undefined,
        default_hourly_rate: dto.default_hourly_rate !== undefined ? dto.default_hourly_rate : undefined,
      },
      include: {
        contact: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_number: true,
          },
        },
        role: { select: { id: true, name: true } },
        contributor_job_roles: {
          include: {
            job_role: {
              select: { id: true, name: true, display_name: true, category: true },
            },
          },
        },
      },
    });
  }

  /**
   * Get crew members available for a given job role
   * Useful when assigning crew to package slots
   */
  async getCrewByJobRole(brandId: number, jobRoleId: number) {
    return this.prisma.contributors.findMany({
      where: {
        is_crew: true,
        archived_at: null,
        user_brands: {
          some: { brand_id: brandId, is_active: true },
        },
        contributor_job_roles: {
          some: { job_role_id: jobRoleId },
        },
      },
      include: {
        contact: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        contributor_job_roles: {
          where: { job_role_id: jobRoleId },
          include: {
            job_role: {
              select: { id: true, name: true, display_name: true },
            },
          },
        },
      },
      orderBy: { contact: { first_name: 'asc' } },
    });
  }

  /**
   * Get crew assignment summary (how many packages/days each crew member is assigned to)
   */
  async getCrewWorkload(brandId: number) {
    const crew = await this.prisma.contributors.findMany({
      where: {
        is_crew: true,
        archived_at: null,
        user_brands: {
          some: { brand_id: brandId, is_active: true },
        },
      },
      include: {
        contact: {
          select: { first_name: true, last_name: true, email: true },
        },
        contributor_job_roles: {
          where: { is_primary: true },
          include: {
            job_role: { select: { id: true, name: true, display_name: true } },
          },
          take: 1,
        },
        _count: {
          select: {
            package_crew_assignments: true,
            project_assignments: true,
          },
        },
      },
      orderBy: { contact: { first_name: 'asc' } },
    });

    return crew.map((c) => ({
      id: c.id,
      name: `${c.contact.first_name || ''} ${c.contact.last_name || ''}`.trim(),
      email: c.contact.email,
      crew_color: c.crew_color,
      primary_role: c.contributor_job_roles[0]?.job_role?.display_name || c.contributor_job_roles[0]?.job_role?.name || null,
      default_hourly_rate: c.default_hourly_rate,
      package_assignments: c._count.package_crew_assignments,
      project_assignments: c._count.project_assignments,
    }));
  }
}
