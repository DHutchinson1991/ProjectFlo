import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from "@nestjs/common";
import { ScenesService } from "./scenes.service";
import { MediaType, MusicType } from "@prisma/client";

// DTOs
export class CreateSceneDto {
  name: string;
  description?: string;
  type: MediaType;
  complexity_score?: number;
  estimated_duration?: number;
  default_editing_style?: string;
  base_task_hours?: number;
}

export class UpdateSceneDto {
  name?: string;
  description?: string;
  type?: MediaType;
  complexity_score?: number;
  estimated_duration?: number;
  default_editing_style?: string;
  base_task_hours?: number;
}

export class SceneMusicOptionDto {
  music_type: MusicType;
  weight?: number;
}

@Controller("scenes")
export class ScenesController {
  constructor(private readonly scenesService: ScenesService) {}

  @Post()
  create(@Body() createSceneDto: CreateSceneDto) {
    return this.scenesService.create(createSceneDto);
  }

  @Get()
  findAll() {
    return this.scenesService.findAll();
  }

  @Get("with-relations")
  findAllWithRelations() {
    return this.scenesService.findAllWithRelations();
  }

  @Get(":id/with-relations")
  findOneWithRelations(@Param("id", ParseIntPipe) id: number) {
    return this.scenesService.findOneWithRelations(id);
  }

  @Get("stats")
  getStats() {
    return this.scenesService.getSceneStats();
  }

  @Get("by-type/:type")
  findByType(@Param("type") type: string) {
    return this.scenesService.findByType(type as MediaType);
  }

  @Get("production")
  getProductionScenes() {
    return this.scenesService.getProductionScenes();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.scenesService.findOneWithRelations(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateSceneDto: UpdateSceneDto,
  ) {
    return this.scenesService.update(id, updateSceneDto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.scenesService.remove(id);
  }

  @Get(":id/dependencies")
  getSceneDependencies(@Param("id", ParseIntPipe) id: number) {
    return this.scenesService.getSceneDependencies(id);
  }

  @Post("bulk-update-hours")
  bulkUpdateTaskHours(
    @Body() updates: { id: number; base_task_hours: number }[],
  ) {
    return this.scenesService.bulkUpdateTaskHours(updates);
  }

  // MUSIC OPTIONS ENDPOINTS

  @Post(":id/music-options")
  addMusicOptions(
    @Param("id", ParseIntPipe) id: number,
    @Body() musicOptions: SceneMusicOptionDto[],
  ) {
    return this.scenesService.addMusicOptions(id, musicOptions);
  }

  @Delete(":id/music-options/:optionId")
  removeMusicOption(
    @Param("id", ParseIntPipe) id: number,
    @Param("optionId", ParseIntPipe) optionId: number,
  ) {
    return this.scenesService.removeMusicOption(id, optionId);
  }

  @Patch("music-options/:optionId/weight")
  updateMusicOptionWeight(
    @Param("optionId", ParseIntPipe) optionId: number,
    @Body() { weight }: { weight: number },
  ) {
    return this.scenesService.updateMusicOptionWeight(optionId, weight);
  }
}
