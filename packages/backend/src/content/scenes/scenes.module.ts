import { Module } from "@nestjs/common";
import { ScenesCrudService } from "./services/scenes-crud.service";
import { ScenesRecordingService } from "./services/scenes-recording.service";
import { SceneTemplatesService } from "./services/scene-templates.service";
import { ScenesController } from "./scenes.controller";
import { PrismaModule } from "../../platform/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ScenesController],
  providers: [ScenesCrudService, ScenesRecordingService, SceneTemplatesService],
  exports: [ScenesCrudService],
})
export class ScenesModule {}
