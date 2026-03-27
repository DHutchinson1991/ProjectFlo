import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe, HttpCode, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServicePackagesService } from './service-packages.service';
import { ServicePackagesBuilderService } from './services/service-packages-builder.service';
import { ServicePackagesVersionsService } from './services/service-packages-versions.service';
import { CreateServicePackageDto } from './dto/create-service-package.dto';
import { UpdateServicePackageDto } from './dto/update-service-package.dto';
import { CreatePackageFromBuilderDto } from './dto/create-package-from-builder.dto';
import { CreateServicePackageVersionDto } from './dto/create-service-package-version.dto';
import { BrandId } from '../../platform/auth/decorators/brand-id.decorator';

@Controller('api/service-packages')
@UseGuards(AuthGuard('jwt'))
export class ServicePackagesController {
  constructor(
    private readonly servicePackagesService: ServicePackagesService,
    private readonly builderService: ServicePackagesBuilderService,
    private readonly versionsService: ServicePackagesVersionsService,
  ) {}
  
  @Post()
  create(
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) createDto: CreateServicePackageDto,
  ) {
    return this.servicePackagesService.create(brandId, createDto);
  }

  @Post('from-builder')
  @HttpCode(201)
  createFromBuilder(
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreatePackageFromBuilderDto,
  ) {
    return this.builderService.createFromBuilder(brandId, dto);
  }

  @Get()
  findAll(
    @BrandId() brandId: number,
    @Request() req: { user?: { id: number } },
  ) {
    return this.servicePackagesService.findAll(brandId, req.user?.id);
  }

  @Get(':id')
  findOne(
    @BrandId() brandId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.servicePackagesService.findOne(id, brandId);
  }

  @Patch(':id')
  update(
    @BrandId() brandId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) updateDto: UpdateServicePackageDto,
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
    @Body(new ValidationPipe({ transform: true })) body: CreateServicePackageVersionDto,
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
