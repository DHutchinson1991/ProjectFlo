import { Module } from '@nestjs/common';
import { NeedsAssessmentsController } from './needs-assessments.controller';
import { PublicNeedsAssessmentsController } from './public-needs-assessments.controller';
import { NeedsAssessmentsService } from './needs-assessments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { InquiriesModule } from '../inquiries/inquiries.module';

@Module({
    imports: [PrismaModule, InquiriesModule],
    controllers: [NeedsAssessmentsController, PublicNeedsAssessmentsController],
    providers: [NeedsAssessmentsService],
    exports: [NeedsAssessmentsService],
})
export class NeedsAssessmentsModule {}
