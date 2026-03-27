import { Module } from '@nestjs/common';
import { JobRolesController } from './job-roles.controller';
import { JobRolesService } from './job-roles.service';
import { JobRoleAssignmentsService } from './services/job-role-assignments.service';
import { PrismaModule } from '../../platform/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [JobRolesController],
    providers: [JobRolesService, JobRoleAssignmentsService],
    exports: [JobRolesService, JobRoleAssignmentsService],
})
export class JobRolesModule {}
