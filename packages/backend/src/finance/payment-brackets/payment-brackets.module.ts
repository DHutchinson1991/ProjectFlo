import { Module } from '@nestjs/common';
import { PaymentBracketsController } from './payment-brackets.controller';
import { PaymentBracketsService } from './payment-brackets.service';
import { PaymentBracketAssignmentsService } from './services/payment-bracket-assignments.service';
import { PrismaModule } from '../../platform/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentBracketsController],
  providers: [PaymentBracketsService, PaymentBracketAssignmentsService],
  exports: [PaymentBracketsService, PaymentBracketAssignmentsService],
})
export class PaymentBracketsModule {}
