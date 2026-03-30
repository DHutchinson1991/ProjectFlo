import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CrewService } from './services/crew.service';
import { CrewManagementService } from './services/crew-management.service';
import { BrandId } from '../../platform/auth/decorators/brand-id.decorator';

@Controller('api/crew')
@UseGuards(AuthGuard('jwt'))
export class CrewController {
  constructor(
    private readonly crewService: CrewService,
    private readonly crewManagementService: CrewManagementService,
  ) {}

  // ─── Crew (brand-scoped) ─────────────────────────────────────────

  /** List all crew for a brand */
  @Get()
  getCrewByBrand(@BrandId() brandId: number) {
    return this.crewService.getCrewByBrand(brandId);
  }

  /** Get crew filtered by job role (for assignment dropdowns) */
  @Get('by-role/:jobRoleId')
  getCrewByJobRole(
    @BrandId() brandId: number,
    @Param('jobRoleId', ParseIntPipe) jobRoleId: number,
  ) {
    return this.crewService.getCrewByJobRole(brandId, jobRoleId);
  }

  /** Get workload summary for all crew */
  @Get('workload')
  getCrewWorkload(@BrandId() brandId: number) {
    return this.crewManagementService.getCrewWorkload(brandId);
  }

  /** Get a single crew record with full details */
  @Get(':id')
  getCrewById(@Param('id', ParseIntPipe) id: number) {
    return this.crewService.getCrewById(id);
  }

  /** Update crew profile (color, bio) */
  @Patch(':id/profile')
  updateCrewProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) dto: { crew_color?: string | null; bio?: string | null },
  ) {
    return this.crewManagementService.updateCrewProfile(id, dto);
  }
}
