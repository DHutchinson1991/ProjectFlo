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

  // ─── Crew Members (brand-scoped) ─────────────────────────────────

  /** List all crew members for a brand */
  @Get()
  getCrewByBrand(@BrandId() brandId: number) {
    return this.crewService.getCrewByBrand(brandId);
  }

  /** Get crew members filtered by job role (for assignment dropdowns) */
  @Get('by-role/:jobRoleId')
  getCrewByJobRole(
    @BrandId() brandId: number,
    @Param('jobRoleId', ParseIntPipe) jobRoleId: number,
  ) {
    return this.crewService.getCrewByJobRole(brandId, jobRoleId);
  }

  /** Get workload summary for all crew members */
  @Get('workload')
  getCrewWorkload(@BrandId() brandId: number) {
    return this.crewManagementService.getCrewWorkload(brandId);
  }

  /** Get a single crew member with full details */
  @Get(':id')
  getCrewMemberById(@Param('id', ParseIntPipe) id: number) {
    return this.crewService.getCrewMemberById(id);
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
