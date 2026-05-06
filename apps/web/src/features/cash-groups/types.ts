export type CashGroupStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'ARCHIVED';

export interface CashGroup {
  id: string;
  ownerUserId: string;
  name: string;
  description: string | null;
  cycleYear: number;
  quotaValue: string;
  dueDay: number;
  maxQuotasPerMember: number;
  defaultLoanInterestRate: string;
  status: CashGroupStatus;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateCashGroupData {
  name: string;
  description?: string;
  cycleYear: number;
  quotaValue: number;
  dueDay: number;
  maxQuotasPerMember?: number;
  defaultLoanInterestRate?: number;
}

export interface UpdateCashGroupData {
  name?: string;
  description?: string;
  quotaValue?: number;
  dueDay?: number;
  maxQuotasPerMember?: number;
  defaultLoanInterestRate?: number;
  status?: CashGroupStatus;
}
