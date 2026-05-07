export type AnnualClosingStatus = 'SIMULATED' | 'CONFIRMED' | 'CANCELED';

export interface MemberClosingResult {
  id?: string;
  memberId: string;
  memberName?: string;
  member?: { id: string; name: string };
  quotaQuantity: number;
  grossAmount: string | number;
  quotaDebtAmount: string | number;
  loanDebtAmount: string | number;
  totalDebtAmount: string | number;
  netAmount: string | number;
  remainingDebtAmount: string | number;
}

export interface AnnualClosing {
  id: string;
  groupId: string;
  cycleYear: number;
  status: AnnualClosingStatus;
  totalQuotaReceived: string | number;
  totalLoanReceived: string | number;
  totalAvailable: string | number;
  totalQuotaPending: string | number;
  totalLoanPending: string | number;
  totalPending: string | number;
  totalQuotas: number;
  valuePerQuota: string | number;
  confirmedAt: string | null;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
  results: MemberClosingResult[];
}

export interface SimulateResult {
  groupId: string;
  cycleYear: number;
  status: 'SIMULATED';
  totalQuotaReceived: number;
  totalLoanReceived: number;
  totalAvailable: number;
  totalQuotaPending: number;
  totalLoanPending: number;
  totalPending: number;
  totalQuotas: number;
  valuePerQuota: number;
  memberResults: MemberClosingResult[];
}
