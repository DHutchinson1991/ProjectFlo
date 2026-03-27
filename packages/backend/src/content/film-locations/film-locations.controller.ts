import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilmLocationsService } from './film-locations.service';
import { AssignFilmLocationDto } from './dto/assign-film-location.dto';
import { SetSceneLocationDto } from './dto/set-scene-location.dto';

@Controller('api/film-locations')
@UseGuards(AuthGuard('jwt'))
export class FilmLocationsController {
    constructor(private readonly filmLocationsService: FilmLocationsService) { }

    @Get('films/:filmId/locations')
    getFilmLocations(@Param('filmId', ParseIntPipe) filmId: number) {
        return this.filmLocationsService.getFilmLocations(filmId);
    }

    @Post('films/:filmId/locations')
    addFilmLocation(
        @Param('filmId', ParseIntPipe) filmId: number,
        @Body(new ValidationPipe({ transform: true })) dto: AssignFilmLocationDto,
    ) {
        return this.filmLocationsService.addFilmLocation(filmId, dto);
    }

    @Delete('films/:filmId/locations/:locationId')
    removeFilmLocation(
        @Param('filmId', ParseIntPipe) filmId: number,
        @Param('locationId', ParseIntPipe) locationId: number,
    ) {
        return this.filmLocationsService.removeFilmLocation(filmId, locationId);
    }

    @Get('scenes/:sceneId/location')
    getSceneLocation(@Param('sceneId', ParseIntPipe) sceneId: number) {
        return this.filmLocationsService.getSceneLocation(sceneId);
    }

    @Put('scenes/:sceneId/location')
    setSceneLocation(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Body(new ValidationPipe({ transform: true })) dto: SetSceneLocationDto,
    ) {
        return this.filmLocationsService.setSceneLocation(sceneId, dto);
    }

    @Delete('scenes/:sceneId/location')
    clearSceneLocation(@Param('sceneId', ParseIntPipe) sceneId: number) {
        return this.filmLocationsService.clearSceneLocation(sceneId);
    }
}
