import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CoverageService } from './coverage.service';
import { CreateCoverageDto } from './dto/create-coverage.dto';
import { UpdateCoverageDto } from './dto/update-coverage.dto';

@Controller('api/coverage')
@UseGuards(AuthGuard('jwt'))
export class CoverageController {
  constructor(private readonly coverageService: CoverageService) {}

  @Post()
  create(@Body(new ValidationPipe({ transform: true })) createCoverageDto: CreateCoverageDto) {
    return this.coverageService.create(createCoverageDto);
  }

  @Get()
  findAll() {
    return this.coverageService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coverageService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body(new ValidationPipe({ transform: true })) updateCoverageDto: UpdateCoverageDto) {
    return this.coverageService.update(id, updateCoverageDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.coverageService.remove(id);
  }
}
