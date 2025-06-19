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
import { EditingStylesService } from './editing-styles.service';
import { CreateEditingStyleDto } from './dto/create-editing-style.dto';
import { UpdateEditingStyleDto } from './dto/update-editing-style.dto';

@Controller('editing-styles')
export class EditingStylesController {
  constructor(private readonly editingStylesService: EditingStylesService) {}

  @Post()
  create(@Body() createEditingStyleDto: CreateEditingStyleDto) {
    return this.editingStylesService.create(createEditingStyleDto);
  }

  @Get()
  findAll() {
    return this.editingStylesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.editingStylesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEditingStyleDto: UpdateEditingStyleDto,
  ) {
    return this.editingStylesService.update(id, updateEditingStyleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.editingStylesService.remove(id);
  }
}
