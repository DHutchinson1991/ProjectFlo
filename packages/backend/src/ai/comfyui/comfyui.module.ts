import { Module } from '@nestjs/common';
import { ComfyUIClientService } from './comfyui-client.service';

@Module({
  providers: [ComfyUIClientService],
  exports: [ComfyUIClientService],
})
export class ComfyUIModule {}
