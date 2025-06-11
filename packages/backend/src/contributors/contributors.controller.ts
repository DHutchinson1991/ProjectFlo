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
} from "@nestjs/common";
import { ContributorsService } from "./contributors.service";
import { CreateContributorDto } from "./dto/create-contributor.dto";
import { UpdateContributorDto } from "./dto/update-contributor.dto";
import { AuthGuard } from "@nestjs/passport"; // Import AuthGuard
import { Roles } from "../auth/decorators/roles.decorator"; // Import Roles decorator
import { RolesGuard } from "../auth/guards/roles.guard"; // Import RolesGuard

@Controller("contributors")
@UseGuards(AuthGuard("jwt")) // Protect all routes in this controller
export class ContributorsController {
  constructor(private readonly contributorsService: ContributorsService) {}

  @Post()
  @Roles("Admin") // Only users with the 'Admin' role can create
  @UseGuards(RolesGuard)
  create(@Body() createContributorDto: CreateContributorDto) {
    return this.contributorsService.create(createContributorDto);
  }

  @Get()
  findAll() {
    return this.contributorsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.contributorsService.findOne(id);
  }

  @Patch(":id")
  @Roles("Admin") // Only users with the 'Admin' role can update
  @UseGuards(RolesGuard)
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateContributorDto: UpdateContributorDto,
  ) {
    return this.contributorsService.update(id, updateContributorDto);
  }

  @Delete(":id")
  @Roles("Admin") // Only users with the 'Admin' role can delete
  @UseGuards(RolesGuard)
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.contributorsService.remove(id);
  }
}
