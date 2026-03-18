import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Headers, Query, Req } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto, ComposeContractDto, SendContractDto, SubmitSignatureDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { Request } from 'express';

@Controller('api/inquiries/:inquiryId/contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) { }

  @Post()
  create(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Body() createContractDto: CreateContractDto
  ) {
    return this.contractsService.create(inquiryId, createContractDto);
  }

  @Get()
  findAll(@Param('inquiryId', ParseIntPipe) inquiryId: number) {
    return this.contractsService.findAllByInquiry(inquiryId);
  }

  @Get(':id')
  findOne(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.contractsService.findOne(inquiryId, id);
  }

  @Patch(':id')
  update(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContractDto: UpdateContractDto
  ) {
    return this.contractsService.update(inquiryId, id, updateContractDto);
  }

  @Delete(':id')
  remove(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.contractsService.remove(inquiryId, id);
  }

  @Post('compose')
  compose(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Headers('x-brand-context') brandHeader: string,
    @Query('brandId') brandQuery: string,
    @Body() dto: ComposeContractDto,
  ) {
    const brandId = parseInt(brandHeader || brandQuery, 10);
    return this.contractsService.composeFromTemplate(inquiryId, brandId, dto);
  }

  @Post(':id/send')
  send(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendContractDto,
  ) {
    return this.contractsService.sendContract(inquiryId, id, dto);
  }

  @Post(':id/sync-template')
  syncTemplate(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-brand-context') brandHeader: string,
    @Query('brandId') brandQuery: string,
  ) {
    const brandId = parseInt(brandHeader || brandQuery, 10);
    return this.contractsService.syncFromTemplate(inquiryId, id, brandId);
  }

  @Post(':id/mark-signed')
  markAsSigned(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.contractsService.markAsSigned(inquiryId, id);
  }
}

// Public signing controller — no auth guard
@Controller('api/signing')
export class ContractSigningController {
  constructor(private readonly contractsService: ContractsService) { }

  @Get(':token')
  getSigningContract(@Param('token') token: string) {
    return this.contractsService.findBySignerToken(token);
  }

  @Post(':token/sign')
  submitSignature(
    @Param('token') token: string,
    @Body() dto: SubmitSignatureDto,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket?.remoteAddress || '';
    return this.contractsService.submitSignature(token, dto.signature_text, ip);
  }
}
