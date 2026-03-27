import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilmTimelineLayersService } from './services/film-timeline-layers.service';

/**
 * Manages global film timeline layers (used for track organisation across all films).
 * Routes: /films/timeline-layers
 */
@Controller('api/films/timeline-layers')
@UseGuards(AuthGuard('jwt'))
export class TimelineLayersController {
  constructor(private readonly service: FilmTimelineLayersService) {}

  @Post()
  create(
    @Body(new ValidationPipe({ transform: true }))
    body: {
      name: string;
      order_index: number;
      color_hex: string;
      description?: string;
    },
  ) {
    return this.service.create(body);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true }))
    body: {
      name?: string;
      order_index?: number;
      color_hex?: string;
      description?: string;
      is_active?: boolean;
    },
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
