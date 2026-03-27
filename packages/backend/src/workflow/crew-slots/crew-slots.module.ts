import { Module } from '@nestjs/common';
import { CrewSlotsController } from './crew-slots.controller';
import { PackageCrewSlotsService } from './services/package-crew-slots.service';
import { ProjectCrewSlotsService } from './services/project-crew-slots.service';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
    imports: [PrismaModule, TasksModule],
    controllers: [CrewSlotsController],
    providers: [PackageCrewSlotsService, ProjectCrewSlotsService],
    exports: [PackageCrewSlotsService, ProjectCrewSlotsService],
})
export class CrewSlotsModule {}
