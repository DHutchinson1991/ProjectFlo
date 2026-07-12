import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { PrismaService } from '../../platform/prisma/prisma.service';

describe('StripeService', () => {
    const buildConfig = (overrides: Record<string, string | undefined> = {}) => ({
        get: jest.fn((key: string, defaultValue?: string) => {
            const values: Record<string, string | undefined> = {
                STRIPE_SECRET_KEY: undefined,
                STRIPE_WEBHOOK_SECRET: '',
                FRONTEND_URL: 'http://localhost:3001',
                ...overrides,
            };
            const value = values[key];
            return value !== undefined ? value : defaultValue;
        }),
    });

    it('initializes without throwing when STRIPE_SECRET_KEY is absent', async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StripeService,
                { provide: ConfigService, useValue: buildConfig() },
                { provide: PrismaService, useValue: {} },
            ],
        }).compile();

        const service = module.get(StripeService);
        expect(service).toBeDefined();
    });

    it('rejects Stripe operations when the secret key is not configured', async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StripeService,
                { provide: ConfigService, useValue: buildConfig() },
                { provide: PrismaService, useValue: {} },
            ],
        }).compile();

        const service = module.get(StripeService);

        expect(() => service.constructWebhookEvent(Buffer.from('{}'), 'sig')).toThrow(BadRequestException);
        expect(() => service.constructWebhookEvent(Buffer.from('{}'), 'sig')).toThrow(
            'Stripe is not configured on this server',
        );
    });

    it('returns has_account false when brand has no connected Stripe account', async () => {
        const prisma = {
            brands: {
                findUnique: jest.fn().mockResolvedValue({
                    stripe_account_id: null,
                    stripe_onboarding_complete: false,
                }),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StripeService,
                { provide: ConfigService, useValue: buildConfig({ STRIPE_SECRET_KEY: 'sk_test_fake' }) },
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        const service = module.get(StripeService);
        const status = await service.getAccountStatus(1);

        expect(status).toEqual({
            has_account: false,
            onboarding_complete: false,
            charges_enabled: false,
            payouts_enabled: false,
            account_id: null,
        });
    });
});
