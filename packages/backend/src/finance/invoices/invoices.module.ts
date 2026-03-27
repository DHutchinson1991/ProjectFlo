import { Module, forwardRef } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { TasksModule } from '../../workflow/tasks/tasks.module';

@Module({
  imports: [forwardRef(() => TasksModule)],
  controllers: [InvoicesController],
  providers: [InvoicesService, PrismaService],
  exports: [InvoicesService],
})
export class InvoicesModule { }
