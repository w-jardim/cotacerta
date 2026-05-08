import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashGroupDto } from './dto/create-cash-group.dto';
import { UpdateCashGroupDto } from './dto/update-cash-group.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { PaymentRequestAnalysisService } from '../payment-requests/payment-request-analysis.service';

@Injectable()
export class CashGroupsService {
  constructor(
    private prisma: PrismaService,
    private readonly paymentRequestAnalysisService: PaymentRequestAnalysisService,
  ) {}

  async create(userId: string, createDto: CreateCashGroupDto) {
    this.validateReceivingSettings(createDto as Record<string, any>, createDto);

    return this.prisma.cashGroup.create({
      data: {
        owner: {
          connect: { id: userId },
        },
        name: createDto.name,
        description: createDto.description,
        cycleYear: createDto.cycleYear,
        quotaValue: new Decimal(createDto.quotaValue),
        dueDay: createDto.dueDay,
        maxQuotasPerMember: createDto.maxQuotasPerMember ?? 2,
        defaultLoanInterestRate: new Decimal(createDto.defaultLoanInterestRate ?? 30.00),
        receivingPixEnabledForCharges:
          createDto.receivingPixEnabledForCharges ?? false,
        receivingPixEnabledForLoans:
          createDto.receivingPixEnabledForLoans ?? false,
        receivingPixKey: createDto.receivingPixKey?.trim() || null,
        receivingPixKeyHolder:
          createDto.receivingPixKeyHolder?.trim() || null,
        receivingPixReceiverCity:
          createDto.receivingPixReceiverCity?.trim() || null,
        receivingPixDescriptionPrefix:
          createDto.receivingPixDescriptionPrefix?.trim() || null,
        receivingInstructions: createDto.receivingInstructions,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.cashGroup.findMany({
      where: {
        ownerUserId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const cashGroup = await this.prisma.cashGroup.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!cashGroup) {
      throw new NotFoundException('Caixinha não encontrada');
    }

    if (cashGroup.ownerUserId !== userId) {
      throw new ForbiddenException('Você não tem permissão para acessar esta caixinha');
    }

    return cashGroup;
  }

  async update(id: string, userId: string, updateDto: UpdateCashGroupDto) {
    const current = await this.findOne(id, userId);

    const data = this.buildCashGroupUpdateData(updateDto);
    const mergedSettings = {
      receivingPixEnabledForCharges:
        data.receivingPixEnabledForCharges ??
        current.receivingPixEnabledForCharges,
      receivingPixEnabledForLoans:
        data.receivingPixEnabledForLoans ?? current.receivingPixEnabledForLoans,
      receivingPixKey: data.receivingPixKey ?? current.receivingPixKey,
      receivingPixKeyHolder:
        data.receivingPixKeyHolder ?? current.receivingPixKeyHolder,
    };

    this.validateReceivingSettings(mergedSettings, updateDto);

    return this.prisma.cashGroup.update({
      where: { id },
      data,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getReceivingSettings(groupId: string, userId: string) {
    const cashGroup = await this.findOne(groupId, userId);

    return {
      id: cashGroup.id,
      receivingPixEnabledForCharges: cashGroup.receivingPixEnabledForCharges,
      receivingPixEnabledForLoans: cashGroup.receivingPixEnabledForLoans,
      receivingPixKey: cashGroup.receivingPixKey,
      receivingPixKeyHolder: cashGroup.receivingPixKeyHolder,
      receivingPixReceiverCity: cashGroup.receivingPixReceiverCity,
      receivingPixDescriptionPrefix: cashGroup.receivingPixDescriptionPrefix,
      receivingInstructions: cashGroup.receivingInstructions,
    };
  }

  async updateReceivingSettings(
    groupId: string,
    userId: string,
    updateDto: UpdateCashGroupDto,
  ) {
    return this.update(groupId, userId, updateDto);
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.cashGroup.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  async restore(id: string, userId: string) {
    const cashGroup = await this.prisma.cashGroup.findUnique({
      where: { id },
    });

    if (!cashGroup) {
      throw new NotFoundException('Caixinha não encontrada');
    }

    if (cashGroup.ownerUserId !== userId) {
      throw new ForbiddenException('Você não tem permissão para restaurar esta caixinha');
    }

    if (cashGroup.status !== 'ARCHIVED') {
      throw new ForbiddenException('Apenas caixinhas arquivadas podem ser restauradas');
    }

    return this.prisma.cashGroup.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async getPaymentRequests(groupId: string, userId: string) {
    const cashGroup = await this.findOne(groupId, userId);

    const requests = await this.prisma.paymentRequest.findMany({
      where: { cashGroupId: groupId },
      include: {
        member: { select: { id: true, name: true } },
        monthlyCharge: {
          select: { id: true, referenceMonth: true, referenceYear: true, amountDue: true, amountPaid: true },
        },
        loan: {
          select: { id: true, principalAmount: true, totalDue: true, amountPaid: true },
        },
        reviewedBy: { select: { id: true, name: true } },
        pixPayload: true,
        analysis: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((request) =>
      this.attachReviewSummary(request, cashGroup),
    );
  }

  async getPaymentRequestAnalysis(
    groupId: string,
    requestId: string,
    userId: string,
  ) {
    await this.findOne(groupId, userId);

    const request = await this.prisma.paymentRequest.findFirst({
      where: { id: requestId, cashGroupId: groupId },
      select: { id: true },
    });

    if (!request) {
      throw new NotFoundException('Solicitação não encontrada.');
    }

    return this.paymentRequestAnalysisService.getAnalysisOrThrow(request.id);
  }

  async analyzePaymentRequest(
    groupId: string,
    requestId: string,
    userId: string,
  ) {
    await this.findOne(groupId, userId);

    const request = await this.prisma.paymentRequest.findFirst({
      where: { id: requestId, cashGroupId: groupId },
      select: {
        id: true,
        status: true,
        receiptDataUrl: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Solicitação não encontrada.');
    }

    if (!request.receiptDataUrl) {
      throw new BadRequestException(
        'O comprovante precisa existir antes da análise.',
      );
    }

    if (request.status === 'CONFIRMED' || request.status === 'REJECTED') {
      throw new BadRequestException(
        `Solicitações com status "${request.status}" não podem ser reprocessadas nesta fase.`,
      );
    }

    return this.paymentRequestAnalysisService.analyzePaymentRequest(request.id);
  }

  async confirmPaymentRequest(
    groupId: string,
    requestId: string,
    userId: string,
    reviewNotes?: string,
  ) {
    await this.findOne(groupId, userId);

    const req = await this.prisma.paymentRequest.findFirst({
      where: { id: requestId, cashGroupId: groupId },
    });

    if (!req) {
      throw new NotFoundException('Solicitação não encontrada.');
    }

    if (req.status === 'CONFIRMED' || req.status === 'REJECTED' || req.status === 'CANCELED') {
      throw new BadRequestException(
        `Esta solicitação já foi encerrada com status "${req.status}".`,
      );
    }

    if (req.method === 'PIX' && !req.receiptDataUrl) {
      throw new BadRequestException(
        'O comprovante Pix ainda não foi enviado pelo cotista.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentRequest.update({
        where: { id: requestId },
        data: {
          status: 'CONFIRMED',
          reviewedByUserId: userId,
          reviewedAt: new Date(),
          reviewNotes: reviewNotes ?? null,
        },
      });

      if (req.type === 'MONTHLY_CHARGE' && req.monthlyChargeId) {
        const charge = await tx.monthlyCharge.findUnique({
          where: { id: req.monthlyChargeId },
        });
        if (charge) {
          const newAmountPaid =
            parseFloat(charge.amountPaid.toString()) + parseFloat(req.amountDeclared.toString());
          const amountDue = parseFloat(charge.amountDue.toString());
          const newStatus =
            newAmountPaid >= amountDue ? 'PAID' : 'PARTIAL';

          await tx.chargePayment.create({
            data: {
              monthlyChargeId: req.monthlyChargeId,
              cashGroupId: req.cashGroupId,
              memberId: req.memberId,
              amountPaid: req.amountDeclared,
              paidAt: new Date(),
              paymentMethod: req.method === 'PIX' ? 'PIX' : 'PIX',
            },
          });

          await tx.monthlyCharge.update({
            where: { id: req.monthlyChargeId },
            data: {
              amountPaid: newAmountPaid,
              status: newStatus,
              paidAt: newStatus === 'PAID' ? new Date() : undefined,
            },
          });
        }
      }

      if (req.type === 'LOAN' && req.loanId) {
        const loan = await tx.loan.findUnique({ where: { id: req.loanId } });
        if (loan) {
          const newAmountPaid =
            parseFloat(loan.amountPaid.toString()) + parseFloat(req.amountDeclared.toString());
          const totalDue = parseFloat(loan.totalDue.toString());
          const newStatus = newAmountPaid >= totalDue ? 'PAID' : 'PARTIAL';

          await tx.loanPayment.create({
            data: {
              loanId: req.loanId,
              amount: req.amountDeclared,
              method: req.method === 'PIX' ? 'PIX' : req.method === 'CASH' ? 'CASH' : 'OTHER',
              status: 'CONFIRMED',
              paidAt: new Date(),
              notes: reviewNotes ?? null,
            },
          });

          await tx.loan.update({
            where: { id: req.loanId },
            data: {
              amountPaid: newAmountPaid,
              status: newStatus,
              paidAt: newStatus === 'PAID' ? new Date() : undefined,
            },
          });
        }
      }
    });

    return { message: 'Pagamento confirmado com sucesso.' };
  }

  async rejectPaymentRequest(
    groupId: string,
    requestId: string,
    userId: string,
    reviewNotes?: string,
  ) {
    await this.findOne(groupId, userId);

    const req = await this.prisma.paymentRequest.findFirst({
      where: { id: requestId, cashGroupId: groupId },
    });

    if (!req) {
      throw new NotFoundException('Solicitação não encontrada.');
    }

    if (req.status === 'CONFIRMED' || req.status === 'REJECTED' || req.status === 'CANCELED') {
      throw new BadRequestException(
        `Esta solicitação já foi encerrada com status "${req.status}".`,
      );
    }

    await this.prisma.paymentRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        reviewedByUserId: userId,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes ?? null,
      },
    });

    return { message: 'Solicitação rejeitada.' };
  }

  private buildCashGroupUpdateData(updateDto: UpdateCashGroupDto) {
    const data: Record<string, any> = {};

    if (updateDto.name !== undefined) data.name = updateDto.name;
    if (updateDto.description !== undefined) data.description = updateDto.description;
    if (updateDto.quotaValue !== undefined) data.quotaValue = new Decimal(updateDto.quotaValue);
    if (updateDto.dueDay !== undefined) data.dueDay = updateDto.dueDay;
    if (updateDto.maxQuotasPerMember !== undefined) data.maxQuotasPerMember = updateDto.maxQuotasPerMember;
    if (updateDto.defaultLoanInterestRate !== undefined) data.defaultLoanInterestRate = new Decimal(updateDto.defaultLoanInterestRate);
    if (updateDto.status !== undefined) data.status = updateDto.status;
    if (updateDto.receivingPixEnabledForCharges !== undefined) data.receivingPixEnabledForCharges = updateDto.receivingPixEnabledForCharges;
    if (updateDto.receivingPixEnabledForLoans !== undefined) data.receivingPixEnabledForLoans = updateDto.receivingPixEnabledForLoans;
    if (updateDto.receivingPixKey !== undefined) data.receivingPixKey = updateDto.receivingPixKey?.trim() || null;
    if (updateDto.receivingPixKeyHolder !== undefined) data.receivingPixKeyHolder = updateDto.receivingPixKeyHolder?.trim() || null;
    if (updateDto.receivingPixReceiverCity !== undefined) data.receivingPixReceiverCity = updateDto.receivingPixReceiverCity?.trim() || null;
    if (updateDto.receivingPixDescriptionPrefix !== undefined) data.receivingPixDescriptionPrefix = updateDto.receivingPixDescriptionPrefix?.trim() || null;
    if (updateDto.receivingInstructions !== undefined) data.receivingInstructions = updateDto.receivingInstructions;

    return data;
  }

  private validateReceivingSettings(
    data: Record<string, any>,
    updateDto: UpdateCashGroupDto,
  ) {
    const pixEnabled =
      data.receivingPixEnabledForCharges === true ||
      data.receivingPixEnabledForLoans === true;

    if (!pixEnabled) {
      return;
    }

    const pixKey = data.receivingPixKey ?? updateDto.receivingPixKey;
    const receiverName =
      data.receivingPixKeyHolder ?? updateDto.receivingPixKeyHolder;

    if (!pixKey) {
      throw new BadRequestException(
        'Ao habilitar Pix, informe a chave Pix da caixinha.',
      );
    }

    if (!receiverName) {
      throw new BadRequestException(
        'Ao habilitar Pix, informe o nome do recebedor.',
      );
    }
  }

  private attachReviewSummary(request: any, cashGroup: any) {
    const expectedAmount =
      request.type === 'MONTHLY_CHARGE' && request.monthlyCharge
        ? Number(request.monthlyCharge.amountDue) -
          Number(request.monthlyCharge.amountPaid)
        : request.type === 'LOAN' && request.loan
          ? Number(request.loan.totalDue) - Number(request.loan.amountPaid)
          : null;

    const declaredAmount = Number(request.amountDeclared);
    const pixAmount = request.pixPayload ? Number(request.pixPayload.amount) : null;
    const configuredPixKey = cashGroup.receivingPixKey ?? null;
    const configuredReceiverName = cashGroup.receivingPixKeyHolder ?? null;
    const normalizedConfiguredReceiver = configuredReceiverName
      ? this.normalizeReviewText(configuredReceiverName)
      : null;
    const normalizedPayloadReceiver = request.pixPayload?.receiverName
      ? this.normalizeReviewText(request.pixPayload.receiverName)
      : null;

    const amountMatchesExpected =
      expectedAmount == null
        ? null
        : Math.abs(declaredAmount - expectedAmount) < 0.01;
    const pixMatchesDeclared =
      pixAmount == null ? null : Math.abs(pixAmount - declaredAmount) < 0.01;
    const pixKeyMatchesConfigured =
      request.pixPayload?.pixKey && configuredPixKey
        ? request.pixPayload.pixKey === configuredPixKey
        : null;
    const receiverMatchesConfigured =
      normalizedPayloadReceiver && normalizedConfiguredReceiver
        ? normalizedPayloadReceiver === normalizedConfiguredReceiver
        : null;

    const warnings: string[] = [];

    if (amountMatchesExpected === false && expectedAmount != null) {
      warnings.push('O valor informado não bate com o valor esperado para esta cobrança.');
    }

    if (pixMatchesDeclared === false) {
      warnings.push('O valor gerado no Pix não bate com o valor informado pelo cotista.');
    }

    if (pixKeyMatchesConfigured === false) {
      warnings.push('A chave Pix usada no pagamento está diferente da chave cadastrada na caixinha.');
    }

    if (receiverMatchesConfigured === false) {
      warnings.push('O nome do recebedor está diferente do cadastro da caixinha.');
    }

    const recommendation =
      warnings.length === 0 && request.method === 'PIX'
        ? 'Os principais dados do pagamento estão consistentes. Ainda assim, a confirmação final continua com o gestor.'
        : warnings.length > 0
          ? 'Foram encontrados pontos de atenção. Vale revisar o comprovante com mais cuidado antes de confirmar.'
          : 'Ainda não há informações suficientes para fazer uma pré-conferência automática.';

    return {
      ...request,
      analysis: request.analysis
        ? this.paymentRequestAnalysisService.serializeAnalysisRecord(
            request.analysis,
          )
        : null,
      reviewSummary: {
        expectedAmount:
          expectedAmount == null ? null : expectedAmount.toFixed(2),
        declaredAmount: declaredAmount.toFixed(2),
        pixAmount: pixAmount == null ? null : pixAmount.toFixed(2),
        configuredPixKey,
        configuredReceiverName,
        amountMatchesExpected,
        pixMatchesDeclared,
        pixKeyMatchesConfigured,
        receiverMatchesConfigured,
        warnings,
        recommendation,
      },
    };
  }

  private normalizeReviewText(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }
}
