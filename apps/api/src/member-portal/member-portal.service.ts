import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MemberPortalService {
  constructor(private readonly prisma: PrismaService) {}

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
    return {
      id: member.id,
      name: member.name,
      phone: member.phone,
      pixKey: member.pixKey,
      quotasCount: member.quotasCount,
      status: member.status,
      cashGroup: member.cashGroup,
      createdAt: member.createdAt,
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

    return this.prisma.loan.findMany({
      where: { memberId: member.id },
      include: {
        payments: {
          select: { id: true, amount: true, paidAt: true, status: true },
        },
      },
      orderBy: { grantedAt: 'desc' },
    });
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
}
