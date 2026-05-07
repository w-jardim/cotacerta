import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LoanPaymentStatus,
  LoanStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { RegisterLoanPaymentDto } from './dto/register-loan-payment.dto';

@Injectable()
export class LoansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, cashGroupId: string, dto: CreateLoanDto) {
    const cashGroup = await this.assertOwnedCashGroup(userId, cashGroupId);
    const member = await this.assertEligibleMember(cashGroupId, dto.memberId);
    const interestRate =
      dto.interestRate ?? Number(cashGroup.defaultLoanInterestRate);
    const totalDue = this.calculateTotalDue(dto.principalAmount, interestRate);
    const cycleEndDate = this.getCashGroupCycleEndDate(cashGroup.cycleYear);
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : cycleEndDate;

    if (dueDate.getTime() > cycleEndDate.getTime()) {
      throw new BadRequestException(
        'Vencimento do empréstimo não pode ultrapassar o término do ciclo da caixinha',
      );
    }

    const loan = await this.prisma.loan.create({
      data: {
        cashGroupId,
        memberId: member.id,
        principalAmount: new Prisma.Decimal(dto.principalAmount),
        interestRate: new Prisma.Decimal(interestRate),
        totalDue: new Prisma.Decimal(totalDue),
        grantedAt: new Date(dto.grantedAt),
        dueDate,
        notes: dto.notes,
        status: LoanStatus.OPEN,
      },
      include: this.loanDetailsInclude,
    });

