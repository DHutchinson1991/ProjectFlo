import { Injectable, Inject, NotFoundException, BadRequestException, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { ContractStatus } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { ComposeContractDto } from './dto/compose-contract.dto';
import { Contract } from './entities/contract.entity';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { ContractTemplateVariablesService } from './services/contract-template-variables.service';
import { InquiryTasksService } from '../../workflow/tasks/inquiry/services/inquiry-tasks.service';

export const CONTRACT_INCLUDE = {
  signers: {
    orderBy: { created_at: 'asc' as const },
  },
};

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private variablesService: ContractTemplateVariablesService,
    @Inject(forwardRef(() => InquiryTasksService))
    private inquiryTasksService: InquiryTasksService,
  ) { }

  async create(inquiryId: number, createContractDto: CreateContractDto): Promise<Contract> {
    const contract = await this.prisma.contracts.create({
      data: {
        inquiry_id: inquiryId,
        title: createContractDto.title,
        content: createContractDto.content ? (createContractDto.content as Prisma.InputJsonValue) : Prisma.DbNull,
        status: createContractDto.status || ContractStatus.DRAFT,
        project_id: createContractDto.project_id || null,
      },
      include: CONTRACT_INCLUDE,
    });
    await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Prepare Contract');
    return contract;
  }

  async findAllByInquiry(inquiryId: number): Promise<Contract[]> {
    return this.prisma.contracts.findMany({
      where: { inquiry_id: inquiryId },
      orderBy: { id: 'desc' },
      include: CONTRACT_INCLUDE,
    });
  }

  async findOne(inquiryId: number, id: number): Promise<Contract> {
    const contract = await this.prisma.contracts.findFirst({
      where: { id, inquiry_id: inquiryId },
      include: CONTRACT_INCLUDE,
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
      include: CONTRACT_INCLUDE,
    });
  }

  async remove(inquiryId: number, id: number): Promise<void> {
    // Verify the contract exists and belongs to the inquiry
    await this.findOne(inquiryId, id);

    await this.prisma.contracts.delete({
      where: { id },
    });
  }

  // ── Compose from template ────────────────────────────────────────

  async composeFromTemplate(
    inquiryId: number,
    brandId: number,
    dto: ComposeContractDto,
  ): Promise<Contract> {
    const preview = await this.variablesService.preview(
      brandId,
      dto.template_id,
      inquiryId,
    );

    // Build rendered HTML from template sections
    const htmlSections = preview.sections.map(
      (s) =>
        `<div class="contract-section">` +
        `<h3>${this.escapeHtml(s.title)}</h3>` +
        `<p>${this.escapeHtml(s.body).replace(/\n/g, '<br/>')}</p>` +
        `</div>`,
    );
    const renderedHtml =
      `<div class="contract-document">` +
      htmlSections.join('\n') +
      `</div>`;

    const title = dto.title || preview.template_name;

    const contract = await this.prisma.contracts.create({
      data: {
        inquiry_id: inquiryId,
        title,
        content: { sections: preview.sections } as unknown as Prisma.InputJsonValue,
        rendered_html: renderedHtml,
        template_id: dto.template_id,
        status: ContractStatus.DRAFT,
        signing_token: randomUUID(),
      },
      include: CONTRACT_INCLUDE,
    });
    await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Prepare Contract');
    return contract;
  }

  async syncFromTemplate(
    inquiryId: number,
    id: number,
    brandId: number,
  ): Promise<Contract> {
    const contract = await this.findOne(inquiryId, id);

    if (!contract.template_id) {
      throw new BadRequestException('This contract is not linked to a template');
    }

    if (contract.status === ContractStatus.SIGNED) {
      throw new BadRequestException('Signed contracts cannot be synced from template');
    }

    const preview = await this.variablesService.preview(
      brandId,
      contract.template_id,
      inquiryId,
    );

    const htmlSections = preview.sections.map(
      (s) =>
        `<div class="contract-section">` +
        `<h3>${this.escapeHtml(s.title)}</h3>` +
        `<p>${this.escapeHtml(s.body).replace(/\n/g, '<br/>')}</p>` +
        `</div>`,
    );
    const renderedHtml =
      `<div class="contract-document">` +
      htmlSections.join('\n') +
      `</div>`;

    return this.prisma.contracts.update({
      where: { id },
      data: {
        content: { sections: preview.sections } as unknown as Prisma.InputJsonValue,
        rendered_html: renderedHtml,
      },
      include: CONTRACT_INCLUDE,
    });
  }

  // ── Legacy helpers ───────────────────────────────────────────────

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

  escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
