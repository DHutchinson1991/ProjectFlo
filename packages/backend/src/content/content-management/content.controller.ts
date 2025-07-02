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
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) { }

  @Post()
  create(@Body() createContentDto: CreateContentDto) {
    return this.contentService.create(createContentDto);
  }

  @Get()
  findAll() {
    return this.contentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contentService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContentDto: UpdateContentDto,
  ) {
    return this.contentService.update(id, updateContentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contentService.delete(id);
  }

  // TODO: Implement components and build functionality
  /*
  @Post(':id/components')
  updateComponents(
    @Param('id', ParseIntPipe) contentId: number,
    @Body() components: Array<{
      component_id: number;
      order_index: number;
      editing_style?: string;
      duration_override?: number;
    }>,
  ) {
    return this.contentService.updateComponents(contentId, components);
  }
 
  @Get(':id/components')
  getComponents(@Param('id', ParseIntPipe) contentId: number) {
    return this.contentService.getComponents(contentId);
  }
 
  @Post('builds/:buildId/:contentId')
  createBuildContent(
    @Param('buildId', ParseIntPipe) buildId: number,
    @Param('contentId', ParseIntPipe) contentId: number,
  ) {
    return this.contentService.createBuildContent(buildId, contentId);
  }
 
  @Get('builds/:buildId')
  findBuildContent(@Param('buildId', ParseIntPipe) buildId: number) {
    return this.contentService.getBuildContent(buildId);
  }
 
  @Get('build-content/:id')
  findBuildContentItem(@Param('id', ParseIntPipe) id: number) {
    return this.contentService.getBuildContentItem(id);
  }
  */
}
