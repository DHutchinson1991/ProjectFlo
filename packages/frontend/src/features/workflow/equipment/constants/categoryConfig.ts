import {
    Videocam as CameraIcon,
    Mic as AudioIcon,
    Lightbulb as LightingIcon,
    Memory as LensIcon,
    Storage as StorageIcon,
    Build as GripIcon,
    Power as PowerIcon,
    Computer as StreamingIcon,
    Palette as BackgroundsIcon,
    Extension as AccessoriesIcon,
    Category as OtherIcon,
} from "@mui/icons-material";
import { EquipmentCategory } from "@/features/workflow/equipment/types/equipment.types";

export const EQUIPMENT_CATEGORY_CONFIG = {
    [EquipmentCategory.CAMERA]: {
        icon: CameraIcon,
        color: '#1976d2',
        label: 'Cameras & Recording',
    },
    [EquipmentCategory.AUDIO]: {
        icon: AudioIcon,
        color: '#388e3c',
        label: 'Audio Equipment',
    },
    [EquipmentCategory.LIGHTING]: {
        icon: LightingIcon,
        color: '#f57c00',
        label: 'Lighting & Grip',
    },
    [EquipmentCategory.LENS]: {
        icon: LensIcon,
        color: '#7b1fa2',
        label: 'Lenses & Optics',
    },
    [EquipmentCategory.STORAGE]: {
        icon: StorageIcon,
        color: '#d32f2f',
        label: 'Storage & Media',
    },
    [EquipmentCategory.GRIP]: {
        icon: GripIcon,
        color: '#455a64',
        label: 'Support & Grip',
    },
    [EquipmentCategory.POWER]: {
        icon: PowerIcon,
        color: '#ff9800',
        label: 'Power & Batteries',
    },
    [EquipmentCategory.STREAMING]: {
        icon: StreamingIcon,
        color: '#ffeb3b',
        label: 'Streaming Equipment',
    },
    [EquipmentCategory.BACKGROUNDS]: {
        icon: BackgroundsIcon,
        color: '#9e9e9e',
        label: 'Backgrounds & Sets',
    },
    [EquipmentCategory.ACCESSORIES]: {
        icon: AccessoriesIcon,
        color: '#9c27b0',
        label: 'Accessories',
    },
};

export const getCategoryIcon = (category: string) => {
    const config = EQUIPMENT_CATEGORY_CONFIG[category as EquipmentCategory];
    return config ? config.icon : OtherIcon;
};

export const getCategoryColor = (category: string) => {
    const config = EQUIPMENT_CATEGORY_CONFIG[category as EquipmentCategory];
    return config ? config.color : '#616161';
};

export const getCategoryLabel = (category: string) => {
    const config = EQUIPMENT_CATEGORY_CONFIG[category as EquipmentCategory];
    return config ? config.label : 'Other Equipment';
};

// Helper functions for generating color variations
export const getCategoryColorWithAlpha = (category: string, alpha: number) => {
    const color = getCategoryColor(category);
    // Convert hex to rgba
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
