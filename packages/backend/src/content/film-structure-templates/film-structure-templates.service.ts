import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilmStructureTemplate, FilmStructureTemplateScene, FilmType, SceneType, Prisma } from '@prisma/client';
import { CreateFilmStructureTemplateDto } from './dto/create-film-structure-template.dto';
import { UpdateFilmStructureTemplateDto } from './dto/update-film-structure-template.dto';

type TemplateWithScenes = FilmStructureTemplate & { scenes: FilmStructureTemplateScene[] };

@Injectable()
export class FilmStructureTemplatesService {
    constructor(private prisma: PrismaService) {}

    private mapToResponseDto(template: TemplateWithScenes) {
        return {
            id: template.id,
            brand_id: template.brand_id,
            name: template.name,
            description: template.description,
            film_type: template.film_type,
            is_system_seeded: template.is_system_seeded,
            is_active: template.is_active,
            created_at: template.created_at,
            updated_at: template.updated_at,
            scenes: template.scenes
                ? template.scenes.map((s: FilmStructureTemplateScene) => ({
                      id: s.id,
                      name: s.name,
                      mode: s.mode,
                      suggested_duration_seconds: s.suggested_duration_seconds,
                      order_index: s.order_index,
                      notes: s.notes,
                      created_at: s.created_at,
                      updated_at: s.updated_at,
                  }))
                : [],
        };
    }

    private readonly defaultInclude = {
        scenes: { orderBy: { order_index: 'asc' as const } },
    };

    async create(createDto: CreateFilmStructureTemplateDto) {
        const template = await this.prisma.filmStructureTemplate.create({
            data: {
                brand_id: createDto.brand_id ?? null,
                name: createDto.name,
                description: createDto.description,
                film_type: (createDto.film_type as FilmType) ?? 'MONTAGE',
                is_active: createDto.is_active ?? true,
                scenes: createDto.scenes?.length
                    ? {
                          create: createDto.scenes.map((s) => ({
                              name: s.name,
                              mode: (s.mode as SceneType) ?? 'MONTAGE',
                              suggested_duration_seconds: s.suggested_duration_seconds,
                              order_index: s.order_index,
                              notes: s.notes,
                          })),
                      }
                    : undefined,
            },
            include: this.defaultInclude,
        });

        return this.mapToResponseDto(template);
    }

    async findAll(brandId?: number, filmType?: string) {
        const where: Prisma.FilmStructureTemplateWhereInput = { is_active: true };

        // Include system defaults + brand-specific
        if (brandId !== undefined) {
            where.OR = [{ brand_id: brandId }, { brand_id: null }];
        }

        if (filmType) {
            where.film_type = filmType as FilmType;
        }

        const templates = await this.prisma.filmStructureTemplate.findMany({
            where,
            include: this.defaultInclude,
            orderBy: { name: 'asc' },
        });

        return templates.map((t) => this.mapToResponseDto(t));
    }

    async findOne(id: number) {
        const template = await this.prisma.filmStructureTemplate.findUnique({
            where: { id },
            include: this.defaultInclude,
        });
        if (!template) {
            throw new NotFoundException(`FilmStructureTemplate with ID ${id} not found`);
        }
        return this.mapToResponseDto(template);
    }

    async update(id: number, updateDto: UpdateFilmStructureTemplateDto) {
        const template = await this.prisma.filmStructureTemplate.findUnique({ where: { id } });
        if (!template) {
            throw new NotFoundException(`FilmStructureTemplate with ID ${id} not found`);
        }
        if (template.is_system_seeded) {
            throw new BadRequestException('System-seeded templates cannot be modified');
        }

        // Update template fields
        const updated = await this.prisma.filmStructureTemplate.update({
            where: { id },
            data: {
                name: updateDto.name,
                description: updateDto.description,
                film_type: updateDto.film_type as FilmType,
                is_active: updateDto.is_active,
            },
            include: this.defaultInclude,
        });

        // Handle nested scenes update if provided
        if (updateDto.scenes) {
            const existingSceneIds = updated.scenes.map((s) => s.id);
            const incomingIds = updateDto.scenes.filter((s) => s.id).map((s) => s.id!);

            // Delete scenes that are no longer in the list
            const toDelete = existingSceneIds.filter((sid) => !incomingIds.includes(sid));
            if (toDelete.length) {
                await this.prisma.filmStructureTemplateScene.deleteMany({
                    where: { id: { in: toDelete } },
                });
            }

            // Upsert each scene
            for (const scene of updateDto.scenes) {
                if (scene.id && existingSceneIds.includes(scene.id)) {
                    await this.prisma.filmStructureTemplateScene.update({
                        where: { id: scene.id },
                        data: {
                            name: scene.name,
                            mode: scene.mode as SceneType,
                            suggested_duration_seconds: scene.suggested_duration_seconds,
                            order_index: scene.order_index,
                            notes: scene.notes,
                        },
                    });
                } else {
                    await this.prisma.filmStructureTemplateScene.create({
                        data: {
                            film_structure_template_id: id,
                            name: scene.name!,
                            mode: (scene.mode as SceneType) ?? 'MONTAGE',
                            suggested_duration_seconds: scene.suggested_duration_seconds,
                            order_index: scene.order_index ?? 0,
                            notes: scene.notes,
                        },
                    });
                }
            }

            // Reload with updated scenes
            const reloaded = await this.prisma.filmStructureTemplate.findUnique({
                where: { id },
                include: this.defaultInclude,
            });
            return this.mapToResponseDto(reloaded!);
        }

        return this.mapToResponseDto(updated);
    }

    async remove(id: number) {
        const template = await this.prisma.filmStructureTemplate.findUnique({ where: { id } });
        if (!template) {
            throw new NotFoundException(`FilmStructureTemplate with ID ${id} not found`);
        }
        if (template.is_system_seeded) {
            throw new BadRequestException('System-seeded templates cannot be deleted');
        }

        await this.prisma.filmStructureTemplate.delete({ where: { id } });
        return { message: `FilmStructureTemplate with ID ${id} deleted successfully` };
    }
}
