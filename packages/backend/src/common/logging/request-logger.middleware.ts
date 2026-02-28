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
        const { method, originalUrl, body, ip, headers } = req;
        const userAgent = headers['user-agent'] || 'Unknown';
        const startTime = Date.now();

        // Log incoming request
        this.logger.log(`→ ${method} ${originalUrl}`, {
            ip,
            userAgent: this.truncateUserAgent(userAgent),
            ...(this.shouldLogBody(method) && Object.keys(body || {}).length > 0 && { body }),
        });

        // Capture response
        const originalSend = res.send;
        res.send = function (data: unknown): Response {
            res.send = originalSend; // Restore original send
            return originalSend.call(this, data);
        };

        // Log response when finished
        res.on('finish', () => {
            const { statusCode } = res;
            const responseTime = Date.now() - startTime;
            const level = this.getLogLevel(statusCode);

            const message = `← ${method} ${originalUrl} ${statusCode} ${responseTime}ms`;

            if (level === 'error') {
                this.logger.error(message, undefined, { ip, statusCode, responseTime });
            } else if (level === 'warn') {
                this.logger.warn(message, { ip, statusCode, responseTime });
            } else {
                this.logger.log(message, { ip, statusCode, responseTime });
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
