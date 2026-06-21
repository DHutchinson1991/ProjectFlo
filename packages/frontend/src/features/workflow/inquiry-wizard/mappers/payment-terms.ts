import type { PaymentScheduleTemplate } from "@/features/finance/payment-schedules/types";
import type { ServicePackage } from "@/features/catalog/packages/types/service-package.types";
import type { NACtx } from '../types';

type EnrichedPackage = ServicePackage & {
    _tax?: { rate: number; amount: number; totalWithTax: number } | null;
    _totalCost?: number;
};

export const MILESTONE_COLORS = ["#a78bfa", "#60a5fa", "#34d399", "#f59e0b", "#f87171", "#818cf8", "#2dd4bf"];

export function timingLabel(rule: PaymentScheduleTemplate["rules"][number]): string {
    switch (rule.trigger_type) {
        case "AFTER_BOOKING":
            return rule.trigger_days && rule.trigger_days > 0
                ? `${rule.trigger_days} days after booking`
                : "on booking";
        case "BEFORE_EVENT":
            return rule.trigger_days && rule.trigger_days > 0
                ? `${rule.trigger_days} days before the event`
                : "on the event date";
        case "AFTER_EVENT":
            return rule.trigger_days && rule.trigger_days > 0
                ? `${rule.trigger_days} days after the event`
                : "after the event";
        default:
            return "";
    }
}

export function rulePercent(rule: PaymentScheduleTemplate["rules"][number]): number {
    return rule.amount_type === "PERCENT" ? Number(rule.amount_value) : 0;
}

/**
 * Resolve which payment schedule template should be pre-selected:
 * the selected package's default plan wins, falling back to the brand
 * default. The user's own choice always overrides both.
 */
export function resolveDefaultTemplateId(
    ctx: NACtx,
    templates: PaymentScheduleTemplate[],
): number | null {
    const selectedPkgId = ctx.responses.selected_package;
    if (selectedPkgId) {
        const pkg = ctx.filteredPackages.find((p) => String(p.id) === String(selectedPkgId));
        const packageDefaultId = pkg?.contents?.default_payment_schedule_template_id;
        if (packageDefaultId && templates.some((t) => t.id === packageDefaultId)) {
            return packageDefaultId;
        }
    }
    return templates.find((t) => t.is_default)?.id ?? null;
}

export function resolveTotal(ctx: NACtx): number | null {
    const builderTotal = ctx.priceEstimate?.summary?.subtotal;
    if (builderTotal && builderTotal > 0) return builderTotal;

    const selectedPkgId = ctx.responses.selected_package;
    if (selectedPkgId) {
        const pkg = ctx.filteredPackages.find((p) => String(p.id) === String(selectedPkgId));
        if (pkg) {
            const epkg = pkg as EnrichedPackage;
            const backendTax = epkg._tax;
            const totalCost = backendTax?.totalWithTax ?? Number(epkg._totalCost ?? 0);
            const itemsTotal = (pkg.contents?.items ?? []).reduce(
                (s: number, it: { price?: number }) => s + (it.price ?? 0), 0,
            );
            const price = totalCost > 0 ? totalCost : (itemsTotal || 0);
            if (price > 0) return price;
        }
    }

    return null;
}
