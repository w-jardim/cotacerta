export interface PortalGroup {
  id: string;
  name: string;
  cycleYear: number;
  quotaValue: string;
  dueDay: number;
  status: string;
  receivingPixEnabledForCharges?: boolean;
  receivingPixEnabledForLoans?: boolean;
  receivingPixKey?: string | null;
  receivingPixKeyHolder?: string | null;
  receivingPixReceiverCity?: string | null;
  receivingPixDescriptionPrefix?: string | null;
  receivingInstructions?: string | null;
  quotasCount: number;
  memberStatus: string;
}

export interface PortalMember {
  id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  pixKey: string | null;
  bankInstitution: string | null;
  bankAccountHolder: string | null;
  quotasCount: number;
  status: string;
  cashGroup: Omit<PortalGroup, 'quotasCount' | 'memberStatus'>;
  createdAt: string;
  pendingProfileChange: {
    id: string;
    requestedData: Record<string, string | null | undefined>;
    createdAt: string;
  } | null;
}

export interface UpdateProfileData {
  name?: string;
  cpf?: string;
  phone?: string;
  pixKey?: string;
  bankInstitution?: string;
  bankAccountHolder?: string;
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

export type PaymentRequestStatus =
  | 'PENDING_REVIEW'
  | 'AUTO_MATCHED'
  | 'NEEDS_MANUAL_REVIEW'
  | 'MISMATCH'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELED';

export type PaymentRequestType = 'MONTHLY_CHARGE' | 'LOAN';
export type ReceivingMethod = 'PIX' | 'CASH' | 'OTHER';

export interface PortalPaymentRequest {
  id: string;
  type: PaymentRequestType;
  method: ReceivingMethod;
  amountDeclared: string;
  status: PaymentRequestStatus;
  notes: string | null;
  reviewNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
  monthlyCharge: { id: string; referenceMonth: number; referenceYear: number } | null;
  loan: { id: string; principalAmount: string; totalDue: string } | null;
  pixPayload: {
    copyPasteCode: string;
    receiverName: string;
    receiverCity: string;
    pixKey: string;
    amount: string;
    description: string | null;
    txid: string | null;
  } | null;
}

export interface SubmitPaymentRequestData {
  type: PaymentRequestType;
  monthlyChargeId?: string;
  loanId?: string;
  method: ReceivingMethod;
  amountDeclared: number;
  receiptFileName?: string;
  receiptMimeType?: string;
  receiptDataUrl?: string;
  notes?: string;
}

export interface StartPixPaymentData {
  method: 'PIX';
}

export interface PixStartResponse {
  paymentRequest: {
    id: string;
    status: PaymentRequestStatus;
    amount: number;
    method: ReceivingMethod;
    receiptUploaded: boolean;
  };
  pix: {
    copyPasteCode: string;
    receiverName: string;
    receiverCity: string;
    pixKey: string;
    amount: number;
    description: string | null;
    txid: string | null;
  };
}

export interface AttachPixReceiptData {
  receiptFileName: string;
  receiptMimeType: string;
  receiptDataUrl: string;
}

export interface MemberPortalReceivingSettings {
  groupId: string;
  pix: {
    enabledForCharges: boolean;
    enabledForLoans: boolean;
    pixKey: string | null;
    receiverName: string | null;
    receiverCity: string | null;
    descriptionPrefix: string | null;
  };
  instructions: string | null;
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
