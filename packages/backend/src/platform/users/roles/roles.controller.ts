import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  ValidationPipe,
} from "@nestjs/common";
import { RolesService } from "./roles.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { RolesQueryDto } from './dto/roles-query.dto';
import { AuthGuard } from "@nestjs/passport";
import { Roles } from "../../auth/decorators/roles.decorator"; // Import Roles decorator
import { RolesGuard } from "../../auth/guards/roles.guard"; // Import RolesGuard

@Controller("api/roles")
@UseGuards(AuthGuard("jwt"))
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  @Post()
  @Roles("Admin") // Only users with the 'Admin' role can create
  @UseGuards(RolesGuard) // Apply the RolesGuard for this specific route
  create(@Body(new ValidationPipe({ transform: true })) createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  findAll(@Query(new ValidationPipe({ transform: true })) query: RolesQueryDto) {
    // Remains accessible to any authenticated user
    return this.rolesService.findAll(query.brandId);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    // Remains accessible to any authenticated user
    return this.rolesService.findOne(id);
  }

  @Patch(":id")
  @Roles("Admin") // Only users with the 'Admin' role can update
  @UseGuards(RolesGuard)
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(":id")
  @Roles("Admin") // Only users with the 'Admin' role can delete
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.rolesService.remove(id);
    return;
  }
}
