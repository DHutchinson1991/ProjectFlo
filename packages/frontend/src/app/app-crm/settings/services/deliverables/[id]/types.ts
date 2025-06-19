// Visual template interfaces for the deliverable editor
export interface VisualTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    components: VisualTemplateComponent[];
    totalDuration: number;
    totalHours: number;
    estimatedCost: number;
    complexity: number;
}

export interface VisualTemplateComponent {
    id: string;
    componentId: string;
    order: number;
    duration?: number;
    component?: {
        id: string;
        name: string;
        description: string;
        category: string;
        baseTimeMinutes: number;
        complexityMultiplier: number;
        baseCost: number;
        icon: string;
        color: string;
    };
}
