import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentBracketsService } from './payment-brackets.service';
import { PaymentBracketAssignmentsService } from './services/payment-bracket-assignments.service';
import { CreatePaymentBracketDto } from './dto/create-payment-bracket.dto';
import { UpdatePaymentBracketDto } from './dto/update-payment-bracket.dto';
import { AssignBracketDto } from './dto/assign-bracket.dto';
import { ToggleUnmannedDto } from './dto/toggle-unmanned.dto';
import { FindPaymentBracketsQueryDto } from './dto/find-payment-brackets-query.dto';
import { PaymentBracketsByRoleQueryDto } from './dto/payment-brackets-by-role-query.dto';
import { PaymentBracketsByJobRoleQueryDto } from './dto/payment-brackets-by-job-role-query.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/payment-brackets')
export class PaymentBracketsController {
  constructor(
    private readonly service: PaymentBracketsService,
    private readonly assignmentsService: PaymentBracketAssignmentsService,
  ) {}

  // ─── Bracket CRUD ────────────────────────────────────────

  @Get()
  async findAll(@Query(new ValidationPipe({ transform: true })) query: FindPaymentBracketsQueryDto) {
    return this.service.findAll(query.include_inactive ?? false);
  }

  @Get('by-role')
  async findGroupedByRole(@Query(new ValidationPipe({ transform: true })) query: PaymentBracketsByRoleQueryDto) {
    return this.assignmentsService.getBracketsByRole(query.brandId);
  }

  @Get('job-role/:jobRoleId')
  async findByJobRole(
    @Param('jobRoleId', ParseIntPipe) jobRoleId: number,
    @Query(new ValidationPipe({ transform: true })) query: PaymentBracketsByJobRoleQueryDto,
  ) {
    return this.service.findByJobRole(jobRoleId, query.include_inactive ?? false);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Post()
  async create(@Body(new ValidationPipe({ transform: true })) dto: CreatePaymentBracketDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdatePaymentBracketDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
  }

  // ─── Assignment ──────────────────────────────────────────

  @Post('assign')
  async assignBracket(@Body(new ValidationPipe({ transform: true })) dto: AssignBracketDto) {
    return this.assignmentsService.assignBracket(dto);
  }

  @Delete('contributor/:contributorId/job-role/:jobRoleId')
  async unassignBracket(
    @Param('contributorId', ParseIntPipe) contributorId: number,
    @Param('jobRoleId', ParseIntPipe) jobRoleId: number,
  ) {
    return this.assignmentsService.unassignBracket(contributorId, jobRoleId);
  }

  @Patch('contributor/:contributorId/job-role/:jobRoleId/unmanned')
  async toggleUnmanned(
    @Param('contributorId', ParseIntPipe) contributorId: number,
    @Param('jobRoleId', ParseIntPipe) jobRoleId: number,
    @Body(new ValidationPipe({ transform: true })) body: ToggleUnmannedDto,
  ) {
    return this.assignmentsService.toggleUnmanned(contributorId, jobRoleId, body.is_unmanned);
  }

  // ─── Query helpers ───────────────────────────────────────

  @Get('contributor/:contributorId')
  async findContributorBrackets(
    @Param('contributorId', ParseIntPipe) contributorId: number,
  ) {
    return this.assignmentsService.findContributorBrackets(contributorId);
  }

  @Get('effective-rate/:contributorId/:jobRoleId')
  async findEffectiveRate(
    @Param('contributorId', ParseIntPipe) contributorId: number,
    @Param('jobRoleId', ParseIntPipe) jobRoleId: number,
  ) {
    return this.assignmentsService.findEffectiveRate(contributorId, jobRoleId);
  }
}
