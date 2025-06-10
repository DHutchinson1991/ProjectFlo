import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { ContributorsService } from "./contributors.service";
import { CreateContributorDto } from "./dto/create-contributor.dto";
import { UpdateContributorDto } from "./dto/update-contributor.dto";

@Controller("contributors")
export class ContributorsController {
  constructor(private readonly contributorsService: ContributorsService) {}

  @Post()
  create(@Body() createContributorDto: CreateContributorDto) {
    return this.contributorsService.create(createContributorDto);
  }

  @Get()
  findAll() {
    return this.contributorsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.contributorsService.findOne(+id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateContributorDto: UpdateContributorDto,
  ) {
    return this.contributorsService.update(+id, updateContributorDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.contributorsService.remove(+id);
  }
}
