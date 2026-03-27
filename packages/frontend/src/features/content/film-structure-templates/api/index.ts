import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type {
  FilmStructureTemplate,
  CreateFilmStructureTemplateDto,
  UpdateFilmStructureTemplateDto,
} from '@/features/content/films/types/film-structure-templates';
import type { FilmType } from '@/features/content/films/types';

export const createFilmStructureTemplatesApi = (client: ApiClient) => ({
  getAll: (brandId?: number, filmType?: FilmType): Promise<FilmStructureTemplate[]> => {
    const params = new URLSearchParams();
    if (brandId) params.set('brandId', String(brandId));
    if (filmType) params.set('filmType', filmType);
    const query = params.toString() ? `?${params.toString()}` : '';
    return client.get(`/api/film-structure-templates${query}`);
  },
  getById: (id: number): Promise<FilmStructureTemplate> =>
    client.get(`/api/film-structure-templates/${id}`),
  create: (data: CreateFilmStructureTemplateDto): Promise<FilmStructureTemplate> =>
    client.post('/api/film-structure-templates', data),
  update: (id: number, data: UpdateFilmStructureTemplateDto): Promise<FilmStructureTemplate> =>
    client.patch(`/api/film-structure-templates/${id}`, data),
  delete: (id: number): Promise<void> =>
    client.delete(`/api/film-structure-templates/${id}`),
});

export const filmStructureTemplatesApi = createFilmStructureTemplatesApi(apiClient);
export type FilmStructureTemplatesApi = ReturnType<typeof createFilmStructureTemplatesApi>;