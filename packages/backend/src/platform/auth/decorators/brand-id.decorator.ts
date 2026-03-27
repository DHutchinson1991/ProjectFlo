import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom parameter decorator that extracts brand ID from the request.
 *
 * Checks (in order):
 *   1. Route param  :brandId
 *   2. Header        x-brand-context
 *   3. Query param   brandId
 *
 * Returns the parsed number, or undefined when the header / param is absent.
 *
 * Usage:
 *   @Get()
 *   findAll(@BrandId() brandId: number) { … }
 */
export const BrandId = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): number | undefined => {
        const req = ctx.switchToHttp().getRequest();

        // 1. Route param (e.g. /brand/:brandId)
        const fromParam = req.params?.brandId;
        if (fromParam !== undefined) {
            return parseInt(fromParam, 10);
        }

        // 2. Header (most common — set by frontend BrandProvider)
        const fromHeader = req.headers?.['x-brand-context'];
        if (fromHeader) {
            return parseInt(fromHeader, 10);
        }

        // 3. Query string fallback
        const fromQuery = req.query?.brandId;
        if (fromQuery) {
            return parseInt(fromQuery, 10);
        }

        return undefined;
    },
);
