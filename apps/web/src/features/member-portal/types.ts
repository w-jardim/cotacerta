export interface PortalGroup {
  id: string;
  name: string;
  cycleYear: number;
  quotaValue: string;
  dueDay: number;
  status: string;
  quotasCount: number;
  memberStatus: string;
}

export interface PortalMember {
  id: string;
  name: string;
  phone: string | null;
  pixKey: string | null;
  quotasCount: number;
  status: string;
  cashGroup: Omit<PortalGroup, 'quotasCount' | 'memberStatus'>;
  createdAt: string;
}

export interface PortalCharge {
  id: string;
  referenceMonth: number;
  referenceYear: number;
  quotasCount: number;
  baseAmount: string;
  amountDue: string;
  amountPaid: string;
  dueDate: string;
  paidAt: string | null;
  status: string;
}

export interface PortalPayment {
  id: string;
  amountPaid: string;
  paidAt: string;
  paymentMethod: string;
  monthlyCharge: { referenceMonth: number; referenceYear: number };
  receipt: { id: string; fileName: string } | null;
}

export interface PortalLoan {
  id: string;
  principalAmount: string;
  interestRate: string;
  totalDue: string;
  amountPaid: string;
  grantedAt: string;
  dueDate: string | null;
  paidAt: string | null;
  status: string;
  notes: string | null;
  payments: Array<{
    id: string;
    amount: string;
    paidAt: string;
    status: string;
  }>;
}

export interface PortalDebts {
  pendingCharges: PortalCharge[];
  pendingLoans: PortalLoan[];
  summary: {
    totalChargesDebt: string;
    totalLoansDebt: string;
    totalDebt: string;
    pendingChargesCount: number;
    pendingLoansCount: number;
  };
}
