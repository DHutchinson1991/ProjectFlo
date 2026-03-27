import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
  Headers,
  ValidationPipe,
} from "@nestjs/common";
import { ContributorsService } from "./contributors.service";
import { ContributorJobRolesService } from "./services/contributor-job-roles.service";
import { CreateContributorDto } from "./dto/create-contributor.dto";
import { UpdateContributorDto } from "./dto/update-contributor.dto";
import { AddJobRoleDto } from "./dto/add-job-role.dto";
import { ContributorsQueryDto } from './dto/contributors-query.dto';
import { AuthGuard } from "@nestjs/passport";
import { Roles } from "../../auth/decorators/roles.decorator";
import { RolesGuard } from "../../auth/guards/roles.guard";

@Controller("api/contributors")
@UseGuards(AuthGuard("jwt"))
export class ContributorsController {
  constructor(
    private readonly contributorsService: ContributorsService,
    private readonly contributorJobRolesService: ContributorJobRolesService,
  ) { }

  @Post()
  @Roles("Admin", "Global Admin") // Allow Admin or Global Admin roles to create
  @UseGuards(RolesGuard)
  create(@Body(new ValidationPipe({ transform: true })) createContributorDto: CreateContributorDto) {
    return this.contributorsService.create(createContributorDto);
  }

  @Get()
  findAll(
    @Query(new ValidationPipe({ transform: true })) query: ContributorsQueryDto,
    @Headers('x-brand-context') brandContext?: string
  ) {
    const effectiveBrandId = brandContext || (query.brandId !== undefined ? String(query.brandId) : undefined);
    const brandIdNumber = effectiveBrandId ? parseInt(effectiveBrandId, 10) : undefined;

    return this.contributorsService.findAll(brandIdNumber);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.contributorsService.findOne(id);
  }

  @Patch(":id")
  @Roles("Admin", "Global Admin") // Allow Admin or Global Admin roles to update
  @UseGuards(RolesGuard)
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) updateContributorDto: UpdateContributorDto,
  ) {
    return this.contributorsService.update(id, updateContributorDto);
  }

  @Delete(":id")
  @Roles("Admin", "Global Admin") // Allow Admin or Global Admin roles to delete
  @UseGuards(RolesGuard)
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.contributorsService.remove(id);
  }

  // Job role management endpoints
  @Post(":id/job-roles")
  @Roles("Admin", "Global Admin")
  @UseGuards(RolesGuard)
  addJobRole(
    @Param("id", ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) dto: AddJobRoleDto,
  ) {
    return this.contributorJobRolesService.addJobRole(id, dto.job_role_id);
  }

  @Delete(":id/job-roles/:jobRoleId")
  @Roles("Admin", "Global Admin")
  @UseGuards(RolesGuard)
  removeJobRole(
    @Param("id", ParseIntPipe) id: number,
    @Param("jobRoleId", ParseIntPipe) jobRoleId: number,
  ) {
    return this.contributorJobRolesService.removeJobRole(id, jobRoleId);
  }

  @Put(":id/job-roles/:jobRoleId/primary")
  @Roles("Admin", "Global Admin")
  @UseGuards(RolesGuard)
  setPrimaryJobRole(
    @Param("id", ParseIntPipe) id: number,
    @Param("jobRoleId", ParseIntPipe) jobRoleId: number,
  ) {
    return this.contributorJobRolesService.setPrimaryJobRole(id, jobRoleId);
  }
}
