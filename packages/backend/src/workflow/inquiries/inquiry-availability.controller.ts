import {
    Controller, Get, Post, Patch, Delete,
    Body, Param, ParseIntPipe, UseGuards, Headers, NotFoundException, ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InquiryAvailabilityService } from './inquiry-availability.service';

/**
 * InquiryAvailabilityController
 *
 * Crew availability requests and equipment reservation routes.
 * Extracted from InquiriesController to keep controllers within the 200-line limit.
 */
@Controller('api/inquiries')
@UseGuards(AuthGuard('jwt'))
export class InquiryAvailabilityController {
    constructor(private readonly svc: InquiryAvailabilityService) {}

    @Get(':id/crew-availability')
    async getCrewAvailability(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId, 10);
        if (!brandIdNum) throw new NotFoundException('Brand ID is required');
        return this.svc.getCrewAvailability(id, brandIdNum);
    }

    @Get(':id/equipment-availability')
    async getEquipmentAvailability(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId, 10);
        if (!brandIdNum) throw new NotFoundException('Brand ID is required');
        return this.svc.getEquipmentAvailability(id, brandIdNum);
    }

    @Patch(':id/equipment-assignments/:assignmentId/swap')
    async swapEquipment(
        @Param('id', ParseIntPipe) id: number,
        @Param('assignmentId', ParseIntPipe) assignmentId: number,
        @Headers('x-brand-context') brandId: string,
        @Body(new ValidationPipe({ transform: true })) body: { new_equipment_id: number },
    ) {
        const brandIdNum = parseInt(brandId, 10);
        if (!brandIdNum) throw new NotFoundException('Brand ID is required');
        return this.svc.swapEquipment(id, assignmentId, body.new_equipment_id, brandIdNum);
    }

    @Post(':id/equipment-reservations')
    async reserveEquipment(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
        @Body(new ValidationPipe({ transform: true })) body: { assignment_id: number },
    ) {
        const brandIdNum = parseInt(brandId, 10);
        if (!brandIdNum) throw new NotFoundException('Brand ID is required');
        return this.svc.reserveEquipment(id, body.assignment_id, brandIdNum);
    }

    @Delete(':id/equipment-reservations/:reservationId')
    async cancelEquipmentReservation(
        @Param('id', ParseIntPipe) id: number,
        @Param('reservationId', ParseIntPipe) reservationId: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId, 10);
        if (!brandIdNum) throw new NotFoundException('Brand ID is required');
        return this.svc.cancelEquipmentReservation(id, reservationId, brandIdNum);
    }

    @Patch(':id/equipment-reservations/:reservationId')
    async updateEquipmentReservation(
        @Param('id', ParseIntPipe) id: number,
        @Param('reservationId', ParseIntPipe) reservationId: number,
        @Headers('x-brand-context') brandId: string,
        @Body(new ValidationPipe({ transform: true })) body: { status: 'confirmed' | 'cancelled' },
    ) {
        const brandIdNum = parseInt(brandId, 10);
        if (!brandIdNum) throw new NotFoundException('Brand ID is required');
        return this.svc.updateEquipmentReservationStatus(id, reservationId, body.status, brandIdNum);
    }
}
