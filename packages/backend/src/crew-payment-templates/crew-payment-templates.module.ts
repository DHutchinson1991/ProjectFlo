import { Module } from '@nestjs/common';
import { CrewPaymentTemplatesController } from './crew-payment-templates.controller';
import { CrewPaymentTemplatesService } from './crew-payment-templates.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CrewPaymentTemplatesController],
  providers: [CrewPaymentTemplatesService],
  exports: [CrewPaymentTemplatesService],
})
export class CrewPaymentTemplatesModule {}
