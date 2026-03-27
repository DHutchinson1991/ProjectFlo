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
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MontagePresetsService } from './montage-presets.service';
import { CreateMontagePresetDto } from './dto/create-montage-preset.dto';
import { UpdateMontagePresetDto } from './dto/update-montage-preset.dto';
import { MontagePresetsQueryDto } from './dto/montage-presets-query.dto';

@Controller('api/montage-presets')
@UseGuards(AuthGuard('jwt'))
export class MontagePresetsController {
    constructor(private readonly montagePresetsService: MontagePresetsService) {}

    @Post()
    create(@Body(new ValidationPipe({ transform: true })) createDto: CreateMontagePresetDto) {
        return this.montagePresetsService.create(createDto);
    }

    @Get()
    findAll(@Query(new ValidationPipe({ transform: true })) query: MontagePresetsQueryDto) {
        return this.montagePresetsService.findAll(query.brandId);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.montagePresetsService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) updateDto: UpdateMontagePresetDto,
    ) {
        return this.montagePresetsService.update(id, updateDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.montagePresetsService.remove(id);
    }
}
