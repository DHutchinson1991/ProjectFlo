import { Project, CreateProjectRequest, UpdateProjectRequest } from '../types/project.types';
import { projectsService } from '../../../../lib/api';

class ProjectApiService {
    async getAllProjects(): Promise<Project[]> {
        return projectsService.getAll();
    }

    async getProjectById(id: number): Promise<Project> {
        return projectsService.getById(id);
    }

    async createProject(data: CreateProjectRequest): Promise<Project> {
        return projectsService.create(data);
    }

    async updateProject(id: number, data: UpdateProjectRequest): Promise<Project> {
        return projectsService.update(id, data);
    }

    async deleteProject(id: number): Promise<void> {
        return projectsService.delete(id);
    }
}

export const projectApiService = new ProjectApiService();
