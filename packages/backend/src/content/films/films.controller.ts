import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
} from "@nestjs/common";
import { FilmsService } from "./films.service";
import { CreateFilmDto } from "./dto/create-film.dto";
import { UpdateFilmDto } from "./dto/update-film.dto";
import { MusicType } from "@prisma/client";

@Controller("films")
export class FilmsController {
  constructor(private readonly filmsService: FilmsService) { }

  @Post()
  create(@Body() createFilmDto: CreateFilmDto) {
    return this.filmsService.create(createFilmDto);
  }

  @Get()
  findAll(@Query('brandId', new ParseIntPipe({ optional: true })) brandId?: number) {
    return this.filmsService.findAll(brandId);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.filmsService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateFilmDto: UpdateFilmDto,
  ) {
    return this.filmsService.update(id, updateFilmDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.filmsService.delete(id);
  }

  // Scene management endpoints - uses local copies for film-specific edits
  @Post(':id/scenes/assign')
  assignScene(
    @Param('id', ParseIntPipe) filmId: number,
    @Body() assignSceneDto: {
      scene_id: number;
      order_index?: number;
      editing_style?: string;
    },
  ) {
    return this.filmsService.assignSceneToFilm(
      filmId,
      assignSceneDto.scene_id,
      assignSceneDto.order_index,
      assignSceneDto.editing_style
    );
  }

  @Get(':id/scenes')
  getFilmScenes(@Param('id', ParseIntPipe) filmId: number) {
    return this.filmsService.getFilmWithLocalScenes(filmId);
  }

  @Get(':id/available-scenes')
  getAvailableScenes(
    @Param('id', ParseIntPipe) filmId: number,
    @Query('brandId', new ParseIntPipe({ optional: true })) brandId?: number
  ) {
    return this.filmsService.getAvailableScenesForFilm(filmId, brandId);
  }

  @Patch(':id/scenes/:sceneId')
  updateFilmScene(
    @Param('id', ParseIntPipe) filmId: number,
    @Param('sceneId', ParseIntPipe) localSceneId: number,
    @Body() updateData: {
      name?: string;
      description?: string;
      editing_style?: string;
      duration_override?: number;
      order_index?: number;
    },
  ) {
    return this.filmsService.updateFilmLocalScene(filmId, localSceneId, updateData);
  }

  @Patch(':id/scenes/:sceneId/components/:componentId')
  updateFilmSceneComponent(
    @Param('id', ParseIntPipe) filmId: number,
    @Param('sceneId', ParseIntPipe) localSceneId: number,
    @Param('componentId', ParseIntPipe) componentId: number,
    @Body() updateData: {
      duration_seconds?: number;
      is_primary?: boolean;
      music_type?: MusicType | null;
      notes?: string;
    },
  ) {
    return this.filmsService.updateFilmLocalSceneMediaComponent(
      filmId,
      localSceneId,
      componentId,
      updateData
    );
  }

  @Delete(':id/scenes/:sceneId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSceneFromFilm(
    @Param('id', ParseIntPipe) filmId: number,
    @Param('sceneId', ParseIntPipe) localSceneId: number,
  ) {
    return this.filmsService.removeSceneFromFilm(filmId, localSceneId);
  }
}
