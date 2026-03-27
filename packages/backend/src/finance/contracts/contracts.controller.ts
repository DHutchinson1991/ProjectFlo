import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Headers, Query, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ContractsService } from './contracts.service';
import { ContractSigningService } from './services/contract-signing.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { ComposeContractDto } from './dto/compose-contract.dto';
import { ContractsBrandQueryDto } from './dto/contracts-brand-query.dto';
import { SendContractDto } from './dto/send-contract.dto';
import { SubmitSignatureDto } from './dto/submit-signature.dto';
import { Request } from 'express';

@UseGuards(AuthGuard('jwt'))
@Controller('api/inquiries/:inquiryId/contracts')
export class ContractsController {
  constructor(
    private readonly contractsService: ContractsService,
    private readonly signingService: ContractSigningService,
  ) { }

  @Post()
  create(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Body(new ValidationPipe({ transform: true })) createContractDto: CreateContractDto
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
    @Body(new ValidationPipe({ transform: true })) updateContractDto: UpdateContractDto
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
    @Query(new ValidationPipe({ transform: true })) query: ContractsBrandQueryDto,
    @Body(new ValidationPipe({ transform: true })) dto: ComposeContractDto,
  ) {
    const brandId = parseInt(brandHeader || String(query.brandId ?? ''), 10);
    return this.contractsService.composeFromTemplate(inquiryId, brandId, dto);
  }

  @Post(':id/send')
  send(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) dto: SendContractDto,
  ) {
    return this.signingService.sendContract(inquiryId, id, dto);
  }

  @Post(':id/sync-template')
  syncTemplate(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-brand-context') brandHeader: string,
    @Query(new ValidationPipe({ transform: true })) query: ContractsBrandQueryDto,
  ) {
    const brandId = parseInt(brandHeader || String(query.brandId ?? ''), 10);
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
  constructor(private readonly signingService: ContractSigningService) { }

  @Get(':token')
  getSigningContract(@Param('token') token: string) {
    return this.signingService.findBySignerToken(token);
  }

  @Post(':token/sign')
  submitSignature(
    @Param('token') token: string,
    @Body(new ValidationPipe({ transform: true })) dto: SubmitSignatureDto,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket?.remoteAddress || '';
    return this.signingService.submitSignature(token, dto.signature_text, ip);
  }
}
