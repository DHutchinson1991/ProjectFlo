export const packageTemplateKeys = {
    all: (brandId: number) => ['catalog', 'package-templates', brandId] as const,
    list: (brandId: number) => [...packageTemplateKeys.all(brandId), 'list'] as const,
    detail: (brandId: number, id: number) => [...packageTemplateKeys.all(brandId), 'detail', id] as const,
};
