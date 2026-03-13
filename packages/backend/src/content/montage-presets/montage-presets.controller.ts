import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
    Query,
} from '@nestjs/common';
import { MontagePresetsService } from './montage-presets.service';
import { CreateMontagePresetDto } from './dto/create-montage-preset.dto';
import { UpdateMontagePresetDto } from './dto/update-montage-preset.dto';

@Controller('montage-presets')
export class MontagePresetsController {
    constructor(private readonly montagePresetsService: MontagePresetsService) {}

    @Post()
    create(@Body() createDto: CreateMontagePresetDto) {
        return this.montagePresetsService.create(createDto);
    }

    @Get()
    findAll(@Query('brandId', new ParseIntPipe({ optional: true })) brandId?: number) {
        return this.montagePresetsService.findAll(brandId);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.montagePresetsService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateMontagePresetDto,
    ) {
        return this.montagePresetsService.update(id, updateDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.montagePresetsService.remove(id);
    }
}
