import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { ProjectFilmCloneService } from '../../../workflow/projects/project-film-clone.service';

@Injectable()
export class InstanceFilmCloneService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filmCloneService: ProjectFilmCloneService,
  ) {}

  async cloneFromLibrary(projectFilmId: number) {
    const projectFilm = await this.prisma.projectFilm.findUnique({
      where: { id: projectFilmId },
    });
    if (!projectFilm) {
      throw new NotFoundException(`ProjectFilm ${projectFilmId} not found`);
    }
    if (!projectFilm.film_id) {
      return { cloned: false, reason: 'No library film linked' };
    }

    const existingScenes = await this.prisma.projectFilmScene.count({
      where: { project_film_id: projectFilmId },
    });
    if (existingScenes > 0) {
      return { cloned: false, reason: 'Instance already has scenes', existingScenes };
    }

    const result = await this.filmCloneService.cloneFilmContent(
      {
        projectId: projectFilm.project_id ?? undefined,
        inquiryId: projectFilm.inquiry_id ?? undefined,
        projectFilmId,
      },
      projectFilm.film_id,
    );

    return { cloned: true, ...result.summary };
  }
}
