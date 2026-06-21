import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GemmaChatRequestDto } from './dto/chat-request.dto';
import { GemmaRequestRetry } from './gemma-request-retry';

const LMSTUDIO_DEFAULT = 'http://localhost:1234/v1';
const GEMMA_TIMEOUT_MS_DEFAULT = 180_000;
const GEMMA_MAX_RETRIES_DEFAULT = 2;
const GEMMA_RETRY_DELAY_MS_DEFAULT = 750;

interface ChatCompletionResponse {
  choices: { message: { role: string; content: string; tool_calls?: ToolCall[] }; finish_reason: string }[];
  model: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

interface EnqueuedGemmaResponse<T> {
  data: T;
  queueWaitMs: number;
  requestDurationMs: number;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export type ToolExecutor = (call: ToolCall) => Promise<string>;

@Injectable()
export class GemmaService implements OnModuleInit {
  private readonly logger = new Logger(GemmaService.name);
  private baseUrl: string;
  private model: string;
  private timeoutMs: number;
  private maxRetries: number;
  private retryDelayMs: number;

  /**
   * Serial request queue — LM Studio handles one request at a time efficiently.
   * Concurrent calls cause mutual starvation and 180s timeouts when package
   * blocking and scene-prep both call the LLM in the same process. By chaining
   * every call onto this promise, we guarantee at most one in-flight request.
   */
  private requestQueue: Promise<void> = Promise.resolve();
  private requestSequence = 0;
  private queuedRequestCount = 0;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.baseUrl = this.config.get<string>('LMSTUDIO_URL', LMSTUDIO_DEFAULT);
    this.model = this.config.get<string>('GEMMA_MODEL', 'google/gemma-4-12b-qat');
    this.timeoutMs = Number(this.config.get('GEMMA_TIMEOUT_MS', GEMMA_TIMEOUT_MS_DEFAULT));
    this.maxRetries = Number(this.config.get('GEMMA_MAX_RETRIES', GEMMA_MAX_RETRIES_DEFAULT));
    this.retryDelayMs = Number(this.config.get('GEMMA_RETRY_DELAY_MS', GEMMA_RETRY_DELAY_MS_DEFAULT));
    this.logger.log(
      `Gemma service initialized — LM Studio at ${this.baseUrl}, model: ${this.model}, timeoutMs: ${this.timeoutMs}, maxRetries: ${this.maxRetries}, retryDelayMs: ${this.retryDelayMs}`,
    );
  }

