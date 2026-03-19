import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BrandsModule } from '../business/brands/brands.module';
import { InquiryTasksModule } from '../inquiry-tasks/inquiry-tasks.module';

@Module({
    imports: [PrismaModule, BrandsModule, InquiryTasksModule],
    controllers: [CalendarController],
    providers: [CalendarService],
    exports: [CalendarService],
})
export class CalendarModule { }
