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
    ParseEnumPipe
} from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import {
    CreateEquipmentAvailabilityDto,
    UpdateEquipmentAvailabilityDto,
    EquipmentAvailabilityQueryDto
} from './dto/equipment-availability.dto';
import { EquipmentCategory, EquipmentType, EquipmentCondition, EquipmentAvailability } from '@prisma/client';

@Controller('equipment')
export class EquipmentController {
    constructor(private readonly equipmentService: EquipmentService) { }

    @Post()
    create(@Body() createEquipmentDto: CreateEquipmentDto) {
        return this.equipmentService.create(createEquipmentDto);
    }

    @Get()
    findAll(
        @Query('brandId', new ParseIntPipe({ optional: true })) brandId?: number,
        @Query('category', new ParseEnumPipe(EquipmentCategory, { optional: true })) category?: EquipmentCategory,
        @Query('type', new ParseEnumPipe(EquipmentType, { optional: true })) type?: EquipmentType,
        @Query('availability', new ParseEnumPipe(EquipmentAvailability, { optional: true })) availability?: EquipmentAvailability,
        @Query('condition', new ParseEnumPipe(EquipmentCondition, { optional: true })) condition?: EquipmentCondition,
        @Query('search') search?: string
    ) {
        return this.equipmentService.findAll({
            brandId,
            category,
            type,
            availability,
            condition,
            search
        });
    }

    @Get('available')
    findAvailable(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('brandId', new ParseIntPipe({ optional: true })) brandId?: number
    ) {
        if (!startDate || !endDate) {
            throw new Error('Start date and end date are required for availability check');
        }

        return this.equipmentService.findAvailable(
            new Date(startDate),
            new Date(endDate),
            brandId
        );
    }

    @Get('category/:category')
    findByCategory(
        @Param('category', new ParseEnumPipe(EquipmentCategory)) category: EquipmentCategory,
        @Query('brandId', new ParseIntPipe({ optional: true })) brandId?: number
    ) {
        return this.equipmentService.findByCategory(category, brandId);
    }

    @Get('grouped')
    findGroupedByCategory(@Query('brandId', new ParseIntPipe({ optional: true })) brandId?: number) {
        return this.equipmentService.findGroupedByCategory(brandId);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.equipmentService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateEquipmentDto: UpdateEquipmentDto
    ) {
        return this.equipmentService.update(id, updateEquipmentDto);
    }

    @Patch(':id/availability')
    updateAvailability(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateData: { status: EquipmentAvailability }
    ) {
        return this.equipmentService.updateAvailability(id, updateData.status);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.equipmentService.remove(id);
    }

    // Equipment Availability Calendar Endpoints
    @Get(':id/availability')
    getEquipmentAvailability(
        @Param('id', ParseIntPipe) equipmentId: number,
        @Query() queryDto: EquipmentAvailabilityQueryDto
    ) {
        return this.equipmentService.getEquipmentAvailability(equipmentId, queryDto);
    }

    @Post(':id/availability')
    createAvailabilitySlot(
        @Param('id', ParseIntPipe) equipmentId: number,
        @Body() createDto: CreateEquipmentAvailabilityDto
    ) {
        return this.equipmentService.createAvailabilitySlot(equipmentId, createDto);
    }

    @Patch('availability/:availabilityId')
    updateAvailabilitySlot(
        @Param('availabilityId', ParseIntPipe) availabilityId: number,
        @Body() updateDto: UpdateEquipmentAvailabilityDto
    ) {
        return this.equipmentService.updateAvailabilitySlot(availabilityId, updateDto);
    }

    @Delete('availability/:availabilityId')
    @HttpCode(HttpStatus.NO_CONTENT)
    removeAvailabilitySlot(@Param('availabilityId', ParseIntPipe) availabilityId: number) {
        return this.equipmentService.removeAvailabilitySlot(availabilityId);
    }

    @Get('availability/calendar')
    getAvailabilityCalendar(
        @Query() queryDto: EquipmentAvailabilityQueryDto
    ) {
        return this.equipmentService.getAvailabilityCalendar(queryDto);
    }
}