    return this.attachLoanMeta(loan);
  }

  async findAll(userId: string, cashGroupId: string, status?: LoanStatus) {
    await this.assertOwnedCashGroup(userId, cashGroupId);

    const loans = await this.prisma.loan.findMany({
      where: {
        cashGroupId,
        ...(status ? { status } : {}),
      },
      include: this.loanListInclude,
      orderBy: [{ status: 'asc' }, { grantedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return this.buildLoanCollection(loans);
  }

  async findAllUserLoans(userId: string, status?: LoanStatus) {
    const loans = await this.prisma.loan.findMany({
      where: {
        cashGroup: {
          ownerUserId: userId,
        },
        ...(status ? { status } : {}),
      },
      include: this.loanListInclude,
      orderBy: [
        { dueDate: 'asc' },
        { grantedAt: 'desc' },
        {
          cashGroup: {
            name: 'asc',
          },
        },
      ],
    });

    return this.buildLoanCollection(loans);
  }

  async findOne(userId: string, cashGroupId: string, loanId: string) {
    const loan = await this.assertOwnedLoan(userId, cashGroupId, loanId);
    return this.attachLoanMeta(loan);
  }

  async cancel(userId: string, cashGroupId: string, loanId: string) {
    const loan = await this.assertOwnedLoan(userId, cashGroupId, loanId);

    if (loan.status === LoanStatus.CANCELED) {
      throw new ConflictException('Este empréstimo já está cancelado');
    }

    if (loan.status === LoanStatus.PAID) {
      throw new ConflictException('Empréstimo quitado não pode ser cancelado');
    }

    const updated = await this.prisma.loan.update({
      where: { id: loanId },
      data: {
        status: LoanStatus.CANCELED,
      },
      include: this.loanDetailsInclude,
    });

    return this.attachLoanMeta(updated);
  }

  async registerPayment(
    userId: string,
    cashGroupId: string,
    loanId: string,
    dto: RegisterLoanPaymentDto,
  ) {
    const loan = await this.assertOwnedLoan(userId, cashGroupId, loanId);
    const financials = this.getLoanFinancialSnapshot(loan);
    const remainingAmount = Number(
      (financials.totalDue - financials.amountPaid).toFixed(2),
    );

    if (loan.status === LoanStatus.CANCELED) {
      throw new ConflictException('Empréstimo cancelado não pode receber pagamento');
    }

    if (remainingAmount <= 0 || loan.status === LoanStatus.PAID) {
      throw new ConflictException('Este empréstimo já está quitado');
    }

    if (dto.amount > remainingAmount) {
      throw new BadRequestException(
        `Valor pago não pode exceder o saldo pendente de R$ ${remainingAmount.toFixed(2)}`,
      );
    }

    const payment = await this.prisma.loanPayment.create({
      data: {
        loanId,
        amount: new Prisma.Decimal(dto.amount),
        method: dto.method,
        paidAt: new Date(dto.paidAt),
        notes: dto.notes,
      },
    });

    await this.refreshLoanStatus(loanId);

    return this.prisma.loanPayment.findUnique({
      where: { id: payment.id },
    });
  }

  async listPayments(userId: string, cashGroupId: string, loanId: string) {
    await this.assertOwnedLoan(userId, cashGroupId, loanId);

    return this.prisma.loanPayment.findMany({
      where: { loanId },
      orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async cancelPayment(
    userId: string,
    cashGroupId: string,
    loanId: string,
    paymentId: string,
  ) {
    const loan = await this.assertOwnedLoan(userId, cashGroupId, loanId);
    const payment = await this.prisma.loanPayment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || payment.loanId !== loan.id) {
      throw new NotFoundException('Pagamento do empréstimo não encontrado');
    }

    if (payment.status === LoanPaymentStatus.CANCELED) {
      throw new ConflictException('Este pagamento já está cancelado');
    }

    await this.prisma.loanPayment.update({
      where: { id: paymentId },
      data: { status: LoanPaymentStatus.CANCELED },
    });

    if (loan.status === LoanStatus.CANCELED) {
      await this.refreshLoanStatus(loanId, true);
      return this.prisma.loanPayment.findUnique({
        where: { id: paymentId },
      });
    }

    await this.refreshLoanStatus(loanId);

    return this.prisma.loanPayment.findUnique({
      where: { id: paymentId },
    });
  }

  private readonly loanListInclude = {
    member: {
      select: {
        id: true,
        name: true,
        phone: true,
        pixKey: true,
        status: true,
      },
    },
    cashGroup: {
      select: {
        id: true,
        name: true,
        ownerUserId: true,
        cycleYear: true,
        defaultLoanInterestRate: true,
      },
    },
    payments: {
      where: {
        status: LoanPaymentStatus.CONFIRMED,
      },
      select: {
        id: true,
        amount: true,
        paidAt: true,
        status: true,
      },
    },
  } satisfies Prisma.LoanInclude;

  private readonly loanDetailsInclude = {
    member: {
      select: {
        id: true,
        name: true,
        phone: true,
        pixKey: true,
        status: true,
      },
    },
    cashGroup: {
      select: {
        id: true,
        name: true,
        ownerUserId: true,
        cycleYear: true,
        defaultLoanInterestRate: true,
      },
    },
    payments: {
      orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
    },
  } satisfies Prisma.LoanInclude;

  private buildLoanCollection(loans: Array<any>) {
    const items = loans.map((loan) => this.attachLoanMeta(loan));
    const summary = {
      totalPrincipal: this.toMoneyString(
        items.reduce((sum, loan) => sum + Number(loan.principalAmount), 0),
      ),
      totalDue: this.toMoneyString(
        items.reduce((sum, loan) => sum + Number(loan.totalDue), 0),
      ),
      totalPaid: this.toMoneyString(
        items.reduce((sum, loan) => sum + Number(loan.amountPaid), 0),
      ),
      totalOpen: this.toMoneyString(
        items
          .filter((loan) => loan.status !== LoanStatus.CANCELED)
          .reduce((sum, loan) => sum + Number(loan.remainingAmount), 0),
      ),
      openCount: items.filter((loan) => loan.status === LoanStatus.OPEN).length,
      partialCount: items.filter((loan) => loan.status === LoanStatus.PARTIAL).length,
      paidCount: items.filter((loan) => loan.status === LoanStatus.PAID).length,
      canceledCount: items.filter((loan) => loan.status === LoanStatus.CANCELED).length,
    };

    return { items, summary };
  }

  private async assertOwnedCashGroup(userId: string, cashGroupId: string) {
    const cashGroup = await this.prisma.cashGroup.findUnique({
      where: { id: cashGroupId },
    });

    if (!cashGroup) {
      throw new NotFoundException('Caixinha não encontrada');
    }

    if (cashGroup.ownerUserId !== userId) {
      throw new ForbiddenException('Você não tem permissão para acessar esta caixinha');
    }

    return cashGroup;
  }

  private async assertEligibleMember(cashGroupId: string, memberId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member || member.cashGroupId !== cashGroupId) {
      throw new BadRequestException('Cotista não pertence a esta caixinha');
    }

    if (member.status !== 'ACTIVE') {
      throw new BadRequestException('Apenas cotistas ativos podem receber empréstimo');
    }

    return member;
  }

  private async assertOwnedLoan(userId: string, cashGroupId: string, loanId: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: this.loanDetailsInclude,
    });

    if (!loan) {
      throw new NotFoundException('Empréstimo não encontrado');
    }

    if (loan.cashGroupId !== cashGroupId) {
      throw new ForbiddenException('Este empréstimo não pertence à caixinha especificada');
    }

    if (loan.cashGroup.ownerUserId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar empréstimos desta caixinha',
      );
    }

    return loan;
  }

  private calculateTotalDue(principalAmount: number, interestRate: number) {
    return Number(
      (principalAmount + principalAmount * (interestRate / 100)).toFixed(2),
    );
  }

  private getCashGroupCycleEndDate(cycleYear: number) {
    return new Date(Date.UTC(cycleYear, 11, 31, 12, 0, 0));
  }

  private getLoanFinancialSnapshot(loan: {
    principalAmount: Prisma.Decimal | number;
    totalDue: Prisma.Decimal | number;
    interestRate: Prisma.Decimal | number;
    amountPaid: Prisma.Decimal | number;
    status: LoanStatus;
    payments?: Array<{
      amount: Prisma.Decimal | number;
      status: LoanPaymentStatus;
      paidAt: Date;
    }>;
  }) {
    const confirmedPayments = (loan.payments ?? []).filter(
      (payment) => payment.status === LoanPaymentStatus.CONFIRMED,
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
    const paidAt = confirmedPayments.length ? confirmedPayments[0].paidAt : null;

    let status = loan.status;

    if (loan.status !== LoanStatus.CANCELED) {
      if (amountPaid >= totalDue) {
        status = LoanStatus.PAID;
      } else if (amountPaid > 0) {
        status = LoanStatus.PARTIAL;
      } else {
        status = LoanStatus.OPEN;
      }
    }

    return {
      principalAmount,
      totalDue,
      totalInterestAmount,
      amountPaid: Number(amountPaid.toFixed(2)),
      interestPaidAmount,
      interestRemainingAmount,
      principalPaidAmount,
      principalRemainingAmount,
      remainingAmount,
      paidAt,
      status,
      paymentsCount: confirmedPayments.length,
    };
  }

  private async refreshLoanStatus(loanId: string, preserveCanceledStatus = false) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        payments: true,
      },
    });

    if (!loan) {
      throw new NotFoundException('Empréstimo não encontrado');
    }

    const snapshot = this.getLoanFinancialSnapshot(loan);

    await this.prisma.loan.update({
      where: { id: loanId },
      data: {
        amountPaid: new Prisma.Decimal(snapshot.amountPaid),
        paidAt:
          !preserveCanceledStatus && snapshot.status === LoanStatus.PAID
            ? snapshot.paidAt
            : null,
        status: preserveCanceledStatus ? LoanStatus.CANCELED : snapshot.status,
      },
    });
  }

  private attachLoanMeta<T extends {
    principalAmount: Prisma.Decimal | number;
    totalDue: Prisma.Decimal | number;
    amountPaid: Prisma.Decimal | number;
    interestRate: Prisma.Decimal | number;
    status: LoanStatus;
    payments?: Array<{
      amount: Prisma.Decimal | number;
      status: LoanPaymentStatus;
      paidAt: Date;
    }>;
  }>(loan: T) {
    const snapshot = this.getLoanFinancialSnapshot(loan);

    return {
      ...loan,
      amountPaid: new Prisma.Decimal(snapshot.amountPaid),
      totalInterestAmount: new Prisma.Decimal(snapshot.totalInterestAmount),
      interestPaidAmount: new Prisma.Decimal(snapshot.interestPaidAmount),
      interestRemainingAmount: new Prisma.Decimal(snapshot.interestRemainingAmount),
      principalPaidAmount: new Prisma.Decimal(snapshot.principalPaidAmount),
      principalRemainingAmount: new Prisma.Decimal(snapshot.principalRemainingAmount),
      remainingAmount: new Prisma.Decimal(snapshot.remainingAmount),
      calculatedStatus: snapshot.status,
      status: snapshot.status,
      paidAt: snapshot.status === LoanStatus.PAID ? snapshot.paidAt : null,
    };
  }

  private toMoneyString(value: number) {
    return value.toFixed(2);
  }
}
