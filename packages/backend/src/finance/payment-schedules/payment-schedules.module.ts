import { Module, forwardRef } from '@nestjs/common';
import { PaymentSchedulesController } from './payment-schedules.controller';
import { EstimateMilestonesController } from './estimate-milestones.controller';
import { QuoteMilestonesController } from './quote-milestones.controller';
import { PaymentSchedulesService } from './payment-schedules.service';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [PrismaModule, forwardRef(() => InvoicesModule)],
  controllers: [PaymentSchedulesController, EstimateMilestonesController, QuoteMilestonesController],
  providers: [PaymentSchedulesService],
  exports: [PaymentSchedulesService],
})
export class PaymentSchedulesModule {}
