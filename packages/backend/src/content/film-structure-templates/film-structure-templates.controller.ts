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
import { FilmStructureTemplatesService } from './film-structure-templates.service';
import { CreateFilmStructureTemplateDto } from './dto/create-film-structure-template.dto';
import { UpdateFilmStructureTemplateDto } from './dto/update-film-structure-template.dto';

@Controller('film-structure-templates')
export class FilmStructureTemplatesController {
    constructor(private readonly templatesService: FilmStructureTemplatesService) {}

    @Post()
    create(@Body() createDto: CreateFilmStructureTemplateDto) {
        return this.templatesService.create(createDto);
    }

    @Get()
    findAll(
        @Query('brandId', new ParseIntPipe({ optional: true })) brandId?: number,
        @Query('filmType') filmType?: string,
    ) {
        return this.templatesService.findAll(brandId, filmType);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.templatesService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateFilmStructureTemplateDto,
    ) {
        return this.templatesService.update(id, updateDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.templatesService.remove(id);
    }
}
