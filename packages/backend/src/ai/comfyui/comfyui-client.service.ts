import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface ComfyUIPromptPayload {
  prompt: string;
  negativePrompt: string;
  seed?: number;
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  checkpointName?: string;
  loraName?: string;
  loraStrength?: number;
  /** ControlNet pose image filename (already uploaded to ComfyUI input dir) */
  poseImageFilename?: string;
  /** ControlNet model name override */
  controlnetModel?: string;
  /** ControlNet strength override (0-1, default from env) */
  controlnetStrength?: number;
}

export interface ComfyUIImg2ImgPayload extends ComfyUIPromptPayload {
  /** Filename of a previously uploaded/generated image already in ComfyUI's input directory */
  inputImageFilename: string;
  /** How much to change the input (0 = identical, 1 = fully new). Default 0.45 */
  denoise?: number;
}

interface ComfyUIHistoryOutput {
  images?: Array<{ filename: string; subfolder: string; type: string }>;
}

interface ComfyUIWorkflowNode {
  class_type: string;
  inputs: Record<string, string | number | boolean | [string, number]>;
}

interface ComfyUIStatusMessage {
  0: string;
  1?: { exception_message?: string };
}

interface ComfyUIJobData {
  status?: { status_str?: string; messages?: ComfyUIStatusMessage[] };
  outputs?: Record<string, ComfyUIHistoryOutput>;
}

interface PollResult {
  filename: string;
  statusMessages: unknown[];
}

export interface GenerationResult {
  filePath: string;
  seed: number;
  comfyLogs: {
    /** Status messages from ComfyUI history (execution events) */
    statusMessages: unknown[];
    /** Recent ComfyUI console logs from /internal/logs (if available) */
    consoleLogs: unknown[];
  };
}

@Injectable()
export class ComfyUIClientService {
  private readonly logger = new Logger(ComfyUIClientService.name);
  private readonly baseUrl: string;
  private readonly uploadsDir: string;

