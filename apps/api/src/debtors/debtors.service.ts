import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DebtorsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllDebtors(
    userId: string,
    cashGroupId?: string,
    referenceMonth?: number,
    referenceYear?: number,
  ) {
    const groupIds = cashGroupId
      ? [cashGroupId]
      : (
          await this.prisma.cashGroup.findMany({
            where: { ownerUserId: userId },
            select: { id: true },
          })
        ).map((g) => g.id);

    if (cashGroupId) {
      await this.assertOwnedCashGroup(userId, cashGroupId);
    }

    const chargesWhere: any = {
      cashGroupId: { in: groupIds },
      status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] },
    };

    if (referenceMonth && referenceYear) {
      chargesWhere.referenceMonth = referenceMonth;
      chargesWhere.referenceYear = referenceYear;
    }

    const loansWhere: any = {
      cashGroupId: { in: groupIds },
      status: { in: ['OPEN', 'PARTIAL'] },
    };

    const [charges, loans] = await Promise.all([
      this.prisma.monthlyCharge.findMany({
        where: chargesWhere,
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
      }),
      this.prisma.loan.findMany({
        where: loansWhere,
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
      }),
    ]);

    const debtorMap = new Map<string, any>();

    for (const charge of charges) {
      const key = `${charge.cashGroupId}-${charge.memberId}`;
      if (!debtorMap.has(key)) {
        debtorMap.set(key, {
          member: charge.member,
          group: charge.cashGroup,
          monthlyCharges: {
            totalDue: 0,
            totalPaid: 0,
            totalPending: 0,
            items: [],
          },
          loans: {
            totalDue: 0,
            totalPaid: 0,
            totalPending: 0,
            items: [],
          },
          totalPending: 0,
        });
      }

      const debtor = debtorMap.get(key);
      const due = Number(charge.amountDue);
      const paid = Number(charge.amountPaid);
      const pending = due - paid;

      debtor.monthlyCharges.totalDue += due;
      debtor.monthlyCharges.totalPaid += paid;
      debtor.monthlyCharges.totalPending += pending;
      debtor.monthlyCharges.items.push({
        id: charge.id,
        referenceMonth: charge.referenceMonth,
        referenceYear: charge.referenceYear,
        dueDate: charge.dueDate,
        baseAmount: Number(charge.baseAmount),
        amountDue: due,
        amountPaid: paid,
        pending,
        status: charge.status,
      });
      debtor.totalPending += pending;
    }

    for (const loan of loans) {
      const key = `${loan.cashGroupId}-${loan.memberId}`;
      if (!debtorMap.has(key)) {
        debtorMap.set(key, {
          member: loan.member,
          group: loan.cashGroup,
          monthlyCharges: {
            totalDue: 0,
            totalPaid: 0,
            totalPending: 0,
            items: [],
          },
          loans: {
            totalDue: 0,
            totalPaid: 0,
            totalPending: 0,
            items: [],
          },
          totalPending: 0,
        });
      }

      const debtor = debtorMap.get(key);
      const due = Number(loan.totalDue);
      const paid = Number(loan.amountPaid);
      const pending = due - paid;

      debtor.loans.totalDue += due;
      debtor.loans.totalPaid += paid;
      debtor.loans.totalPending += pending;
      debtor.loans.items.push({
        id: loan.id,
        principalAmount: Number(loan.principalAmount),
        interestRate: Number(loan.interestRate),
        totalDue: due,
        amountPaid: paid,
        pending,
        grantedAt: loan.grantedAt,
        dueDate: loan.dueDate,
        status: loan.status,
      });
      debtor.totalPending += pending;
    }

    const items = Array.from(debtorMap.values()).filter(
      (debtor) => debtor.totalPending > 0,
    );

    const summary = {
      membersWithDebt: items.length,
      totalMonthlyChargesPending: items.reduce(
        (sum, item) => sum + item.monthlyCharges.totalPending,
        0,
      ),
      totalLoansPending: items.reduce(
        (sum, item) => sum + item.loans.totalPending,
        0,
      ),
      totalPending: items.reduce((sum, item) => sum + item.totalPending, 0),
    };

    return { items, summary };
  }

  async getDebtorsByCashGroup(
    userId: string,
    cashGroupId: string,
    referenceMonth?: number,
    referenceYear?: number,
  ) {
    await this.assertOwnedCashGroup(userId, cashGroupId);
    return this.getAllDebtors(
      userId,
      cashGroupId,
      referenceMonth,
      referenceYear,
    );
  }

  async getDebtorMessage(
    userId: string,
    cashGroupId: string,
    memberId: string,
    referenceMonth?: number,
    referenceYear?: number,
  ) {
    const cashGroup = await this.assertOwnedCashGroup(userId, cashGroupId);
    const member = await this.assertMemberInCashGroup(memberId, cashGroupId);

    const debtors = await this.getAllDebtors(
      userId,
      cashGroupId,
      referenceMonth,
      referenceYear,
    );

    const debtor = debtors.items.find(
      (item) =>
        item.member.id === memberId && item.group.id === cashGroupId,
    );

    if (!debtor || debtor.totalPending <= 0) {
      throw new NotFoundException(
        'Não há pendências para este cotista no período selecionado',
      );
    }

    const parts: string[] = [];
    parts.push(`Olá ${member.name},`);
    parts.push(
      `Passando para lembrar que consta uma pendência na caixinha *${cashGroup.name}*`,
    );

    if (debtor.monthlyCharges.totalPending > 0) {
      parts.push(
        `\n*Cotas mensais:* R$ ${debtor.monthlyCharges.totalPending.toFixed(2)}`,
      );
    }

    if (debtor.loans.totalPending > 0) {
      parts.push(
        `*Empréstimos:* R$ ${debtor.loans.totalPending.toFixed(2)}`,
      );
    }

    parts.push(
      `\n*Total pendente:* R$ ${debtor.totalPending.toFixed(2)}`,
    );
    parts.push('\nQuando puder, regularize por favor.');

    const message = parts.join('\n');
    const phone = member.phone?.replace(/\D/g, '');
    const whatsappUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : null;

    return {
      memberId: member.id,
      memberName: member.name,
      phone: member.phone,
      message,
      whatsappUrl,
    };
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

  private async assertMemberInCashGroup(
    memberId: string,
    cashGroupId: string,
  ) {
    const member = await this.prisma.member.findFirst({
      where: {
        id: memberId,
        cashGroupId,
      },
    });

    if (!member) {
      throw new NotFoundException(
        'Cotista não encontrado nesta caixinha',
      );
    }

    return member;
  }
}
