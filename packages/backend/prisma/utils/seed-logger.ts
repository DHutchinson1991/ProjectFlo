// Shared logging utility for all seed files
// Provides consistent formatting, icons, colors, and log levels

export enum LogLevel {
    QUIET = 'quiet',
    NORMAL = 'normal',
    VERBOSE = 'verbose'
}

export enum SeedType {
    ADMIN = 'admin',
    SYSTEM = 'system',
    MOONRISE = 'moonrise',
    LAYER5 = 'layer5',
}

export class SeedLogger {
    private static instance: SeedLogger;
    private logLevel: LogLevel;
    private useColors: boolean;
    private startTimes: Map<string, number> = new Map();

    private constructor() {
        this.logLevel = (process.env.SEED_LOG_LEVEL as LogLevel) || LogLevel.NORMAL;
        this.useColors = process.env.NO_COLOR !== 'true';
    }

    static getInstance(): SeedLogger {
        if (!SeedLogger.instance) {
            SeedLogger.instance = new SeedLogger();
        }
        return SeedLogger.instance;
    }

    // ANSI Color codes
    private ansiColors = {
        reset: '\x1b[0m',
        bright: '\x1b[1m',
        dim: '\x1b[2m',

        // Foreground colors
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        gray: '\x1b[90m',

        // Background colors
        bgRed: '\x1b[41m',
        bgGreen: '\x1b[42m',
        bgYellow: '\x1b[43m',
        bgBlue: '\x1b[44m',
        bgMagenta: '\x1b[45m',
        bgCyan: '\x1b[46m'
    };

    // Icons for different seed types and operations
    private icons = {
        // Seed types
        [SeedType.ADMIN]: '👑',
        [SeedType.SYSTEM]: '🏗️',
        [SeedType.MOONRISE]: '🌙',
        [SeedType.LAYER5]: '🏢',

        // Operations
        success: '✅',
        info: 'ℹ️',
        warning: '⚠️',
        error: '❌',
        processing: '🔄',
        summary: '📊',
        assignment: '🎯',
        tag: '🏷️',
        people: '👥',
        time: '⏰',
        location: '📍',
        database: '🗄️',
        brand: '🏢',
        team: '👥',
        project: '💼',
        task: '📋',
        film: '🎬',
        scene: '🎭',
        created: '✨',
        updated: '🔄',
        skipped: '⏭️',
        deleted: '🗑️'
    };

    private shouldLog(level: 'quiet' | 'normal' | 'verbose'): boolean {
        const levels = { quiet: 0, normal: 1, verbose: 2 };
        return levels[level] <= levels[this.logLevel];
    }

    private colorize(text: string, color: keyof typeof this.ansiColors): string {
        if (!this.useColors) return text;
        return `${this.ansiColors[color]}${text}${this.ansiColors.reset}`;
    }

    // Visual dividers
    divider(length: number = 60, char: string = '═'): string {
        return char.repeat(length);
    }

    sectionHeader(title: string, seedType?: SeedType, stepInfo?: string): void {
        const icon = seedType ? this.icons[seedType] : '📋';
        const stepText = stepInfo ? ` - ${stepInfo}` : '';

        console.log('');
        console.log(this.colorize(this.divider(), 'cyan'));
        console.log(`${icon}  ${this.colorize(title.toUpperCase(), 'bright')}${stepText}`);
        console.log(this.colorize(this.divider(), 'cyan'));
    }

    sectionDivider(title?: string): void {
        if (title) {
            console.log('');
            const dashCount = Math.max(0, 50 - title.length - 3);
            console.log(this.colorize(`── ${title} ${'─'.repeat(dashCount)}`, 'gray'));
        } else {
            console.log(this.colorize('────────────────────────────────────────────────────────────', 'gray'));
        }
    }

    // Main logging methods
    success(message: string, level: 'quiet' | 'normal' | 'verbose' = 'normal'): void {
        if (!this.shouldLog(level)) return;
        console.log(`${this.icons.success}  ${this.colorize(message, 'green')}`);
    }

