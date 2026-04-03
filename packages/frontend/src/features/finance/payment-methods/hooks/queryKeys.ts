export const paymentMethodKeys = {
  all: (brandId: number) => ['paymentMethods', brandId] as const,
  list: (brandId: number) => [...paymentMethodKeys.all(brandId), 'list'] as const,
  detail: (brandId: number, id: number) => [...paymentMethodKeys.all(brandId), 'detail', id] as const,
};
