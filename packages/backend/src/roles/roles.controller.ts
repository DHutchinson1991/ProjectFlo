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
} from "@nestjs/common";
import { RolesService } from "./roles.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { AuthGuard } from "@nestjs/passport";
import { Roles } from "../auth/decorators/roles.decorator"; // Import Roles decorator
import { RolesGuard } from "../auth/guards/roles.guard"; // Import RolesGuard

@Controller("roles")
@UseGuards(AuthGuard("jwt")) // Protect all routes in this controller with JWT auth
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles("Admin") // Only users with the 'Admin' role can create
  @UseGuards(RolesGuard) // Apply the RolesGuard for this specific route
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  findAll() {
    // Remains accessible to any authenticated user
    return this.rolesService.findAll();
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
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(":id")
  @Roles("Admin") // Only users with the 'Admin' role can delete
  @UseGuards(RolesGuard)
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.rolesService.remove(id);
  }
}
