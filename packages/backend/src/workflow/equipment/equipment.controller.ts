import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
    Query,
    HttpCode,
    HttpStatus,
    ParseEnumPipe,
    ValidationPipe,
    Headers,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EquipmentService } from './equipment.service';
import { EquipmentQueryService } from './equipment-query.service';
import { EquipmentAvailabilityService } from './equipment-availability.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { CreateEquipmentAvailabilityDto } from './dto/create-equipment-availability.dto';
import { UpdateEquipmentAvailabilityDto } from './dto/update-equipment-availability.dto';
import { EquipmentAvailabilityQueryDto } from './dto/equipment-availability-query.dto';
import { EquipmentFiltersQueryDto } from './dto/equipment-filters-query.dto';
import { EquipmentAvailableQueryDto } from './dto/equipment-available-query.dto';
import { EquipmentCategory, EquipmentType, EquipmentCondition, EquipmentAvailability } from '@prisma/client';

@Controller('api/equipment')
@UseGuards(AuthGuard('jwt'))
export class EquipmentController {
    constructor(
        private readonly equipmentService: EquipmentService,
        private readonly equipmentQueryService: EquipmentQueryService,
        private readonly equipmentAvailabilityService: EquipmentAvailabilityService,
    ) { }

    @Post()
    create(
        @Body(new ValidationPipe({ transform: true })) createEquipmentDto: CreateEquipmentDto,
        @Headers('x-brand-context') brandId?: string,
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.equipmentService.create(createEquipmentDto, parsedBrandId);
    }

    @Get()
    findAll(
        @Query(new ValidationPipe({ transform: true })) query: EquipmentFiltersQueryDto,
        @Headers('x-brand-context') brandIdHeader?: string,
    ) {
        const brandId = brandIdHeader ? parseInt(brandIdHeader) : undefined;
        return this.equipmentService.findAll({ brandId, ...query });
    }

    @Get('available')
    findAvailable(
        @Query(new ValidationPipe({ transform: true })) query: EquipmentAvailableQueryDto,
        @Headers('x-brand-context') brandId?: string
    ) {
        const { startDate, endDate } = query;
        if (!startDate || !endDate) {
            throw new BadRequestException('Start date and end date are required for availability check');
        }
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.equipmentQueryService.findAvailable(new Date(startDate), new Date(endDate), parsedBrandId);
    }

    @Get('category/:category')
    findByCategory(
        @Param('category', new ParseEnumPipe(EquipmentCategory)) category: EquipmentCategory,
        @Headers('x-brand-context') brandId?: string
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.equipmentQueryService.findByCategory(category, parsedBrandId);
    }

    @Get('grouped')
    findGroupedByCategory(@Headers('x-brand-context') brandId?: string) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.equipmentQueryService.findGroupedByCategory(parsedBrandId);
    }

    @Get('availability/calendar')
    getAvailabilityCalendar(
        @Query(new ValidationPipe({ transform: true })) queryDto: EquipmentAvailabilityQueryDto,
        @Headers('x-brand-context') brandId?: string
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.equipmentAvailabilityService.getAvailabilityCalendar(queryDto);
    }

    @Get('unmanned/:brandId')
    findUnmannedEquipment(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Headers('x-brand-context') brandIdHeader?: string
    ) {
        const parsedBrandId = brandIdHeader ? parseInt(brandIdHeader) : brandId;
        return this.equipmentQueryService.findUnmannedEquipment(parsedBrandId);
    }

    @Get(':id')
    findOne(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId?: string
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.equipmentService.findOne(id, parsedBrandId);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) updateEquipmentDto: UpdateEquipmentDto,
        @Headers('x-brand-context') brandId?: string
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.equipmentService.update(id, updateEquipmentDto, parsedBrandId);
    }

    @Patch(':id/availability')
    updateAvailability(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) updateData: { status: EquipmentAvailability },
        @Headers('x-brand-context') brandId?: string
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.equipmentService.updateAvailability(id, updateData.status, parsedBrandId);
    }

    @Patch(':id/unmanned')
    setUnmannedStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) body: { isUnmanned: boolean },
        @Headers('x-brand-context') brandId?: string
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.equipmentService.setUnmannedStatus(id, body.isUnmanned, parsedBrandId);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId?: string
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.equipmentService.remove(id, parsedBrandId);
    }

    @Get(':id/availability')
    getEquipmentAvailability(
        @Param('id', ParseIntPipe) equipmentId: number,
        @Query(new ValidationPipe({ transform: true })) queryDto: EquipmentAvailabilityQueryDto,
        @Headers('x-brand-context') brandId?: string
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.equipmentAvailabilityService.getEquipmentAvailability(equipmentId, queryDto);
    }

    @Post(':id/availability')
    createAvailabilitySlot(
        @Param('id', ParseIntPipe) equipmentId: number,
        @Body(new ValidationPipe({ transform: true })) createDto: CreateEquipmentAvailabilityDto,
        @Headers('x-brand-context') brandId?: string
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.equipmentAvailabilityService.createAvailabilitySlot(equipmentId, createDto);
    }

    @Patch('availability/:availabilityId')
    updateAvailabilitySlot(
        @Param('availabilityId', ParseIntPipe) availabilityId: number,
        @Body(new ValidationPipe({ transform: true })) updateDto: UpdateEquipmentAvailabilityDto,
        @Headers('x-brand-context') brandId?: string
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.equipmentAvailabilityService.updateAvailabilitySlot(availabilityId, updateDto);
    }

    @Delete('availability/:availabilityId')
    @HttpCode(HttpStatus.NO_CONTENT)
    removeAvailabilitySlot(
        @Param('availabilityId', ParseIntPipe) availabilityId: number,
        @Headers('x-brand-context') brandId?: string
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.equipmentAvailabilityService.removeAvailabilitySlot(availabilityId);
    }
}
