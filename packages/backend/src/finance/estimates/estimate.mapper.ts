import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { UpdateEstimateDto } from './dto/update-estimate.dto';
import { computeTaxBreakdown } from '../shared/pricing.utils';

export interface EstimateRecord {
  total_amount: Decimal | number;
  tax_rate?: Decimal | number | null;
  deposit_required?: Decimal | number | null;
  version?: number | null;
  updated_at: Date;
  status?: string | null;
  items?: EstimateItemRecord[];
  [key: string]: unknown;
}

export interface EstimateItemRecord {
  quantity: Decimal | number;
  unit_price: Decimal | number;
  [key: string]: unknown;
}

export function mapEstimateItem(item: EstimateItemRecord) {
  return {
    ...item,
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
  };
}

export function mapEstimateResponse(
  estimate: EstimateRecord,
  opts: { latestDataChange?: Date } = {},
) {
  const totalAmount = Number(estimate.total_amount);
  const taxRate = Number(estimate.tax_rate ?? 0);
  return {
    ...estimate,
    total_amount: totalAmount,
    total_with_tax: computeTaxBreakdown(totalAmount, taxRate).total,
    version: estimate.version ?? 1,
    ...(opts.latestDataChange !== undefined && {
      is_stale: opts.latestDataChange > new Date(estimate.updated_at),
    }),
    tax_rate: taxRate || undefined,
    deposit_required: estimate.deposit_required
      ? Number(estimate.deposit_required)
      : undefined,
    items: (estimate.items ?? []).map(mapEstimateItem),
  };
}

export function buildEstimateUpdateData(
  dto: UpdateEstimateDto,
  currentVersion: number,
  totalAmount?: number,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (dto.estimate_number) data.estimate_number = dto.estimate_number;
  if (dto.title !== undefined) data.title = dto.title;
  if (dto.issue_date) data.issue_date = new Date(dto.issue_date);
  if (dto.expiry_date) data.expiry_date = new Date(dto.expiry_date);
  if (dto.status) data.status = dto.status;
  if (dto.tax_rate !== undefined) data.tax_rate = new Decimal(dto.tax_rate);
  if (dto.deposit_required !== undefined)
    data.deposit_required = dto.deposit_required
      ? new Decimal(dto.deposit_required)
      : null;
  if (dto.notes !== undefined) data.notes = dto.notes;
  if (dto.terms !== undefined) data.terms = dto.terms;
  if (dto.payment_method !== undefined) data.payment_method = dto.payment_method;
  if (dto.installments !== undefined) data.installments = dto.installments;
  if (dto.is_primary !== undefined) data.is_primary = dto.is_primary;
  if (dto.project_id !== undefined) data.project_id = dto.project_id;
  if (totalAmount !== undefined) data.total_amount = new Decimal(totalAmount);

  const hasContentChange =
    dto.items || totalAmount !== undefined || dto.title !== undefined;
  if (hasContentChange) data.version = currentVersion + 1;

  return data;
}

export async function generateEstimateNumber(
  db: Pick<PrismaService, 'estimates'>,
): Promise<string> {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  for (let attempt = 0; attempt < 50; attempt++) {
    const code =
      letters[Math.floor(Math.random() * letters.length)] +
      digits[Math.floor(Math.random() * digits.length)] +
      letters[Math.floor(Math.random() * letters.length)] +
      digits[Math.floor(Math.random() * digits.length)];
    const candidate = `EST-${code}`;
    const exists = await db.estimates.findFirst({
      where: { estimate_number: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  return `EST-${Date.now().toString(36).slice(-6).toUpperCase()}`;
}

export async function getEstimateLatestDataChange(
  prisma: PrismaService,
  inquiryId: number,
): Promise<Date> {
  const [inquiry, latestOperator, latestFilm] = await Promise.all([
    prisma.inquiries.findUnique({
      where: { id: inquiryId },
      select: { updated_at: true },
    }),
    prisma.projectCrewSlot.findFirst({
      where: { inquiry_id: inquiryId },
      orderBy: { updated_at: 'desc' },
      select: { updated_at: true },
    }),
    prisma.projectFilm.findFirst({
      where: { inquiry_id: inquiryId },
      orderBy: { updated_at: 'desc' },
      select: { updated_at: true },
    }),
  ]);

  const dates = [
    inquiry?.updated_at,
    latestOperator?.updated_at,
    latestFilm?.updated_at,
  ].filter(Boolean) as Date[];

  return dates.length > 0
    ? new Date(Math.max(...dates.map((d) => d.getTime())))
    : new Date(0);
}
