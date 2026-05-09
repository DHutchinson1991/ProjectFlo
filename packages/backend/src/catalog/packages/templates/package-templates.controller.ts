import { Controller, Get, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PackageTemplatesService } from './package-templates.service';
import { BrandId } from '../../../platform/auth/decorators/brand-id.decorator';

@Controller('api/package-templates')
@UseGuards(AuthGuard('jwt'))
export class PackageTemplatesController {
  constructor(
    private readonly packageTemplatesService: PackageTemplatesService,
  ) {}

  /**
   * GET /api/package-templates
   * All package templates visible to the brand (system-seeded + brand-specific).
   */
  @Get()
  async findAll(@BrandId() brandId: number) {
    return this.packageTemplatesService.findAll(brandId);
  }

  /**
   * GET /api/package-templates/system-seeded
   * Only system-seeded package templates.
   */
  @Get('system-seeded')
  async findSystemSeeded() {
    return this.packageTemplatesService.findSystemSeeded();
  }

  /**
   * GET /api/package-templates/brand-specific
   * Only brand-specific package templates.
   */
  @Get('brand-specific')
  async findBrandSpecific(@BrandId() brandId: number) {
    return this.packageTemplatesService.findBrandSpecific(brandId);
  }

  /**
   * GET /api/package-templates/:id
   * A single template with all activities, moments, locations, subjects.
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @BrandId() brandId: number,
  ) {
    return this.packageTemplatesService.findOne(id, brandId);
  }
}
