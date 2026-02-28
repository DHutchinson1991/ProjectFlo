import { Controller, Get, Post, Body, Param, Headers, HttpCode } from '@nestjs/common';
import { WeddingTypesService } from './wedding-types.service';
import { CreatePackageFromWeddingTypeDto } from './dto/create-package-from-wedding-type.dto';

@Controller('wedding-types')
export class WeddingTypesController {
  constructor(private readonly weddingTypesService: WeddingTypesService) {}

  /**
   * GET /wedding-types
   * Get all available wedding types for the brand (system-seeded + brand-specific)
   */
  @Get()
  async findAll(@Headers('x-brand-context') brandIdHeader: string) {
    const brandId = parseInt(brandIdHeader, 10);
    return this.weddingTypesService.findAll(brandId);
  }

  /**
   * GET /wedding-types/system-seeded
   * Get only system-seeded wedding types available to all brands
   */
  @Get('system-seeded')
  async findSystemSeeded() {
    return this.weddingTypesService.findSystemSeeded();
  }

  /**
   * GET /wedding-types/brand-specific
   * Get brand-specific wedding type overrides
   */
  @Get('brand-specific')
  async findBrandSpecific(@Headers('x-brand-context') brandIdHeader: string) {
    const brandId = parseInt(brandIdHeader, 10);
    return this.weddingTypesService.findBrandSpecific(brandId);
  }

  /**
   * GET /wedding-types/:id
   * Get a specific wedding type with all activities and moments (for preview)
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Headers('x-brand-context') brandIdHeader: string,
  ) {
    const weddingTypeId = parseInt(id, 10);
    const brandId = parseInt(brandIdHeader, 10);
    return this.weddingTypesService.findOne(weddingTypeId, brandId);
  }

  /**
   * POST /wedding-types/:id/create-package
   * Create a new service package from a wedding type template
   * Automatically populates event days, activities, and moments
   *
   * Body: {
   *   packageName: string;
   *   packageDescription?: string;
   * }
   *
   * Returns: The newly created service package with all related data
   */
  @Post(':id/create-package')
  @HttpCode(201)
  async createPackageFromTemplate(
    @Param('id') id: string,
    @Headers('x-brand-context') brandIdHeader: string,
    @Body() createPackageDto: CreatePackageFromWeddingTypeDto,
  ) {
    const weddingTypeId = parseInt(id, 10);
    const brandId = parseInt(brandIdHeader, 10);

    return this.weddingTypesService.createPackageFromTemplate(
      brandId,
      weddingTypeId,
      createPackageDto.packageName,
      createPackageDto.packageDescription,
    );
  }
}
