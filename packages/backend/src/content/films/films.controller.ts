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
} from "@nestjs/common";
import { FilmsService } from "./films.service";
import { CreateFilmDto } from "./dto/create-film.dto";
import { UpdateFilmDto } from "./dto/update-film.dto";

@Controller("films")
export class FilmsController {
  constructor(private readonly filmsService: FilmsService) {}

  @Post()
  create(@Body() createFilmDto: CreateFilmDto) {
    return this.filmsService.create(createFilmDto);
  }

  @Get()
  findAll() {
    return this.filmsService.findAll();
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

  // TODO: Implement scenes and build functionality
  /*
  @Post(':id/scenes')
  updateScenes(
    @Param('id', ParseIntPipe) filmId: number,
    @Body() scenes: Array<{
      scene_id: number;
      order_index: number;
      editing_style?: string;
      duration_override?: number;
    }>,
  ) {
    return this.filmsService.updateScenes(filmId, scenes);
  }

  @Get(':id/scenes')
  getScenes(@Param('id', ParseIntPipe) filmId: number) {
    return this.filmsService.getScenes(filmId);
  }
 
  @Post('builds/:buildId/:filmId')
  createBuildFilm(
    @Param('buildId', ParseIntPipe) buildId: number,
    @Param('filmId', ParseIntPipe) filmId: number,
  ) {
    return this.filmsService.createBuildFilm(buildId, filmId);
  }
 
  @Get('builds/:buildId')
  findBuildFilm(@Param('buildId', ParseIntPipe) buildId: number) {
    return this.filmsService.getBuildFilm(buildId);
  }
 
  @Get('build-film/:id')
  findBuildFilmItem(@Param('id', ParseIntPipe) id: number) {
    return this.filmsService.getBuildFilmItem(id);
  }
  */
}
