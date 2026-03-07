import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePaymentBracketDto,
  UpdatePaymentBracketDto,
  AssignBracketDto,
} from './dto/payment-bracket.dto';

function isPrismaError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}

@Injectable()
export class PaymentBracketsService {
  constructor(private prisma: PrismaService) {}

  // ─── CRUD ────────────────────────────────────────────────

  async findAll(includeInactive = false) {
    return this.prisma.payment_brackets.findMany({
      where: includeInactive ? {} : { is_active: true },
      orderBy: [{ job_role_id: 'asc' }, { level: 'asc' }],
      include: {
        job_role: {
          select: { id: true, name: true, display_name: true, category: true },
        },
        _count: { select: { contributor_job_roles: true } },
      },
    });
  }

  async findById(id: number) {
    const bracket = await this.prisma.payment_brackets.findUnique({
      where: { id },
      include: {
        job_role: {
          select: { id: true, name: true, display_name: true, category: true },
        },
        contributor_job_roles: {
          include: {
            contributor: {
              include: {
                contact: {
                  select: { first_name: true, last_name: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!bracket) {
      throw new NotFoundException(`Payment bracket with ID ${id} not found`);
    }

    return bracket;
  }

  async findByJobRole(jobRoleId: number, includeInactive = false) {
    // Verify the job role exists
    const jobRole = await this.prisma.job_roles.findUnique({
      where: { id: jobRoleId },
    });
    if (!jobRole) {
      throw new NotFoundException(`Job role with ID ${jobRoleId} not found`);
    }

    return this.prisma.payment_brackets.findMany({
      where: {
        job_role_id: jobRoleId,
        ...(includeInactive ? {} : { is_active: true }),
      },
      orderBy: { level: 'asc' },
      include: {
        _count: { select: { contributor_job_roles: true } },
      },
    });
  }

  async create(dto: CreatePaymentBracketDto) {
    // Verify the job role exists
    const jobRole = await this.prisma.job_roles.findUnique({
      where: { id: dto.job_role_id },
    });
    if (!jobRole) {
      throw new NotFoundException(
        `Job role with ID ${dto.job_role_id} not found`,
      );
    }

    try {
      return await this.prisma.payment_brackets.create({
        data: {
          job_role_id: dto.job_role_id,
          name: dto.name,
          display_name: dto.display_name,
          level: dto.level,
          hourly_rate: dto.hourly_rate,
          day_rate: dto.day_rate,
          overtime_rate: dto.overtime_rate,
          description: dto.description,
          color: dto.color,
          is_active: dto.is_active ?? true,
        },
        include: {
          job_role: {
            select: {
              id: true,
              name: true,
              display_name: true,
              category: true,
            },
          },
        },
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2002') {
        throw new ConflictException(
          `A bracket with name "${dto.name}" or level ${dto.level} already exists for this job role`,
        );
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdatePaymentBracketDto) {
    try {
      return await this.prisma.payment_brackets.update({
        where: { id },
        data: dto,
        include: {
          job_role: {
            select: {
              id: true,
              name: true,
              display_name: true,
              category: true,
            },
          },
        },
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2025') {
        throw new NotFoundException(`Payment bracket with ID ${id} not found`);
      }
      if (isPrismaError(error) && error.code === 'P2002') {
        throw new ConflictException(
          `A bracket with that name or level already exists for this job role`,
        );
      }
      throw error;
    }
  }

  async delete(id: number) {
    try {
      // Soft delete — also unset from any contributor_job_roles using it
      const [, bracket] = await this.prisma.$transaction([
        this.prisma.contributor_job_roles.updateMany({
          where: { payment_bracket_id: id },
          data: { payment_bracket_id: null },
        }),
        this.prisma.payment_brackets.update({
          where: { id },
          data: { is_active: false },
        }),
      ]);
      return bracket;
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2025') {
        throw new NotFoundException(`Payment bracket with ID ${id} not found`);
      }
      throw error;
    }
  }

  // ─── Assignment ──────────────────────────────────────────

  async assignBracket(dto: AssignBracketDto) {
    // Verify the contributor_job_role assignment exists
    const assignment = await this.prisma.contributor_job_roles.findUnique({
      where: {
        contributor_id_job_role_id: {
          contributor_id: dto.contributor_id,
          job_role_id: dto.job_role_id,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Contributor ${dto.contributor_id} is not assigned to job role ${dto.job_role_id}`,
      );
    }

    // Verify the bracket exists and belongs to the same job role
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

    return this.prisma.contributor_job_roles.update({
      where: {
        contributor_id_job_role_id: {
          contributor_id: dto.contributor_id,
          job_role_id: dto.job_role_id,
        },
      },
      data: { payment_bracket_id: dto.payment_bracket_id },
      include: {
        job_role: true,
        payment_bracket: true,
        contributor: {
          include: {
            contact: {
              select: { first_name: true, last_name: true, email: true },
            },
          },
        },
      },
    });
  }

  async unassignBracket(contributorId: number, jobRoleId: number) {
    const assignment = await this.prisma.contributor_job_roles.findUnique({
      where: {
        contributor_id_job_role_id: {
          contributor_id: contributorId,
          job_role_id: jobRoleId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Contributor ${contributorId} is not assigned to job role ${jobRoleId}`,
      );
    }

    return this.prisma.contributor_job_roles.update({
      where: {
        contributor_id_job_role_id: {
          contributor_id: contributorId,
          job_role_id: jobRoleId,
        },
      },
      data: { payment_bracket_id: null },
      include: {
        job_role: true,
        payment_bracket: true,
        contributor: {
          include: {
            contact: {
              select: { first_name: true, last_name: true, email: true },
            },
          },
        },
      },
    });
  }

  // ─── Unmanned toggle ─────────────────────────────────────

  async toggleUnmanned(contributorId: number, jobRoleId: number, isUnmanned: boolean) {
    const assignment = await this.prisma.contributor_job_roles.findUnique({
      where: {
        contributor_id_job_role_id: {
          contributor_id: contributorId,
          job_role_id: jobRoleId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Contributor ${contributorId} is not assigned to job role ${jobRoleId}`,
      );
    }

    return this.prisma.contributor_job_roles.update({
      where: {
        contributor_id_job_role_id: {
          contributor_id: contributorId,
          job_role_id: jobRoleId,
        },
      },
      data: { is_unmanned: isUnmanned },
      include: {
        job_role: true,
        payment_bracket: true,
        contributor: {
          include: {
            contact: {
              select: { first_name: true, last_name: true, email: true },
            },
          },
        },
      },
    });
  }

  // ─── Query helpers ───────────────────────────────────────

  async getContributorBrackets(contributorId: number) {
    return this.prisma.contributor_job_roles.findMany({
      where: {
        contributor_id: contributorId,
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

  /** Resolve the effective hourly rate for a contributor+role.
   *  Priority: bracket rate > skill rate > default_hourly_rate */
  async getEffectiveRate(contributorId: number, jobRoleId: number) {
    const assignment = await this.prisma.contributor_job_roles.findUnique({
      where: {
        contributor_id_job_role_id: {
          contributor_id: contributorId,
          job_role_id: jobRoleId,
        },
      },
      include: {
        payment_bracket: true,
        contributor: {
          select: { default_hourly_rate: true },
        },
        job_role: {
          select: { id: true, name: true, display_name: true },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Contributor ${contributorId} is not assigned to job role ${jobRoleId}`,
      );
    }

    const bracketRate = assignment.payment_bracket?.hourly_rate ?? null;
    const defaultRate = assignment.contributor.default_hourly_rate;

    return {
      contributor_id: contributorId,
      job_role: assignment.job_role,
      payment_bracket: assignment.payment_bracket,
      effective_hourly_rate: bracketRate ?? defaultRate,
      rate_source: bracketRate ? 'payment_bracket' : 'default_hourly_rate',
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
        _count: { select: { contributor_job_roles: true } },
        contributor_job_roles: {
          where: brandId
            ? { contributor: { user_brands: { some: { brand_id: brandId, is_active: true } } } }
            : undefined,
          include: {
            contributor: {
              include: {
                contact: {
                  select: {
                    first_name: true,
                    last_name: true,
                    email: true,
                  },
                },
              },
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
