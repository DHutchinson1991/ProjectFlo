import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PricingService } from './pricing.service';
import { PricingAuditService } from './services/pricing-audit.service';

interface AuthenticatedRequest {
  user: { id: number; email: string };
}

@Controller('api/pricing')
@UseGuards(AuthGuard('jwt'))
export class PricingController {
  constructor(
    private readonly pricingService: PricingService,
    private readonly auditService: PricingAuditService,
  ) {}

  @Get(':brandId/package/:packageId')
  estimatePackagePrice(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('packageId', ParseIntPipe) packageId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.pricingService.estimatePackagePrice(
      packageId,
      brandId,
      req.user.id,
    );
  }

  @Get(':brandId/package/:packageId/audit-rates')
  auditRates(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('packageId', ParseIntPipe) packageId: number,
  ) {
    return this.auditService.auditRates(packageId, brandId);
  }

  @Get(':brandId/inquiry/:inquiryId')
  estimateInquiryPrice(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.pricingService.estimateInquiryPrice(
      inquiryId,
      brandId,
      req.user.id,
    );
  }
}
