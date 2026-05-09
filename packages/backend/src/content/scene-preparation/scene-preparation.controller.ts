import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  ValidationPipe,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';
import { AuthGuard } from '@nestjs/passport';
import { ScenePreparationService } from './services/scene-preparation.service';
import { SpatialOverlayService } from '../spatial-engine/services/spatial-overlay.service';
import { FilmPrepEventsService } from './services/film-prep-events.service';
import { GenerateShotPreviewDto } from './dto/generate-shot-preview.dto';

@Controller('api/content/shot-previews')
@UseGuards(AuthGuard('jwt'))
export class ScenePreparationController {
  constructor(
    private readonly scenePrep: ScenePreparationService,
    private readonly spatialOverlay: SpatialOverlayService,
    private readonly prepEvents: FilmPrepEventsService,
  ) {}

  @Post('prepare')
  prepare(
    @Body(new ValidationPipe({ transform: true })) dto: GenerateShotPreviewDto,
  ) {
    return this.scenePrep.prepare(dto);
  }

  @Post('prepare-scene/:filmSceneId')
  prepareScene(
    @Param('filmSceneId', ParseIntPipe) filmSceneId: number,
    @Body() body: { filmId: number; sourceType?: 'package' | 'project' },
  ) {
    return this.scenePrep.prepareScene(filmSceneId, body.filmId, body.sourceType || 'package');
  }

  @Post('preview-prompt')
  previewPrompt(
    @Body(new ValidationPipe({ transform: true })) dto: GenerateShotPreviewDto,
  ) {
    return this.scenePrep.previewPrompt(dto);
  }

  @Get('composition-guide/:assignmentId')
  getCompositionGuide(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Query('filmId', ParseIntPipe) filmId: number,
    @Query('sourceType') sourceType?: 'package' | 'project',
  ) {
    return this.scenePrep.getCompositionGuide(assignmentId, filmId, sourceType || 'package');
  }

  @Get('spatial-overlay/:assignmentId')
  getSpatialOverlay(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Query('filmId', ParseIntPipe) filmId: number,
    @Query('sourceType') sourceType?: 'package' | 'project',
  ) {
    return this.scenePrep.getSpatialOverlay(assignmentId, filmId, sourceType || 'package');
  }

  @Get('conflicts/:sceneMomentId')
  listMomentConflicts(
    @Param('sceneMomentId', ParseIntPipe) sceneMomentId: number,
    @Query('sourceType') sourceType?: 'package' | 'project',
  ) {
    return this.scenePrep.listMomentConflicts(sceneMomentId, sourceType || 'package');
  }

  // ─── SSE: Film AI-prep progress ─────────────────────────────────
  @Sse('prep-events/:filmId')
  streamPrepEvents(@Param('filmId', ParseIntPipe) filmId: number): Observable<MessageEvent> {
    return this.prepEvents.subscribe(filmId).pipe(
      map((event) => ({ data: event }) as MessageEvent),
      takeWhile((msg) => {
        const data = msg.data as { step?: string; status?: string };
        return data.step !== 'done';
      }, true),
    );
  }
}
