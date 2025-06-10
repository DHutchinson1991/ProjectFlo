import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  // UseGuards, // Temporarily commented out
  ParseIntPipe,
} from "@nestjs/common";
import { ContributorsService } from "./contributors.service";
import { CreateContributorDto } from "./dto/create-contributor.dto";
import { UpdateContributorDto } from "./dto/update-contributor.dto";
// import { AuthGuard } from "@nestjs/passport"; // Temporarily commented out
// import { Roles } from "../auth/decorators/roles.decorator"; // Temporarily commented out
// import { RolesGuard } from "../auth/guards/roles.guard"; // Temporarily commented out

@Controller("contributors")
// @UseGuards(AuthGuard('jwt')) // Temporarily commented out
export class ContributorsController {
  constructor(private readonly contributorsService: ContributorsService) {}

  @Post()
  // @Roles('Admin') // Temporarily commented out
  // @UseGuards(RolesGuard) // Temporarily commented out
  create(@Body() createContributorDto: CreateContributorDto) {
    return this.contributorsService.create(createContributorDto);
  }

  @Get()
  findAll() { // Will be public for now
    return this.contributorsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) { // Will be public for now
    return this.contributorsService.findOne(id);
  }

  @Patch(":id")
  // @Roles('Admin') // Temporarily commented out
  // @UseGuards(RolesGuard) // Temporarily commented out
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateContributorDto: UpdateContributorDto,
  ) {
    return this.contributorsService.update(id, updateContributorDto);
  }

  @Delete(":id")
  // @Roles('Admin') // Temporarily commented out
  // @UseGuards(RolesGuard) // Temporarily commented out
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.contributorsService.remove(id);
  }
}
