import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe, HttpCode, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PackagesService } from './packages.service';
import { PackageCreationService } from './creation/package-creation.service';
import { PackageVersionsService } from './services/package-versions.service';
import { PackageAiRunsService } from './services/package-ai-runs.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { CreatePackageFromBuilderDto } from './dto/create-package-from-builder.dto';
import { CreatePackageFromEventTypeDto } from './creation/dto/create-package-from-event-type.dto';
import { CreatePackageVersionDto } from './dto/create-package-version.dto';
import { BrandId } from '../../platform/auth/decorators/brand-id.decorator';

@Controller('api/packages')
@UseGuards(AuthGuard('jwt'))
export class PackagesController {
  constructor(
    private readonly servicePackagesService: PackagesService,
    private readonly packageCreationService: PackageCreationService,
    private readonly versionsService: PackageVersionsService,
    private readonly aiRunsService: PackageAiRunsService,
  ) {}
  
  @Post()
  create(
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) createDto: CreatePackageDto,
  ) {
    return this.servicePackagesService.create(brandId, createDto);
  }

  @Post('from-builder')
  @HttpCode(201)
  createFromBuilder(
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreatePackageFromBuilderDto,
  ) {
    return this.packageCreationService.createForInquiry(brandId, dto);
  }

  /**
  /**
   * POST /api/packages/from-template/:packageTemplateId
   * Catalog-level creation: builds a reusable package from a PackageTemplate.
   */
  @Post('from-template/:packageTemplateId')
  @HttpCode(201)
  createFromTemplate(
    @Param('packageTemplateId', ParseIntPipe) packageTemplateId: number,
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreatePackageFromEventTypeDto,
  ) {
    return this.packageCreationService.createForCatalog(brandId, packageTemplateId, dto);
  }

  @Get()
  findAll(
    @BrandId() brandId: number,
    @Request() req: { user?: { id: number } },
  ) {
    return this.servicePackagesService.findAll(brandId, req.user?.id);
  }

  @Get(':id/traceability')
  getTraceability(
    @BrandId() brandId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.servicePackagesService.findTraceability(id, brandId);
  }

  @Get(':id')
  findOne(
    @BrandId() brandId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.servicePackagesService.findOne(id, brandId);
  }

  @Get(':id/ai-runs')
  getAiRuns(
    @BrandId() brandId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.aiRunsService.findAll(id, brandId);
  }

  @Get(':id/ai-runs/:runId')
  getAiRun(
    @BrandId() brandId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('runId') runId: string,
  ) {
    return this.aiRunsService.findOne(id, runId, brandId);
  }

  @Post(':id/ai-runs/:runId/cancel')
  @HttpCode(200)
  cancelAiRun(
    @BrandId() brandId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('runId') runId: string,
  ) {
    return this.aiRunsService.cancelPlanningRun(id, runId, brandId);
  }

  @Patch(':id')
  update(
    @BrandId() brandId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) updateDto: UpdatePackageDto,
  ) {
    return this.servicePackagesService.update(id, brandId, updateDto);
  }

  @Delete(':id')
  remove(
    @BrandId() brandId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.servicePackagesService.remove(id, brandId);
  }

  // ─── Version History ───────────────────────────────────────────────

  @Post(':id/versions')
  createVersion(
    @BrandId() brandId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) body: CreatePackageVersionDto,
  ) {
    return this.versionsService.createVersion(id, brandId, body.change_summary);
  }

  @Get(':id/versions')
  getVersions(
    @BrandId() brandId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.versionsService.getVersions(id, brandId);
  }

  @Get(':id/versions/:versionId')
  getVersion(
    @BrandId() brandId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('versionId', ParseIntPipe) versionId: number,
  ) {
    return this.versionsService.getVersion(id, versionId, brandId);
  }

  @Post(':id/versions/:versionId/restore')
  restoreVersion(
    @BrandId() brandId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('versionId', ParseIntPipe) versionId: number,
  ) {
    return this.versionsService.restoreVersion(id, versionId, brandId);
  }
}
