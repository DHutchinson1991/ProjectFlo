import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto, ContractStatus } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { Contract } from './entities/contract.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) { }

  async create(inquiryId: number, createContractDto: CreateContractDto): Promise<Contract> {
    return this.prisma.contracts.create({
      data: {
        inquiry_id: inquiryId,
        title: createContractDto.title,
        content: createContractDto.content ? (createContractDto.content as Prisma.InputJsonValue) : Prisma.DbNull,
        status: createContractDto.status || ContractStatus.DRAFT,
        project_id: createContractDto.project_id || null,
      },
    });
  }

  async findAllByInquiry(inquiryId: number): Promise<Contract[]> {
    return this.prisma.contracts.findMany({
      where: { inquiry_id: inquiryId },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(inquiryId: number, id: number): Promise<Contract> {
    const contract = await this.prisma.contracts.findFirst({
      where: { id, inquiry_id: inquiryId },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found for inquiry ${inquiryId}`);
    }

    return contract;
  }

  async update(inquiryId: number, id: number, updateContractDto: UpdateContractDto): Promise<Contract> {
    // Verify the contract exists and belongs to the inquiry
    await this.findOne(inquiryId, id);

    const updateData: Prisma.contractsUpdateInput = {};

    if (updateContractDto.title) updateData.title = updateContractDto.title;
    if (updateContractDto.content !== undefined) {
      updateData.content = updateContractDto.content ? (updateContractDto.content as Prisma.InputJsonValue) : Prisma.DbNull;
    }
    if (updateContractDto.status) updateData.status = updateContractDto.status;
    if (updateContractDto.project_id !== undefined) {
      updateData.project = updateContractDto.project_id ? { connect: { id: updateContractDto.project_id } } : { disconnect: true };
    }
    if (updateContractDto.sent_at) updateData.sent_at = updateContractDto.sent_at;
    if (updateContractDto.signed_date) updateData.signed_date = updateContractDto.signed_date;

    return this.prisma.contracts.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(inquiryId: number, id: number): Promise<void> {
    // Verify the contract exists and belongs to the inquiry
    await this.findOne(inquiryId, id);

    await this.prisma.contracts.delete({
      where: { id },
    });
  }

  async markAsSent(inquiryId: number, id: number): Promise<Contract> {
    return this.update(inquiryId, id, {
      status: ContractStatus.SENT,
      sent_at: new Date(),
    });
  }

  async markAsSigned(inquiryId: number, id: number): Promise<Contract> {
    return this.update(inquiryId, id, {
      status: ContractStatus.SIGNED,
      signed_date: new Date(),
    });
  }
}
