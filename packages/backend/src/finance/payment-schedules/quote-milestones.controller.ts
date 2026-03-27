import {
  Controller, Get, Post, Patch,
  Body, Param, ParseIntPipe, UseGuards, ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentSchedulesService } from './payment-schedules.service';
import { ApplyScheduleToQuoteDto } from './dto/apply-schedule-to-quote.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/quotes')
export class QuoteMilestonesController {
  constructor(private readonly svc: PaymentSchedulesService) {}

  @Get(':quoteId/milestones')
  getMilestones(@Param('quoteId', ParseIntPipe) quoteId: number) {
    return this.svc.getMilestonesForQuote(quoteId);
  }

  @Post(':quoteId/apply-schedule')
  applySchedule(
    @Param('quoteId', ParseIntPipe) quoteId: number,
    @Body(new ValidationPipe({ transform: true })) dto: ApplyScheduleToQuoteDto,
  ) {
    return this.svc.applyToQuote(quoteId, dto);
  }

  @Patch('milestones/:milestoneId/status')
  updateStatus(
    @Param('milestoneId', ParseIntPipe) milestoneId: number,
    @Body('status') status: string,
  ) {
    return this.svc.updateQuoteMilestoneStatus(milestoneId, status);
  }
}
