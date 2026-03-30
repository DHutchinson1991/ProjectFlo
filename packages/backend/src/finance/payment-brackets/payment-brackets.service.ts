import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreatePaymentBracketDto } from './dto/create-payment-bracket.dto';
import { UpdatePaymentBracketDto } from './dto/update-payment-bracket.dto';

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
        _count: { select: { crew_job_role_assignments: true } },
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
        crew_job_role_assignments: {
          include: {
            crew: {
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
        _count: { select: { crew_job_role_assignments: true } },
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

  async remove(id: number) {
    try {
      // Soft delete — also unset from any crew_job_roles using it
      const [, bracket] = await this.prisma.$transaction([
        this.prisma.crewJobRole.updateMany({
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
}
