/**
 * Re-exports from @projectflo/shared (the single source of truth).
 * Backend-only additions (Decimal variant) live here.
 */
export {
  roundMoney,
  computeLineTotal,
  computeItemsTotal,
  computeTaxBreakdown,
} from '@projectflo/shared';

import { Decimal } from '@prisma/client/runtime/library';

/**
 * Same as computeItemsTotal but uses Prisma Decimal for precision.
 * Use when storing the result directly in a Decimal DB column.
 */
export function computeItemsTotalDecimal(
  items: ReadonlyArray<{ quantity: number | string; unit_price: number | string }>,
): Decimal {
  return items.reduce(
    (sum, item) =>
      sum.add(new Decimal(String(item.quantity)).mul(new Decimal(String(item.unit_price)))),
    new Decimal(0),
  );
}
