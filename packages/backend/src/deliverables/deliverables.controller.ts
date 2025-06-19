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
import { DeliverablesService } from './deliverables.service';
import { CreateDeliverableDto } from './dto/create-deliverable.dto';
import { UpdateDeliverableDto } from './dto/update-deliverable.dto';
import { ComponentPricingDto } from './dto/component-pricing.dto';
import { CreateBuildDeliverableDto } from './dto/create-build-deliverable.dto';

@Controller('deliverables')
export class DeliverablesController {
  constructor(private readonly deliverablesService: DeliverablesService) {}

  @Post('templates')
  createTemplate(@Body() createDeliverableDto: CreateDeliverableDto) {
    return this.deliverablesService.createTemplate(createDeliverableDto);
  }

  @Get('templates')
  findAllTemplates() {
    return this.deliverablesService.findAllTemplates();
  }

  @Get('templates/:id')
  findTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.deliverablesService.findTemplate(id);
  }

  @Patch('templates/:id')
  updateTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDeliverableDto: UpdateDeliverableDto,
  ) {
    return this.deliverablesService.updateTemplate(id, updateDeliverableDto);
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.deliverablesService.deleteTemplate(id);
  }

  @Get('templates/:id/pricing')
  getTemplatePricing(@Param('id', ParseIntPipe) id: number) {
    return this.deliverablesService.getTemplatePricing(id);
  }

  @Get('components')
  getAvailableComponents() {
    return this.deliverablesService.getAvailableVideoComponents();
  }

  @Post('components/pricing')
  getComponentsPricing(@Body() body: ComponentPricingDto) {
    return this.deliverablesService.getComponentsPricing(body.componentIds);
  }

  @Post('build-deliverables')
  createBuildDeliverable(@Body() body: CreateBuildDeliverableDto) {
    return this.deliverablesService.createBuildDeliverable(body.buildId, body.deliverableId);
  }

  @Get('build-deliverables/:id')
  getBuildDeliverable(@Param('id', ParseIntPipe) id: number) {
    return this.deliverablesService.getBuildDeliverable(id);
  }

  @Get('builds/:buildId/deliverables')
  getBuildDeliverables(@Param('buildId', ParseIntPipe) buildId: number) {
    return this.deliverablesService.getBuildDeliverables(buildId);
  }

  @Patch('templates/:id/components')
  updateDeliverableComponents(
    @Param('id', ParseIntPipe) id: number,
    @Body() components: Array<{
      component_id: number;
      order_index: number;
      editing_style?: string;
      duration_override?: number;
    }>
  ) {
    return this.deliverablesService.updateDeliverableComponents(id, components);
  }

  @Get('templates/:id/components')
  getDeliverableComponents(@Param('id', ParseIntPipe) id: number) {
    return this.deliverablesService.getDeliverableComponents(id);
  }
}