import {
    BadRequestException,
    Body,
    Controller,
    Headers,
    Param,
    ParseIntPipe,
    Patch,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InquiryTasksService } from './services/inquiry-tasks.service';
import { ToggleInquirySubtaskDto } from './dto/toggle-inquiry-subtask.dto';

@Controller('api/inquiries/:inquiryId/subtasks')
@UseGuards(AuthGuard('jwt'))
export class InquirySubtasksController {
    constructor(private readonly inquiryTasksService: InquiryTasksService) {}

    @Patch(':subtaskId/toggle')
    async toggle(
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Param('subtaskId', ParseIntPipe) subtaskId: number,
        @Body(new ValidationPipe({ transform: true })) dto: ToggleInquirySubtaskDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId, 10);
        if (!brandIdNum) throw new BadRequestException('Brand ID is required');

        return this.inquiryTasksService.toggleSubtask(inquiryId, subtaskId, brandIdNum, dto.completed_by_id);
    }
}
