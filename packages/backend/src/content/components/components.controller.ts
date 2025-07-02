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
import { ComponentsService } from "./components.service";
import { ComponentType, MusicType } from "@prisma/client";

// DTOs
export class CreateComponentDto {
  name: string;
  description?: string;
  type: ComponentType;
  complexity_score?: number;
  estimated_duration?: number;
  default_editing_style?: string;
  base_task_hours?: number;
}

export class UpdateComponentDto {
  name?: string;
  description?: string;
  type?: ComponentType;
  complexity_score?: number;
  estimated_duration?: number;
  default_editing_style?: string;
  base_task_hours?: number;
}

export class ComponentCoverageSceneDto {
  coverage_scene_id: number;
}

export class ComponentMusicOptionDto {
  music_type: MusicType;
  weight?: number;
}

@Controller("components")
export class ComponentsController {
  constructor(private readonly componentsService: ComponentsService) { }

  @Post()
  create(@Body() createComponentDto: CreateComponentDto) {
    return this.componentsService.create(createComponentDto);
  }

  @Get()
  findAll() {
    return this.componentsService.findAll();
  }

  @Get("with-relations")
  findAllWithRelations() {
    return this.componentsService.findAllWithRelations();
  }

  @Get(":id/with-relations")
  findOneWithRelations(@Param("id", ParseIntPipe) id: number) {
    return this.componentsService.findOneWithRelations(id);
  }

  @Get("stats")
  getStats() {
    return this.componentsService.getComponentStats();
  }

  @Get("coverage-scenes/available")
  getAvailableCoverageScenes() {
    return this.componentsService.getAvailableCoverageScenes();
  }

  @Get("by-type/:type")
  findByType(@Param("type") type: string) {
    return this.componentsService.findByType(type as ComponentType);
  }

  @Get("coverage-based")
  getCoverageBasedComponents() {
    return this.componentsService.getCoverageBasedComponents();
  }

  @Get("production")
  getProductionComponents() {
    return this.componentsService.getProductionComponents();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.componentsService.findOneWithRelations(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateComponentDto: UpdateComponentDto,
  ) {
    return this.componentsService.update(id, updateComponentDto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.componentsService.remove(id);
  }

  @Get(":id/dependencies")
  getComponentDependencies(@Param("id", ParseIntPipe) id: number) {
    return this.componentsService.getComponentDependencies(id);
  }

  @Post("bulk-update-hours")
  bulkUpdateTaskHours(
    @Body() updates: { id: number; base_task_hours: number }[],
  ) {
    return this.componentsService.bulkUpdateTaskHours(updates);
  }

  // COVERAGE SCENES ENDPOINTS

  @Post(":id/coverage-scenes")
  addCoverageScenes(
    @Param("id", ParseIntPipe) id: number,
    @Body() coverageScenes: ComponentCoverageSceneDto[],
  ) {
    return this.componentsService.addCoverageScenes(id, coverageScenes);
  }

  @Delete(":id/coverage-scenes/:sceneId")
  removeCoverageScene(
    @Param("id", ParseIntPipe) id: number,
    @Param("sceneId", ParseIntPipe) sceneId: number,
  ) {
    return this.componentsService.removeCoverageScene(id, sceneId);
  }

  // MUSIC OPTIONS ENDPOINTS

  @Post(":id/music-options")
  addMusicOptions(
    @Param("id", ParseIntPipe) id: number,
    @Body() musicOptions: ComponentMusicOptionDto[],
  ) {
    return this.componentsService.addMusicOptions(id, musicOptions);
  }

  @Delete(":id/music-options/:optionId")
  removeMusicOption(
    @Param("id", ParseIntPipe) id: number,
    @Param("optionId", ParseIntPipe) optionId: number,
  ) {
    return this.componentsService.removeMusicOption(id, optionId);
  }

  @Patch("music-options/:optionId/weight")
  updateMusicOptionWeight(
    @Param("optionId", ParseIntPipe) optionId: number,
    @Body() { weight }: { weight: number },
  ) {
    return this.componentsService.updateMusicOptionWeight(optionId, weight);
  }
}
