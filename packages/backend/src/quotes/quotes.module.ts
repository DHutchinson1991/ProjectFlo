import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { InquiryTasksModule } from '../inquiry-tasks/inquiry-tasks.module';

@Module({
    imports: [PrismaModule, InquiryTasksModule],
    controllers: [QuotesController],
    providers: [QuotesService],
    exports: [QuotesService],
})
export class QuotesModule { }
