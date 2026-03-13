import { Module } from '@nestjs/common';
import { PaymentSchedulesController, EstimateMilestonesController } from './payment-schedules.controller';
import { PaymentSchedulesService } from './payment-schedules.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentSchedulesController, EstimateMilestonesController],
  providers: [PaymentSchedulesService],
  exports: [PaymentSchedulesService],
})
export class PaymentSchedulesModule {}
