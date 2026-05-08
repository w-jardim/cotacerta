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
  totalInterestAmount: string;
  interestPaidAmount: string;
  interestRemainingAmount: string;
  principalPaidAmount: string;
  principalRemainingAmount: string;
  remainingAmount: string;
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
export type PaymentRequestAnalysisStatus =
  | 'NOT_ANALYZED'
  | 'AUTO_MATCHED'
  | 'NEEDS_MANUAL_REVIEW'
  | 'MISMATCH';

export interface PaymentRequestAnalysis {
  id: string;
  status: PaymentRequestAnalysisStatus;
  extractedText: string | null;
  extractedAmount: string | null;
  extractedPaidAt: string | null;
  extractedReceiver: string | null;
  extractedPixKey: string | null;
  extractedTxid: string | null;
  extractedBank: string | null;
  expectedAmount: string | null;
  expectedReceiver: string | null;
  expectedPixKey: string | null;
  amountMatches: boolean | null;
  receiverMatches: boolean | null;
  pixKeyMatches: boolean | null;
  dateLooksValid: boolean | null;
  issues: string[];
  analyzedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

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
  analysis: PaymentRequestAnalysis | null;
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
  paymentScope?: 'FULL' | 'INTEREST_ONLY';
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

export interface PaymentRequestAnalysisResponse {
  paymentRequestId: string;
  requestStatus: PaymentRequestStatus;
  receiptPresent: boolean;
  analysis: PaymentRequestAnalysis | null;
  expected: {
    amount: string | null;
    receiver: string | null;
    pixKey: string | null;
  };
  summary: {
    badge: string;
    message: string;
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
