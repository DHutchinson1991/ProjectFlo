import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BrandId } from '../../platform/auth/decorators/brand-id.decorator';
import { CrewPresetsService } from './crew-presets.service';
import { CreateCrewPresetDto, UpdateCrewPresetDto } from './dto/crew-preset.dto';

@Controller('api/crew-presets')
@UseGuards(AuthGuard('jwt'))
export class CrewPresetsController {
  constructor(private readonly service: CrewPresetsService) {}

  @Get()
  findAll(@BrandId() brandId: number) {
    return this.service.findAll(brandId);
  }

  @Get(':id')
  findOne(@BrandId() brandId: number, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id, brandId);
  }

  @Post()
  create(
    @BrandId() brandId: number,
    @Body(new ValidationPipe({ transform: true })) dto: CreateCrewPresetDto,
  ) {
    return this.service.create(brandId, dto);
  }

  @Patch(':id')
  update(
    @BrandId() brandId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateCrewPresetDto,
  ) {
    return this.service.update(id, brandId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@BrandId() brandId: number, @Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id, brandId);
  }
}
