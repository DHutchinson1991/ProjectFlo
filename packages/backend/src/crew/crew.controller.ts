import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  Headers,
} from '@nestjs/common';
import { CrewService } from './crew.service';

@Controller('crew')
export class CrewController {
  constructor(private readonly crewService: CrewService) {}

  // ─── Crew Members (brand-scoped) ─────────────────────────────────

  /** List all crew members for a brand */
  @Get('brand/:brandId')
  getCrewByBrand(@Param('brandId', ParseIntPipe) brandId: number) {
    return this.crewService.getCrewByBrand(brandId);
  }

  /** List ALL contributors for a brand (crew + non-crew) */
  @Get('brand/:brandId/all-contributors')
  getAllContributorsByBrand(@Param('brandId', ParseIntPipe) brandId: number) {
    return this.crewService.getAllContributorsByBrand(brandId);
  }

  /** Get crew members filtered by job role (for assignment dropdowns) */
  @Get('brand/:brandId/by-role/:jobRoleId')
  getCrewByJobRole(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('jobRoleId', ParseIntPipe) jobRoleId: number,
  ) {
    return this.crewService.getCrewByJobRole(brandId, jobRoleId);
  }

  /** Get workload summary for all crew members */
  @Get('brand/:brandId/workload')
  getCrewWorkload(@Param('brandId', ParseIntPipe) brandId: number) {
    return this.crewService.getCrewWorkload(brandId);
  }

  /** Get a single crew member with full details */
  @Get(':id')
  getCrewMemberById(@Param('id', ParseIntPipe) id: number) {
    return this.crewService.getCrewMemberById(id);
  }

  /** Toggle crew status + update crew fields */
  @Patch(':id/crew-status')
  setCrewStatus(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-brand-context') brandId: string,
    @Body() dto: { is_crew: boolean; crew_color?: string | null; bio?: string | null },
  ) {
    const brandIdNum = parseInt(brandId);
    return this.crewService.setCrewStatus(id, dto, brandIdNum);
  }

  /** Update crew profile (color, bio, rate) */
  @Patch(':id/profile')
  updateCrewProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { crew_color?: string | null; bio?: string | null; default_hourly_rate?: number },
  ) {
    return this.crewService.updateCrewProfile(id, dto);
  }
}
