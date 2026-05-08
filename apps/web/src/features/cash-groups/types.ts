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
  receivingPixEnabledForCharges: boolean;
  receivingPixEnabledForLoans: boolean;
  receivingPixKey: string | null;
  receivingPixKeyHolder: string | null;
  receivingPixReceiverCity: string | null;
  receivingPixDescriptionPrefix: string | null;
  receivingInstructions: string | null;
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
  receivingPixEnabledForCharges?: boolean;
  receivingPixEnabledForLoans?: boolean;
  receivingPixKey?: string;
  receivingPixKeyHolder?: string;
  receivingPixReceiverCity?: string;
  receivingPixDescriptionPrefix?: string;
  receivingInstructions?: string;
}

export interface UpdateCashGroupData {
  name?: string;
  description?: string;
  quotaValue?: number;
  dueDay?: number;
  maxQuotasPerMember?: number;
  defaultLoanInterestRate?: number;
  status?: CashGroupStatus;
  receivingPixEnabledForCharges?: boolean;
  receivingPixEnabledForLoans?: boolean;
  receivingPixKey?: string;
  receivingPixKeyHolder?: string;
  receivingPixReceiverCity?: string;
  receivingPixDescriptionPrefix?: string;
  receivingInstructions?: string;
}

export interface ReceivingSettings {
  id: string;
  receivingPixEnabledForCharges: boolean;
  receivingPixEnabledForLoans: boolean;
  receivingPixKey: string | null;
  receivingPixKeyHolder: string | null;
  receivingPixReceiverCity: string | null;
  receivingPixDescriptionPrefix: string | null;
  receivingInstructions: string | null;
}

export type AdminPaymentRequestStatus =
  | 'PENDING_REVIEW'
  | 'AUTO_MATCHED'
  | 'NEEDS_MANUAL_REVIEW'
  | 'MISMATCH'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELED';

export interface AdminPaymentRequest {
  id: string;
  type: 'MONTHLY_CHARGE' | 'LOAN';
  method: 'PIX' | 'CASH' | 'OTHER';
  amountDeclared: string;
  status: AdminPaymentRequestStatus;
  notes: string | null;
  reviewNotes: string | null;
  receiptFileName: string | null;
  receiptMimeType: string | null;
  receiptDataUrl: string | null;
  createdAt: string;
  reviewedAt: string | null;
  member: { id: string; name: string };
  monthlyCharge: {
    referenceMonth: number;
    referenceYear: number;
    amountDue: string;
    amountPaid: string;
  } | null;
  loan: {
    id: string;
    principalAmount: string;
    totalDue: string;
    amountPaid: string;
  } | null;
  pixPayload: {
    copyPasteCode: string;
    receiverName: string;
    receiverCity: string;
    pixKey: string;
    amount: string;
    description: string | null;
    txid: string | null;
  } | null;
  reviewedBy: { id: string; name: string } | null;
}
