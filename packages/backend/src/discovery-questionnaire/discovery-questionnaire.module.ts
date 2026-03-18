import { Module } from '@nestjs/common';
import { DiscoveryQuestionnaireController } from './discovery-questionnaire.controller';
import { DiscoveryQuestionnaireService } from './discovery-questionnaire.service';
import { PrismaModule } from '../prisma/prisma.module';
import { InquiryTasksModule } from '../inquiry-tasks/inquiry-tasks.module';

@Module({
    imports: [PrismaModule, InquiryTasksModule],
    controllers: [DiscoveryQuestionnaireController],
    providers: [DiscoveryQuestionnaireService],
    exports: [DiscoveryQuestionnaireService],
})
export class DiscoveryQuestionnaireModule {}
