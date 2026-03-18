import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from './logger.service';

/**
 * HTTP Request/Response Logging Middleware
 * 
 * Logs all incoming requests and outgoing responses with:
 * - HTTP method and URL
 * - Request body (for POST/PUT/PATCH)
 * - Response status code
 * - Response time in milliseconds
 * - User agent
 * - IP address
 * 
 * Usage: Register globally in app.module.ts
 * ```typescript
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer.apply(RequestLoggerMiddleware).forRoutes('*');
 *   }
 * }
 * ```
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
    private readonly logger = new LoggerService('HTTP');

    use(req: Request, res: Response, next: NextFunction) {
        const { method, originalUrl, body, ip } = req;
        const startTime = Date.now();

        // Log response when finished
        res.on('finish', () => {
            const { statusCode } = res;
            const responseTime = Date.now() - startTime;

            // Skip logging for 304 Not Modified (cached responses)
            if (statusCode === 304) {
                next;
                return;
            }

            const message = `${method} ${originalUrl} ${statusCode} ${responseTime}ms`;

            if (statusCode >= 500) {
                this.logger.error(message, undefined, { ip, statusCode, responseTime });
            } else if (statusCode >= 400) {
                this.logger.warn(message, { ip, statusCode, responseTime });
            } else {
                this.logger.log(message, {
                    responseTime,
                    ...(this.shouldLogBody(method) && Object.keys(body || {}).length > 0 && { body }),
                });
            }
        });

        next();
    }

    /**
     * Determine log level based on status code
     */
    private getLogLevel(statusCode: number): 'log' | 'warn' | 'error' {
        if (statusCode >= 500) {
            return 'error';
        } else if (statusCode >= 400) {
            return 'warn';
        }
        return 'log';
    }

    /**
     * Check if request body should be logged
     */
    private shouldLogBody(method: string): boolean {
        return ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase());
    }

    /**
     * Truncate user agent for cleaner logs
     */
    private truncateUserAgent(userAgent: string): string {
        if (userAgent.length > 100) {
            return userAgent.substring(0, 100) + '...';
        }
        return userAgent;
    }
}
