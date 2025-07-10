import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
import { ScenesService } from "./scenes.service";
import { MediaType, MusicType } from "@prisma/client";
import { CreateSceneDto } from "./dto/create-scene.dto";
import { UpdateSceneDto } from "./dto/update-scene.dto";

// Music component DTO (updated for unified structure)
export class SceneMusicComponentDto {
  music_type: MusicType;
  weight?: number;
  duration_seconds?: number;
}

// Media component DTO for broader use
export class SceneMediaComponentDto {
  media_type: 'VIDEO' | 'AUDIO' | 'MUSIC';
  duration_seconds: number;
  is_primary?: boolean;
  volume_level?: number;
  sync_offset?: number;
  music_type?: string;
  music_weight?: number;
  notes?: string;
}

@Controller("scenes")
export class ScenesController {
  constructor(private readonly scenesService: ScenesService) { }

  @Post()
  create(@Body() createSceneDto: CreateSceneDto, @Query('brandId') brandId?: string) {
    const parsedBrandId = brandId ? parseInt(brandId, 10) : null;
    return this.scenesService.create(createSceneDto, parsedBrandId);
  }

  @Get()
  findAll(@Query('brandId') brandId?: string) {
    const parsedBrandId = brandId ? parseInt(brandId, 10) : null;
    return this.scenesService.findAll(parsedBrandId);
  }

  @Get("with-relations")
  findAllWithRelations(@Query('brandId') brandId?: string) {
    const parsedBrandId = brandId ? parseInt(brandId, 10) : null;
    return this.scenesService.findAllWithRelations(parsedBrandId);
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

  // MUSIC COMPONENT ENDPOINTS (Updated for unified structure)

  @Post(":id/music-options")
  addMusicOptions(
    @Param("id", ParseIntPipe) id: number,
    @Body() musicOptions: SceneMusicComponentDto[],
  ) {
    return this.scenesService.addMusicOptions(id, musicOptions);
  }

  @Delete(":id/music-options/:componentId")
  removeMusicOption(
    @Param("id", ParseIntPipe) id: number,
    @Param("componentId", ParseIntPipe) componentId: number,
  ) {
    return this.scenesService.removeMusicOption(id, componentId);
  }

  @Patch("music-options/:componentId")
  updateMusicComponent(
    @Param("componentId", ParseIntPipe) componentId: number,
    @Body() updateData: { music_type?: string; duration_seconds?: number; notes?: string },
  ) {
    return this.scenesService.updateMusicComponent(componentId, updateData);
  }

  @Get(":id/music-components")
  getMusicComponents(@Param("id", ParseIntPipe) id: number) {
    return this.scenesService.getMusicComponents(id);
  }

  @Post(":id/media-components")
  addMediaComponent(
    @Param("id", ParseIntPipe) id: number,
    @Body() componentData: SceneMediaComponentDto,
  ) {
    return this.scenesService.addMediaComponent(id, componentData);
  }
}
