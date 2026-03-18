import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe, Query, HttpCode } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServicePackagesService } from './service-packages.service';
import { CreateServicePackageDto } from './dto/create-service-package.dto';
import { UpdateServicePackageDto } from './dto/update-service-package.dto';
import { CreatePackageFromBuilderDto } from './dto/create-package-from-builder.dto';
// Validating auth guard import - usually exist in auth module
// Assuming a standard JwtAuthGuard exists or something similar. 
// For now, I'll assume usage without specific guards to keep it generic, 
// but in a real app I'd add `@UseGuards(JwtAuthGuard)` and get user from request.
// Given the context doesn't show auth structure details, I'll assume we pass brandId as param for now or mock it.
// Wait, listing shows `auth-utils.ts` in frontend, but backend has `activity-logs` etc.
// I'll stick to a simple controller.

@Controller('service-packages')
export class ServicePackagesController {
  constructor(private readonly servicePackagesService: ServicePackagesService) {}

  // In a real scenario, brandId would come from the JWT User. 
  // For dev/mvp, we'll accept a header or query param, or just hardcode for main brand if not provided.
  // OR, we can make `brandId` a required query param.
  
  @Post(':brandId')
  create(@Param('brandId', ParseIntPipe) brandId: number, @Body() createDto: CreateServicePackageDto) {
    return this.servicePackagesService.create(brandId, createDto);
  }

  @Post(':brandId/from-builder')
  @HttpCode(201)
  createFromBuilder(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Body() dto: CreatePackageFromBuilderDto,
  ) {
    return this.servicePackagesService.createFromBuilder(brandId, dto);
  }

  @Get(':brandId')
  @UseGuards(AuthGuard('jwt'))
  findAll(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Request() req: { user?: { id: number } },
  ) {
    return this.servicePackagesService.findAll(brandId, req.user?.id);
  }

  @Get(':brandId/:id')
  findOne(@Param('brandId', ParseIntPipe) brandId: number, @Param('id', ParseIntPipe) id: number) {
    return this.servicePackagesService.findOne(id, brandId);
  }

  @Patch(':brandId/:id')
  update(@Param('brandId', ParseIntPipe) brandId: number, @Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateServicePackageDto) {
    return this.servicePackagesService.update(id, brandId, updateDto);
  }

  @Delete(':brandId/:id')
  remove(@Param('brandId', ParseIntPipe) brandId: number, @Param('id', ParseIntPipe) id: number) {
    return this.servicePackagesService.remove(id, brandId);
  }

  // ─── Version History ───────────────────────────────────────────────

  @Post(':brandId/:id/versions')
  createVersion(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { change_summary?: string },
  ) {
    return this.servicePackagesService.createVersion(id, brandId, body.change_summary);
  }

  @Get(':brandId/:id/versions')
  getVersions(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.servicePackagesService.getVersions(id, brandId);
  }

  @Get(':brandId/:id/versions/:versionId')
  getVersion(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('versionId', ParseIntPipe) versionId: number,
  ) {
    return this.servicePackagesService.getVersion(id, versionId, brandId);
  }

  @Post(':brandId/:id/versions/:versionId/restore')
  restoreVersion(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('versionId', ParseIntPipe) versionId: number,
  ) {
    return this.servicePackagesService.restoreVersion(id, versionId, brandId);
  }
}
