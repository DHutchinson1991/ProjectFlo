export class GemmaRequestRetry {
  private static readonly retryableStatuses = new Set([408, 425, 429, 500, 502, 503, 504]);
  private static readonly retryableErrorCodes = new Set([
    'ECONNRESET',
    'ECONNREFUSED',
    'EPIPE',
    'ETIMEDOUT',
    'UND_ERR_CONNECT_TIMEOUT',
    'UND_ERR_HEADERS_TIMEOUT',
    'UND_ERR_SOCKET',
  ]);

  static isRetryableStatus(status: number): boolean {
    return this.retryableStatuses.has(status);
  }

  static isTimeoutError(err: unknown): boolean {
    return err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
  }

  static isRetryableError(err: unknown): boolean {
    if (!(err instanceof Error) || this.isTimeoutError(err)) {
      return false;
    }

    if (err.message.includes('fetch failed')) {
      return true;
    }

    const code = this.readStringField(this.readCause(err), 'code');
    return code ? this.retryableErrorCodes.has(code) : false;
  }

  static describeError(err: unknown): string {
    if (!(err instanceof Error)) {
      return 'Unknown error';
    }

    const cause = this.readCause(err);
    return [err.message, this.readStringField(cause, 'code'), this.readStringField(cause, 'message')]
      .filter((value): value is string => Boolean(value))
      .join(' | ');
  }

  static retryDelayMs(attemptIndex: number, baseDelayMs: number): number {
    return baseDelayMs * Math.pow(2, attemptIndex);
  }

  static wait(delayMs: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  private static readCause(error: Error): unknown {
    return (error as Error & { cause?: unknown }).cause;
  }

  private static readStringField(value: unknown, key: string): string | undefined {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    const field = (value as Record<string, unknown>)[key];
    if (typeof field === 'string' || typeof field === 'number') {
      return String(field);
    }

    return undefined;
  }
}