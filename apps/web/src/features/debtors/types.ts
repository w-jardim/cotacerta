export interface DebtorChargeItem {
  id: string;
  referenceMonth: number;
  referenceYear: number;
  dueDate: string;
  baseAmount: number;
  amountDue: number;
  amountPaid: number;
  pending: number;
  status: string;
}

export interface DebtorLoanItem {
  id: string;
  principalAmount: number;
  interestRate: number;
  totalDue: number;
  amountPaid: number;
  pending: number;
  grantedAt: string;
  dueDate: string | null;
  status: string;
}

export interface Debtor {
  member: {
    id: string;
    name: string;
    phone: string | null;
    pixKey: string | null;
  };
  group: {
    id: string;
    name: string;
    cycleYear: number;
  };
  monthlyCharges: {
    totalDue: number;
    totalPaid: number;
    totalPending: number;
    items: DebtorChargeItem[];
  };
  loans: {
    totalDue: number;
    totalPaid: number;
    totalPending: number;
    items: DebtorLoanItem[];
  };
  totalPending: number;
}

export interface DebtorsSummary {
  membersWithDebt: number;
  totalMonthlyChargesPending: number;
  totalLoansPending: number;
  totalPending: number;
}

export interface DebtorsResponse {
  items: Debtor[];
  summary: DebtorsSummary;
}

export interface DebtorMessage {
  memberId: string;
  memberName: string;
  phone: string | null;
  message: string;
  whatsappUrl: string | null;
}
