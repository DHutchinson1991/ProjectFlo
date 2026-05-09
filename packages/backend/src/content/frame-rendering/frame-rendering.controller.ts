import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Headers,
  ParseIntPipe,
  UseGuards,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FrameRenderService } from './services/frame-render.service';
import { GenerateShotPreviewDto } from '../scene-preparation/dto/generate-shot-preview.dto';

@Controller('api/content/shot-previews')
@UseGuards(AuthGuard('jwt'))
export class FrameRenderingController {
  constructor(private readonly frameRender: FrameRenderService) {}

  @Post('generate')
  generate(
    @Body(new ValidationPipe({ transform: true })) dto: GenerateShotPreviewDto,
    @Headers('x-brand-context') brandHeader: string,
  ) {
    const brandId = this.parseBrandId(brandHeader);
    return this.frameRender.renderFrame(dto, brandId);
  }

  @Get('health')
  checkHealth() {
    return this.frameRender.checkHealth();
  }

  @Get('by-assignment/:assignmentId')
  findByAssignment(@Param('assignmentId', ParseIntPipe) assignmentId: number) {
    return this.frameRender.findByAssignment(assignmentId);
  }

  @Get('by-film/:filmId')
  findByFilm(
    @Param('filmId', ParseIntPipe) filmId: number,
    @Headers('x-brand-context') brandHeader: string,
  ) {
    const brandId = this.parseBrandId(brandHeader);
    return this.frameRender.findByFilm(filmId, brandId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.frameRender.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.frameRender.remove(id);
  }

  @Post(':id/critique')
  critiqueAndRegenerate(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-brand-context') brandHeader: string,
  ) {
    const brandId = this.parseBrandId(brandHeader);
    return this.frameRender.critiqueAndRegenerate(id, brandId);
  }

  private parseBrandId(header: string): number {
    const brandId = parseInt(header, 10);
    if (isNaN(brandId)) throw new BadRequestException('Missing or invalid X-Brand-Context header');
    return brandId;
  }
}
