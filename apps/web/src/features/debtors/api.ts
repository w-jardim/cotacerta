import { apiClient } from '../../lib/api-client';
import type { DebtorsResponse, DebtorMessage } from './types';

export const debtorsApi = {
  async getAllDebtors(
    cashGroupId?: string,
    referenceMonth?: number,
    referenceYear?: number,
  ): Promise<DebtorsResponse> {
    const params: any = {};
    if (cashGroupId) params.cashGroupId = cashGroupId;
    if (referenceMonth) params.referenceMonth = referenceMonth;
    if (referenceYear) params.referenceYear = referenceYear;

    const response = await apiClient.get('/debtors', { params });
    return response.data;
  },

  async getDebtorsByCashGroup(
    cashGroupId: string,
    referenceMonth?: number,
    referenceYear?: number,
  ): Promise<DebtorsResponse> {
    const params: any = {};
    if (referenceMonth) params.referenceMonth = referenceMonth;
    if (referenceYear) params.referenceYear = referenceYear;

    const response = await apiClient.get(
      `/cash-groups/${cashGroupId}/debtors`,
      { params },
    );
    return response.data;
  },

  async getDebtorMessage(
    cashGroupId: string,
    memberId: string,
    referenceMonth?: number,
    referenceYear?: number,
  ): Promise<DebtorMessage> {
    const params: any = {};
    if (referenceMonth) params.referenceMonth = referenceMonth;
    if (referenceYear) params.referenceYear = referenceYear;

    const response = await apiClient.get(
      `/cash-groups/${cashGroupId}/debtors/${memberId}/message`,
      { params },
    );
    return response.data;
  },
};
