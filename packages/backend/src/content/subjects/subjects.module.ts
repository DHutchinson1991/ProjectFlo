import { Module } from '@nestjs/common';
import { SubjectsCrudService } from './subjects-crud.service';
import { SubjectSceneAssignmentsService } from './subject-scene-assignments.service';
import { SubjectMomentAssignmentsService } from './subject-moment-assignments.service';
import { SubjectRolesService } from './subject-roles.service';
import { SubjectsController } from './subjects.controller';
import { PrismaModule } from '../../platform/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SubjectsController],
    providers: [
        SubjectsCrudService,
        SubjectSceneAssignmentsService,
        SubjectMomentAssignmentsService,
        SubjectRolesService,
    ],
    exports: [SubjectsCrudService],
})
export class SubjectsModule { }
