import { Module } from "@nestjs/common";
import { FilmsService } from "./films.service";
import { FilmsController } from "./films.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { FilmEquipmentService } from './services/film-equipment.service';
import { FilmTimelineTracksService } from './services/film-timeline-tracks.service';
import { FilmScenesManagementService } from './services/film-scenes-management.service';

@Module({
  imports: [PrismaModule],
  controllers: [FilmsController],
  providers: [
    FilmsService,
    FilmEquipmentService,
    FilmTimelineTracksService,
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
