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
import { FilmStructureTemplatesService } from './film-structure-templates.service';
import { CreateFilmStructureTemplateDto } from './dto/create-film-structure-template.dto';
import { UpdateFilmStructureTemplateDto } from './dto/update-film-structure-template.dto';
import { FilmStructureTemplatesQueryDto } from './dto/film-structure-templates-query.dto';

@Controller('api/film-structure-templates')
@UseGuards(AuthGuard('jwt'))
export class FilmStructureTemplatesController {
    constructor(private readonly templatesService: FilmStructureTemplatesService) {}

    @Post()
    create(@Body(new ValidationPipe({ transform: true })) createDto: CreateFilmStructureTemplateDto) {
        return this.templatesService.create(createDto);
    }

    @Get()
    findAll(@Query(new ValidationPipe({ transform: true })) query: FilmStructureTemplatesQueryDto) {
        return this.templatesService.findAll(query.brandId, query.filmType);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.templatesService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) updateDto: UpdateFilmStructureTemplateDto,
    ) {
        return this.templatesService.update(id, updateDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.templatesService.remove(id);
    }
}
