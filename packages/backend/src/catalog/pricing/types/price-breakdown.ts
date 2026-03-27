export interface PriceBreakdown {
  packageId: number;
  packageName: string;
  currency: string;
  equipment: {
    cameras: number;
    audio: number;
    totalItems: number;
    dailyCost: number;
    items: Array<{ name: string; category: string; dailyRate: number }>;
  };
  crew: {
    operatorCount: number;
    totalHours: number;
    totalCost: number;
    operators: Array<{ position: string; hours: number; rate: number; cost: number }>;
  };
  tasks: {
    totalTasks: number;
    totalHours: number;
    totalCost: number;
    byPhase: Record<string, { taskCount: number; hours: number; cost: number }>;
  };
  summary: {
    equipmentCost: number;
    crewCost: number;
    subtotal: number;
  };
  tax: {
    rate: number;
    amount: number;
    totalWithTax: number;
  };
  warnings: string[];
}
