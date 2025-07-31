import { Module } from '@nestjs/common';
import { JobRolesController } from './job-roles.controller';
import { JobRolesService } from './job-roles.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [JobRolesController],
    providers: [JobRolesService],
    exports: [JobRolesService]
})
export class JobRolesModule { }
