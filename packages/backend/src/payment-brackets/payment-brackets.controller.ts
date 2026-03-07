import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentBracketsService } from './payment-brackets.service';
import {
  CreatePaymentBracketDto,
  UpdatePaymentBracketDto,
  AssignBracketDto,
} from './dto/payment-bracket.dto';

@Controller('payment-brackets')
export class PaymentBracketsController {
  constructor(private readonly service: PaymentBracketsService) {}

  // ─── Bracket CRUD ────────────────────────────────────────

  @Get()
  async getAll(@Query('include_inactive') includeInactive?: string) {
    return this.service.findAll(includeInactive === 'true');
  }

  @Get('by-role')
  async getGroupedByRole(@Query('brandId') brandId?: string) {
    const id = brandId ? parseInt(brandId, 10) : undefined;
    return this.service.getBracketsByRole(id);
  }

  @Get('job-role/:jobRoleId')
  async getByJobRole(
    @Param('jobRoleId', ParseIntPipe) jobRoleId: number,
    @Query('include_inactive') includeInactive?: string,
  ) {
    return this.service.findByJobRole(jobRoleId, includeInactive === 'true');
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Post()
  async create(@Body() dto: CreatePaymentBracketDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePaymentBracketDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.service.delete(id);
  }

  // ─── Assignment ──────────────────────────────────────────

  @Post('assign')
  async assignBracket(@Body() dto: AssignBracketDto) {
    return this.service.assignBracket(dto);
  }

  @Delete('contributor/:contributorId/job-role/:jobRoleId')
  async unassignBracket(
    @Param('contributorId', ParseIntPipe) contributorId: number,
    @Param('jobRoleId', ParseIntPipe) jobRoleId: number,
  ) {
    return this.service.unassignBracket(contributorId, jobRoleId);
  }

  @Patch('contributor/:contributorId/job-role/:jobRoleId/unmanned')
  async toggleUnmanned(
    @Param('contributorId', ParseIntPipe) contributorId: number,
    @Param('jobRoleId', ParseIntPipe) jobRoleId: number,
    @Body() body: { is_unmanned: boolean },
  ) {
    return this.service.toggleUnmanned(contributorId, jobRoleId, body.is_unmanned);
  }

  // ─── Query helpers ───────────────────────────────────────

  @Get('contributor/:contributorId')
  async getContributorBrackets(
    @Param('contributorId', ParseIntPipe) contributorId: number,
  ) {
    return this.service.getContributorBrackets(contributorId);
  }

  @Get('effective-rate/:contributorId/:jobRoleId')
  async getEffectiveRate(
    @Param('contributorId', ParseIntPipe) contributorId: number,
    @Param('jobRoleId', ParseIntPipe) jobRoleId: number,
  ) {
    return this.service.getEffectiveRate(contributorId, jobRoleId);
  }
}
