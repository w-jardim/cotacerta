import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PixPayloadService } from '../pix/pix-payload.service';
import { PaymentRequestAnalysisService } from '../payment-requests/payment-request-analysis.service';
import { ReceiptFingerprintService } from '../common/receipt/receipt-fingerprint.service';

export interface UpdateMemberProfileDto {
  name?: string;
  phone?: string;
  pixKey?: string;
  cpf?: string;
  bankInstitution?: string;
  bankAccountHolder?: string;
}

export interface SubmitPaymentRequestDto {
  type: 'MONTHLY_CHARGE' | 'LOAN';
  monthlyChargeId?: string;
  loanId?: string;
  method: 'PIX' | 'CASH' | 'OTHER';
  amountDeclared: number;
  receiptFileName?: string;
  receiptMimeType?: string;
  receiptDataUrl?: string;
  notes?: string;
}

export interface StartPixPaymentDto {
  method: 'PIX';
  paymentScope?: 'FULL' | 'INTEREST_ONLY';
}

export interface AttachPaymentReceiptDto {
  receiptFileName: string;
  receiptMimeType: string;
  receiptDataUrl: string;
}

@Injectable()
export class MemberPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pixPayloadService: PixPayloadService,
    private readonly paymentRequestAnalysisService: PaymentRequestAnalysisService,
    private readonly receiptFingerprintService: ReceiptFingerprintService,
  ) {}

  private async getMemberByUserId(userId: string) {
    const member = await this.prisma.member.findUnique({
      where: { userId },
      include: {
        cashGroup: {
          select: {
            id: true,
            name: true,
            cycleYear: true,
            quotaValue: true,
            dueDay: true,
            status: true,
            receivingPixEnabledForCharges: true,
            receivingPixEnabledForLoans: true,
            receivingPixKey: true,
            receivingPixKeyHolder: true,
            receivingPixReceiverCity: true,
            receivingPixDescriptionPrefix: true,
            receivingInstructions: true,
          },
        },
      },
    });
    if (!member) {
      throw new NotFoundException(
        'Nenhum cotista vinculado a este usuário',
      );
    }
    return member;
  }

  async getMe(userId: string) {
    const member = await this.getMemberByUserId(userId);
    const pendingChange = await this.prisma.memberProfileChangeRequest.findFirst({
      where: { memberId: member.id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    return {
      id: member.id,
      name: member.name,
      cpf: member.cpf,
      phone: member.phone,
      pixKey: member.pixKey,
      bankInstitution: member.bankInstitution,
      bankAccountHolder: member.bankAccountHolder,
      quotasCount: member.quotasCount,
      status: member.status,
      cashGroup: member.cashGroup,
      createdAt: member.createdAt,
      pendingProfileChange: pendingChange
        ? { id: pendingChange.id, requestedData: pendingChange.requestedData, createdAt: pendingChange.createdAt }
        : null,
    };
  }

  async updateMe(userId: string, dto: UpdateMemberProfileDto) {
    const member = await this.getMemberByUserId(userId);

    const existing = await this.prisma.memberProfileChangeRequest.findFirst({
      where: { memberId: member.id, status: 'PENDING' },
    });

    if (existing) {
      throw new BadRequestException(
        'Você já possui uma solicitação de alteração de perfil pendente. Aguarde a aprovação do administrador.',
      );
    }

    const request = await this.prisma.memberProfileChangeRequest.create({
      data: {
        memberId: member.id,
        requestedData: dto as any,
        status: 'PENDING',
      },
    });

    return {
      message: 'Solicitação de alteração de perfil enviada para aprovação do administrador.',
      request: {
        id: request.id,
        status: request.status,
        createdAt: request.createdAt,
      },
    };
  }

  async getGroups(userId: string) {
    const member = await this.getMemberByUserId(userId);
    return [
      {
        ...member.cashGroup,
        quotasCount: member.quotasCount,
        memberStatus: member.status,
      },
    ];
  }

  async getReceivingSettings(userId: string, groupId: string) {
    const member = await this.getMemberByUserId(userId);

    if (member.cashGroup.id !== groupId) {
      throw new NotFoundException('Caixinha não encontrada.');
    }

    return {
      groupId: member.cashGroup.id,
      pix: {
        enabledForCharges: member.cashGroup.receivingPixEnabledForCharges,
        enabledForLoans: member.cashGroup.receivingPixEnabledForLoans,
        pixKey: member.cashGroup.receivingPixKey,
        receiverName: member.cashGroup.receivingPixKeyHolder,
        receiverCity:
          member.cashGroup.receivingPixReceiverCity ?? 'SAO PAULO',
        descriptionPrefix: member.cashGroup.receivingPixDescriptionPrefix,
      },
      instructions: member.cashGroup.receivingInstructions,
    };
  }

  async getCharges(
    userId: string,
    groupId?: string,
    referenceMonth?: number,
    referenceYear?: number,
  ) {
    const member = await this.getMemberByUserId(userId);

    const where: any = { memberId: member.id };
    if (groupId) where.cashGroupId = groupId;
    if (referenceMonth) where.referenceMonth = Number(referenceMonth);
    if (referenceYear) where.referenceYear = Number(referenceYear);

    return this.prisma.monthlyCharge.findMany({
      where,
      orderBy: [{ referenceYear: 'desc' }, { referenceMonth: 'desc' }],
    });
  }

  async getPayments(userId: string) {
    const member = await this.getMemberByUserId(userId);

    return this.prisma.chargePayment.findMany({
      where: { memberId: member.id },
      include: {
        monthlyCharge: {
          select: { referenceMonth: true, referenceYear: true },
        },
        receipt: { select: { id: true, fileName: true } },
      },
      orderBy: { paidAt: 'desc' },
    });
  }

  async getLoans(userId: string) {
    const member = await this.getMemberByUserId(userId);

    const loans = await this.prisma.loan.findMany({
      where: { memberId: member.id },
      include: {
        payments: {
          select: { id: true, amount: true, paidAt: true, status: true },
        },
      },
      orderBy: { grantedAt: 'desc' },
    });

    return loans.map((loan) => this.attachLoanMeta(loan));
  }

  async getDebts(userId: string) {
    const member = await this.getMemberByUserId(userId);

    const [pendingCharges, pendingLoans] = await Promise.all([
      this.prisma.monthlyCharge.findMany({
        where: {
          memberId: member.id,
          status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] },
        },
        orderBy: [{ referenceYear: 'asc' }, { referenceMonth: 'asc' }],
      }),
      this.prisma.loan.findMany({
        where: {
          memberId: member.id,
          status: { in: ['OPEN', 'PARTIAL'] },
        },
        orderBy: { grantedAt: 'asc' },
      }),
    ]);

    const totalChargesDebt = pendingCharges.reduce(
      (sum, c) =>
        sum +
        (parseFloat(c.amountDue.toString()) -
          parseFloat(c.amountPaid.toString())),
      0,
    );

    const totalLoansDebt = pendingLoans.reduce(
      (sum, l) =>
        sum +
        (parseFloat(l.totalDue.toString()) -
          parseFloat(l.amountPaid.toString())),
      0,
    );

    return {
      pendingCharges,
      pendingLoans,
      summary: {
        totalChargesDebt: totalChargesDebt.toFixed(2),
        totalLoansDebt: totalLoansDebt.toFixed(2),
        totalDebt: (totalChargesDebt + totalLoansDebt).toFixed(2),
        pendingChargesCount: pendingCharges.length,
        pendingLoansCount: pendingLoans.length,
      },
    };
  }

  async submitPaymentRequest(userId: string, dto: SubmitPaymentRequestDto) {
    const member = await this.getMemberByUserId(userId);

    if (dto.method === 'PIX' && !dto.receiptDataUrl) {
      throw new BadRequestException(
        'Pagamento via Pix exige comprovante anexado.',
      );
    }

    const receiptHash = dto.receiptDataUrl
      ? await this.receiptFingerprintService.assertReceiptIsUnique(
          dto.receiptDataUrl,
        )
      : null;

    if (dto.type === 'MONTHLY_CHARGE' && dto.monthlyChargeId) {
      const charge = await this.prisma.monthlyCharge.findFirst({
        where: { id: dto.monthlyChargeId, memberId: member.id },
      });
      if (!charge) {
        throw new NotFoundException('Cobrança não encontrada.');
      }
      if (charge.status === 'PAID' || charge.status === 'CANCELED') {
        throw new BadRequestException(
          `Esta cobrança já está com status "${charge.status}".`,
        );
      }
    }

    if (dto.type === 'LOAN') {
      if (!dto.loanId) {
        throw new BadRequestException('ID do empréstimo é obrigatório.');
      }
      const loan = await this.prisma.loan.findFirst({
        where: { id: dto.loanId, memberId: member.id },
      });
      if (!loan) {
        throw new NotFoundException('Empréstimo não encontrado.');
      }
      if (loan.status === 'PAID' || loan.status === 'CANCELED') {
        throw new BadRequestException(
          `Este empréstimo já está com status "${loan.status}".`,
        );
      }
    }

    const request = await this.prisma.paymentRequest.create({
      data: {
        cashGroupId: member.cashGroupId,
        memberId: member.id,
        type: dto.type,
        monthlyChargeId: dto.monthlyChargeId ?? null,
        loanId: dto.loanId ?? null,
        method: dto.method,
        amountDeclared: dto.amountDeclared,
        receiptFileName: dto.receiptFileName ?? null,
        receiptMimeType: dto.receiptMimeType ?? null,
        receiptDataUrl: dto.receiptDataUrl ?? null,
        receiptHash,
        notes: dto.notes ?? null,
        status: 'PENDING_REVIEW',
      },
    });

    const analysis =
      request.receiptDataUrl && request.receiptMimeType
        ? await this.paymentRequestAnalysisService.analyzePaymentRequest(
            request.id,
          )
        : null;

    return {
      message: this.buildMemberFacingReceiptMessage(
        analysis?.analysis?.status ?? request.status,
        dto.method,
      ),
      request: {
        id: request.id,
        status: analysis?.requestStatus ?? request.status,
        createdAt: request.createdAt,
      },
      analysis,
    };
  }

  async getPaymentRequests(userId: string) {
    const member = await this.getMemberByUserId(userId);

    return this.prisma.paymentRequest.findMany({
      where: { memberId: member.id },
      include: {
        monthlyCharge: {
          select: { id: true, referenceMonth: true, referenceYear: true },
        },
        loan: {
          select: { id: true, principalAmount: true, totalDue: true },
        },
        pixPayload: true,
        analysis: true,
      },
      orderBy: { createdAt: 'desc' },
    }).then((requests) =>
      requests.map((request) => ({
        ...request,
        analysis: request.analysis
          ? this.paymentRequestAnalysisService.serializeAnalysisRecord(
              request.analysis,
            )
          : null,
      })),
    );
  }

  async startChargePixPayment(
    userId: string,
    chargeId: string,
    dto: StartPixPaymentDto,
  ) {
    if (dto.method !== 'PIX') {
      throw new BadRequestException('Apenas o método PIX é suportado nesta rota.');
    }

    const member = await this.getMemberByUserId(userId);
    const charge = await this.prisma.monthlyCharge.findFirst({
      where: { id: chargeId, memberId: member.id },
    });

    if (!charge) {
      throw new NotFoundException('Cobrança não encontrada.');
    }

    if (!['PENDING', 'PARTIAL', 'OVERDUE'].includes(charge.status)) {
      throw new BadRequestException(
        `Esta cobrança não pode gerar Pix no status "${charge.status}".`,
      );
    }

    const amount = Number(charge.amountDue) - Number(charge.amountPaid);
    if (amount <= 0) {
      throw new BadRequestException('Esta cobrança não possui saldo pendente.');
    }

    this.assertPixAvailable(member.cashGroup, 'MONTHLY_CHARGE');

    const description = this.buildPixDescription(
      member.cashGroup.receivingPixDescriptionPrefix,
      `COTA ${String(charge.referenceMonth).padStart(2, '0')}/${charge.referenceYear}`,
    );

    const txid = `CHG${charge.id.slice(-22)}`;

    return this.createOrRefreshPixRequest({
      memberId: member.id,
      cashGroupId: member.cashGroupId,
      type: 'MONTHLY_CHARGE',
      monthlyChargeId: charge.id,
      amount,
      pixKey: member.cashGroup.receivingPixKey!,
      receiverName: member.cashGroup.receivingPixKeyHolder!,
      receiverCity: member.cashGroup.receivingPixReceiverCity,
      description,
      txid,
    });
  }

  async startLoanPixPayment(
    userId: string,
    loanId: string,
    dto: StartPixPaymentDto,
  ) {
    if (dto.method !== 'PIX') {
      throw new BadRequestException('Apenas o método PIX é suportado nesta rota.');
    }

    const member = await this.getMemberByUserId(userId);
    const loan = await this.prisma.loan.findFirst({
      where: { id: loanId, memberId: member.id },
    });

    if (!loan) {
      throw new NotFoundException('Empréstimo não encontrado.');
    }

    if (!['OPEN', 'PARTIAL'].includes(loan.status)) {
      throw new BadRequestException(
        `Este empréstimo não pode gerar Pix no status "${loan.status}".`,
      );
    }

    const loanWithMeta = this.attachLoanMeta(loan);
    const paymentScope = dto.paymentScope ?? 'FULL';
    const amount =
      paymentScope === 'INTEREST_ONLY'
        ? Number(loanWithMeta.interestRemainingAmount)
        : Number(loanWithMeta.remainingAmount);

    if (amount <= 0) {
      throw new BadRequestException(
        paymentScope === 'INTEREST_ONLY'
          ? 'Este empréstimo não possui juros pendentes para pagamento.'
          : 'Este empréstimo não possui saldo pendente.',
      );
    }

    this.assertPixAvailable(member.cashGroup, 'LOAN');

    const description = this.buildPixDescription(
      member.cashGroup.receivingPixDescriptionPrefix,
      paymentScope === 'INTEREST_ONLY'
        ? 'PAGAMENTO JUROS EMPRESTIMO'
        : 'PAGAMENTO EMPRESTIMO',
    );

    const txid = `LOAN${loan.id.slice(-21)}`;

    return this.createOrRefreshPixRequest({
      memberId: member.id,
      cashGroupId: member.cashGroupId,
      type: 'LOAN',
      loanId: loan.id,
      amount,
      pixKey: member.cashGroup.receivingPixKey!,
      receiverName: member.cashGroup.receivingPixKeyHolder!,
      receiverCity: member.cashGroup.receivingPixReceiverCity,
      description,
      txid,
    });
  }

  async attachPaymentReceipt(
    userId: string,
    requestId: string,
    dto: AttachPaymentReceiptDto,
  ) {
    const member = await this.getMemberByUserId(userId);
    const request = await this.prisma.paymentRequest.findFirst({
      where: { id: requestId, memberId: member.id },
      include: {
        monthlyCharge: { select: { referenceMonth: true, referenceYear: true } },
        loan: { select: { id: true } },
      },
    });

    if (!request) {
      throw new NotFoundException('Solicitação de pagamento não encontrada.');
    }

    if (['CONFIRMED', 'REJECTED', 'CANCELED'].includes(request.status)) {
      throw new BadRequestException(
        `Esta solicitação já foi encerrada com status "${request.status}".`,
      );
    }

    this.validateReceipt(dto);
    const receiptHash =
      await this.receiptFingerprintService.assertReceiptIsUnique(
        dto.receiptDataUrl,
        {
          ignorePaymentRequestId: request.id,
        },
      );

    const updated = await this.prisma.paymentRequest.update({
      where: { id: request.id },
      data: {
        receiptFileName: dto.receiptFileName,
        receiptMimeType: dto.receiptMimeType,
        receiptDataUrl: dto.receiptDataUrl,
        receiptHash,
        status: 'PENDING_REVIEW',
      },
      include: {
        pixPayload: true,
      },
    });

    const analysis =
      updated.receiptDataUrl && updated.receiptMimeType
        ? await this.paymentRequestAnalysisService.analyzePaymentRequest(
            updated.id,
          )
        : null;

    return {
      message: this.buildMemberFacingReceiptMessage(
        analysis?.analysis?.status ?? updated.status,
        updated.method,
      ),
      request: {
        id: updated.id,
        status: analysis?.requestStatus ?? updated.status,
        amount: Number(updated.amountDeclared),
        method: updated.method,
        createdAt: updated.createdAt,
      },
      analysis,
      pix: updated.pixPayload
        ? {
            copyPasteCode: updated.pixPayload.copyPasteCode,
            receiverName: updated.pixPayload.receiverName,
            pixKey: updated.pixPayload.pixKey,
            amount: Number(updated.pixPayload.amount),
            description: updated.pixPayload.description,
          }
        : null,
    };
  }

  private assertPixAvailable(cashGroup: any, type: 'MONTHLY_CHARGE' | 'LOAN') {
    const enabled =
      type === 'MONTHLY_CHARGE'
        ? cashGroup.receivingPixEnabledForCharges
        : cashGroup.receivingPixEnabledForLoans;

    if (!enabled) {
      throw new BadRequestException(
        type === 'MONTHLY_CHARGE'
          ? 'Pix não está habilitado para cobranças nesta caixinha.'
          : 'Pix não está habilitado para empréstimos nesta caixinha.',
      );
    }

    if (!cashGroup.receivingPixKey) {
      throw new BadRequestException('A chave Pix da caixinha não foi configurada.');
    }

    if (!cashGroup.receivingPixKeyHolder) {
      throw new BadRequestException(
        'O nome do recebedor da caixinha não foi configurado.',
      );
    }
  }

  private buildPixDescription(prefix: string | null | undefined, detail: string) {
    const base = prefix?.trim() || 'COTACERTA';
    return `${base} ${detail}`.trim().slice(0, 72);
  }

  private async createOrRefreshPixRequest(input: {
    memberId: string;
    cashGroupId: string;
    type: 'MONTHLY_CHARGE' | 'LOAN';
    monthlyChargeId?: string;
    loanId?: string;
    amount: number;
    pixKey: string;
    receiverName: string;
    receiverCity?: string | null;
    description: string;
    txid: string;
  }) {
    const activeRequest = await this.prisma.paymentRequest.findFirst({
      where: {
        memberId: input.memberId,
        type: input.type,
        method: 'PIX',
        monthlyChargeId: input.monthlyChargeId ?? null,
        loanId: input.loanId ?? null,
        status: {
          in: ['PENDING_REVIEW', 'AUTO_MATCHED', 'NEEDS_MANUAL_REVIEW', 'MISMATCH'],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: { pixPayload: true },
    });

    const pix = this.pixPayloadService.generate({
      pixKey: input.pixKey,
      receiverName: input.receiverName,
      receiverCity: input.receiverCity,
      amount: input.amount,
      description: input.description,
      txid: input.txid,
    });

    let request;
    if (activeRequest) {
      request = await this.prisma.paymentRequest.update({
        where: { id: activeRequest.id },
        data: {
          amountDeclared: input.amount,
          status: 'PENDING_REVIEW',
          notes: input.description,
          pixPayload: activeRequest.pixPayload
            ? {
                update: {
                  pixKey: pix.pixKey,
                  receiverName: pix.receiverName,
                  receiverCity: pix.receiverCity,
                  amount: pix.amount,
                  description: pix.description,
                  txid: pix.txid,
                  copyPasteCode: pix.copyPasteCode,
                },
              }
            : {
                create: {
                  pixKey: pix.pixKey,
                  receiverName: pix.receiverName,
                  receiverCity: pix.receiverCity,
                  amount: pix.amount,
                  description: pix.description,
                  txid: pix.txid,
                  copyPasteCode: pix.copyPasteCode,
                },
              },
        },
        include: { pixPayload: true },
      });
    } else {
      request = await this.prisma.paymentRequest.create({
        data: {
          cashGroupId: input.cashGroupId,
          memberId: input.memberId,
          type: input.type,
          monthlyChargeId: input.monthlyChargeId ?? null,
          loanId: input.loanId ?? null,
          method: 'PIX',
          amountDeclared: input.amount,
          notes: input.description,
          status: 'PENDING_REVIEW',
          pixPayload: {
            create: {
              pixKey: pix.pixKey,
              receiverName: pix.receiverName,
              receiverCity: pix.receiverCity,
              amount: pix.amount,
              description: pix.description,
              txid: pix.txid,
              copyPasteCode: pix.copyPasteCode,
            },
          },
        },
        include: { pixPayload: true },
      });
    }

    return {
      paymentRequest: {
        id: request.id,
        status: request.status,
        amount: Number(request.amountDeclared),
        method: request.method,
        receiptUploaded: Boolean(request.receiptDataUrl),
      },
      pix: {
        copyPasteCode: request.pixPayload!.copyPasteCode,
        receiverName: request.pixPayload!.receiverName,
        receiverCity: request.pixPayload!.receiverCity,
        pixKey: request.pixPayload!.pixKey,
        amount: Number(request.pixPayload!.amount),
        description: request.pixPayload!.description,
        txid: request.pixPayload!.txid,
      },
    };
  }

  private buildMemberFacingReceiptMessage(status: string, method: string) {
    if (method !== 'PIX') {
      return 'Pagamento informado. Aguardando confirmação do gestor.';
    }

    if (status === 'AUTO_MATCHED') {
      return 'Comprovante recebido. Os dados parecem compatíveis. Aguardando confirmação final do gestor.';
    }

    if (status === 'MISMATCH') {
      return 'Comprovante recebido, mas o sistema encontrou uma possível divergência. Aguarde a análise do gestor.';
    }

    return 'Comprovante recebido. O gestor fará a conferência manual.';
  }

  private validateReceipt(receipt: AttachPaymentReceiptDto) {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    if (!allowedMimeTypes.includes(receipt.receiptMimeType)) {
      throw new BadRequestException(
        'Tipo de comprovante inválido. Use JPG, PNG, WEBP ou PDF.',
      );
    }

    if (
      !receipt.receiptDataUrl.startsWith(
        `data:${receipt.receiptMimeType};base64,`,
      )
    ) {
      throw new BadRequestException('Formato do comprovante inválido.');
    }

    const estimatedSizeBytes = Buffer.from(
      receipt.receiptDataUrl.split(',')[1] || '',
      'base64',
    ).length;

    if (estimatedSizeBytes > 5 * 1024 * 1024) {
      throw new BadRequestException('O comprovante deve ter no máximo 5MB.');
    }
  }

  private getLoanFinancialSnapshot(loan: {
    principalAmount: any;
    totalDue: any;
    interestRate: any;
    amountPaid: any;
    payments?: Array<{
      amount: any;
      status: string;
      paidAt: Date;
    }>;
  }) {
    const confirmedPayments = (loan.payments ?? []).filter(
      (payment) => payment.status === 'CONFIRMED',
    );
    const amountPaid = confirmedPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );
    const principalAmount = Number(loan.principalAmount);
    const interestRate = Number(loan.interestRate);
    const totalDue = Number(loan.totalDue);
    const totalInterestAmount = Number(
      (principalAmount * (interestRate / 100)).toFixed(2),
    );
    const interestPaidAmount = Number(
      Math.min(amountPaid, totalInterestAmount).toFixed(2),
    );
    const interestRemainingAmount = Number(
      Math.max(0, totalInterestAmount - interestPaidAmount).toFixed(2),
    );
    const principalPaidAmount = Number(
      Math.max(0, amountPaid - totalInterestAmount).toFixed(2),
    );
    const principalRemainingAmount = Number(
      Math.max(0, principalAmount - principalPaidAmount).toFixed(2),
    );
    const remainingAmount = Number(Math.max(0, totalDue - amountPaid).toFixed(2));

    return {
      amountPaid: Number(amountPaid.toFixed(2)),
      totalInterestAmount,
      interestPaidAmount,
      interestRemainingAmount,
      principalPaidAmount,
      principalRemainingAmount,
      remainingAmount,
    };
  }

  private attachLoanMeta<T extends {
    principalAmount: any;
    totalDue: any;
    amountPaid: any;
    interestRate: any;
    payments?: Array<{
      amount: any;
      status: string;
      paidAt: Date;
    }>;
  }>(loan: T) {
    const snapshot = this.getLoanFinancialSnapshot(loan);

    return {
      ...loan,
      amountPaid: snapshot.amountPaid.toFixed(2),
      totalInterestAmount: snapshot.totalInterestAmount.toFixed(2),
      interestPaidAmount: snapshot.interestPaidAmount.toFixed(2),
      interestRemainingAmount: snapshot.interestRemainingAmount.toFixed(2),
      principalPaidAmount: snapshot.principalPaidAmount.toFixed(2),
      principalRemainingAmount: snapshot.principalRemainingAmount.toFixed(2),
      remainingAmount: snapshot.remainingAmount.toFixed(2),
    };
  }
}