  /**
   * Enqueue an LLM call so it runs only after all previously enqueued calls
   * have settled (resolved or rejected). Errors in earlier calls do not block
   * the queue — the next call always proceeds.
   */
  private enqueue<T>(fn: () => Promise<T>, purpose: string): Promise<T> {
    const requestId = ++this.requestSequence;
    const enqueuedAt = Date.now();
    const queuedBehind = this.queuedRequestCount;
    this.queuedRequestCount += 1;

    if (queuedBehind > 0) {
      this.logger.log(
        `LM Studio request #${requestId} queued for ${purpose} behind ${queuedBehind} request(s)`,
      );
    }

    const wrapped = async () => {
      const startedAt = Date.now();
      const queueWaitMs = startedAt - enqueuedAt;

      this.logger.log(
        `LM Studio request #${requestId} started for ${purpose} after ${queueWaitMs}ms in queue`,
      );

      try {
        const result = await fn();
        this.logger.log(
          `LM Studio request #${requestId} completed for ${purpose} in ${Date.now() - startedAt}ms (queue ${queueWaitMs}ms)`,
        );
        return result;
      } catch (error) {
        this.logger.warn(
          `LM Studio request #${requestId} failed for ${purpose} after ${Date.now() - startedAt}ms (queue ${queueWaitMs}ms): ${GemmaRequestRetry.describeError(error)}`,
        );
        throw error;
      } finally {
        this.queuedRequestCount = Math.max(0, this.queuedRequestCount - 1);
      }
    };

    const next = this.requestQueue.then(wrapped, wrapped) as Promise<T>;
    // Advance the queue tail regardless of success/failure so future calls proceed.
    this.requestQueue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  private enqueueWithTelemetry<T>(fn: () => Promise<T>, purpose: string): Promise<EnqueuedGemmaResponse<T>> {
    const requestId = ++this.requestSequence;
    const enqueuedAt = Date.now();
    const queuedBehind = this.queuedRequestCount;
    this.queuedRequestCount += 1;

    if (queuedBehind > 0) {
      this.logger.log(
        `LM Studio request #${requestId} queued for ${purpose} behind ${queuedBehind} request(s)`,
      );
    }

    const wrapped = async () => {
      const startedAt = Date.now();
      const queueWaitMs = startedAt - enqueuedAt;

      this.logger.log(
        `LM Studio request #${requestId} started for ${purpose} after ${queueWaitMs}ms in queue`,
      );

      try {
        const data = await fn();
        const requestDurationMs = Date.now() - startedAt;
        this.logger.log(
          `LM Studio request #${requestId} completed for ${purpose} in ${requestDurationMs}ms (queue ${queueWaitMs}ms)`,
        );
        return { data, queueWaitMs, requestDurationMs };
      } catch (error) {
        this.logger.warn(
          `LM Studio request #${requestId} failed for ${purpose} after ${Date.now() - startedAt}ms (queue ${queueWaitMs}ms): ${GemmaRequestRetry.describeError(error)}`,
        );
        throw error;
      } finally {
        this.queuedRequestCount = Math.max(0, this.queuedRequestCount - 1);
      }
    };

    const next = this.requestQueue.then(wrapped, wrapped);
    this.requestQueue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  private postChatCompletion(
    body: Record<string, unknown>,
    purpose: string,
  ): Promise<ChatCompletionResponse> {
    return this.enqueue(() => this.executePost(body, purpose), purpose);
  }

  private postChatCompletionWithTelemetry(
    body: Record<string, unknown>,
    purpose: string,
  ): Promise<EnqueuedGemmaResponse<ChatCompletionResponse>> {
    return this.enqueueWithTelemetry(() => this.executePost(body, purpose), purpose);
  }

  private async executePost(
    body: Record<string, unknown>,
    purpose: string,
  ): Promise<ChatCompletionResponse> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          const message = `AI provider returned ${response.status} during ${purpose}: ${errorBody}`;

          if (GemmaRequestRetry.isRetryableStatus(response.status) && attempt < this.maxRetries) {
            const delayMs = GemmaRequestRetry.retryDelayMs(attempt, this.retryDelayMs);
            this.logger.warn(
              `LM Studio error ${response.status} during ${purpose}; retrying attempt ${attempt + 2}/${this.maxRetries + 1} in ${delayMs}ms`,
            );
            await GemmaRequestRetry.wait(delayMs);
            continue;
          }

          this.logger.error(`LM Studio error ${response.status} during ${purpose}: ${errorBody}`);
          throw new Error(message);
        }

        return await response.json();
      } catch (err) {
        if (GemmaRequestRetry.isTimeoutError(err)) {
          this.logger.error(`LM Studio request timed out after ${this.timeoutMs}ms during ${purpose}`);
          throw new Error(`AI request timed out after ${this.timeoutMs}ms during ${purpose}`);
        }

        const error = err instanceof Error ? err : new Error('Unknown error');
        lastError = error;

        if (error.message.startsWith('AI provider returned')) {
          throw error;
        }

        if (GemmaRequestRetry.isRetryableError(error) && attempt < this.maxRetries) {
          const delayMs = GemmaRequestRetry.retryDelayMs(attempt, this.retryDelayMs);
          this.logger.warn(
            `LM Studio request failed during ${purpose}: ${GemmaRequestRetry.describeError(error)}; retrying attempt ${attempt + 2}/${this.maxRetries + 1} in ${delayMs}ms`,
          );
          await GemmaRequestRetry.wait(delayMs);
          continue;
        }

        throw new Error(`AI request failed during ${purpose}: ${GemmaRequestRetry.describeError(error)}`);
      }
    }

