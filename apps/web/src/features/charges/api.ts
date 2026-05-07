import { apiClient } from '../../lib/api-client';
import type {
  ChargeDetails,
  ChargePayment,
  MonthlyCharge,
  ChargesListResponse,
  GenerateChargesDto,
  MarkPaidDto,
  RegisterPaymentData,
} from './types';

export const chargesApi = {
  getAllUserCharges: async (): Promise<MonthlyCharge[]> => {
    const response = await apiClient.get('/charges');
    return response.data;
  },

  generateCharges: async (
    cashGroupId: string,
    data: GenerateChargesDto,
  ): Promise<{ createdCharges: MonthlyCharge[]; existingCharges: MonthlyCharge[] }> => {
    const response = await apiClient.post(
      `/cash-groups/${cashGroupId}/charges/generate`,
      data,
    );
    return response.data;
  },

  listCharges: async (
    cashGroupId: string,
    referenceMonth?: number,
    referenceYear?: number,
  ): Promise<ChargesListResponse> => {
    const response = await apiClient.get(
      `/cash-groups/${cashGroupId}/charges`,
      {
        params: {
          ...(referenceMonth ? { referenceMonth } : {}),
          ...(referenceYear ? { referenceYear } : {}),
        },
      },
    );
    return response.data;
  },

  listDebtors: async (
    cashGroupId: string,
    referenceMonth: number,
    referenceYear: number,
  ): Promise<MonthlyCharge[]> => {
    const response = await apiClient.get(
      `/cash-groups/${cashGroupId}/charges/debtors`,
      {
        params: { referenceMonth, referenceYear },
      },
    );
    return response.data;
  },

  getOne: async (
    cashGroupId: string,
    chargeId: string,
  ): Promise<ChargeDetails> => {
    const response = await apiClient.get(
      `/cash-groups/${cashGroupId}/charges/${chargeId}`,
    );
    return response.data;
  },

  registerPayment: async (
    cashGroupId: string,
    chargeId: string,
    data: RegisterPaymentData,
  ): Promise<ChargePayment> => {
    const response = await apiClient.post(
      `/cash-groups/${cashGroupId}/charges/${chargeId}/payments`,
      data,
    );
    return response.data;
  },

  markAsPaid: async (
    cashGroupId: string,
    chargeId: string,
    data: MarkPaidDto,
  ): Promise<MonthlyCharge> => {
    const response = await apiClient.patch(
      `/cash-groups/${cashGroupId}/charges/${chargeId}/mark-paid`,
      data,
    );
    return response.data;
  },

  cancel: async (cashGroupId: string, chargeId: string): Promise<MonthlyCharge> => {
    const response = await apiClient.patch(
      `/cash-groups/${cashGroupId}/charges/${chargeId}/cancel`,
    );
    return response.data;
  },
};
