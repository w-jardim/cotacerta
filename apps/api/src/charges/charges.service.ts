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

@Injectable()
export class ChargesService {
  constructor(private readonly prisma: PrismaService) {}

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

    const dueDate = new Date(referenceYear, referenceMonth - 1, cashGroup.dueDay);
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
    referenceMonth: number,
    referenceYear: number,
  ) {
    await this.assertOwnedCashGroup(userId, cashGroupId);

    const charges = await this.prisma.monthlyCharge.findMany({
      where: {
        cashGroupId,
        referenceMonth,
        referenceYear,
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
        createdAt: 'desc',
      },
    });

    const summary = {
      totalDue: charges.reduce((sum, charge) => sum + Number(charge.amountDue), 0),
      totalPaid: charges.reduce((sum, charge) => sum + Number(charge.amountPaid), 0),
      totalPending: charges
        .filter((charge) => ['PENDING', 'OVERDUE', 'PARTIAL'].includes(charge.status))
        .reduce(
          (sum, charge) => sum + (Number(charge.amountDue) - Number(charge.amountPaid)),
          0,
        ),
      totalCharges: charges.length,
      pendingCount: charges.filter((charge) =>
        ['PENDING', 'OVERDUE', 'PARTIAL'].includes(charge.status),
      ).length,
      paidCount: charges.filter((charge) => charge.status === 'PAID').length,
      canceledCount: charges.filter((charge) => charge.status === 'CANCELED').length,
    };

    return {
      charges,
      summary,
    };
  }

  async findDebtors(
    userId: string,
    cashGroupId: string,
    referenceMonth: number,
    referenceYear: number,
  ) {
    await this.assertOwnedCashGroup(userId, cashGroupId);

    return this.prisma.monthlyCharge.findMany({
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
  }

  async findOne(userId: string, cashGroupId: string, chargeId: string) {
    const charge = await this.assertOwnedCharge(userId, cashGroupId, chargeId);

    return this.prisma.monthlyCharge.findUnique({
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
  }

  async registerPayment(
    userId: string,
    cashGroupId: string,
    chargeId: string,
    dto: RegisterPaymentDto,
  ) {
    const charge = await this.assertOwnedCharge(userId, cashGroupId, chargeId);

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
              },
            }
          : undefined,
      },
      include: {
        receipt: true,
      },
    });

    await this.refreshChargeStatus(charge.id);

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
    const charge = await this.assertOwnedCharge(userId, cashGroupId, chargeId);
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
    const charge = await this.assertOwnedCharge(userId, cashGroupId, chargeId);

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
    return this.prisma.monthlyCharge.findMany({
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

  private async refreshChargeStatus(chargeId: string) {
    const charge = await this.prisma.monthlyCharge.findUnique({
      where: { id: chargeId },
      include: {
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

    const totalPaid = charge.payments.reduce(
      (sum, payment) => sum + Number(payment.amountPaid),
      0,
    );
    const latestPaidAt = charge.payments.length
      ? charge.payments[charge.payments.length - 1].paidAt
      : null;

    let status: 'PENDING' | 'PARTIAL' | 'PAID';
    if (totalPaid >= Number(charge.amountDue)) {
      status = 'PAID';
    } else if (totalPaid > 0) {
      status = 'PARTIAL';
    } else {
      status = 'PENDING';
    }

    await this.prisma.monthlyCharge.update({
      where: { id: chargeId },
      data: {
        amountPaid: new Prisma.Decimal(totalPaid),
        paidAt: latestPaidAt,
        status,
      },
    });
  }
}
