import {
    Assignment as ProjectIcon,
    Lightbulb as CreativeIcon,
    Build as PreProductionIcon,
    VideoCall as ProductionIcon,
    Edit as PostProductionIcon,
    LocalShipping as DeliveryIcon,
    Inventory as PackageIcon,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';

export interface ProjectPhase {
    id: string;
    name: string;
    icon: SvgIconComponent;
    color: string;
    description: string;
}

export const PROJECT_PHASES: ProjectPhase[] = [
    {
        id: 'overview',
        name: 'Overview',
        icon: ProjectIcon,
        color: '#6b7280',
        description: 'Project summary and details'
    },
    {
        id: 'package',
        name: 'Package',
        icon: PackageIcon,
        color: '#a855f7',
        description: 'Cloned package schedule snapshot'
    },
    {
        id: 'creative',
        name: 'Creative Development',
        icon: CreativeIcon,
        color: '#8b5cf6',
        description: 'Creative planning and ideation'
    },
    {
        id: 'preproduction',
        name: 'Pre Production',
        icon: PreProductionIcon,
        color: '#f59e0b',
        description: 'Planning and preparation'
    },
    {
        id: 'production',
        name: 'Production',
        icon: ProductionIcon,
        color: '#ef4444',
        description: 'Filming and content creation'
    },
    {
        id: 'postproduction',
        name: 'Post Production',
        icon: PostProductionIcon,
        color: '#3b82f6',
        description: 'Editing and post-processing'
    },
    {
        id: 'delivery',
        name: 'Delivery',
        icon: DeliveryIcon,
        color: '#10b981',
        description: 'Final delivery and completion'
    }
];
