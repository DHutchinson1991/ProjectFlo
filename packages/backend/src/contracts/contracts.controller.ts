import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

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

  @Post(':id/send')
  markAsSent(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.contractsService.markAsSent(inquiryId, id);
  }

  @Post(':id/sign')
  markAsSigned(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.contractsService.markAsSigned(inquiryId, id);
  }
}
