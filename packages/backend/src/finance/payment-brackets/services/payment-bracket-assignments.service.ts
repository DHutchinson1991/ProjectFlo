import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { AssignBracketDto } from '../dto/assign-bracket.dto';

@Injectable()
export class PaymentBracketAssignmentsService {
  constructor(private prisma: PrismaService) {}

  async assignBracket(dto: AssignBracketDto) {
    const assignment = await this.prisma.crewJobRole.findUnique({
      where: {
        crew_id_job_role_id: {
          crew_id: dto.crew_id,
          job_role_id: dto.job_role_id,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Crew ${dto.crew_id} is not assigned to job role ${dto.job_role_id}`,
      );
    }

    const bracket = await this.prisma.payment_brackets.findUnique({
      where: { id: dto.payment_bracket_id },
    });

    if (!bracket) {
      throw new NotFoundException(
        `Payment bracket with ID ${dto.payment_bracket_id} not found`,
      );
    }

    if (bracket.job_role_id !== dto.job_role_id) {
      throw new BadRequestException(
        `Payment bracket ${dto.payment_bracket_id} does not belong to job role ${dto.job_role_id}`,
      );
    }

    if (!bracket.is_active) {
      throw new BadRequestException(
        `Payment bracket "${bracket.name}" is inactive`,
      );
    }

    return this.prisma.crewJobRole.update({
      where: {
        crew_id_job_role_id: {
          crew_id: dto.crew_id,
          job_role_id: dto.job_role_id,
        },
      },
      data: { payment_bracket_id: dto.payment_bracket_id },
      include: {
        job_role: true,
        payment_bracket: true,
        crew: {
          include: {
            contact: {
              select: { first_name: true, last_name: true, email: true },
            },
          },
        },
      },
    });
  }

  async unassignBracket(crewId: number, jobRoleId: number) {
    const assignment = await this.prisma.crewJobRole.findUnique({
      where: {
        crew_id_job_role_id: {
          crew_id: crewId,
          job_role_id: jobRoleId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Crew ${crewId} is not assigned to job role ${jobRoleId}`,
      );
    }

    return this.prisma.crewJobRole.update({
      where: {
        crew_id_job_role_id: {
          crew_id: crewId,
          job_role_id: jobRoleId,
        },
      },
      data: { payment_bracket_id: null },
      include: {
        job_role: true,
        payment_bracket: true,
        crew: {
          include: {
            contact: {
              select: { first_name: true, last_name: true, email: true },
            },
          },
        },
      },
    });
  }

  async toggleUnmanned(crewId: number, jobRoleId: number, isUnmanned: boolean) {
    const assignment = await this.prisma.crewJobRole.findUnique({
      where: {
        crew_id_job_role_id: {
          crew_id: crewId,
          job_role_id: jobRoleId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Crew ${crewId} is not assigned to job role ${jobRoleId}`,
      );
    }

    return this.prisma.crewJobRole.update({
      where: {
        crew_id_job_role_id: {
          crew_id: crewId,
          job_role_id: jobRoleId,
        },
      },
      data: { is_unmanned: isUnmanned },
      include: {
        job_role: true,
        payment_bracket: true,
        crew: {
          include: {
            contact: {
              select: { first_name: true, last_name: true, email: true },
            },
          },
        },
      },
    });
  }

  async findCrewBrackets(crewId: number) {
    return this.prisma.crewJobRole.findMany({
      where: {
        crew_id: crewId,
        payment_bracket_id: { not: null },
      },
      include: {
        job_role: {
          select: { id: true, name: true, display_name: true, category: true },
        },
        payment_bracket: true,
      },
      orderBy: { job_role: { name: 'asc' } },
    });
  }

  /** Resolve the effective hourly rate for a crew+role.
   *  Uses bracket rate only. */
  async findEffectiveRate(crewId: number, jobRoleId: number) {
    const assignment = await this.prisma.crewJobRole.findUnique({
      where: {
        crew_id_job_role_id: {
          crew_id: crewId,
          job_role_id: jobRoleId,
        },
      },
      include: {
        payment_bracket: true,
        job_role: {
          select: { id: true, name: true, display_name: true },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Crew ${crewId} is not assigned to job role ${jobRoleId}`,
      );
    }

    const bracketRate = assignment.payment_bracket?.hourly_rate ?? null;

    return {
      crew_id: crewId,
      job_role: assignment.job_role,
      payment_bracket: assignment.payment_bracket,
      effective_hourly_rate: bracketRate,
      rate_source: bracketRate ? 'payment_bracket' : 'none',
    };
  }

  /** Summary: all brackets grouped by job role, optionally scoped to a brand */
  async getBracketsByRole(brandId?: number) {
    const brackets = await this.prisma.payment_brackets.findMany({
      where: { is_active: true },
      orderBy: [{ job_role_id: 'asc' }, { level: 'asc' }],
      include: {
        job_role: {
          select: { id: true, name: true, display_name: true, category: true },
        },
        _count: { select: { crew_job_role_assignments: true } },
        crew_job_role_assignments: {
          where: brandId
            ? { crew: { brand_memberships: { some: { brand_id: brandId, is_active: true } } } }
            : undefined,
          include: {
            crew: {
              include: { contact: { select: { first_name: true, last_name: true, email: true } } },
            },
          },
        },
      },
    });

    const grouped = brackets.reduce(
      (acc, bracket) => {
        const key = bracket.job_role.name;
        if (!acc[key]) {
          acc[key] = {
            job_role: bracket.job_role,
            brackets: [],
          };
        }
        acc[key].brackets.push(bracket);
        return acc;
      },
      {} as Record<string, { job_role: Record<string, unknown>; brackets: typeof brackets }>,  
    );

    return grouped;
  }
}
