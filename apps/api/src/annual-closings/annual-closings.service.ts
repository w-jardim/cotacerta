import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface MemberResult {
  memberId: string;
  memberName: string;
  quotaQuantity: number;
  grossAmount: number;
  quotaDebtAmount: number;
  loanDebtAmount: number;
  totalDebtAmount: number;
  netAmount: number;
  remainingDebtAmount: number;
}

export interface ClosingCalculation {
  totalQuotaReceived: number;
  totalLoanReceived: number;
  totalAvailable: number;
  totalQuotaPending: number;
  totalLoanPending: number;
  totalPending: number;
  totalQuotas: number;
  valuePerQuota: number;
  memberResults: MemberResult[];
}

@Injectable()
export class AnnualClosingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertOwnership(userId: string, groupId: string) {
    const group = await this.prisma.cashGroup.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Caixinha não encontrada');
    if (group.ownerUserId !== userId)
      throw new ForbiddenException('Acesso negado a esta caixinha');
    return group;
  }

  private async calculate(
    groupId: string,
    cycleYear: number,
  ): Promise<ClosingCalculation> {
    const members = await this.prisma.member.findMany({
      where: { cashGroupId: groupId, status: 'ACTIVE' },
    });

    if (members.length === 0) {
      throw new BadRequestException(
        'A caixinha não possui cotistas ativos para calcular o fechamento',
      );
    }

    const totalQuotas = members.reduce((sum, m) => sum + m.quotasCount, 0);
    if (totalQuotas === 0) {
      throw new BadRequestException(
        'Total de cotas é zero — não é possível calcular o rateio',
      );
    }

    const memberIds = members.map((m) => m.id);

    const [charges, loans] = await Promise.all([
      this.prisma.monthlyCharge.findMany({
        where: {
          cashGroupId: groupId,
          memberId: { in: memberIds },
          referenceYear: cycleYear,
          status: { not: 'CANCELED' },
        },
      }),
      this.prisma.loan.findMany({
        where: {
          cashGroupId: groupId,
          memberId: { in: memberIds },
          status: { not: 'CANCELED' },
        },
      }),
    ]);

    // Aggregate totals
    let totalQuotaReceived = 0;
    let totalQuotaPending = 0;
    const quotaReceivedByMember = new Map<string, number>();
    const quotaPendingByMember = new Map<string, number>();

    for (const charge of charges) {
      const paid = Number(charge.amountPaid);
      const due = Number(charge.amountDue);
      totalQuotaReceived += paid;
      quotaReceivedByMember.set(
        charge.memberId,
        (quotaReceivedByMember.get(charge.memberId) ?? 0) + paid,
      );
      if (['PENDING', 'OVERDUE', 'PARTIAL'].includes(charge.status)) {
        const pending = due - paid;
        if (pending > 0) {
          totalQuotaPending += pending;
          quotaPendingByMember.set(
            charge.memberId,
            (quotaPendingByMember.get(charge.memberId) ?? 0) + pending,
          );
        }
      }
    }

    let totalLoanReceived = 0;
    let totalLoanPending = 0;
    const loanPendingByMember = new Map<string, number>();

    for (const loan of loans) {
      const paid = Number(loan.amountPaid);
      const due = Number(loan.totalDue);
      totalLoanReceived += paid;
      if (['OPEN', 'PARTIAL'].includes(loan.status)) {
        const pending = due - paid;
        if (pending > 0) {
          totalLoanPending += pending;
          loanPendingByMember.set(
            loan.memberId,
            (loanPendingByMember.get(loan.memberId) ?? 0) + pending,
          );
        }
      }
    }

    const totalAvailable = totalQuotaReceived + totalLoanReceived;
    const totalPending = totalQuotaPending + totalLoanPending;
    const valuePerQuota = totalQuotas > 0 ? totalAvailable / totalQuotas : 0;

    const memberResults: MemberResult[] = members.map((m) => {
      const quotaQty = m.quotasCount;
      const gross = valuePerQuota * quotaQty;
      const quotaDebt = quotaPendingByMember.get(m.id) ?? 0;
      const loanDebt = loanPendingByMember.get(m.id) ?? 0;
      const totalDebt = quotaDebt + loanDebt;
      const net = Math.max(0, gross - totalDebt);
      const remaining = Math.max(0, totalDebt - gross);

      return {
        memberId: m.id,
        memberName: m.name,
        quotaQuantity: quotaQty,
        grossAmount: Math.round(gross * 100) / 100,
        quotaDebtAmount: Math.round(quotaDebt * 100) / 100,
        loanDebtAmount: Math.round(loanDebt * 100) / 100,
        totalDebtAmount: Math.round(totalDebt * 100) / 100,
        netAmount: Math.round(net * 100) / 100,
        remainingDebtAmount: Math.round(remaining * 100) / 100,
      };
    });

    return {
      totalQuotaReceived: Math.round(totalQuotaReceived * 100) / 100,
      totalLoanReceived: Math.round(totalLoanReceived * 100) / 100,
      totalAvailable: Math.round(totalAvailable * 100) / 100,
      totalQuotaPending: Math.round(totalQuotaPending * 100) / 100,
      totalLoanPending: Math.round(totalLoanPending * 100) / 100,
      totalPending: Math.round(totalPending * 100) / 100,
      totalQuotas,
      valuePerQuota: Math.round(valuePerQuota * 100) / 100,
      memberResults,
    };
  }

  async simulate(userId: string, groupId: string, cycleYear: number) {
    await this.assertOwnership(userId, groupId);
    const calculation = await this.calculate(groupId, cycleYear);
    return {
      groupId,
      cycleYear,
      status: 'SIMULATED',
      ...calculation,
    };
  }

  async saveSimulation(userId: string, groupId: string, cycleYear: number) {
    await this.assertOwnership(userId, groupId);

    // Check not already confirmed
    const confirmed = await this.prisma.annualClosing.findFirst({
      where: { groupId, cycleYear, status: 'CONFIRMED' },
    });
    if (confirmed) {
      throw new BadRequestException(
        `Já existe um fechamento confirmado para ${cycleYear} nesta caixinha`,
      );
    }

    const calculation = await this.calculate(groupId, cycleYear);

    // Delete existing simulation for this group/year
    await this.prisma.annualClosing.deleteMany({
      where: { groupId, cycleYear, status: 'SIMULATED' },
    });

    const closing = await this.prisma.annualClosing.create({
      data: {
        groupId,
        cycleYear,
        status: 'SIMULATED',
        totalQuotaReceived: calculation.totalQuotaReceived,
        totalLoanReceived: calculation.totalLoanReceived,
        totalAvailable: calculation.totalAvailable,
        totalQuotaPending: calculation.totalQuotaPending,
        totalLoanPending: calculation.totalLoanPending,
        totalPending: calculation.totalPending,
        totalQuotas: calculation.totalQuotas,
        valuePerQuota: calculation.valuePerQuota,
        results: {
          create: calculation.memberResults.map((r) => ({
            memberId: r.memberId,
            quotaQuantity: r.quotaQuantity,
            grossAmount: r.grossAmount,
            quotaDebtAmount: r.quotaDebtAmount,
            loanDebtAmount: r.loanDebtAmount,
            totalDebtAmount: r.totalDebtAmount,
            netAmount: r.netAmount,
            remainingDebtAmount: r.remainingDebtAmount,
          })),
        },
      },
      include: {
        results: {
          include: { member: { select: { id: true, name: true } } },
        },
      },
    });

    return closing;
  }

  async list(userId: string, groupId: string) {
    await this.assertOwnership(userId, groupId);
    return this.prisma.annualClosing.findMany({
      where: { groupId },
      orderBy: [{ cycleYear: 'desc' }, { createdAt: 'desc' }],
      include: {
        results: {
          include: { member: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async findOne(userId: string, groupId: string, closingId: string) {
    await this.assertOwnership(userId, groupId);
    const closing = await this.prisma.annualClosing.findUnique({
      where: { id: closingId },
      include: {
        results: {
          include: { member: { select: { id: true, name: true } } },
        },
      },
    });
    if (!closing || closing.groupId !== groupId) {
      throw new NotFoundException('Fechamento não encontrado');
    }
    return closing;
  }

  async confirm(userId: string, groupId: string, closingId: string) {
    await this.assertOwnership(userId, groupId);

    const closing = await this.prisma.annualClosing.findUnique({
      where: { id: closingId },
    });
    if (!closing || closing.groupId !== groupId) {
      throw new NotFoundException('Fechamento não encontrado');
    }
    if (closing.status === 'CONFIRMED') {
      throw new BadRequestException('Este fechamento já foi confirmado');
    }
    if (closing.status === 'CANCELED') {
      throw new BadRequestException(
        'Não é possível confirmar um fechamento cancelado',
      );
    }

    // Check for existing confirmed closing for same group/year
    const existing = await this.prisma.annualClosing.findFirst({
      where: {
        groupId,
        cycleYear: closing.cycleYear,
        status: 'CONFIRMED',
        id: { not: closingId },
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Já existe um fechamento confirmado para ${closing.cycleYear} nesta caixinha`,
      );
    }

    return this.prisma.annualClosing.update({
      where: { id: closingId },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
      include: {
        results: {
          include: { member: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async cancel(userId: string, groupId: string, closingId: string) {
    await this.assertOwnership(userId, groupId);

    const closing = await this.prisma.annualClosing.findUnique({
      where: { id: closingId },
    });
    if (!closing || closing.groupId !== groupId) {
      throw new NotFoundException('Fechamento não encontrado');
    }
    if (closing.status === 'CONFIRMED') {
      throw new BadRequestException(
        'Não é possível cancelar um fechamento já confirmado',
      );
    }
    if (closing.status === 'CANCELED') {
      throw new BadRequestException('Este fechamento já está cancelado');
    }

    return this.prisma.annualClosing.update({
      where: { id: closingId },
      data: { status: 'CANCELED', canceledAt: new Date() },
    });
  }
}
