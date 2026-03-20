import { Module } from '@nestjs/common';
import { OperatorsController } from './operators.controller';
import { OperatorsService } from './operators.service';
import { PrismaModule } from '../prisma/prisma.module';
import { InquiryTasksModule } from '../inquiry-tasks/inquiry-tasks.module';

@Module({
  imports: [PrismaModule, InquiryTasksModule],
  controllers: [OperatorsController],
  providers: [OperatorsService],
  exports: [OperatorsService],
})
export class OperatorsModule {}
