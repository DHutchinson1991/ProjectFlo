import { Module } from '@nestjs/common';
import { DiscoveryQuestionnaireController } from './discovery-questionnaire.controller';
import { DiscoveryQuestionnaireService } from './discovery-questionnaire.service';
import { DiscoveryQuestionnaireSubmissionsService } from './services/discovery-questionnaire-submissions.service';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { TasksModule } from '../../workflow/tasks/tasks.module';

@Module({
    imports: [PrismaModule, TasksModule],
    controllers: [DiscoveryQuestionnaireController],
    providers: [DiscoveryQuestionnaireService, DiscoveryQuestionnaireSubmissionsService],
    exports: [DiscoveryQuestionnaireService, DiscoveryQuestionnaireSubmissionsService],
})
export class DiscoveryQuestionnaireModule {}
