import { Module } from '@nestjs/common';
import { InstanceFilmContentController } from './instance-film-content.controller';
import { InstanceFilmSceneController } from './instance-film-scene.controller';
import { InstanceFilmStructureController } from './instance-film-structure.controller';
import { InstanceBeatService } from './services/instance-beat.service';
import { InstanceMomentService } from './services/instance-moment.service';
import { InstanceSceneService } from './services/instance-scene.service';
import { InstanceStructureService } from './services/instance-structure.service';
import { InstanceFilmCloneService } from './services/instance-film-clone.service';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { ProjectsModule } from '../../workflow/projects/projects.module';

@Module({
  imports: [PrismaModule, ProjectsModule],
  controllers: [
    InstanceFilmContentController,
    InstanceFilmSceneController,
    InstanceFilmStructureController,
  ],
  providers: [
    InstanceBeatService,
    InstanceMomentService,
    InstanceSceneService,
    InstanceStructureService,
    InstanceFilmCloneService,
  ],
})
export class InstanceFilmsModule {}
