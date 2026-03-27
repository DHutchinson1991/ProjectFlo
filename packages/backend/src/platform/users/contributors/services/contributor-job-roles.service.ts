import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../../platform/prisma/prisma.service";

@Injectable()
export class ContributorJobRolesService {
  constructor(private readonly prisma: PrismaService) { }

  async addJobRole(contributorId: number, jobRoleId: number) {
    await this.ensureContributorExists(contributorId);
    await this.ensureJobRoleExists(jobRoleId);

    const existingAssignment = await this.prisma.crewMemberJobRole.findUnique({
      where: {
        crew_member_id_job_role_id: {
          crew_member_id: contributorId,
          job_role_id: jobRoleId,
        },
      },
    });

    if (existingAssignment) {
      throw new ConflictException("Job role is already assigned to this contributor");
    }

    await this.prisma.crewMemberJobRole.create({
      data: {
        crew_member_id: contributorId,
        job_role_id: jobRoleId,
        is_primary: false,
      },
    });

    return this.findContributorWithRelations(contributorId);
  }

  async removeJobRole(contributorId: number, jobRoleId: number) {
    await this.ensureContributorExists(contributorId);

    const assignment = await this.prisma.crewMemberJobRole.findUnique({
      where: {
        crew_member_id_job_role_id: {
          crew_member_id: contributorId,
          job_role_id: jobRoleId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException("Job role is not assigned to this contributor");
    }

    if (assignment.is_primary) {
      await this.prisma.crewMemberJobRole.update({
        where: {
          crew_member_id_job_role_id: {
            crew_member_id: contributorId,
            job_role_id: jobRoleId,
          },
        },
        data: { is_primary: false },
      });
    }

    await this.prisma.crewMemberJobRole.delete({
      where: {
        crew_member_id_job_role_id: {
          crew_member_id: contributorId,
          job_role_id: jobRoleId,
        },
      },
    });

    return this.findContributorWithRelations(contributorId);
  }

  async setPrimaryJobRole(contributorId: number, jobRoleId: number) {
    await this.ensureContributorExists(contributorId);

    const assignment = await this.prisma.crewMemberJobRole.findUnique({
      where: {
        crew_member_id_job_role_id: {
          crew_member_id: contributorId,
          job_role_id: jobRoleId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException("Job role is not assigned to this contributor");
    }

    await this.prisma.crewMemberJobRole.updateMany({
      where: { crew_member_id: contributorId },
      data: { is_primary: false },
    });

    await this.prisma.crewMemberJobRole.update({
      where: {
        crew_member_id_job_role_id: {
          crew_member_id: contributorId,
          job_role_id: jobRoleId,
        },
      },
      data: { is_primary: true },
    });

    return this.findContributorWithRelations(contributorId);
  }

  private async ensureContributorExists(contributorId: number) {
    const contributor = await this.prisma.crewMember.findUnique({
      where: { id: contributorId },
    });

    if (!contributor) {
      throw new NotFoundException(`Contributor with ID ${contributorId} not found`);
    }
  }

  private async ensureJobRoleExists(jobRoleId: number) {
    const jobRole = await this.prisma.job_roles.findUnique({
      where: { id: jobRoleId },
    });

    if (!jobRole) {
      throw new NotFoundException(`Job role with ID ${jobRoleId} not found`);
    }
  }

  private async findContributorWithRelations(contributorId: number) {
    return this.prisma.crewMember.findUnique({
      where: { id: contributorId },
      include: {
        contact: true,
        role: true,
        job_role_assignments: {
          include: {
            job_role: true,
            payment_bracket: true,
          },
        },
      },
    });
  }
}
