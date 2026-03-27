import { Module } from "@nestjs/common";
import { FilmsService } from "./films.service";
import { FilmsController } from "./films.controller";
import { PrismaModule } from "../../platform/prisma/prisma.module";
import { FilmEquipmentService } from './services/film-equipment.service';
import { FilmEquipmentAssignmentsService } from './services/film-equipment-assignments.service';
import { FilmTimelineTracksService } from './services/film-timeline-tracks.service';
import { FilmTimelineLayersService } from './services/film-timeline-layers.service';
import { FilmScenesManagementService } from './services/film-scenes-management.service';

@Module({
  imports: [PrismaModule],
  controllers: [FilmsController],
  providers: [
    FilmsService,
    FilmEquipmentService,
    FilmEquipmentAssignmentsService,
    FilmTimelineTracksService,
    FilmTimelineLayersService,
    FilmScenesManagementService,
  ],
  exports: [
    FilmsService,
    FilmEquipmentService,
    FilmTimelineTracksService,
    FilmScenesManagementService,
  ],
})
export class FilmsModule { }
