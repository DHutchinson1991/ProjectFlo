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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InquiryTasksService } from './inquiry-tasks.service';
import { UpdateInquiryTaskDto, ToggleInquiryTaskDto } from './dto/inquiry-tasks.dto';

@Controller('api/inquiries/:inquiryId/tasks')
@UseGuards(AuthGuard('jwt'))
export class InquiryTasksController {
    constructor(private readonly inquiryTasksService: InquiryTasksService) {}

    /** Get all tasks for an inquiry */
    @Get()
    async findAll(
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) throw new BadRequestException('Brand ID is required');
        return this.inquiryTasksService.findAllForInquiry(inquiryId, brandIdNum);
    }

    /** Update a task (status, due_date, order_index) */
    @Patch(':taskId')
    async update(
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Param('taskId', ParseIntPipe) taskId: number,
        @Body() dto: UpdateInquiryTaskDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) throw new BadRequestException('Brand ID is required');
        return this.inquiryTasksService.update(inquiryId, taskId, dto, brandIdNum);
    }

    /** Toggle a task between To_Do and Completed */
    @Patch(':taskId/toggle')
    async toggle(
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Param('taskId', ParseIntPipe) taskId: number,
        @Body() dto: ToggleInquiryTaskDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) throw new BadRequestException('Brand ID is required');
        return this.inquiryTasksService.toggle(inquiryId, taskId, brandIdNum, dto.completed_by_id);
    }

    /** Generate (or regenerate) tasks from the task library */
    @Post('generate')
    async generate(
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) throw new BadRequestException('Brand ID is required');
        return this.inquiryTasksService.generateForInquiry(inquiryId, brandIdNum);
    }
}
