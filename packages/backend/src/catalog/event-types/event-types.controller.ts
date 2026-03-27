import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  ParseIntPipe,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EventTypesService } from './event-types.service';
import { EventTypesLinkingService } from './services/event-types-linking.service';
import { EventTypesPackageBuilderService } from './services/event-types-package-builder.service';
import { CreateEventTypeDto } from './dto/create-event-type.dto';
import { UpdateEventTypeDto } from './dto/update-event-type.dto';
import { LinkEventDayDto } from './dto/link-event-day.dto';
import { LinkSubjectRoleDto } from './dto/link-subject-role.dto';
import { CreatePackageFromEventTypeDto } from './dto/create-package-from-event-type.dto';
import { BrandId } from '../../platform/auth/decorators/brand-id.decorator';

@Controller('api/event-types')
@UseGuards(AuthGuard('jwt'))
export class EventTypesController {
  constructor(
    private readonly eventTypesService: EventTypesService,
    private readonly linkingService: EventTypesLinkingService,
    private readonly packageBuilderService: EventTypesPackageBuilderService,
  ) {}

  // ────────────────────────── CRUD ──────────────────────────

  /** GET /event-types — list all active event types for the brand */
  @Get()
  findAll(@BrandId() brandId: number) {
    return this.eventTypesService.findAll(brandId);
  }

  /** GET /event-types/:id — single event type with deep includes */
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @BrandId() brandId: number,
  ) {
    return this.eventTypesService.findOne(id, brandId);
  }

  /** POST /event-types — create a new event type */
  @Post()
  @HttpCode(201)
  create(
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreateEventTypeDto,
  ) {
    return this.eventTypesService.create(brandId, dto);
  }

  /** PATCH /event-types/:id — update an event type */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateEventTypeDto,
  ) {
    return this.eventTypesService.update(id, brandId, dto);
  }

  /** DELETE /event-types/:id — delete an event type */
  @Delete(':id')
  @HttpCode(204)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @BrandId() brandId: number,
  ) {
    return this.eventTypesService.remove(id, brandId);
  }

  // ────────────────────── EVENT DAY LINKS ──────────────────────

  /** POST /event-types/:id/event-days — link an event day template */
  @Post(':id/event-days')
  @HttpCode(201)
  linkEventDay(
    @Param('id', ParseIntPipe) id: number,
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: LinkEventDayDto,
  ) {
    return this.linkingService.linkEventDay(id, brandId, dto);
  }

  /** DELETE /event-types/:id/event-days/:dayId — unlink an event day template */
  @Delete(':id/event-days/:dayId')
  @HttpCode(204)
  unlinkEventDay(
    @Param('id', ParseIntPipe) id: number,
    @Param('dayId', ParseIntPipe) dayId: number,
    @BrandId() brandId: number,
  ) {
    return this.linkingService.unlinkEventDay(id, dayId, brandId);
  }

  // ────────────────────── SUBJECT ROLE LINKS ──────────────────────

  /** POST /event-types/:id/subject-roles — link a subject role */
  @Post(':id/subject-roles')
  @HttpCode(201)
  linkSubjectRole(
    @Param('id', ParseIntPipe) id: number,
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: LinkSubjectRoleDto,
  ) {
    return this.linkingService.linkSubjectRole(id, brandId, dto);
  }

  /** DELETE /event-types/:id/subject-roles/:subjectRoleId — unlink a subject role */
  @Delete(':id/subject-roles/:subjectRoleId')
  @HttpCode(204)
  unlinkSubjectRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('subjectRoleId', ParseIntPipe) subjectRoleId: number,
    @BrandId() brandId: number,
  ) {
    return this.linkingService.unlinkSubjectRole(id, subjectRoleId, brandId);
  }

  // ────────────────────── PACKAGE CREATION ──────────────────────

  /** POST /event-types/:id/create-package — create a package from wizard selections */
  @Post(':id/create-package')
  @HttpCode(201)
  createPackage(
    @Param('id', ParseIntPipe) id: number,
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreatePackageFromEventTypeDto,
  ) {
    return this.packageBuilderService.createPackageFromEventType(brandId, id, dto);
  }
}