    throw new Error(`AI request failed during ${purpose}: ${GemmaRequestRetry.describeError(lastError)}`);
  }

  async chat(dto: GemmaChatRequestDto): Promise<{
    reply: string;
    model: string;
    provider: string;
    usage?: ChatCompletionResponse['usage'];
    queueWaitMs: number;
    requestDurationMs: number;
  }> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages: dto.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: dto.maxTokens ?? 512,
      temperature: dto.temperature ?? 0.7,
    };
    if (dto.responseFormat) {
      // LM Studio only supports 'json_schema' or 'text' — convert 'json_object' to a permissive json_schema
      if (dto.responseFormat.type === 'json_object') {
        body.response_format = {
          type: 'json_schema',
          json_schema: {
            name: 'response',
            schema: { type: 'object', additionalProperties: true },
          },
        };
      } else {
        body.response_format = dto.responseFormat;
      }
    }

    const purpose = dto.requestLabel ? `chat:${dto.requestLabel}` : 'chat';
    const result = await this.postChatCompletionWithTelemetry(body, purpose);
    const reply = result.data.choices?.[0]?.message?.content ?? '';

    return {
      reply,
      model: this.model,
      provider: 'local',
      usage: result.data.usage,
      queueWaitMs: result.queueWaitMs,
      requestDurationMs: result.requestDurationMs,
    };
  }

  /**
   * Streaming variant of `chat()` — issues an OpenAI-compatible
   * `stream: true` request and forwards every content delta through
   * `onTextDelta` as the model writes it. The aggregated reply,
   * model, usage and timing are returned exactly as `chat()` would,
   * so callers can drop in `chatStream` whenever they want live
   * progress without changing downstream parsing.
   *
   * The stream is parsed inline (no third-party SSE dependency): we
   * read the response body, split on blank lines, strip the `data:`
   * prefix, and JSON-parse each frame. `[DONE]` and any malformed
   * frame are tolerated and skipped.
   */
  async chatStream(
    dto: GemmaChatRequestDto,
    opts: { onTextDelta?: (delta: string, accumulated: string) => void; signal?: AbortSignal },
  ): Promise<{
    reply: string;
    model: string;
    provider: string;
    usage?: ChatCompletionResponse['usage'];
    queueWaitMs: number;
    requestDurationMs: number;
  }> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages: dto.messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: dto.maxTokens ?? 512,
      temperature: dto.temperature ?? 0.7,
      stream: true,
    };
    if (dto.responseFormat) {
      if (dto.responseFormat.type === 'json_object') {
        body.response_format = {
          type: 'json_schema',
          json_schema: {
            name: 'response',
            schema: { type: 'object', additionalProperties: true },
          },
        };
      } else {
        body.response_format = dto.responseFormat;
      }
    }

    const purpose = dto.requestLabel ? `chatStream:${dto.requestLabel}` : 'chatStream';
    const result = await this.enqueueWithTelemetry(
      () => this.executeStreamingPost(body, purpose, opts),
      purpose,
    );

    return {
      reply: result.data.content,
      model: this.model,
      provider: 'local',
      usage: result.data.usage,
      queueWaitMs: result.queueWaitMs,
      requestDurationMs: result.requestDurationMs,
    };
  }

  private async executeStreamingPost(
    body: Record<string, unknown>,
    purpose: string,
    opts: { onTextDelta?: (delta: string, accumulated: string) => void; signal?: AbortSignal },
  ): Promise<{ content: string; usage?: ChatCompletionResponse['usage'] }> {
    const externalSignal = opts.signal;
    // Combined timeout + external abort
    const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    timeoutSignal.addEventListener('abort', onAbort, { once: true });
    if (externalSignal) externalSignal.addEventListener('abort', onAbort, { once: true });

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const errorBody = await response.text().catch(() => '');
        const message = `AI provider returned ${response.status} during ${purpose}: ${errorBody}`;
        this.logger.error(message);
        throw new Error(message);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let content = '';
      let usage: ChatCompletionResponse['usage'] | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Frames are separated by blank lines per the SSE spec.
        let separatorIndex = buffer.indexOf('\n\n');
        while (separatorIndex !== -1) {
          const frame = buffer.slice(0, separatorIndex);
          buffer = buffer.slice(separatorIndex + 2);
          separatorIndex = buffer.indexOf('\n\n');

          for (const line of frame.split(/\r?\n/)) {
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              const parsed = JSON.parse(payload) as {
                choices?: { delta?: { content?: string }; finish_reason?: string }[];
                usage?: ChatCompletionResponse['usage'];
              };
              const delta = parsed.choices?.[0]?.delta?.content ?? '';
              if (delta) {
                content += delta;
                opts.onTextDelta?.(delta, content);
              }
              if (parsed.usage) usage = parsed.usage;
            } catch {
              // Skip malformed frames — stream stays usable.
            }
          }
        }
      }

      return { content, usage };
    } catch (err) {
      if (GemmaRequestRetry.isTimeoutError(err)) {
        throw new Error(`AI request timed out after ${this.timeoutMs}ms during ${purpose}`);
      }
      throw err;
    } finally {
      timeoutSignal.removeEventListener('abort', onAbort);
      if (externalSignal) externalSignal.removeEventListener('abort', onAbort);
    }
  }

  /**
   * LM Studio supports OpenAI-compatible tool_calls via `/v1/chat/completions`.
   * If the model requests tool calls, the toolExecutor callback is invoked for each,
   * then results are fed back for a final response.
   */
  async chatWithTools(dto: GemmaChatRequestDto & {
    tools: ToolDefinition[];
    toolExecutor: ToolExecutor;
    maxToolRounds?: number;
  }): Promise<{ reply: string; model: string; provider: string; toolCalls: ToolCall[]; usage?: ChatCompletionResponse['usage'] }> {
    const messages: Array<Record<string, unknown>> = dto.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const allToolCalls: ToolCall[] = [];
    const maxRounds = dto.maxToolRounds ?? 3;

    for (let round = 0; round < maxRounds; round++) {
      const data = await this.postChatCompletion(
        {
          model: this.model,
          messages,
          tools: dto.tools,
          max_tokens: dto.maxTokens ?? 512,
          temperature: dto.temperature ?? 0.7,
        },
        `tool chat round ${round + 1}`,
      );
      const choice = data.choices?.[0];

      // If no tool calls, return the content response
      if (!choice?.message?.tool_calls?.length || choice.finish_reason !== 'tool_calls') {
        return {
          reply: choice?.message?.content ?? '',
          model: this.model,
          provider: 'local',
          toolCalls: allToolCalls,
          usage: data.usage,
        };
      }

      // Process tool calls
      const toolCalls = choice.message.tool_calls;
      allToolCalls.push(...toolCalls);

      // Add assistant tool_call message to conversation
      messages.push({
        role: 'assistant',
        content: null,
        tool_calls: toolCalls,
      });

      // Execute each tool and add results
      for (const tc of toolCalls) {
        const result = await dto.toolExecutor(tc);
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: result,
        });
      }
    }

    // If we exhausted rounds, do a final call without tools
    const finalData = await this.postChatCompletion(
      {
        model: this.model,
        messages,
        max_tokens: dto.maxTokens ?? 512,
        temperature: dto.temperature ?? 0.7,
      },
      'final tool chat',
    );
    return {
      reply: finalData.choices?.[0]?.message?.content ?? '',
      model: this.model,
      provider: 'local',
      toolCalls: allToolCalls,
      usage: finalData.usage,
    };
  }

  /**
   * Send a multimodal chat request with an image (base64-encoded).
   * Uses the OpenAI vision format supported by LM Studio.
   * Gemma 4 models are natively multimodal.
   */
  async chatWithImage(opts: {
    systemPrompt?: string;
    userText: string;
    imageBase64: string;
    imageMimeType?: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<{ reply: string; model: string; provider: string; usage?: ChatCompletionResponse['usage'] }> {
    const mime = opts.imageMimeType || 'image/png';
    const dataUrl = `data:${mime};base64,${opts.imageBase64}`;

    const messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [];

    if (opts.systemPrompt) {
      messages.push({ role: 'system', content: opts.systemPrompt });
    }

    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: opts.userText },
        { type: 'image_url', image_url: { url: dataUrl } },
      ],
    });

    const data = await this.postChatCompletion(
      {
        model: this.model,
        messages,
        max_tokens: opts.maxTokens ?? 512,
        temperature: opts.temperature ?? 0.4,
      },
      'vision chat',
    );
    const reply = data.choices?.[0]?.message?.content ?? '';

    return { reply, model: this.model, provider: 'local', usage: data.usage };
  }

  async listModels(): Promise<{ current: string; provider: string; available: string[] }> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      const data = await res.json();
      const models = (data.data ?? []).map((m: { id: string }) => m.id);
      return { current: this.model, provider: 'local', available: models };
    } catch {
      return { current: this.model, provider: 'local', available: [this.model] };
    }
  }
}
