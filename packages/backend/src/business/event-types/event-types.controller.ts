import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  HttpCode,
  ParseIntPipe,
} from '@nestjs/common';
import { EventTypesService } from './event-types.service';
import {
  CreateEventTypeDto,
  UpdateEventTypeDto,
  LinkEventDayDto,
  LinkSubjectTypeDto,
} from './dto/event-type.dto';
import { CreatePackageFromEventTypeDto } from './dto/create-package-from-event-type.dto';

@Controller('event-types')
export class EventTypesController {
  constructor(private readonly eventTypesService: EventTypesService) {}

  // ────────────────────────── CRUD ──────────────────────────

  /** GET /event-types — list all active event types for the brand */
  @Get()
  findAll(@Headers('x-brand-context') brandIdHeader: string) {
    const brandId = parseInt(brandIdHeader, 10);
    return this.eventTypesService.findAll(brandId);
  }

  /** GET /event-types/:id — single event type with deep includes */
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-brand-context') brandIdHeader: string,
  ) {
    const brandId = parseInt(brandIdHeader, 10);
    return this.eventTypesService.findOne(id, brandId);
  }

  /** POST /event-types — create a new event type */
  @Post()
  @HttpCode(201)
  create(
    @Headers('x-brand-context') brandIdHeader: string,
    @Body() dto: CreateEventTypeDto,
  ) {
    const brandId = parseInt(brandIdHeader, 10);
    return this.eventTypesService.create(brandId, dto);
  }

  /** PATCH /event-types/:id — update an event type */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-brand-context') brandIdHeader: string,
    @Body() dto: UpdateEventTypeDto,
  ) {
    const brandId = parseInt(brandIdHeader, 10);
    return this.eventTypesService.update(id, brandId, dto);
  }

  /** DELETE /event-types/:id — delete an event type */
  @Delete(':id')
  @HttpCode(204)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-brand-context') brandIdHeader: string,
  ) {
    const brandId = parseInt(brandIdHeader, 10);
    return this.eventTypesService.remove(id, brandId);
  }

  // ────────────────────── EVENT DAY LINKS ──────────────────────

  /** POST /event-types/:id/event-days — link an event day template */
  @Post(':id/event-days')
  @HttpCode(201)
  linkEventDay(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-brand-context') brandIdHeader: string,
    @Body() dto: LinkEventDayDto,
  ) {
    const brandId = parseInt(brandIdHeader, 10);
    return this.eventTypesService.linkEventDay(id, brandId, dto);
  }

  /** DELETE /event-types/:id/event-days/:dayId — unlink an event day template */
  @Delete(':id/event-days/:dayId')
  @HttpCode(204)
  unlinkEventDay(
    @Param('id', ParseIntPipe) id: number,
    @Param('dayId', ParseIntPipe) dayId: number,
    @Headers('x-brand-context') brandIdHeader: string,
  ) {
    const brandId = parseInt(brandIdHeader, 10);
    return this.eventTypesService.unlinkEventDay(id, dayId, brandId);
  }

  // ────────────────────── SUBJECT TYPE LINKS ──────────────────────

  /** POST /event-types/:id/subject-types — link a subject type template */
  @Post(':id/subject-types')
  @HttpCode(201)
  linkSubjectType(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-brand-context') brandIdHeader: string,
    @Body() dto: LinkSubjectTypeDto,
  ) {
    const brandId = parseInt(brandIdHeader, 10);
    return this.eventTypesService.linkSubjectType(id, brandId, dto);
  }

  /** DELETE /event-types/:id/subject-types/:subjectTypeId — unlink a subject type */
  @Delete(':id/subject-types/:subjectTypeId')
  @HttpCode(204)
  unlinkSubjectType(
    @Param('id', ParseIntPipe) id: number,
    @Param('subjectTypeId', ParseIntPipe) subjectTypeId: number,
    @Headers('x-brand-context') brandIdHeader: string,
  ) {
    const brandId = parseInt(brandIdHeader, 10);
    return this.eventTypesService.unlinkSubjectType(
      id,
      subjectTypeId,
      brandId,
    );
  }

  // ────────────────────── PACKAGE CREATION ──────────────────────

  /** POST /event-types/:id/create-package — create a package from wizard selections */
  @Post(':id/create-package')
  @HttpCode(201)
  createPackage(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-brand-context') brandIdHeader: string,
    @Body() dto: CreatePackageFromEventTypeDto,
  ) {
    const brandId = parseInt(brandIdHeader, 10);
    return this.eventTypesService.createPackageFromEventType(brandId, id, dto);
  }
}
