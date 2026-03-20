import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { EstimatesService } from './estimates.service';
import { CreateEstimateDto } from './dto/create-estimate.dto';
import { UpdateEstimateDto } from './dto/update-estimate.dto';

@Controller('api/inquiries/:inquiryId/estimates')
export class EstimatesController {
  constructor(private readonly estimatesService: EstimatesService) { }

  @Post()
  create(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Body() createEstimateDto: CreateEstimateDto
  ) {
    return this.estimatesService.create(inquiryId, createEstimateDto);
  }

  @Get()
  findAll(@Param('inquiryId', ParseIntPipe) inquiryId: number) {
    return this.estimatesService.findAll(inquiryId);
  }

  @Get(':id')
  findOne(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.estimatesService.findOne(inquiryId, id);
  }

  @Patch(':id')
  update(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEstimateDto: UpdateEstimateDto
  ) {
    return this.estimatesService.update(inquiryId, id, updateEstimateDto);
  }

  @Delete(':id')
  remove(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.estimatesService.remove(inquiryId, id);
  }

  @Post(':id/send')
  send(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.estimatesService.send(inquiryId, id);
  }

  @Post(':id/refresh')
  refresh(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.estimatesService.refreshItems(inquiryId, id);
  }

  @Post(':id/revise')
  revise(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.estimatesService.revise(inquiryId, id);
  }

  @Get(':id/snapshots')
  getSnapshots(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.estimatesService.getSnapshots(inquiryId, id);
  }
}
