import { Injectable, Inject, NotFoundException, BadRequestException, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto, ContractStatus, SendContractDto, ComposeContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { Contract } from './entities/contract.entity';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { ContractTemplatesService } from './contract-templates.service';
import { InquiryTasksService } from '../inquiry-tasks/inquiry-tasks.service';
import { InvoicesService } from '../invoices/invoices.service';

const CONTRACT_INCLUDE = {
  signers: {
    orderBy: { created_at: 'asc' as const },
  },
};

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private templateService: ContractTemplatesService,
    @Inject(forwardRef(() => InquiryTasksService))
    private inquiryTasksService: InquiryTasksService,
    @Inject(forwardRef(() => InvoicesService))
    private invoicesService: InvoicesService,
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
    // Preview the template with variable resolution
    const preview = await this.templateService.preview(
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

    const preview = await this.templateService.preview(
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

  // ── Send contract ────────────────────────────────────────────────

  async sendContract(
    inquiryId: number,
    id: number,
    dto: SendContractDto,
  ): Promise<Contract> {
    const contract = await this.findOne(inquiryId, id);

    if (contract.status === 'Signed') {
      throw new BadRequestException('Contract is already signed');
    }

    // Re-render HTML if not already rendered and we have content sections
    let html = contract.rendered_html;
    if (!html && contract.content) {
      const content = contract.content as any;
      if (content?.sections) {
        const htmlSections = content.sections.map(
          (s: any) =>
            `<div class="contract-section">` +
            `<h3>${this.escapeHtml(s.title)}</h3>` +
            `<p>${this.escapeHtml(s.body).replace(/\n/g, '<br/>')}</p>` +
            `</div>`,
        );
        html =
          `<div class="contract-document">` +
          htmlSections.join('\n') +
          `</div>`;
      }
    }

    // Delete old signers if re-sending
    await this.prisma.contract_signers.deleteMany({
      where: { contract_id: id },
    });

    // Create signers with unique tokens
    const signerData = dto.signers.map((s) => ({
      contract_id: id,
      name: s.name,
      email: s.email,
      role: s.role || 'client',
    }));

    await this.prisma.contract_signers.createMany({ data: signerData });

    // Update the contract status
    return this.prisma.contracts.update({
      where: { id },
      data: {
        status: ContractStatus.SENT,
        sent_at: new Date(),
        signing_token: contract.signing_token || randomUUID(),
        rendered_html: html,
      },
      include: CONTRACT_INCLUDE,
    });
  }

  // ── Public signing endpoints (token-based, no auth) ──────────────

  async findBySignerToken(token: string) {
    const signer = await this.prisma.contract_signers.findUnique({
      where: { token },
      include: {
        contract: {
          include: {
            inquiry: { include: { contact: true } },
            signers: { orderBy: { created_at: 'asc' } },
          },
        },
      },
    });

    if (!signer) {
      throw new NotFoundException('Invalid or expired signing link');
    }

    // Mark as viewed if first time
    if (!signer.viewed_at) {
      await this.prisma.contract_signers.update({
        where: { id: signer.id },
        data: { viewed_at: new Date(), status: 'viewed' },
      });
    }

    return {
      signer: {
        id: signer.id,
        name: signer.name,
        email: signer.email,
        role: signer.role,
        status: signer.status === 'pending' ? 'viewed' : signer.status,
        signed_at: signer.signed_at,
      },
      contract: {
        id: signer.contract.id,
        title: signer.contract.title,
        status: signer.contract.status,
        rendered_html: signer.contract.rendered_html,
        content: signer.contract.content,
        sent_at: signer.contract.sent_at,
      },
      signers: signer.contract.signers.map((s) => ({
        name: s.name,
        role: s.role,
        status: s.status,
        signed_at: s.signed_at,
      })),
    };
  }

  async submitSignature(token: string, signatureText: string, signerIp?: string) {
    const signer = await this.prisma.contract_signers.findUnique({
      where: { token },
      include: {
        contract: {
          include: {
            signers: true,
          },
        },
      },
    });

    if (!signer) {
      throw new NotFoundException('Invalid or expired signing link');
    }

    if (signer.status === 'signed') {
      throw new BadRequestException('This contract has already been signed by you');
    }

    // Record the signature
    await this.prisma.contract_signers.update({
      where: { id: signer.id },
      data: {
        status: 'signed',
        signed_at: new Date(),
        signature_text: signatureText,
        signer_ip: signerIp || null,
      },
    });

    // Check if all signers have signed
    const allSigners = await this.prisma.contract_signers.findMany({
      where: { contract_id: signer.contract_id },
    });
    const allSigned = allSigners.every(
      (s) => s.id === signer.id || s.status === 'signed',
    );

    // If all signed, mark contract as signed
    if (allSigned) {
      await this.prisma.contracts.update({
        where: { id: signer.contract_id },
        data: {
          status: ContractStatus.SIGNED,
          signed_date: new Date(),
        },
      });

      const inquiryId = signer.contract.inquiry_id;
      await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Contract Signed');

      // Auto-generate deposit invoice
      await this.invoicesService.autoGenerateDepositInvoice(inquiryId);
    }

    return { success: true, allSigned };
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

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