    info(message: string, level: 'quiet' | 'normal' | 'verbose' = 'normal'): void {
        if (!this.shouldLog(level)) return;
        console.log(`${this.icons.info}  ${this.colorize(message, 'blue')}`);
    }

    warning(message: string, level: 'quiet' | 'normal' | 'verbose' = 'normal'): void {
        if (!this.shouldLog(level)) return;
        console.log(`${this.icons.warning}  ${this.colorize(message, 'yellow')}`);
    }

    error(message: string, level: 'quiet' | 'normal' | 'verbose' = 'normal'): void {
        if (!this.shouldLog(level)) return;
        console.log(`${this.icons.error}  ${this.colorize(message, 'red')}`);
    }

    processing(message: string, level: 'quiet' | 'normal' | 'verbose' = 'normal'): void {
        if (!this.shouldLog(level)) return;
        console.log(`${this.icons.processing}  ${message}`);
    }

    // Smart summary with context awareness
    smartSummary(
        operation: string,
        created: number,
        skipped: number,
        total?: number,
        level: 'quiet' | 'normal' | 'verbose' = 'normal'
    ): void {
        if (!this.shouldLog(level)) return;

        const totalItems = total || (created + skipped);
        let summary = `${this.icons.summary} ${operation}: `;

        if (created === 0 && skipped === totalItems) {
            summary += this.colorize(`All ${totalItems} items already exist (no changes needed)`, 'blue');
        } else if (skipped > created) {
            summary += this.colorize(`${created} created, ${skipped} skipped (mostly up-to-date)`, 'green');
        } else if (created > skipped) {
            summary += this.colorize(`${created} created, ${skipped} skipped (fresh setup)`, 'green');
        } else {
            summary += this.colorize(`${created} created, ${skipped} skipped`, 'green');
        }

        console.log(summary);
    }

    // Full summary including updated values
    summary(
        operation: string,
        counts: { created: number; updated?: number; skipped?: number; total?: number },
        level: 'quiet' | 'normal' | 'verbose' = 'normal'
    ): void {
        if (!this.shouldLog(level)) return;
        const created = counts.created || 0;
        const updated = counts.updated || 0;
        const skipped = counts.skipped || 0;
        const total = counts.total ?? (created + updated + skipped);
        const parts: string[] = [];
        parts.push(this.colorize(`${created} created`, 'blue'));
        if (updated > 0) parts.push(this.colorize(`${updated} updated`, 'yellow'));
        if (skipped > 0) parts.push(this.colorize(`${skipped} skipped`, 'yellow'));
        console.log(`${this.icons.summary}  ${operation}: ${parts.join(', ')}${total ? this.colorize(` (total ${total})`, 'cyan') : ''}`);
    }

    // Timing methods
    startTimer(key: string): void {
        this.startTimes.set(key, Date.now());
    }

    endTimer(key: string, operation: string, level: 'quiet' | 'normal' | 'verbose' = 'verbose'): number {
        const startTime = this.startTimes.get(key);
        if (!startTime) return 0;

        const duration = Date.now() - startTime;
        const seconds = (duration / 1000).toFixed(1);

        if (this.shouldLog(level)) {
            console.log(`${this.icons.time}  ${operation}: ${this.colorize(`${seconds}s`, 'cyan')}`);
        }

        this.startTimes.delete(key);
        return duration;
    }