  private readonly loraName: string;
  private readonly loraStrength: number;
  private readonly clipSkip: number;
  private readonly controlnetModel: string;
  private readonly controlnetStrength: number;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('COMFYUI_API_URL', 'http://127.0.0.1:8000');
    this.loraName = this.configService.get<string>('COMFYUI_LORA_NAME', '');
    this.loraStrength = parseFloat(this.configService.get<string>('COMFYUI_LORA_STRENGTH', '0.8'));
    this.clipSkip = parseInt(this.configService.get<string>('COMFYUI_CLIP_SKIP', '-2'), 10);
    this.controlnetModel = this.configService.get<string>('COMFYUI_CONTROLNET_MODEL', '');
    this.controlnetStrength = parseFloat(this.configService.get<string>('COMFYUI_CONTROLNET_STRENGTH', '0.7'));
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'shot-previews');

    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Build a ComfyUI API workflow JSON for txt2img with SDXL.
   * Includes a hi-res fix pass: generate at base resolution, upscale 1.5×,
   * then refine with a second KSampler at low denoise.
   */
  private buildWorkflow(payload: ComfyUIPromptPayload): Record<string, ComfyUIWorkflowNode> {
    const checkpoint = payload.checkpointName || 'juggernautXL_ragnarokBy.safetensors';
    const seed = payload.seed ?? Math.floor(Math.random() * 2147483647);
    const loraName = payload.loraName || this.loraName;
    const loraStr = payload.loraStrength ?? this.loraStrength;
    const useLora = !!loraName;
    const controlnetModel = payload.controlnetModel || this.controlnetModel;
    const controlnetStr = payload.controlnetStrength ?? this.controlnetStrength;
    const useControlnet = !!controlnetModel && !!payload.poseImageFilename;

    // When LoRA is active, insert LoraLoader (node 10) + CLIPSetLastLayer (node 11)
    // between checkpoint and CLIP encoders. CLIP skip from env (default -2 for Pony/Illustrious LoRAs).
    const modelSource: [string, number] = useLora ? ['10', 0] : ['1', 0];
    const clipSource: [string, number] = useLora ? ['11', 0] : ['1', 1];
    // When ControlNet is active, positive conditioning routes through ControlNetApply (node 14)
    const positiveSource: [string, number] = useControlnet ? ['14', 0] : ['2', 0];

    const workflow: Record<string, ComfyUIWorkflowNode> = {
      '1': {
        class_type: 'CheckpointLoaderSimple',
        inputs: { ckpt_name: checkpoint },
      },
      '2': {
        class_type: 'CLIPTextEncode',
        inputs: {
          text: payload.prompt,
          clip: clipSource,
        },
      },
      '3': {
        class_type: 'CLIPTextEncode',
        inputs: {
          text: payload.negativePrompt,
          clip: clipSource,
        },
      },
      '4': {
        class_type: 'EmptyLatentImage',
        inputs: {
          width: payload.width || 896,
          height: payload.height || 576,
          batch_size: 1,
        },
      },
      '5': {
        class_type: 'KSampler',
        inputs: {
          seed,
          steps: payload.steps || 25,
          cfg: payload.cfgScale || 6.5,
          sampler_name: 'dpmpp_2m_sde',
          scheduler: 'karras',
          denoise: 1,
          model: modelSource,
          positive: positiveSource,
          negative: ['3', 0],
          latent_image: ['4', 0],
        },
      },
      // ── Hi-Res Fix: upscale latent 1.5× then refine ──
      '20': {
        class_type: 'LatentUpscale',
        inputs: {
          upscale_method: 'nearest-exact',
          width: Math.round((payload.width || 896) * 1.5),
          height: Math.round((payload.height || 576) * 1.5),
          crop: 'disabled',
          samples: ['5', 0],
        },
      },
      '21': {
        class_type: 'KSampler',
        inputs: {
          seed: seed + 1,
          steps: 10,
          cfg: payload.cfgScale || 6.5,
          sampler_name: 'dpmpp_2m_sde',
          scheduler: 'karras',
          denoise: 0.4,
          model: modelSource,
          positive: positiveSource,
          negative: ['3', 0],
          latent_image: ['20', 0],
        },
      },
      '6': {
        class_type: 'VAEDecode',
        inputs: {
          samples: ['21', 0],
          vae: ['1', 2],
        },
      },
      '7': {
        class_type: 'SaveImage',
        inputs: {
          filename_prefix: 'shot_preview',
          images: ['6', 0],
        },
      },
    };

    if (useLora) {
      workflow['10'] = {
        class_type: 'LoraLoader',
        inputs: {
          lora_name: loraName,
          strength_model: loraStr,
          strength_clip: loraStr,
          model: ['1', 0],
          clip: ['1', 1],
        },
      };
      // CLIP skip from env — Pony/Illustrious LoRAs need skip 2 (-2)
      workflow['11'] = {
        class_type: 'CLIPSetLastLayer',
        inputs: {
          stop_at_clip_layer: this.clipSkip,
          clip: ['10', 1],
        },
      };
    }

    if (useControlnet) {
      // Node 12: Load the ControlNet model (SDXL OpenPose)
      workflow['12'] = {
        class_type: 'ControlNetLoader',
        inputs: { control_net_name: controlnetModel },
      };
      // Node 13: Load the ControlNet guide image (dynamic composition guide)
      workflow['13'] = {
        class_type: 'LoadImage',
        inputs: { image: payload.poseImageFilename! },
      };
      // Node 14: Apply ControlNet — modifies positive conditioning
      workflow['14'] = {
        class_type: 'ControlNetApply',
        inputs: {
          conditioning: ['2', 0],
          control_net: ['12', 0],
          image: ['13', 0],
          strength: controlnetStr,
        },
      };
    }

    return workflow;
  }

  /**
   * Submit a generation job to ComfyUI and poll until complete.
   * Returns the local file path of the saved image.
   */
  async generate(payload: ComfyUIPromptPayload): Promise<GenerationResult> {
    const workflow = this.buildWorkflow(payload);
    const seed = workflow['5'].inputs.seed as number;

    // Log the full workflow config for diagnostics
    const workflowSummary = {
      checkpoint: workflow['1'].inputs.ckpt_name,
      resolution: `${workflow['4'].inputs.width}x${workflow['4'].inputs.height}`,
      sampler: workflow['5'].inputs.sampler_name,
      scheduler: workflow['5'].inputs.scheduler,
      steps: workflow['5'].inputs.steps,
      cfg: workflow['5'].inputs.cfg,
      seed,
      hasLora: !!workflow['10'],
      loraName: workflow['10']?.inputs?.lora_name || null,
      loraStrength: workflow['10']?.inputs?.strength_model || null,
      clipSkip: workflow['11']?.inputs?.stop_at_clip_layer || null,
      hasControlnet: !!workflow['12'],
      controlnetModel: workflow['12']?.inputs?.control_net_name || null,
      controlnetStrength: workflow['14']?.inputs?.strength || null,
      hasHiResFix: !!workflow['20'],
      hiResUpscaleTo: workflow['20'] ? `${workflow['20'].inputs.width}x${workflow['20'].inputs.height}` : null,
      hiResSteps: workflow['21']?.inputs?.steps || null,
      hiResDenoise: workflow['21']?.inputs?.denoise || null,
      nodeCount: Object.keys(workflow).length,
    };
    this.logger.log(`[txt2img] Workflow: ${JSON.stringify(workflowSummary)}`);

    // 1. Submit the prompt
    this.logger.log(`Submitting prompt to ComfyUI: "${payload.prompt.substring(0, 80)}..."`);
    let submitResponse: Response;
    try {
      submitResponse = await fetch(`${this.baseUrl}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow }),
      });
    } catch (fetchError) {
      this.logger.error(`[txt2img] Failed to connect to ComfyUI at ${this.baseUrl}: ${fetchError}`);
      throw new Error(`ComfyUI unreachable at ${this.baseUrl}: ${fetchError}`);
    }

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      this.logger.error(`[txt2img] ComfyUI rejected workflow (${submitResponse.status}): ${errorText}`);
      throw new Error(`ComfyUI prompt submission failed (${submitResponse.status}): ${errorText}`);
    }

    const submitBody = (await submitResponse.json()) as { prompt_id: string; node_errors?: Record<string, unknown>; error?: string };
    if (submitBody.node_errors && Object.keys(submitBody.node_errors).length > 0) {
      this.logger.error(`[txt2img] ComfyUI node errors: ${JSON.stringify(submitBody.node_errors)}`);
    }
    if (submitBody.error) {
      this.logger.error(`[txt2img] ComfyUI submission error: ${submitBody.error}`);
    }
    const { prompt_id } = submitBody;
    this.logger.log(`ComfyUI job submitted: ${prompt_id}`);

    // 2. Poll for completion
    const pollResult = await this.pollForCompletion(prompt_id);

    // 3. Fetch ComfyUI console logs
    const consoleLogs = await this.fetchRecentLogs();

    // 4. Download the image
    const imageResponse = await fetch(
      `${this.baseUrl}/view?filename=${encodeURIComponent(pollResult.filename)}&type=output`,
    );
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image from ComfyUI: ${imageResponse.status}`);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const localFilename = `${prompt_id}_${Date.now()}.png`;
    const localPath = path.join(this.uploadsDir, localFilename);

    fs.writeFileSync(localPath, imageBuffer);
    this.logger.log(`Image saved: ${localPath}`);

    return {
      filePath: `shot-previews/${localFilename}`,
      seed,
      comfyLogs: {
        statusMessages: pollResult.statusMessages,
        consoleLogs,
      },
    };
  }

  /**
   * Build a ComfyUI workflow for img2img — loads an existing image, encodes
   * to latent space, then denoises partially to keep the structure.
   */
  private buildImg2ImgWorkflow(payload: ComfyUIImg2ImgPayload): Record<string, ComfyUIWorkflowNode> {
    const checkpoint = payload.checkpointName || 'juggernautXL_ragnarokBy.safetensors';
    const seed = payload.seed ?? Math.floor(Math.random() * 2147483647);
    const denoise = payload.denoise ?? 0.45;
    const loraName = payload.loraName || this.loraName;
    const loraStr = payload.loraStrength ?? this.loraStrength;
    const useLora = !!loraName;
    const controlnetModel = payload.controlnetModel || this.controlnetModel;
    const controlnetStr = payload.controlnetStrength ?? this.controlnetStrength;
    const useControlnet = !!controlnetModel && !!payload.poseImageFilename;

    const modelSource: [string, number] = useLora ? ['10', 0] : ['1', 0];
    const clipSource: [string, number] = useLora ? ['11', 0] : ['1', 1];
    const positiveSource: [string, number] = useControlnet ? ['14', 0] : ['2', 0];

    const workflow: Record<string, ComfyUIWorkflowNode> = {
      '1': {
        class_type: 'CheckpointLoaderSimple',
        inputs: { ckpt_name: checkpoint },
      },
      '2': {
        class_type: 'CLIPTextEncode',
        inputs: { text: payload.prompt, clip: clipSource },
      },
      '3': {
        class_type: 'CLIPTextEncode',
        inputs: { text: payload.negativePrompt, clip: clipSource },
      },
      // Load the background plate image
      '4': {
        class_type: 'LoadImage',
        inputs: { image: payload.inputImageFilename },
      },
      // Encode the loaded image into latent space
      '5': {
        class_type: 'VAEEncode',
        inputs: { pixels: ['4', 0], vae: ['1', 2] },
      },
      // KSampler with denoise < 1 to preserve background structure
      '6': {
        class_type: 'KSampler',
        inputs: {
          seed,
          steps: payload.steps || 25,
          cfg: payload.cfgScale || 6.5,
          sampler_name: 'dpmpp_2m_sde',
          scheduler: 'karras',
          denoise,
          model: modelSource,
          positive: positiveSource,
          negative: ['3', 0],
          latent_image: ['5', 0],
        },
      },
      '7': {
        class_type: 'VAEDecode',
        inputs: { samples: ['6', 0], vae: ['1', 2] },
      },
      '8': {
        class_type: 'SaveImage',
        inputs: { filename_prefix: 'shot_preview', images: ['7', 0] },
      },
    };

    if (useLora) {
      workflow['10'] = {
        class_type: 'LoraLoader',
        inputs: {
          lora_name: loraName,
          strength_model: loraStr,
          strength_clip: loraStr,
          model: ['1', 0],
          clip: ['1', 1],
        },
      };
      // CLIP skip from env — Pony/Illustrious LoRAs need skip 2 (-2)
      workflow['11'] = {
        class_type: 'CLIPSetLastLayer',
        inputs: {
          stop_at_clip_layer: this.clipSkip,
          clip: ['10', 1],
        },
      };
    }

    if (useControlnet) {
      // SDXL OpenPose ControlNet
      workflow['12'] = {
        class_type: 'ControlNetLoader',
        inputs: { control_net_name: controlnetModel },
      };
      workflow['13'] = {
        class_type: 'LoadImage',
        inputs: { image: payload.poseImageFilename! },
      };
      workflow['14'] = {
        class_type: 'ControlNetApply',
        inputs: {
          conditioning: ['2', 0],
          control_net: ['12', 0],
          image: ['13', 0],
          strength: controlnetStr,
        },
      };
    }

    return workflow;
  }

  /**
   * Upload a local image to ComfyUI's input directory so it can be
   * referenced by LoadImage nodes.
   * Returns the filename ComfyUI assigned.
   */
  async uploadImage(localPath: string): Promise<string> {
    const imageBuffer = fs.readFileSync(localPath);
    const filename = path.basename(localPath);

    const formData = new FormData();
    formData.append('image', new Blob([imageBuffer]), filename);
    formData.append('overwrite', 'true');

    const response = await fetch(`${this.baseUrl}/upload/image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`ComfyUI image upload failed (${response.status}): ${await response.text()}`);
    }

    const result = (await response.json()) as { name: string; subfolder?: string; type?: string };
    this.logger.log(`Uploaded image to ComfyUI: ${result.name}`);
    return result.name;
  }

  /**
   * Generate an image using img2img — takes an existing image as the
   * starting point and partially denoises with a new prompt.
   */
  async generateImg2Img(payload: ComfyUIImg2ImgPayload): Promise<GenerationResult> {
    const workflow = this.buildImg2ImgWorkflow(payload);
    const seed = workflow['6'].inputs.seed as number;

    this.logger.log(`Submitting img2img prompt to ComfyUI (denoise=${payload.denoise ?? 0.45})`);

    // Log the full img2img workflow config for diagnostics
    const workflowSummary = {
      checkpoint: workflow['1'].inputs.ckpt_name,
      inputImage: workflow['4'].inputs.image,
      sampler: workflow['6'].inputs.sampler_name,
      scheduler: workflow['6'].inputs.scheduler,
      steps: workflow['6'].inputs.steps,
      cfg: workflow['6'].inputs.cfg,
      denoise: workflow['6'].inputs.denoise,
      seed,
      hasLora: !!workflow['10'],
      loraName: workflow['10']?.inputs?.lora_name || null,
      loraStrength: workflow['10']?.inputs?.strength_model || null,
      clipSkip: workflow['11']?.inputs?.stop_at_clip_layer || null,
      hasControlnet: !!workflow['12'],
      controlnetModel: workflow['12']?.inputs?.control_net_name || null,
      controlnetStrength: workflow['14']?.inputs?.strength || null,
      nodeCount: Object.keys(workflow).length,
    };
    this.logger.log(`[img2img] Workflow: ${JSON.stringify(workflowSummary)}`);
    let submitResponse: Response;
    try {
      submitResponse = await fetch(`${this.baseUrl}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow }),
      });
    } catch (fetchError) {
      this.logger.error(`[img2img] Failed to connect to ComfyUI at ${this.baseUrl}: ${fetchError}`);
      throw new Error(`ComfyUI unreachable at ${this.baseUrl}: ${fetchError}`);
    }

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      this.logger.error(`[img2img] ComfyUI rejected workflow (${submitResponse.status}): ${errorText}`);
      throw new Error(`ComfyUI img2img submission failed (${submitResponse.status}): ${errorText}`);
    }

    const submitBody = (await submitResponse.json()) as { prompt_id: string; node_errors?: Record<string, unknown>; error?: string };
    if (submitBody.node_errors && Object.keys(submitBody.node_errors).length > 0) {
      this.logger.error(`[img2img] ComfyUI node errors: ${JSON.stringify(submitBody.node_errors)}`);
    }
    if (submitBody.error) {
      this.logger.error(`[img2img] ComfyUI submission error: ${submitBody.error}`);
    }
    const { prompt_id } = submitBody;
    this.logger.log(`ComfyUI img2img job submitted: ${prompt_id}`);

    // Poll for completion (same logic as txt2img)
    const pollResult = await this.pollForCompletion(prompt_id);

    // Fetch ComfyUI console logs
    const consoleLogs = await this.fetchRecentLogs();

    // Download the image
    const imageResponse = await fetch(
      `${this.baseUrl}/view?filename=${encodeURIComponent(pollResult.filename)}&type=output`,
    );
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image from ComfyUI: ${imageResponse.status}`);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const localFilename = `${prompt_id}_${Date.now()}.png`;
    const localPath = path.join(this.uploadsDir, localFilename);

    fs.writeFileSync(localPath, imageBuffer);
    this.logger.log(`img2img image saved: ${localPath}`);

    return {
      filePath: `shot-previews/${localFilename}`,
      seed,
      comfyLogs: {
        statusMessages: pollResult.statusMessages,
        consoleLogs,
      },
    };
  }

  /**
   * Check if ComfyUI is reachable.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/system_stats`, { signal: AbortSignal.timeout(5000) });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Poll ComfyUI history for a completed job. Max 300 seconds (5 min).
   * First generation is slow — ComfyUI must load all models into VRAM.
   */
  /**
   * Fetch recent log entries from ComfyUI's internal logging endpoint.
   * Returns an empty array if the endpoint is not available (older ComfyUI versions).
   */
  async fetchRecentLogs(): Promise<unknown[]> {
    try {
      const response = await fetch(`${this.baseUrl}/internal/logs`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        const logs = (data as { entries?: unknown[] })?.entries || (Array.isArray(data) ? data : []);
        this.logger.log(`[logs] Fetched ${(logs as unknown[]).length} ComfyUI log entries`);
        return logs as unknown[];
      }
      this.logger.warn(`[logs] ComfyUI /internal/logs not available (${response.status})`);
      return [];
    } catch (e) {
      this.logger.warn(`[logs] Failed to fetch ComfyUI logs: ${e}`);
      return [];
    }
  }

  private async pollForCompletion(promptId: string): Promise<PollResult> {
    const maxAttempts = 150;
    const pollInterval = 2000;
    const startTime = Date.now();

    this.logger.log(`[poll] Starting poll for job ${promptId} (max ${maxAttempts * pollInterval / 1000}s)`);

    // Check the queue first to see if the job is queued or rejected
    try {
      const queueResponse = await fetch(`${this.baseUrl}/queue`);
      if (queueResponse.ok) {
        const queue = (await queueResponse.json()) as {
          queue_running: unknown[];
          queue_pending: unknown[];
        };
        this.logger.log(`[poll] ComfyUI queue: ${queue.queue_running.length} running, ${queue.queue_pending.length} pending`);
      }
    } catch (e) {
      this.logger.warn(`[poll] Failed to check ComfyUI queue: ${e}`);
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await this.sleep(pollInterval);

      const elapsed = Math.round((Date.now() - startTime) / 1000);

      if (attempt === 0 || attempt === 2 || attempt === 5 || (attempt > 0 && attempt % 15 === 0)) {
        this.logger.log(`[poll] Job ${promptId.substring(0, 8)}… — attempt ${attempt + 1}, elapsed ${elapsed}s`);
      }

      let historyResponse: Response;
      try {
        historyResponse = await fetch(`${this.baseUrl}/history/${promptId}`);
      } catch (fetchError) {
        this.logger.warn(`[poll] Failed to fetch history for ${promptId}: ${fetchError}`);
        continue;
      }

      if (!historyResponse.ok) {
        this.logger.warn(`[poll] History response not ok: ${historyResponse.status} ${historyResponse.statusText}`);
        continue;
      }

      let history: Record<string, ComfyUIJobData>;
      try {
        history = (await historyResponse.json()) as Record<string, ComfyUIJobData>;
      } catch (parseError) {
        this.logger.warn(`[poll] Failed to parse history JSON: ${parseError}`);
        continue;
      }

      const jobData = history[promptId];

      if (!jobData) {
        // Job not in history yet — still queued or processing
        if (attempt === 0 || attempt === 5 || attempt % 30 === 0) {
          this.logger.log(`[poll] Job ${promptId.substring(0, 8)}… not in history yet (attempt ${attempt + 1}, ${elapsed}s)`);
        }
        continue;
      }

      // Log job status
      const statusStr = jobData.status?.status_str || 'unknown';
      if (attempt <= 5 || attempt % 10 === 0) {
        this.logger.log(`[poll] Job ${promptId.substring(0, 8)}… status: "${statusStr}", has outputs: ${!!jobData.outputs}, ${elapsed}s`);
      }

      if (statusStr === 'error') {
        const errorMessages = (jobData.status?.messages || [])
          .filter((m) => m[0] === 'execution_error')
          .map((m) => m[1]?.exception_message || 'Unknown error');
        const allMessages = (jobData.status?.messages || []).map((m) => ({ type: m[0], detail: m[1] }));
        this.logger.error(`[poll] Job ${promptId} FAILED after ${elapsed}s. Messages: ${JSON.stringify(allMessages)}`);
        // Fetch console logs before throwing so they're available to the caller
        const consoleLogs = await this.fetchRecentLogs();
        if (consoleLogs.length > 0) {
          this.logger.error(`[poll] ComfyUI console logs around failure: ${JSON.stringify(consoleLogs.slice(-20))}`);
        }
        const err = new Error(`ComfyUI generation failed: ${errorMessages.join('; ') || 'Unknown error'}`);
        (err as any).comfyLogs = { statusMessages: allMessages, consoleLogs };
        throw err;
      }

      const outputs = jobData.outputs;
      if (outputs) {
        const outputKeys = Object.keys(outputs);
        this.logger.log(`[poll] Job ${promptId.substring(0, 8)}… has output nodes: [${outputKeys.join(', ')}]`);
        for (const [nodeId, nodeOutput] of Object.entries(outputs)) {
          if (nodeOutput.images && nodeOutput.images.length > 0) {
            const image = nodeOutput.images[0];
            const statusMessages = (jobData.status?.messages || []).map((m) => ({ type: m[0], detail: m[1] }));
            this.logger.log(`[poll] Job ${promptId.substring(0, 8)}… COMPLETED in ${elapsed}s — image: ${image.filename} (node ${nodeId}, type: ${image.type})`);
            return { filename: image.filename, statusMessages };
          }
        }
        // Outputs exist but no images
        this.logger.warn(`[poll] Job ${promptId.substring(0, 8)}… has outputs but no images: ${JSON.stringify(outputs)}`);
      }
    }

    const totalElapsed = Math.round((Date.now() - startTime) / 1000);
    this.logger.error(`[poll] Job ${promptId} TIMED OUT after ${totalElapsed}s (${maxAttempts} attempts)`);
    throw new Error(`ComfyUI generation timed out after ${totalElapsed}s`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
