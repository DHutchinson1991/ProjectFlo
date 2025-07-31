import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMusicLibraryItemDto, UpdateMusicLibraryItemDto } from './dto/music.dto';

@Injectable()
export class MusicService {
    constructor(private prisma: PrismaService) { }

    // ==================== MUSIC LIBRARY ====================

    async getMusicLibrary(projectId?: number, brandId?: number) {
        const where: { project_id?: number; brand_id?: number } = {};

        if (projectId) {
            where.project_id = projectId;
        }

        if (brandId) {
            where.brand_id = brandId;
        }

        const musicItems = await this.prisma.musicLibrary.findMany({
            where,
            orderBy: {
                created_at: 'desc'
            }
        });

        // For each music item, find if it's attached to any moments
        const enrichedMusicItems = await Promise.all(
            musicItems.map(async (item) => {
                // Find moments that have this music attached (by matching name and artist)
                const attachedMoment = await this.prisma.sceneMomentMusic.findFirst({
                    where: {
                        music_name: item.music_name,
                        artist: item.artist,
                        music_type: item.music_type
                    },
                    include: {
                        moment: {
                            select: {
                                id: true,
                                name: true,
                                scene: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                });

                return {
                    ...item,
                    moment_id: attachedMoment?.moment.id || null,
                    moment_name: attachedMoment?.moment.name || null,
                    scene_name: attachedMoment?.moment.scene?.name || null,
                };
            })
        );

        return enrichedMusicItems;
    }

    async getMusicLibraryItem(id: number) {
        const item = await this.prisma.musicLibrary.findUnique({
            where: { id }
        });

        if (!item) {
            throw new NotFoundException(`Music library item with ID ${id} not found`);
        }

        return item;
    }

    async createMusicLibraryItem(data: CreateMusicLibraryItemDto) {
        // Auto-generate assignment number if not provided
        let assignmentNumber = data.assignment_number;

        if (!assignmentNumber) {
            // Find the highest assignment number and increment
            const existingMusic = await this.prisma.musicLibrary.findMany({
                where: {
                    assignment_number: {
                        startsWith: 'M'
                    }
                },
                orderBy: {
                    assignment_number: 'desc'
                },
                take: 1
            });

            if (existingMusic.length > 0) {
                const highestNumber = parseInt(existingMusic[0].assignment_number?.substring(1) || '0');
                assignmentNumber = `M${highestNumber + 1}`;
            } else {
                assignmentNumber = 'M1';
            }
        }

        return this.prisma.musicLibrary.create({
            data: {
                assignment_number: assignmentNumber,
                music_name: data.music_name,
                artist: data.artist,
                duration: data.duration,
                music_type: data.music_type,
                file_path: data.file_path,
                notes: data.notes,
                project_id: data.project_id,
                brand_id: data.brand_id,
            }
        });
    }

    async updateMusicLibraryItem(id: number, data: UpdateMusicLibraryItemDto) {
        // Check if item exists
        await this.getMusicLibraryItem(id);

        return this.prisma.musicLibrary.update({
            where: { id },
            data: {
                music_name: data.music_name,
                artist: data.artist,
                duration: data.duration,
                music_type: data.music_type,
                file_path: data.file_path,
                notes: data.notes,
            }
        });
    }

    async deleteMusicLibraryItem(id: number) {
        // Check if item exists
        await this.getMusicLibraryItem(id);

        // Check if music is attached to any moments
        const attachedMoments = await this.prisma.sceneMomentMusic.findMany({
            where: {
                music_name: {
                    equals: (await this.getMusicLibraryItem(id)).music_name
                }
            }
        });

        if (attachedMoments.length > 0) {
            throw new Error(`Cannot delete music item: it is attached to ${attachedMoments.length} moment(s)`);
        }

        return this.prisma.musicLibrary.delete({
            where: { id }
        });
    }

    // ==================== ATTACH/DETACH MUSIC TO MOMENTS ====================

    async attachMusicToMoment(momentId: number, musicLibraryItemId: number) {
        // Get the music library item
        const musicItem = await this.getMusicLibraryItem(musicLibraryItemId);

        // Check if moment exists
        const moment = await this.prisma.sceneMoments.findUnique({
            where: { id: momentId },
            include: { music: true }
        });

        if (!moment) {
            throw new NotFoundException(`Moment with ID ${momentId} not found`);
        }

        // If moment already has music, update it, otherwise create new
        if (moment.music) {
            return this.prisma.sceneMomentMusic.update({
                where: { moment_id: momentId },
                data: {
                    music_name: musicItem.music_name,
                    artist: musicItem.artist,
                    duration: musicItem.duration,
                    music_type: musicItem.music_type,
                    file_path: musicItem.file_path,
                    notes: musicItem.notes,
                }
            });
        } else {
            return this.prisma.sceneMomentMusic.create({
                data: {
                    moment_id: momentId,
                    music_name: musicItem.music_name,
                    artist: musicItem.artist,
                    duration: musicItem.duration,
                    music_type: musicItem.music_type,
                    file_path: musicItem.file_path,
                    notes: musicItem.notes,
                }
            });
        }
    }

    async detachMusicFromMoment(momentId: number) {
        // Check if moment exists
        const moment = await this.prisma.sceneMoments.findUnique({
            where: { id: momentId },
            include: { music: true }
        });

        if (!moment) {
            throw new NotFoundException(`Moment with ID ${momentId} not found`);
        }

        if (!moment.music) {
            throw new NotFoundException(`Moment with ID ${momentId} has no music attached`);
        }

        return this.prisma.sceneMomentMusic.delete({
            where: { moment_id: momentId }
        });
    }
}
