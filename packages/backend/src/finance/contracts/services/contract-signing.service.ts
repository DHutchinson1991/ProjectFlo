import { Injectable, Inject, NotFoundException, BadRequestException, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { SendContractDto } from '../dto/send-contract.dto';
import { ContractStatus } from '../dto/create-contract.dto';
import { Contract } from '../entities/contract.entity';
import { ContractsService, CONTRACT_INCLUDE } from '../contracts.service';
import { randomUUID } from 'crypto';
import { InquiryTasksService } from '../../../workflow/tasks/inquiry/services/inquiry-tasks.service';
import { InvoicesService } from '../../invoices/invoices.service';

@Injectable()
export class ContractSigningService {
  constructor(
    private prisma: PrismaService,
    private contractsService: ContractsService,
    @Inject(forwardRef(() => InquiryTasksService))
    private inquiryTasksService: InquiryTasksService,
    @Inject(forwardRef(() => InvoicesService))
    private invoicesService: InvoicesService,
  ) {}

  async sendContract(
    inquiryId: number,
    id: number,
    dto: SendContractDto,
  ): Promise<Contract> {
    const contract = await this.contractsService.findOne(inquiryId, id);

    if (contract.status === 'Signed') {
      throw new BadRequestException('Contract is already signed');
    }

    let html = contract.rendered_html;
    if (!html && contract.content) {
      const content = contract.content as Record<string, unknown>;
      if (content?.sections) {
        const htmlSections = (content.sections as { title: string; body: string }[]).map(
          (s) =>
            `<div class="contract-section">` +
            `<h3>${this.contractsService.escapeHtml(s.title)}</h3>` +
            `<p>${this.contractsService.escapeHtml(s.body).replace(/\n/g, '<br/>')}</p>` +
            `</div>`,
        );
        html =
          `<div class="contract-document">` +
          htmlSections.join('\n') +
          `</div>`;
      }
    }

    await this.prisma.contract_signers.deleteMany({
      where: { contract_id: id },
    });

    const signerData = dto.signers.map((s) => ({
      contract_id: id,
      name: s.name,
      email: s.email,
      role: s.role || 'client',
    }));

    await this.prisma.contract_signers.createMany({ data: signerData });

    // Auto-sign studio signers immediately — no signing link required
    const studioSigners = await this.prisma.contract_signers.findMany({
      where: { contract_id: id, role: 'studio' },
    });
    for (const studioSigner of studioSigners) {
      await this.prisma.contract_signers.update({
        where: { id: studioSigner.id },
        data: {
          status: 'signed',
          signed_at: new Date(),
          signature_text: studioSigner.name,
        },
      });
    }

    const now = new Date();
    const signingDeadline = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    return this.prisma.contracts.update({
      where: { id },
      data: {
        status: ContractStatus.SENT,
        sent_at: now,
        signed_date: signingDeadline,
        signing_token: contract.signing_token || randomUUID(),
        rendered_html: html,
      },
      include: CONTRACT_INCLUDE,
    });
  }

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
      include: { contract: { include: { signers: true } } },
    });

    if (!signer) {
      throw new NotFoundException('Invalid or expired signing link');
    }

    if (signer.status === 'signed') {
      throw new BadRequestException('This contract has already been signed by you');
    }

    await this.prisma.contract_signers.update({
      where: { id: signer.id },
      data: {
        status: 'signed',
        signed_at: new Date(),
        signature_text: signatureText,
        signer_ip: signerIp || null,
      },
    });

    const allSigners = await this.prisma.contract_signers.findMany({
      where: { contract_id: signer.contract_id },
    });
    const allSigned = allSigners.every(
      (s) => s.id === signer.id || s.status === 'signed',
    );

    if (allSigned) {
      await this.prisma.contracts.update({
        where: { id: signer.contract_id },
        data: { status: ContractStatus.SIGNED, signed_date: new Date() },
      });

      const inquiryId = signer.contract.inquiry_id;
      await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Contract Signed');
      await this.invoicesService.autoGenerateDepositInvoice(inquiryId);
    }

    return { success: true, allSigned };
  }
}
