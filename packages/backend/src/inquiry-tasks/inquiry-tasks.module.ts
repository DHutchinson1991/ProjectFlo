import { Module } from '@nestjs/common';
import { InquiryTasksController } from './inquiry-tasks.controller';
import { InquiryTasksService } from './inquiry-tasks.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [InquiryTasksController],
    providers: [InquiryTasksService],
    exports: [InquiryTasksService],
})
export class InquiryTasksModule {}
