import {
    Assignment as ProjectIcon,
    Lightbulb as CreativeIcon,
    Build as PreProductionIcon,
    VideoCall as ProductionIcon,
    Edit as PostProductionIcon,
    LocalShipping as DeliveryIcon,
    CalendarMonth as PlanningIcon,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';
import { ProjectPhase } from '../types/project.types';

export interface ProjectPhaseConfig {
    id: ProjectPhase;
    tabId: string;
    name: string;
    icon: SvgIconComponent;
    color: string;
    description: string;
}

/**
 * Phase tabs that appear after the core tabs (Project, Discovery, Proposal, Schedule).
 * Each maps to a project_phase enum value.
 */
export const PROJECT_PHASE_TABS: ProjectPhaseConfig[] = [
    {
        id: ProjectPhase.BOOKING,
        tabId: 'planning',
        name: 'Planning',
        icon: PlanningIcon,
        color: '#6b7280',
        description: 'Post-booking planning and coordination',
    },
    {
        id: ProjectPhase.CREATIVE_DEVELOPMENT,
        tabId: 'creative',
        name: 'Creative Development',
        icon: CreativeIcon,
        color: '#8b5cf6',
        description: 'Creative planning and ideation',
    },
    {
        id: ProjectPhase.PRE_PRODUCTION,
        tabId: 'preproduction',
        name: 'Pre-Production',
        icon: PreProductionIcon,
        color: '#f59e0b',
        description: 'Planning and preparation',
    },
    {
        id: ProjectPhase.PRODUCTION,
        tabId: 'production',
        name: 'Production',
        icon: ProductionIcon,
        color: '#ef4444',
        description: 'Filming and content creation',
    },
    {
        id: ProjectPhase.POST_PRODUCTION,
        tabId: 'postproduction',
        name: 'Post-Production',
        icon: PostProductionIcon,
        color: '#3b82f6',
        description: 'Editing and post-processing',
    },
    {
        id: ProjectPhase.DELIVERY,
        tabId: 'delivery',
        name: 'Delivery',
        icon: DeliveryIcon,
        color: '#10b981',
        description: 'Final delivery and completion',
    },
];

/** All phase configs indexed by enum value for quick lookup. */
export const PHASE_CONFIG_MAP = new Map(
    PROJECT_PHASE_TABS.map((p) => [p.id, p]),
);
