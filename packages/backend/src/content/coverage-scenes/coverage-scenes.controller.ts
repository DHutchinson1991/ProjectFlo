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
} from '@nestjs/common';
import { CoverageScenes } from './coverage-scenes.service';
import { CreateCoverageSceneDto } from './dto/create-coverage-scene.dto';
import { UpdateCoverageSceneDto } from './dto/update-coverage-scene.dto';

@Controller('coverage-scenes')
export class CoverageScenesController {
  constructor(private readonly coverageScenesService: CoverageScenes) {}

  @Post()
  create(@Body() createCoverageSceneDto: CreateCoverageSceneDto) {
    return this.coverageScenesService.create(createCoverageSceneDto);
  }

  @Get()
  findAll() {
    return this.coverageScenesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coverageScenesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCoverageSceneDto: UpdateCoverageSceneDto,
  ) {
    return this.coverageScenesService.update(id, updateCoverageSceneDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.coverageScenesService.remove(id);
  }
}