import {
    Controller,
    Get,
    Patch,
    Post,
    Body,
    Param,
    ParseIntPipe,
    UseGuards,
    Headers,
    BadRequestException,
    ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InquiryTasksService } from './services/inquiry-tasks.service';
import { UpdateInquiryTaskDto } from './dto/update-inquiry-task.dto';
import { ToggleInquiryTaskDto } from './dto/toggle-inquiry-task.dto';
import { BrandId } from '../../../platform/auth/decorators/brand-id.decorator';

@Controller('api/inquiries/:inquiryId/tasks')
@UseGuards(AuthGuard('jwt'))
export class InquiryTasksController {
    constructor(private readonly inquiryTasksService: InquiryTasksService) {}

    @Get()
    async findAll(
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @BrandId() brandId?: number,
    ) {
        if (!brandId) throw new BadRequestException('Brand ID is required');
        return this.inquiryTasksService.findAllForInquiry(inquiryId, brandId);
    }

    @Patch(':taskId')
    async update(
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Param('taskId', ParseIntPipe) taskId: number,
        @Body(new ValidationPipe({ transform: true })) dto: UpdateInquiryTaskDto,
        @BrandId() brandId?: number,
    ) {
        if (!brandId) throw new BadRequestException('Brand ID is required');
        return this.inquiryTasksService.update(inquiryId, taskId, dto, brandId);
    }

    @Patch(':taskId/toggle')
    async toggle(
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Param('taskId', ParseIntPipe) taskId: number,
        @Body(new ValidationPipe({ transform: true })) dto: ToggleInquiryTaskDto,
        @BrandId() brandId?: number,
    ) {
        if (!brandId) throw new BadRequestException('Brand ID is required');
        return this.inquiryTasksService.toggle(inquiryId, taskId, brandId, dto.completed_by_id);
    }

    @Post('generate')
    async generate(
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @BrandId() brandId?: number,
    ) {
        if (!brandId) throw new BadRequestException('Brand ID is required');
        return this.inquiryTasksService.generateForInquiry(inquiryId, brandId);
    }

    @Get(':taskId/events')
    async getEvents(
        @Param('taskId', ParseIntPipe) taskId: number,
    ) {
        return this.inquiryTasksService.getTaskEvents(taskId);
    }
}
