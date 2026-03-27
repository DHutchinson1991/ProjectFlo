import { Module } from '@nestjs/common';
import { ProposalsController } from './proposals.controller';
import { PublicProposalsController } from './public-proposals.controller';
import { ProposalCrudService } from './services/proposal-crud.service';
import { ProposalLifecycleService } from './services/proposal-lifecycle.service';
import { ProposalContentGeneratorService } from './services/proposal-content-generator.service';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
    imports: [PrismaModule, TasksModule],
    controllers: [ProposalsController, PublicProposalsController],
    providers: [
        ProposalCrudService,
        ProposalLifecycleService,
        ProposalContentGeneratorService,
    ],
    exports: [ProposalCrudService, ProposalLifecycleService, ProposalContentGeneratorService],
})
export class ProposalsModule {}
