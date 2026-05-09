import { Injectable } from '@nestjs/common';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { PrismaService } from '../../../../platform/prisma/prisma.service';

/**
 * Resolves a brand's currency for new service packages, falling back to
 * `DEFAULT_CURRENCY` when the brand has none set. Used by every creator so
 * currency selection stays consistent across catalog and inquiry flows.
 */
@Injectable()
export class BrandCurrencyResolver {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(brandId: number): Promise<string> {
    const brand = await this.prisma.brands.findUnique({
      where: { id: brandId },
      select: { currency: true },
    });
    return brand?.currency || DEFAULT_CURRENCY;
  }
}
