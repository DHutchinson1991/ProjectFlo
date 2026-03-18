import { Module } from '@nestjs/common';
import { PaymentBracketsController } from './payment-brackets.controller';
import { PaymentBracketsService } from './payment-brackets.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentBracketsController],
  providers: [PaymentBracketsService],
  exports: [PaymentBracketsService],
})
export class PaymentBracketsModule {}
