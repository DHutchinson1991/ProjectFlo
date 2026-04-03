export interface LineItem {
    id?: number; // Database ID (optional for new items)
    tempId: string; // Frontend ID for DnD
    category?: string;
    description: string;
    service_date?: string;
    start_time?: string;
    end_time?: string;
    quantity: number;
    unit?: string;
    unit_price: number;
    total: number;
    type?: 'service' | 'product' | 'discount';
}

export interface LineItemEditorProps {
    items: LineItem[];
    onChange: (items: LineItem[]) => void;
    currency: string;
    readOnly?: boolean;
}

export const UNIT_TYPES = ['Qty', 'Hours', 'Days', 'Flat Rate', 'Service', 'Event', 'Fixed'];

export const ITEM_CATEGORIES = [
    { value: 'Coverage',         label: 'Coverage' },
    { value: 'Films',            label: 'Films' },
    { value: 'Post-Production',  label: 'Post-Production' },
    { value: 'Travel',           label: 'Travel' },
    { value: 'Equipment',        label: 'Equipment' },
    { value: 'Discount',         label: 'Discount' },
    { value: 'Other',            label: 'Other' },
];

export const CATEGORY_COLORS: Record<string, string> = {
    Equipment: '#10b981',
    Planning: '#a855f7',
    Coverage: '#648CFF',
    'Post-Production': '#f97316',
    Travel: '#06b6d4',
    Discount: '#ef4444',
    Other: '#94a3b8',
};
