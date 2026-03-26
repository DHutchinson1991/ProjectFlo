import { useContext } from 'react';
import { ProjectsContext } from '../components/ProjectProvider';

export function useProjects() {
    const context = useContext(ProjectsContext);
    if (!context) {
        throw new Error('useProjects must be used within a ProjectProvider');
    }
    return context;
}