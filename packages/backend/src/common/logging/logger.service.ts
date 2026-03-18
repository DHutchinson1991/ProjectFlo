import { Injectable } from '@nestjs/common';

/**
 * Enhanced Logger Service with context-aware logging
 * 
 * Features:
 * - Colored console output in development
 * - Structured JSON logging in production
 * - Context tracking (class name, method name)
 * - Environment-based log levels
 * - Timestamp for all logs
 * 
 * Usage:
 * ```typescript
 * private readonly logger = new LoggerService(FilmsService.name);
 * 
 * this.logger.log('Creating film', { dto });
 * this.logger.error('Failed to create film', error.stack, { dto });
 * ```
 */
@Injectable()
export class LoggerService {
    private context: string;
    private isProduction: boolean;

    // ANSI color codes for console output
    private readonly colors = {
        reset: '\x1b[0m',
        bright: '\x1b[1m',
        dim: '\x1b[2m',
        // Log level colors
        error: '\x1b[31m', // Red
        warn: '\x1b[33m', // Yellow
        log: '\x1b[36m', // Cyan
        debug: '\x1b[35m', // Magenta
        verbose: '\x1b[37m', // White
        // Context colors
        context: '\x1b[33m', // Yellow
        timestamp: '\x1b[90m', // Gray
    };

    constructor(context: string) {
        this.context = context;
        this.isProduction = process.env.NODE_ENV === 'production';
    }

    /**
     * Log informational message
     */
    log(message: string, meta?: Record<string, unknown>) {
        this.printLog('log', message, undefined, meta);
    }

    /**
     * Log error message
     */
    error(message: string, trace?: string, meta?: Record<string, unknown>) {
        this.printLog('error', message, trace, meta);
    }

    /**
     * Log warning message
     */
    warn(message: string, meta?: Record<string, unknown>) {
        this.printLog('warn', message, undefined, meta);
    }

    /**
     * Log debug message (only in development)
     */
    debug(message: string, meta?: Record<string, unknown>) {
        if (!this.isProduction) {
            this.printLog('debug', message, undefined, meta);
        }
    }

    /**
     * Log verbose message (only in development)
     */
    verbose(message: string, meta?: Record<string, unknown>) {
        if (!this.isProduction) {
            this.printLog('verbose', message, undefined, meta);
        }
    }

    /**
     * Core logging function
     */
    private printLog(
        level: 'log' | 'error' | 'warn' | 'debug' | 'verbose',
        message: string,
        trace?: string,
        meta?: Record<string, unknown>
    ) {
        const timestamp = new Date().toISOString();

        if (this.isProduction) {
            // Production: Structured JSON logging
            const logEntry = {
                timestamp,
                level: level.toUpperCase(),
                context: this.context,
                message,
                ...(meta && { meta }),
                ...(trace && { trace }),
            };
            console.log(JSON.stringify(logEntry));
        } else {
            // Development: Colored console output
            const formattedMessage = this.formatDevMessage(level, timestamp, message, trace, meta);
            console.log(formattedMessage);
        }
    }

    /**
     * Format message for development with colors
     */
    private formatDevMessage(
        level: string,
        timestamp: string,
        message: string,
        trace?: string,
        meta?: Record<string, unknown>
    ): string {
        const color = this.colors[level as keyof typeof this.colors] || this.colors.reset;
        const levelStr = level.toUpperCase().padEnd(7);
        
        let formatted = '';
        
        // Timestamp
        formatted += `${this.colors.timestamp}${timestamp}${this.colors.reset} `;
        
        // Log level
        formatted += `${color}${levelStr}${this.colors.reset} `;
        
        // Context
        formatted += `${this.colors.context}[${this.context}]${this.colors.reset} `;
        
        // Message
        formatted += `${color}${message}${this.colors.reset}`;
        
        // Metadata (if provided)
        if (meta) {
            formatted += `\n${this.colors.dim}${JSON.stringify(meta, null, 2)}${this.colors.reset}`;
        }
        
        // Stack trace (if provided)
        if (trace) {
            formatted += `\n${this.colors.error}${trace}${this.colors.reset}`;
        }
        
        return formatted;
    }

    /**
     * Static method for quick logging without context
     */
    static log(message: string, context = 'Application') {
        const logger = new LoggerService(context);
        logger.log(message);
    }

    /**
     * Static method for quick error logging
     */
    static error(message: string, trace?: string, context = 'Application') {
        const logger = new LoggerService(context);
        logger.error(message, trace);
    }

    /**
     * Static method for quick warning logging
     */
    static warn(message: string, context = 'Application') {
        const logger = new LoggerService(context);
        logger.warn(message);
    }
}
