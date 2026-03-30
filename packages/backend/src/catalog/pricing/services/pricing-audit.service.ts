import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { roundMoney } from '@finance/shared/pricing.utils';

interface CrewJobRoleEntry {
  is_primary: boolean;
  job_role_id: number;
  payment_bracket: { hourly_rate: unknown; day_rate: unknown } | null;
}

interface CrewWithRoles {
  id: number;
  job_role_assignments: CrewJobRoleEntry[];
}

@Injectable()
export class PricingAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async auditRates(packageId: number, brandId: number) {
    const pkg = await this.prisma.service_packages.findFirst({
      where: { id: packageId, brand_id: brandId },
      include: {
        package_crew_slots: {
          include: {
            crew: {
              select: {
                id: true,
                job_role_assignments: {
                  select: {
                    is_primary: true,
                    job_role_id: true,
                    payment_bracket: {
                      select: { hourly_rate: true, day_rate: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!pkg) throw new NotFoundException('Package not found');

    const crewSlots = pkg.package_crew_slots.map(op => {
      const hours = Number(op.hours ?? 0);
      const { rate, tier, isDayRate } = this.resolveRate(op);

      return {
        position: op.label ?? 'Unknown',
        crewId: op.crew_id,
        hours,
        rate,
        isDayRate,
        tier,
        cost: roundMoney(isDayRate ? rate * (hours > 0 ? hours : 1) : rate * hours),
      };
    });

    return {
      packageId: pkg.id,
      packageName: pkg.name,
      crewSlots,
    };
  }

  private resolveRate(
    op: { crew_id: number | null; job_role_id: number | null; crew: CrewWithRoles | null },
  ): { rate: number; tier: string; isDayRate: boolean } {
    if (!op.crew || !op.job_role_id) {
      return { rate: 0, tier: 'none', isDayRate: false };
    }

    const roles = op.crew.job_role_assignments || [];
    const match = roles.find((r) => r.job_role_id === op.job_role_id);

    if (!match?.payment_bracket) {
      return { rate: 0, tier: 'none', isDayRate: false };
    }

    const hr = Number(match.payment_bracket.hourly_rate ?? 0);
    const dr = Number(match.payment_bracket.day_rate ?? 0);

    if (dr > 0 && hr === 0) {
      return { rate: dr, tier: 'matched-role-day', isDayRate: true };
    }
    if (hr > 0) {
      return { rate: hr, tier: 'matched-role', isDayRate: false };
    }

    return { rate: 0, tier: 'none', isDayRate: false };
  }
}
