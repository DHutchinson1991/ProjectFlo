import {
    resolveDefaultTemplateId,
    resolveTotal,
    rulePercent,
    timingLabel,
} from './payment-terms';
import type { NACtx } from '../types';

const baseCtx = (): NACtx => ({
    responses: {},
    filteredPackages: [],
    priceEstimate: null,
});

describe('payment-terms mappers', () => {
    describe('timingLabel', () => {
        it('formats AFTER_BOOKING with and without delay days', () => {
            expect(timingLabel({ trigger_type: 'AFTER_BOOKING', trigger_days: 0 } as any)).toBe('on booking');
            expect(timingLabel({ trigger_type: 'AFTER_BOOKING', trigger_days: 14 } as any)).toBe(
                '14 days after booking',
            );
        });

        it('formats BEFORE_EVENT and AFTER_EVENT', () => {
            expect(timingLabel({ trigger_type: 'BEFORE_EVENT', trigger_days: 30 } as any)).toBe(
                '30 days before the event',
            );
            expect(timingLabel({ trigger_type: 'AFTER_EVENT', trigger_days: 0 } as any)).toBe('after the event');
        });
    });

    describe('rulePercent', () => {
        it('returns percent value only for PERCENT rules', () => {
            expect(rulePercent({ amount_type: 'PERCENT', amount_value: 25 } as any)).toBe(25);
            expect(rulePercent({ amount_type: 'FIXED', amount_value: 25 } as any)).toBe(0);
        });
    });

    describe('resolveDefaultTemplateId', () => {
        const templates = [
            { id: 1, is_default: false },
            { id: 2, is_default: true },
            { id: 3, is_default: false },
        ] as any[];

        it('prefers selected package default payment schedule when available', () => {
            const ctx = {
                ...baseCtx(),
                responses: { selected_package: '10' },
                filteredPackages: [
                    {
                        id: 10,
                        contents: { default_payment_schedule_template_id: 3 },
                    },
                ],
            } as NACtx;

            expect(resolveDefaultTemplateId(ctx, templates)).toBe(3);
        });

        it('falls back to brand default when package has no default schedule', () => {
            const ctx = {
                ...baseCtx(),
                responses: { selected_package: '10' },
                filteredPackages: [{ id: 10, contents: {} }],
            } as NACtx;

            expect(resolveDefaultTemplateId(ctx, templates)).toBe(2);
        });
    });

    describe('resolveTotal', () => {
        it('prefers builder price estimate subtotal', () => {
            const ctx = {
                ...baseCtx(),
                priceEstimate: { summary: { subtotal: 4500 } },
            } as NACtx;

            expect(resolveTotal(ctx)).toBe(4500);
        });

        it('uses package tax-inclusive total when estimate is absent', () => {
            const ctx = {
                ...baseCtx(),
                responses: { selected_package: '5' },
                filteredPackages: [
                    {
                        id: 5,
                        contents: { items: [{ price: 100 }] },
                        _tax: { totalWithTax: 2400 },
                    },
                ],
            } as NACtx;

            expect(resolveTotal(ctx)).toBe(2400);
        });

        it('returns null when no pricing source is available', () => {
            expect(resolveTotal(baseCtx())).toBeNull();
        });
    });
});
