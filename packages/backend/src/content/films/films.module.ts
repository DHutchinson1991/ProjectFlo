import { Module } from "@nestjs/common";
import { FilmsService } from "./films.service";
import { FilmsController } from "./films.controller";
import { PrismaModule } from "../../platform/prisma/prisma.module";
import { FilmEquipmentService } from './services/film-equipment.service';
import { FilmEquipmentAssignmentsService } from './services/film-equipment-assignments.service';
import { FilmTimelineTracksService } from './services/film-timeline-tracks.service';
import { FilmTimelineLayersService } from './services/film-timeline-layers.service';
import { FilmScenesManagementService } from './services/film-scenes-management.service';
import { SceneSpatialService } from './services/scene-spatial.service';
import { SceneSpatialController } from './controllers/scene-spatial.controller';

@Module({
  imports: [PrismaModule],
  controllers: [FilmsController, SceneSpatialController],
  providers: [
    FilmsService,
    FilmEquipmentService,
    FilmEquipmentAssignmentsService,
    FilmTimelineTracksService,
    FilmTimelineLayersService,
    FilmScenesManagementService,
    SceneSpatialService,
  ],
  exports: [
    FilmsService,
    FilmEquipmentService,
    FilmTimelineTracksService,
    FilmScenesManagementService,
    SceneSpatialService,
  ],
})
export class FilmsModule { }
