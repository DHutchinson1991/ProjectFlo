# ComfyUI Client

## What this module does
HTTP client for interfacing with a ComfyUI image generation server. Handles workflow submission, image retrieval, file uploads/downloads, and health checks. Used exclusively by the frame-rendering pipeline to produce AI-generated shot previews.

## Key files
| File | Purpose |
|------|---------|
| `comfyui.module.ts` | NestJS module — exports `ComfyUIClientService` |
| `comfyui-client.service.ts` | HTTP client: workflow submission, polling, image save, health check |

## Business rules / invariants
- ComfyUI server URL and credentials come from `ConfigService` environment variables.
- Generated images are saved locally under `uploads/shot-previews/` with a deterministic filename.
- Supports both txt2img and img2img workflows via different payload types.
- ControlNet pose images must be pre-uploaded to ComfyUI's input directory before use.

## Related modules
- **Backend**: `content/frame-rendering/` — sole consumer of this client for image generation.
- **Frontend**: No direct frontend consumer; images are served via frame-rendering endpoints.
