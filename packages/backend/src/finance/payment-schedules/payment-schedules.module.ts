import { Module } from '@nestjs/common';
import { PaymentSchedulesController } from './payment-schedules.controller';
import { EstimateMilestonesController } from './estimate-milestones.controller';
import { QuoteMilestonesController } from './quote-milestones.controller';
import { PaymentSchedulesService } from './payment-schedules.service';
import { PrismaModule } from '../../platform/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentSchedulesController, EstimateMilestonesController, QuoteMilestonesController],
  providers: [PaymentSchedulesService],
  exports: [PaymentSchedulesService],
})
export class PaymentSchedulesModule {}
