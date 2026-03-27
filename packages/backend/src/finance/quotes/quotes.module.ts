import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { TasksModule } from '../../workflow/tasks/tasks.module';

@Module({
    imports: [PrismaModule, TasksModule],
    controllers: [QuotesController],
    providers: [QuotesService],
    exports: [QuotesService],
})
export class QuotesModule { }
