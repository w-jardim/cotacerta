export type LoanStatus = 'OPEN' | 'PARTIAL' | 'PAID' | 'CANCELED';
export type LoanPaymentMethod = 'PIX' | 'CASH' | 'OTHER';
export type LoanPaymentStatus = 'CONFIRMED' | 'CANCELED';

export interface LoanPayment {
  id: string;
  loanId: string;
  amount: string;
  method: LoanPaymentMethod;
  status: LoanPaymentStatus;
  paidAt: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  id: string;
  cashGroupId: string;
  memberId: string;
  principalAmount: string;
  interestRate: string;
  totalDue: string;
  totalInterestAmount: string;
  amountPaid: string;
  interestPaidAmount: string;
  interestRemainingAmount: string;
  principalPaidAmount: string;
  principalRemainingAmount: string;
  remainingAmount: string;
  grantedAt: string;
  dueDate: string | null;
  paidAt: string | null;
  status: LoanStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  member?: {
    id: string;
    name: string;
    phone: string | null;
    pixKey: string | null;
    status?: string;
  };
  cashGroup?: {
    id: string;
    name: string;
    cycleYear: number;
    defaultLoanInterestRate?: string;
  };
  payments?: LoanPayment[];
}

export interface LoansSummary {
  totalPrincipal: string;
  totalDue: string;
  totalPaid: string;
  totalOpen: string;
  openCount: number;
  partialCount: number;
  paidCount: number;
  canceledCount: number;
}

export interface LoansListResponse {
  items: Loan[];
  summary: LoansSummary;
}

export interface CreateLoanData {
  memberId: string;
  principalAmount: number;
  interestRate?: number;
  grantedAt: string;
  dueDate?: string;
  notes?: string;
}

export interface RegisterLoanPaymentData {
  amount: number;
  method: LoanPaymentMethod;
  paidAt: string;
  notes?: string;
}
