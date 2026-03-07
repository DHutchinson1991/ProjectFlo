import { Project, CreateProjectRequest, UpdateProjectRequest } from '../types/project.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

class ProjectApiService {
    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Add authorization header if token exists
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Add brand context header if brand exists
        const brandId = localStorage.getItem('projectflo_current_brand');
        if (brandId) {
            headers['X-Brand-Context'] = brandId;
        }

        return headers;
    }

    private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        // For DELETE requests, return empty object if no content
        if (response.status === 204 || !response.headers.get('content-length')) {
            return {} as T;
        }

        return response.json();
    }

    async getAllProjects(): Promise<Project[]> {
        return this.makeRequest<Project[]>('/projects');
    }

    async getProjectById(id: number): Promise<Project> {
        return this.makeRequest<Project>(`/projects/${id}`);
    }

    async createProject(data: CreateProjectRequest): Promise<Project> {
        return this.makeRequest<Project>('/projects', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateProject(id: number, data: UpdateProjectRequest): Promise<Project> {
        return this.makeRequest<Project>(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteProject(id: number): Promise<void> {
        return this.makeRequest<void>(`/projects/${id}`, {
            method: 'DELETE',
        });
    }
}

export const projectApiService = new ProjectApiService();
