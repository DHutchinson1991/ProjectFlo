export interface FinanceMilestone {
    label: string;
    amount: number | string;
    due_date?: string | Date | null;
    status?: string;
}
