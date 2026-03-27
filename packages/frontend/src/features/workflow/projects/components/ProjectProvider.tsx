"use client";

import React, { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import { createProjectsApi } from '../api';
import type { Project, UpdateProjectRequest } from '../types/project.types';

const projectsApi = createProjectsApi(apiClient);

export interface ProjectsContextValue {
    activeProject: Project | null;
    setActiveProject: (project: Project | null) => void;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    isLoading: boolean;
    loadProjects: () => Promise<void>;
    getProjectById: (id: number) => Promise<Project | null>;
    createProject: (name: string) => Promise<Project | null>;
    updateProject: (id: number, data: UpdateProjectRequest) => Promise<Project | null>;
    deleteProject: (id: number) => Promise<boolean>;
    syncScheduleFromPackage: (projectId: number) => Promise<boolean>;
}

export const ProjectsContext = createContext<ProjectsContextValue | undefined>(undefined);

interface ProjectProviderProps {
    children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
    const [activeProject, setActiveProjectState] = useState<Project | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const savedProjectId = localStorage.getItem('activeProjectId');
        if (savedProjectId && projects.length > 0) {
            const project = projects.find((item) => item.id === Number(savedProjectId));
            if (project) {
                setActiveProjectState(project);
            }
        }
    }, [projects]);

    const setActiveProject = (project: Project | null) => {
        setActiveProjectState(project);
        if (project) {
            localStorage.setItem('activeProjectId', project.id.toString());
        } else {
            localStorage.removeItem('activeProjectId');
        }
    };

    const loadProjects = async () => {
        setIsLoading(true);
        try {
            const projectsData = await projectsApi.getAll();
            setProjects(projectsData);
            if (!activeProject && projectsData.length > 0) {
                const savedProjectId = localStorage.getItem('activeProjectId');
                const fallbackProject = savedProjectId
                    ? projectsData.find((item) => item.id === Number(savedProjectId))
                    : undefined;
                setActiveProject(fallbackProject ?? projectsData[0]);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getProjectById = async (id: number) => {
        try {
            return await projectsApi.getById(id);
        } catch (error) {
            console.error('Error loading project:', error);
            return null;
        }
    };

    const createProject = async (name: string) => {
        try {
            const newProject = await projectsApi.create({ project_name: name });
            await loadProjects();
            return newProject;
        } catch (error) {
            console.error('Error creating project:', error);
            return null;
        }
    };

    const updateProject = async (id: number, data: UpdateProjectRequest) => {
        try {
            const updatedProject = await projectsApi.update(id, data);
            setProjects((prev) => prev.map((item) => (item.id === id ? updatedProject : item)));
            if (activeProject?.id === id) {
                setActiveProject(updatedProject);
            }
            return updatedProject;
        } catch (error) {
            console.error('Error updating project:', error);
            return null;
        }
    };

    const deleteProject = async (id: number) => {
        try {
            await projectsApi.delete(id);
            setProjects((prev) => prev.filter((item) => item.id !== id));
            if (activeProject?.id === id) {
                setActiveProject(null);
            }
            return true;
        } catch (error) {
            console.error('Error deleting project:', error);
            return false;
        }
    };

    const syncScheduleFromPackage = async (projectId: number) => {
        try {
            await projectsApi.syncScheduleFromPackage(projectId);
            return true;
        } catch (error) {
            console.error('Error syncing project schedule:', error);
            return false;
        }
    };

    const value = useMemo<ProjectsContextValue>(() => ({
        activeProject,
        setActiveProject,
        projects,
        setProjects,
        isLoading,
        loadProjects,
        getProjectById,
        createProject,
        updateProject,
        deleteProject,
        syncScheduleFromPackage,
    }), [activeProject, isLoading, projects]);

    return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}