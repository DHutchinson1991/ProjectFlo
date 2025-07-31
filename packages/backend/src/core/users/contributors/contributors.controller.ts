import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards, // Import UseGuards
  ParseIntPipe, // Import ParseIntPipe
  Query, // Import Query
  Headers, // Import Headers
} from "@nestjs/common";
import { ContributorsService } from "./contributors.service";
import { CreateContributorDto } from "./dto/create-contributor.dto";
import { UpdateContributorDto } from "./dto/update-contributor.dto";
import { AuthGuard } from "@nestjs/passport"; // Import AuthGuard
import { Roles } from "../../auth/decorators/roles.decorator"; // Import Roles decorator
import { RolesGuard } from "../../auth/guards/roles.guard"; // Import RolesGuard

@Controller("contributors")
@UseGuards(AuthGuard("jwt")) // Protect all routes in this controller
export class ContributorsController {
  constructor(private readonly contributorsService: ContributorsService) { }

  @Post()
  @Roles("Admin", "Global Admin") // Allow Admin or Global Admin roles to create
  @UseGuards(RolesGuard)
  create(@Body() createContributorDto: CreateContributorDto) {
    return this.contributorsService.create(createContributorDto);
  }

  @Get()
  findAll(
    @Query('brandId') brandId?: string,
    @Headers('x-brand-context') brandContext?: string
  ) {
    // Debug logging
    console.log('🔍 Contributors API - Query brandId:', brandId);
    console.log('🔍 Contributors API - Header brandContext:', brandContext);

    // Use brand context header if available, otherwise fall back to query parameter
    const effectiveBrandId = brandContext || brandId;
    const brandIdNumber = effectiveBrandId ? parseInt(effectiveBrandId, 10) : undefined;

    console.log('🔍 Contributors API - Effective brandId:', brandIdNumber);

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
    @Body() updateContributorDto: UpdateContributorDto,
  ) {
    return this.contributorsService.update(id, updateContributorDto);
  }

  @Delete(":id")
  @Roles("Admin", "Global Admin") // Allow Admin or Global Admin roles to delete
  @UseGuards(RolesGuard)
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.contributorsService.remove(id);
  }
}
