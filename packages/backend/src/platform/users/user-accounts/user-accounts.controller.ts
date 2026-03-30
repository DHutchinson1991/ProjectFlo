import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
  Headers,
  ValidationPipe,
} from "@nestjs/common";
import { UserAccountsService } from "./user-accounts.service";
import { CreateUserAccountDto } from "./dto/create-user-account.dto";
import { UpdateUserAccountDto } from "./dto/update-user-account.dto";
import { UserAccountsQueryDto } from './dto/user-accounts-query.dto';
import { AuthGuard } from "@nestjs/passport";
import { Roles } from "../../auth/decorators/roles.decorator";
import { RolesGuard } from "../../auth/guards/roles.guard";

@Controller("api/user-accounts")
@UseGuards(AuthGuard("jwt"))
export class UserAccountsController {
  constructor(private readonly userAccountsService: UserAccountsService) { }

  @Post()
  @Roles("Admin", "Global Admin")
  @UseGuards(RolesGuard)
  create(@Body(new ValidationPipe({ transform: true })) createUserAccountDto: CreateUserAccountDto) {
    return this.userAccountsService.create(createUserAccountDto);
  }

  @Get()
  findAll(
    @Query(new ValidationPipe({ transform: true })) query: UserAccountsQueryDto,
    @Headers('x-brand-context') brandContext?: string
  ) {
    const effectiveBrandId = brandContext || (query.brandId !== undefined ? String(query.brandId) : undefined);
    const brandIdNumber = effectiveBrandId ? parseInt(effectiveBrandId, 10) : undefined;
    return this.userAccountsService.findAll(brandIdNumber);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.userAccountsService.findOne(id);
  }

  @Patch(":id")
  @Roles("Admin", "Global Admin")
  @UseGuards(RolesGuard)
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) updateUserAccountDto: UpdateUserAccountDto,
  ) {
    return this.userAccountsService.update(id, updateUserAccountDto);
  }

  @Delete(":id")
  @Roles("Admin", "Global Admin")
  @UseGuards(RolesGuard)
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.userAccountsService.remove(id);
  }
}
