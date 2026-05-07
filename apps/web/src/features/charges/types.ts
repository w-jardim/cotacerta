export type MonthlyChargeStatus =
  | 'PENDING'
  | 'PAID'
  | 'PARTIAL'
  | 'OVERDUE'
  | 'CANCELED';

export interface MonthlyCharge {
  id: string;
  cashGroupId: string;
  memberId: string;
  quotasCount: number;
  referenceMonth: number;
  referenceYear: number;
  dueDate: string;
  baseAmount: string;
  amountDue: string;
  amountPaid: string;
  overdueMonths?: number;
  lateFeeAmount?: string;
  monthlyLateFeeAmount?: string;
  appliedInterestRate?: string;
  status: MonthlyChargeStatus;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  member?: {
    id: string;
    name: string;
    phone: string | null;
    pixKey: string | null;
  };
  cashGroup?: {
    id: string;
    name: string;
    cycleYear: number;
    defaultLoanInterestRate?: string;
  };
}

export type PaymentMethod = 'PIX';

export interface PaymentReceipt {
  id?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
  createdAt?: string;
}

export interface ChargePayment {
  id: string;
  monthlyChargeId: string;
  cashGroupId: string;
  memberId: string;
  amountPaid: string;
  paidAt: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  receipt?: PaymentReceipt | null;
}

export interface ChargeDetails extends MonthlyCharge {
  payments: ChargePayment[];
}

export interface ChargesSummary {
  totalDue: string;
  totalPaid: string;
  totalPending: string;
  totalCharges: number;
  paidCount: number;
  pendingCount: number;
}

export interface ChargesListResponse {
  charges: MonthlyCharge[];
  summary: ChargesSummary;
}

export interface GenerateChargesDto {
  referenceMonth: number;
  referenceYear: number;
}

export interface MarkPaidDto {
  amountPaid: number;
}

export interface RegisterPaymentData {
  amountPaid: number;
  paidAt: string;
  paymentMethod: PaymentMethod;
  receipt?: PaymentReceipt;
}
