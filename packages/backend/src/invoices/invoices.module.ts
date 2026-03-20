import { Module, forwardRef } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PrismaService } from '../prisma/prisma.service';
import { InquiryTasksModule } from '../inquiry-tasks/inquiry-tasks.module';

@Module({
  imports: [forwardRef(() => InquiryTasksModule)],
  controllers: [InvoicesController],
  providers: [InvoicesService, PrismaService],
  exports: [InvoicesService],
})
export class InvoicesModule { }
