import { Module } from '@nestjs/common';
import { TaskLibraryService } from './task-library.service';
import { TaskLibraryController } from './task-library.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [TaskLibraryController],
    providers: [TaskLibraryService],
    exports: [TaskLibraryService],
})
export class TaskLibraryModule { }
