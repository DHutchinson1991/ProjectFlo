"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project } from '../projects/types/project.types';
import { projectApiService } from '../projects/services/projectApi';

interface ProjectContextType {
    // Active project state
    activeProject: Project | null;
    setActiveProject: (project: Project | null) => void;

    // All projects list
    projects: Project[];
    setProjects: (projects: Project[]) => void;

    // Loading states
    isLoading: boolean;

    // Functions
    loadProjects: () => Promise<void>;
    createProject: (name: string) => Promise<Project | null>;
    updateProject: (id: number, data: { project_name: string }) => Promise<Project | null>;
    deleteProject: (id: number) => Promise<boolean>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
    children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
    const [activeProject, setActiveProjectState] = useState<Project | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load active project from localStorage on mount
    useEffect(() => {
        const savedProjectId = localStorage.getItem('activeProjectId');
        if (savedProjectId && projects.length > 0) {
            const project = projects.find(p => p.id === parseInt(savedProjectId));
            if (project) {
                setActiveProjectState(project);
            }
        }
    }, [projects]);

    // Set active project and save to localStorage
    const setActiveProject = (project: Project | null) => {
        setActiveProjectState(project);
        if (project) {
            localStorage.setItem('activeProjectId', project.id.toString());
        } else {
            localStorage.removeItem('activeProjectId');
        }
    };

    // Load all projects from API
    const loadProjects = async () => {
        setIsLoading(true);
        try {
            const projectsData = await projectApiService.getAllProjects();
            setProjects(projectsData);

            // If no active project is set, but we have projects, set the first one as active
            if (!activeProject && projectsData.length > 0) {
                const savedProjectId = localStorage.getItem('activeProjectId');
                if (savedProjectId) {
                    const savedProject = projectsData.find(p => p.id === parseInt(savedProjectId));
                    if (savedProject) {
                        setActiveProject(savedProject);
                    } else {
                        setActiveProject(projectsData[0]);
                    }
                } else {
                    setActiveProject(projectsData[0]);
                }
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Create a new project
    const createProject = async (name: string): Promise<Project | null> => {
        try {
            const newProject = await projectApiService.createProject({
                project_name: name,
            });

            // Reload projects to get the updated list
            await loadProjects();

            return newProject;
        } catch (error) {
            console.error('Error creating project:', error);
            return null;
        }
    };

    // Update a project
    const updateProject = async (id: number, data: { project_name: string }): Promise<Project | null> => {
        try {
            const updatedProject = await projectApiService.updateProject(id, data);

            // Update projects list
            setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));

            // Update active project if it's the one being updated
            if (activeProject && activeProject.id === id) {
                setActiveProject(updatedProject);
            }

            return updatedProject;
        } catch (error) {
            console.error('Error updating project:', error);
            return null;
        }
    };

    // Delete a project
    const deleteProject = async (id: number): Promise<boolean> => {
        try {
            await projectApiService.deleteProject(id);

            // Remove from projects list
            setProjects(prev => prev.filter(p => p.id !== id));

            // If the deleted project was active, clear active project
            if (activeProject && activeProject.id === id) {
                setActiveProject(null);
            }

            return true;
        } catch (error) {
            console.error('Error deleting project:', error);
            return false;
        }
    };

    // Load projects on mount
    useEffect(() => {
        loadProjects();
    }, []);

    const value: ProjectContextType = {
        activeProject,
        setActiveProject,
        projects,
        setProjects,
        isLoading,
        loadProjects,
        createProject,
        updateProject,
        deleteProject,
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProjects() {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProjects must be used within a ProjectProvider');
    }
    return context;
}
