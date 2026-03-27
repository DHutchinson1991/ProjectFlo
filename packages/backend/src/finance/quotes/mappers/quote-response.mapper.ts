import { computeTaxBreakdown } from '../../shared/pricing.utils';

/** Prisma include clause shared across quote queries */
export const QUOTE_ITEMS_INCLUDE = {
  items: {
    select: {
      id: true,
      category: true,
      description: true,
      quantity: true,
      unit: true,
      unit_price: true,
      service_date: true,
      start_time: true,
      end_time: true,
    },
  },
} as const;

/** Convert Prisma Decimal fields to plain numbers for the API response */
export function mapQuoteResponse(quote: Record<string, unknown> & { total_amount: unknown; tax_rate: unknown; items: { quantity: unknown; unit_price: unknown }[] }) {
  const totalAmount = Number(quote.total_amount);
  const taxRate = quote.tax_rate ? Number(quote.tax_rate) : 0;
  return {
    ...quote,
    total_amount: totalAmount,
    total_with_tax: computeTaxBreakdown(totalAmount, taxRate).total,
    items: quote.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
    })),
  };
}
