export const CATEGORY_COLORS: Record<string, string> = {
    Coverage: '#648CFF',
    Planning: '#a855f7',
    'Post-Production': '#f97316',
    Travel: '#06b6d4',
    Equipment: '#10b981',
    Discount: '#ef4444',
    Other: '#94a3b8',
};

export function getCategoryColor(rawCategory: string): string {
    const key = rawCategory.startsWith('Post-Production') ? 'Post-Production' : rawCategory;
    return CATEGORY_COLORS[key] ?? '#94a3b8';
}
