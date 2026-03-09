import { Module } from '@nestjs/common';
import { InstanceFilmsController } from './instance-films.controller';
import { InstanceFilmsService } from './instance-films.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProjectsModule } from '../../projects/projects.module';

@Module({
  imports: [PrismaModule, ProjectsModule],
  controllers: [InstanceFilmsController],
  providers: [InstanceFilmsService],
  exports: [InstanceFilmsService],
})
export class InstanceFilmsModule {}
