import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentMethod, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateChargesDto } from './dto/generate-charges.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { RegisterPaymentDto, PaymentReceiptDto } from './dto/register-payment.dto';
import { ReceiptFingerprintService } from '../common/receipt/receipt-fingerprint.service';

@Injectable()
export class ChargesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly receiptFingerprintService: ReceiptFingerprintService,
  ) {}

  async generateCharges(
    userId: string,
    cashGroupId: string,
    dto: GenerateChargesDto,
  ) {
    const { referenceMonth, referenceYear } = dto;
    const cashGroup = await this.assertOwnedCashGroup(userId, cashGroupId);

    const activeMembers = await this.prisma.member.findMany({
      where: {
        cashGroupId,
        status: 'ACTIVE',
      },
    });

    if (activeMembers.length === 0) {
      throw new BadRequestException(
        'Não há cotistas ativos nesta caixinha para gerar cobranças',
      );
    }

    const dueDate = new Date(
      Date.UTC(referenceYear, referenceMonth - 1, cashGroup.dueDay, 12, 0, 0),
    );
    const createdCharges: any[] = [];
    const existingCharges: any[] = [];

    for (const member of activeMembers) {
      const existing = await this.prisma.monthlyCharge.findUnique({
        where: {
          cashGroupId_memberId_referenceMonth_referenceYear: {
            cashGroupId,
            memberId: member.id,
            referenceMonth,
            referenceYear,
          },
        },
      });

      if (existing) {
        existingCharges.push(existing);
        continue;
      }

      const amountDue = Number(cashGroup.quotaValue) * member.quotasCount;
      const charge = await this.prisma.monthlyCharge.create({
        data: {
          cashGroupId,
          memberId: member.id,
          referenceMonth,
          referenceYear,
          quotasCount: member.quotasCount,
          baseAmount: new Prisma.Decimal(amountDue),
          amountDue: new Prisma.Decimal(amountDue),
          dueDate,
          status: 'PENDING',
        },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              phone: true,
              pixKey: true,
            },
          },
        },
      });

      createdCharges.push(charge);
    }

    return {
      created: createdCharges,
      existing: existingCharges,
      summary: {
        createdCount: createdCharges.length,
        existingCount: existingCharges.length,
        totalCount: activeMembers.length,
      },
    };
  }

  async findAll(
    userId: string,
    cashGroupId: string,
    referenceMonth?: number,
    referenceYear?: number,
  ) {
    const cashGroup = await this.assertOwnedCashGroup(userId, cashGroupId);

    const charges = await this.prisma.monthlyCharge.findMany({
      where: {
        cashGroupId,
        ...(referenceMonth ? { referenceMonth } : {}),
        ...(referenceYear ? { referenceYear } : {}),
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            pixKey: true,
          },
        },
      },
      orderBy: [
        { referenceYear: 'desc' },
        { referenceMonth: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    const syncedCharges = await Promise.all(
      charges.map((charge) => this.synchronizeChargeFinancials(charge, cashGroup)),
    );

    const summary = {
      totalDue: syncedCharges.reduce(
        (sum, charge) => sum + Number(charge.amountDue),
        0,
      ),
      totalPaid: syncedCharges.reduce(
        (sum, charge) => sum + Number(charge.amountPaid),
        0,
      ),
      totalPending: syncedCharges
        .filter((charge) => ['PENDING', 'OVERDUE', 'PARTIAL'].includes(charge.status))
        .reduce(
          (sum, charge) => sum + (Number(charge.amountDue) - Number(charge.amountPaid)),
          0,
        ),
      totalCharges: syncedCharges.length,
      pendingCount: syncedCharges.filter((charge) =>
        ['PENDING', 'OVERDUE', 'PARTIAL'].includes(charge.status),
      ).length,
      paidCount: syncedCharges.filter((charge) => charge.status === 'PAID').length,
      canceledCount: syncedCharges.filter((charge) => charge.status === 'CANCELED').length,
    };

    return {
      charges: syncedCharges,
      summary,
    };
  }

  async findDebtors(
    userId: string,
    cashGroupId: string,
    referenceMonth: number,
    referenceYear: number,
  ) {
    const cashGroup = await this.assertOwnedCashGroup(userId, cashGroupId);

    const charges = await this.prisma.monthlyCharge.findMany({
      where: {
        cashGroupId,
        referenceMonth,
        referenceYear,
        status: {
          in: ['PENDING', 'OVERDUE', 'PARTIAL'],
        },
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            pixKey: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    return Promise.all(
      charges.map((charge) => this.synchronizeChargeFinancials(charge, cashGroup)),
    );
  }

  async findOne(userId: string, cashGroupId: string, chargeId: string) {
    const charge = await this.assertOwnedCharge(userId, cashGroupId, chargeId);
    await this.synchronizeChargeFinancials(charge, charge.cashGroup);

    const freshCharge = await this.prisma.monthlyCharge.findUnique({
      where: { id: charge.id },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            pixKey: true,
          },
        },
        payments: {
          include: {
            receipt: true,
          },
          orderBy: {
            paidAt: 'desc',
          },
        },
      },
    });

    if (!freshCharge) {
      throw new NotFoundException('Cobrança não encontrada');
    }

    return this.attachChargeFinancialMeta(freshCharge, charge.cashGroup);
  }

  async registerPayment(
    userId: string,
    cashGroupId: string,
    chargeId: string,
    dto: RegisterPaymentDto,
  ) {
    const rawCharge = await this.assertOwnedCharge(userId, cashGroupId, chargeId);
    const charge = await this.synchronizeChargeFinancials(rawCharge, rawCharge.cashGroup);

    if (charge.status === 'CANCELED') {
      throw new ConflictException('Não é possível registrar pagamento em cobrança cancelada');
    }

    const amountPaid = Number(dto.amountPaid);
    const remainingBeforePayment = Number(charge.amountDue) - Number(charge.amountPaid);

    if (amountPaid <= 0) {
      throw new BadRequestException('Valor pago deve ser maior que zero');
    }

    if (remainingBeforePayment <= 0) {
      throw new ConflictException('Esta cobrança já está totalmente paga');
    }

    if (amountPaid > remainingBeforePayment) {
      throw new BadRequestException(
        `Valor pago não pode exceder o saldo pendente de R$ ${remainingBeforePayment.toFixed(2)}`,
      );
    }

    this.validateReceipt(dto.receipt);
    const receiptHash = dto.receipt
      ? await this.receiptFingerprintService.assertReceiptIsUnique(
          dto.receipt.dataUrl,
          {
            manualContext: true,
          },
        )
      : null;

    const payment = await this.prisma.chargePayment.create({
      data: {
        monthlyChargeId: charge.id,
        cashGroupId: charge.cashGroupId,
        memberId: charge.memberId,
        amountPaid: new Prisma.Decimal(amountPaid),
        paidAt: new Date(dto.paidAt),
        paymentMethod: dto.paymentMethod,
        receipt: dto.receipt
          ? {
              create: {
                fileName: dto.receipt.fileName,
                mimeType: dto.receipt.mimeType,
                sizeBytes: dto.receipt.sizeBytes,
                dataUrl: dto.receipt.dataUrl,
                receiptHash,
              },
            }
          : undefined,
      },
      include: {
        receipt: true,
      },
    });

    await this.refreshChargeStatus(charge.id, new Date(dto.paidAt));

    return this.prisma.chargePayment.findUnique({
      where: { id: payment.id },
      include: {
        receipt: true,
      },
    });
  }

  async markAsPaid(
    userId: string,
    cashGroupId: string,
    chargeId: string,
    dto: MarkPaidDto,
  ) {
    const rawCharge = await this.assertOwnedCharge(userId, cashGroupId, chargeId);
    const charge = await this.synchronizeChargeFinancials(rawCharge, rawCharge.cashGroup);
    const remainingAmount = Number(charge.amountDue) - Number(charge.amountPaid);
    const amountPaid = dto.amountPaid ?? remainingAmount;

    if (amountPaid <= 0) {
      throw new BadRequestException('Valor pago deve ser maior que zero');
    }

    return this.registerPayment(userId, cashGroupId, chargeId, {
      amountPaid,
      paidAt: new Date().toISOString(),
      paymentMethod: PaymentMethod.PIX,
    });
  }

  async cancel(userId: string, cashGroupId: string, chargeId: string) {
    const rawCharge = await this.assertOwnedCharge(userId, cashGroupId, chargeId);
    const charge = await this.synchronizeChargeFinancials(rawCharge, rawCharge.cashGroup);

    const paymentsCount = await this.prisma.chargePayment.count({
      where: { monthlyChargeId: charge.id },
    });

    if (paymentsCount > 0) {
      throw new ConflictException(
        'Não é possível cancelar uma cobrança que já possui pagamentos registrados',
      );
    }

    return this.prisma.monthlyCharge.update({
      where: { id: chargeId },
      data: {
        status: 'CANCELED',
        amountDue: charge.amountDue,
        amountPaid: new Prisma.Decimal(0),
        paidAt: null,
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            pixKey: true,
          },
        },
      },
    });
  }

  async getAllUserCharges(userId: string) {
    const charges = await this.prisma.monthlyCharge.findMany({
      where: {
        cashGroup: {
          ownerUserId: userId,
        },
        status: {
          in: ['PENDING', 'OVERDUE', 'PARTIAL'],
        },
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            pixKey: true,
          },
        },
        cashGroup: {
          select: {
            id: true,
            name: true,
            cycleYear: true,
            defaultLoanInterestRate: true,
          },
        },
      },
      orderBy: [
        {
          dueDate: 'asc',
        },
        {
          cashGroup: {
            name: 'asc',
          },
        },
      ],
    });

    const syncedCharges = await Promise.all(
      charges.map((charge) => this.synchronizeChargeFinancials(charge, charge.cashGroup)),
    );

    return syncedCharges;
  }

  private async assertOwnedCashGroup(userId: string, cashGroupId: string) {
    const cashGroup = await this.prisma.cashGroup.findUnique({
      where: { id: cashGroupId },
    });

    if (!cashGroup) {
      throw new NotFoundException('Caixinha não encontrada');
    }

    if (cashGroup.ownerUserId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar esta caixinha',
      );
    }

    return cashGroup;
  }

  private async assertOwnedCharge(userId: string, cashGroupId: string, chargeId: string) {
    const charge = await this.prisma.monthlyCharge.findUnique({
      where: { id: chargeId },
      include: {
        cashGroup: true,
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            pixKey: true,
          },
        },
      },
    });

    if (!charge) {
      throw new NotFoundException('Cobrança não encontrada');
    }

    if (charge.cashGroupId !== cashGroupId) {
      throw new ForbiddenException(
        'Esta cobrança não pertence à caixinha especificada',
      );
    }

    if (charge.cashGroup.ownerUserId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar cobranças desta caixinha',
      );
    }

    return charge;
  }

  private validateReceipt(receipt?: PaymentReceiptDto) {
    if (!receipt) {
      return;
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

    if (!allowedMimeTypes.includes(receipt.mimeType)) {
      throw new BadRequestException(
        'Comprovante deve ser uma imagem JPG, PNG, WEBP ou um arquivo PDF',
      );
    }

    if (!receipt.dataUrl.startsWith(`data:${receipt.mimeType};base64,`)) {
      throw new BadRequestException('Formato do comprovante inválido');
    }
  }

  private async refreshChargeStatus(chargeId: string, asOfDate = new Date()) {
    const charge = await this.prisma.monthlyCharge.findUnique({
      where: { id: chargeId },
      include: {
        cashGroup: true,
        payments: {
          orderBy: {
            paidAt: 'asc',
          },
        },
      },
    });

    if (!charge) {
      throw new NotFoundException('Cobrança não encontrada');
    }

    const snapshot = this.getChargeFinancialSnapshot(
      charge,
      charge.cashGroup,
      asOfDate,
      true,
    );

    const totalPaid = charge.payments.reduce(
      (sum, payment) => sum + Number(payment.amountPaid),
      0,
    );
    const latestPaidAt = charge.payments.length
      ? charge.payments[charge.payments.length - 1].paidAt
      : null;

    await this.prisma.monthlyCharge.update({
      where: { id: chargeId },
      data: {
        amountDue: new Prisma.Decimal(snapshot.amountDue),
        amountPaid: new Prisma.Decimal(totalPaid),
        paidAt: latestPaidAt,
        status: snapshot.status,
      },
    });
  }

  private async synchronizeChargeFinancials<T extends {
    id: string;
    dueDate: Date;
    baseAmount: Prisma.Decimal | number;
    amountDue: Prisma.Decimal | number;
    amountPaid: Prisma.Decimal | number;
    status: string;
    cashGroupId: string;
  }>(
    charge: T,
    cashGroup: { defaultLoanInterestRate: Prisma.Decimal | number },
  ): Promise<T> {
    if (charge.status === 'PAID' || charge.status === 'CANCELED') {
      return this.attachChargeFinancialMeta(charge, cashGroup);
    }

    const snapshot = this.getChargeFinancialSnapshot(charge, cashGroup);
    const shouldPersist =
      Number(charge.amountDue) !== snapshot.amountDue || charge.status !== snapshot.status;

    if (shouldPersist) {
      await this.prisma.monthlyCharge.update({
        where: { id: charge.id },
        data: {
          amountDue: new Prisma.Decimal(snapshot.amountDue),
          status: snapshot.status,
        },
      });
    }

    return this.attachChargeFinancialMeta(
      {
        ...charge,
        amountDue: new Prisma.Decimal(snapshot.amountDue),
        status: snapshot.status,
      },
      cashGroup,
    );
  }

  private attachChargeFinancialMeta<T extends {
    amountDue: Prisma.Decimal | number;
    baseAmount: Prisma.Decimal | number;
    dueDate: Date;
    amountPaid: Prisma.Decimal | number;
    status: string;
  }>(charge: T, cashGroup: { defaultLoanInterestRate: Prisma.Decimal | number }) {
    const snapshot = this.getChargeFinancialSnapshot(charge, cashGroup);

    return {
      ...charge,
      amountDue: new Prisma.Decimal(snapshot.amountDue),
      overdueMonths: snapshot.overdueMonths,
      lateFeeAmount: new Prisma.Decimal(snapshot.lateFeeAmount),
      monthlyLateFeeAmount: new Prisma.Decimal(snapshot.monthlyLateFeeAmount),
      appliedInterestRate: new Prisma.Decimal(snapshot.appliedInterestRate),
    };
  }

  private getChargeFinancialSnapshot(
    charge: {
      dueDate: Date;
      baseAmount: Prisma.Decimal | number;
      amountDue: Prisma.Decimal | number;
      amountPaid: Prisma.Decimal | number;
      status: string;
    },
    cashGroup: { defaultLoanInterestRate: Prisma.Decimal | number },
    asOfDate = new Date(),
    settleAtAsOfDate = false,
  ) {
    const baseAmount = Number(charge.baseAmount);
    const amountPaid = Number(charge.amountPaid);
    const appliedInterestRate = Number(cashGroup.defaultLoanInterestRate);
    const overdueMonths = this.getOverdueMonths(charge.dueDate, asOfDate);
    const monthlyLateFeeAmount = Number(
      (baseAmount * (appliedInterestRate / 100)).toFixed(2),
    );
    const lateFeeAmount = Number((monthlyLateFeeAmount * overdueMonths).toFixed(2));
    const amountDue = Number((baseAmount + lateFeeAmount).toFixed(2));

    let status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';

    if (settleAtAsOfDate && amountPaid >= amountDue) {
      status = 'PAID';
    } else if (amountPaid >= Number(charge.amountDue) && charge.status === 'PAID') {
      status = 'PAID';
    } else if (amountPaid > 0) {
      status = 'PARTIAL';
    } else if (overdueMonths > 0) {
      status = 'OVERDUE';
    } else {
      status = 'PENDING';
    }

    return {
      amountDue,
      overdueMonths,
      lateFeeAmount,
      monthlyLateFeeAmount,
      appliedInterestRate,
      status,
    };
  }

  private isPastDue(dueDate: Date) {
    const dueUtc = Date.UTC(
      dueDate.getUTCFullYear(),
      dueDate.getUTCMonth(),
      dueDate.getUTCDate(),
    );
    const now = new Date();
    const todayUtc = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );

    return todayUtc > dueUtc;
  }

  private getOverdueMonths(dueDate: Date, asOfDate: Date) {
    const dueUtc = Date.UTC(
      dueDate.getUTCFullYear(),
      dueDate.getUTCMonth(),
      dueDate.getUTCDate(),
    );
    const asOfUtc = Date.UTC(
      asOfDate.getUTCFullYear(),
      asOfDate.getUTCMonth(),
      asOfDate.getUTCDate(),
    );

    if (asOfUtc <= dueUtc) {
      return 0;
    }

    return (
      (asOfDate.getUTCFullYear() - dueDate.getUTCFullYear()) * 12 +
      (asOfDate.getUTCMonth() - dueDate.getUTCMonth()) +
      1
    );
  }
}