    // Progress indicators
    progress(current: number, total: number, operation: string): void {
        if (!this.shouldLog('normal')) return;

        const percentage = Math.round((current / total) * 100);
        const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));

        console.log(`🔄  ${operation}: ${this.colorize(progressBar, 'green')} ${percentage}% (${current}/${total})`);
    }

    // Specific operation loggers
    created(item: string, details?: string, level: 'quiet' | 'normal' | 'verbose' = 'verbose'): void {
        if (!this.shouldLog(level)) return;
        const detailText = details ? ` (${details})` : '';
        console.log(`${this.icons.created}  ${this.colorize(`Created${detailText}`, 'blue')}: ${item}`);
    }

    skipped(item: string, reason?: string, level: 'quiet' | 'normal' | 'verbose' = 'verbose'): void {
        if (!this.shouldLog(level)) return;
        const reasonText = reason ? ` (${reason})` : '';
        console.log(`${this.icons.skipped}  ${this.colorize(`Skipped${reasonText}`, 'yellow')}: ${item}`);
    }

    assigned(item: string, target: string, level: 'quiet' | 'normal' | 'verbose' = 'verbose'): void {
        if (!this.shouldLog(level)) return;
        console.log(`${this.icons.assignment}  ${this.colorize('Assigned', 'green')}: ${item} → ${target}`);
    }

    tagged(item: string, tag: string, level: 'quiet' | 'normal' | 'verbose' = 'verbose'): void {
        if (!this.shouldLog(level)) return;
        console.log(`${this.icons.tag}  ${this.colorize('Tagged', 'cyan')}: ${item} → ${tag}`);
    }
}

// Export singleton instance and utility functions
export const logger = SeedLogger.getInstance();

// Standard summary contract for all seeds
export interface SeedSummary {
    created: number;
    updated: number;
    skipped: number;
    total: number;
}

// Helper to print a three-part summary with totals
export function logSummary(title: string, summary: SeedSummary, level: 'quiet' | 'normal' | 'verbose' = 'normal') {
    logger.sectionDivider(title);
    logger.summary('Summary', summary, level);
}

// Helper to sum multiple summaries
export function sumSummaries(...parts: SeedSummary[]): SeedSummary {
    return parts.reduce<SeedSummary>((acc, s) => ({
        created: acc.created + (s?.created || 0),
        updated: acc.updated + (s?.updated || 0),
        skipped: acc.skipped + (s?.skipped || 0),
        total: acc.total + (s?.total || 0),
    }), { created: 0, updated: 0, skipped: 0, total: 0 });
}

export function createSeedLogger(seedType: SeedType) {
    return {
        sectionHeader: (title: string, stepInfo?: string) =>
            logger.sectionHeader(title, seedType, stepInfo),

        success: (message: string, level?: 'quiet' | 'normal' | 'verbose') =>
            logger.success(message, level),

        info: (message: string, level?: 'quiet' | 'normal' | 'verbose') =>
            logger.info(message, level),

        warning: (message: string, level?: 'quiet' | 'normal' | 'verbose') =>
            logger.warning(message, level),

        error: (message: string, level?: 'quiet' | 'normal' | 'verbose') =>
            logger.error(message, level),

        processing: (message: string, level?: 'quiet' | 'normal' | 'verbose') =>
            logger.processing(message, level),

        smartSummary: (operation: string, created: number, skipped: number, total?: number, level?: 'quiet' | 'normal' | 'verbose') =>
            logger.smartSummary(operation, created, skipped, total, level),

        summary: (operation: string, counts: { created: number; updated?: number; skipped?: number; total?: number }, level?: 'quiet' | 'normal' | 'verbose') =>
            logger.summary(operation, counts, level),

        startTimer: (key: string) => logger.startTimer(key),

        endTimer: (key: string, operation: string, level?: 'quiet' | 'normal' | 'verbose') =>
            logger.endTimer(key, operation, level),

        created: (item: string, details?: string, level?: 'quiet' | 'normal' | 'verbose') =>
            logger.created(item, details, level),

        skipped: (item: string, reason?: string, level?: 'quiet' | 'normal' | 'verbose') =>
            logger.skipped(item, reason, level),

        assigned: (item: string, target: string, level?: 'quiet' | 'normal' | 'verbose') =>
            logger.assigned(item, target, level),

        tagged: (item: string, tag: string, level?: 'quiet' | 'normal' | 'verbose') =>
            logger.tagged(item, tag, level),

        sectionDivider: (title?: string) => logger.sectionDivider(title)
    };
}