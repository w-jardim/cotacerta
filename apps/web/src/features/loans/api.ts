import { apiClient } from '../../lib/api-client';
import type {
  CreateLoanData,
  Loan,
  LoanPayment,
  LoanStatus,
  LoansListResponse,
  RegisterLoanPaymentData,
} from './types';

export const loansApi = {
  async getAllUserLoans(status?: LoanStatus): Promise<LoansListResponse> {
    const response = await apiClient.get<LoansListResponse>('/loans', {
      params: status ? { status } : {},
    });
    return response.data;
  },

  async listLoans(cashGroupId: string, status?: LoanStatus): Promise<LoansListResponse> {
    const response = await apiClient.get<LoansListResponse>(`/cash-groups/${cashGroupId}/loans`, {
      params: status ? { status } : {},
    });
    return response.data;
  },

  async getOne(cashGroupId: string, loanId: string): Promise<Loan> {
    const response = await apiClient.get<Loan>(`/cash-groups/${cashGroupId}/loans/${loanId}`);
    return response.data;
  },

  async create(cashGroupId: string, data: CreateLoanData): Promise<Loan> {
    const response = await apiClient.post<Loan>(`/cash-groups/${cashGroupId}/loans`, data);
    return response.data;
  },

  async cancel(cashGroupId: string, loanId: string): Promise<Loan> {
    const response = await apiClient.patch<Loan>(`/cash-groups/${cashGroupId}/loans/${loanId}/cancel`);
    return response.data;
  },

  async registerPayment(
    cashGroupId: string,
    loanId: string,
    data: RegisterLoanPaymentData,
  ): Promise<LoanPayment> {
    const response = await apiClient.post<LoanPayment>(
      `/cash-groups/${cashGroupId}/loans/${loanId}/payments`,
      data,
    );
    return response.data;
  },

  async listPayments(cashGroupId: string, loanId: string): Promise<LoanPayment[]> {
    const response = await apiClient.get<LoanPayment[]>(
      `/cash-groups/${cashGroupId}/loans/${loanId}/payments`,
    );
    return response.data;
  },

  async cancelPayment(
    cashGroupId: string,
    loanId: string,
    paymentId: string,
  ): Promise<LoanPayment> {
    const response = await apiClient.patch<LoanPayment>(
      `/cash-groups/${cashGroupId}/loans/${loanId}/payments/${paymentId}/cancel`,
    );
    return response.data;
  },
};
