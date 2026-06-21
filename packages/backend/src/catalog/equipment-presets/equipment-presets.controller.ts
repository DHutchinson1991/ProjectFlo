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
import { CreateEquipmentPresetDto, UpdateEquipmentPresetDto } from './dto/equipment-preset.dto';
import { EquipmentPresetsService } from './equipment-presets.service';

@Controller('api/equipment-presets')
@UseGuards(AuthGuard('jwt'))
export class EquipmentPresetsController {
  constructor(private readonly service: EquipmentPresetsService) {}

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
    @Body(new ValidationPipe({ transform: true })) dto: CreateEquipmentPresetDto,
  ) {
    return this.service.create(brandId, dto);
  }

  @Patch(':id')
  update(
    @BrandId() brandId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateEquipmentPresetDto,
  ) {
    return this.service.update(id, brandId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@BrandId() brandId: number, @Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id, brandId);
  }
}
