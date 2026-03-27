import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EstimatesService } from './estimates.service';
import { EstimateLifecycleService } from './services/estimate-lifecycle.service';
import { EstimateSnapshotService } from './services/estimate-snapshot.service';
import { CreateEstimateDto } from './dto/create-estimate.dto';
import { UpdateEstimateDto } from './dto/update-estimate.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/inquiries/:inquiryId/estimates')
export class EstimatesController {
  constructor(
    private readonly estimatesService: EstimatesService,
    private readonly lifecycleService: EstimateLifecycleService,
    private readonly snapshotService: EstimateSnapshotService,
  ) {}

  @Post()
  create(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Body(new ValidationPipe({ transform: true })) createEstimateDto: CreateEstimateDto
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
    @Body(new ValidationPipe({ transform: true })) updateEstimateDto: UpdateEstimateDto
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
    return this.lifecycleService.send(inquiryId, id);
  }

  @Post(':id/refresh')
  refresh(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.lifecycleService.refreshItems(inquiryId, id);
  }

  @Post(':id/revise')
  revise(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.lifecycleService.revise(inquiryId, id);
  }

  @Get(':id/snapshots')
  async getSnapshots(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.estimatesService.findOne(inquiryId, id);
    return this.snapshotService.getSnapshots(id);
  }
}
