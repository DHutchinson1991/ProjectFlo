import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { FilmLocation, FilmSceneLocation, LocationsLibrary } from '@prisma/client';
import { AssignFilmLocationDto } from './dto/assign-film-location.dto';
import { SetSceneLocationDto } from './dto/set-scene-location.dto';
import { FilmLocationResponseDto } from './dto/film-location-response.dto';
import { SceneLocationResponseDto } from './dto/scene-location-response.dto';

@Injectable()
export class FilmLocationsService {
    constructor(private prisma: PrismaService) { }

    private mapFilmLocation(location: FilmLocation & { location: LocationsLibrary }): FilmLocationResponseDto {
        return {
            id: location.id,
            film_id: location.film_id,
            location_id: location.location_id,
            notes: location.notes ?? null,
            created_at: location.created_at,
            updated_at: location.updated_at,
            location: {
                id: location.location.id,
                name: location.location.name,
                address_line1: location.location.address_line1 ?? null,
                city: location.location.city ?? null,
                state: location.location.state ?? null,
                country: location.location.country ?? null,
            },
        };
    }

    private mapSceneLocation(location: FilmSceneLocation & { location: LocationsLibrary }): SceneLocationResponseDto {
        return {
            id: location.id,
            scene_id: location.scene_id,
            location_id: location.location_id,
            created_at: location.created_at,
            updated_at: location.updated_at,
            location: {
                id: location.location.id,
                name: location.location.name,
                address_line1: location.location.address_line1 ?? null,
                city: location.location.city ?? null,
                state: location.location.state ?? null,
                country: location.location.country ?? null,
            },
        };
    }

    async getFilmLocations(filmId: number) {
        const film = await this.prisma.film.findUnique({ where: { id: filmId } });
        if (!film) {
            throw new NotFoundException(`Film with ID ${filmId} not found`);
        }

        const locations = await this.prisma.filmLocation.findMany({
            where: { film_id: filmId },
            include: { location: true },
            orderBy: { created_at: 'asc' },
        });

        return locations.map((location) => this.mapFilmLocation(location));
    }

    async addFilmLocation(filmId: number, dto: AssignFilmLocationDto) {
        const film = await this.prisma.film.findUnique({ where: { id: filmId } });
        if (!film) {
            throw new NotFoundException(`Film with ID ${filmId} not found`);
        }

        const location = await this.prisma.locationsLibrary.findUnique({ where: { id: dto.location_id } });
        if (!location) {
            throw new NotFoundException(`Location with ID ${dto.location_id} not found`);
        }

        const created = await this.prisma.filmLocation.upsert({
            where: {
                film_id_location_id: {
                    film_id: filmId,
                    location_id: dto.location_id,
                },
            },
            update: {
                notes: dto.notes ?? undefined,
            },
            create: {
                film_id: filmId,
                location_id: dto.location_id,
                notes: dto.notes,
            },
            include: { location: true },
        });

        return this.mapFilmLocation(created);
    }

    async removeFilmLocation(filmId: number, locationId: number) {
        const existing = await this.prisma.filmLocation.findUnique({
            where: {
                film_id_location_id: {
                    film_id: filmId,
                    location_id: locationId,
                },
            },
        });

        if (!existing) {
            throw new NotFoundException('Film location assignment not found');
        }

        await this.prisma.$transaction([
            this.prisma.filmSceneLocation.deleteMany({
                where: {
                    location_id: locationId,
                    scene: {
                        film_id: filmId,
                    },
                },
            }),
            this.prisma.filmLocation.delete({
                where: {
                    film_id_location_id: {
                        film_id: filmId,
                        location_id: locationId,
                    },
                },
            }),
        ]);

        return { message: 'Location removed from film' };
    }

    async getSceneLocation(sceneId: number) {
        const scene = await this.prisma.filmScene.findUnique({ where: { id: sceneId } });
        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        const assignment = await this.prisma.filmSceneLocation.findUnique({
            where: { scene_id: sceneId },
            include: { location: true },
        });

        if (!assignment) return null;

        return this.mapSceneLocation(assignment);
    }

    async setSceneLocation(sceneId: number, dto: SetSceneLocationDto) {
        const scene = await this.prisma.filmScene.findUnique({ where: { id: sceneId } });
        if (!scene) {
            throw new NotFoundException(`Scene with ID ${sceneId} not found`);
        }

        const assignedToFilm = await this.prisma.filmLocation.findUnique({
            where: {
                film_id_location_id: {
                    film_id: scene.film_id,
                    location_id: dto.location_id,
                },
            },
        });

        if (!assignedToFilm) {
            throw new BadRequestException('Location must be assigned to the film before selecting it for a scene');
        }

        const assignment = await this.prisma.filmSceneLocation.upsert({
            where: { scene_id: sceneId },
            update: { location_id: dto.location_id },
            create: {
                scene_id: sceneId,
                location_id: dto.location_id,
            },
            include: { location: true },
        });

        return this.mapSceneLocation(assignment);
    }

    async clearSceneLocation(sceneId: number) {
        const existing = await this.prisma.filmSceneLocation.findUnique({ where: { scene_id: sceneId } });
        if (!existing) {
            return { message: 'Scene location not set' };
        }

        await this.prisma.filmSceneLocation.delete({ where: { scene_id: sceneId } });
        return { message: 'Scene location cleared' };
    }
}
