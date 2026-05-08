import { apiClient } from '../../lib/api-client';
import type {
  CashGroup,
  CreateCashGroupData,
  UpdateCashGroupData,
  AdminPaymentRequest,
  ReceivingSettings,
} from './types';

export const cashGroupsApi = {
  async getAll(): Promise<CashGroup[]> {
    const response = await apiClient.get<CashGroup[]>('/cash-groups');
    return response.data;
  },

  async getOne(id: string): Promise<CashGroup> {
    const response = await apiClient.get<CashGroup>(`/cash-groups/${id}`);
    return response.data;
  },

  async create(data: CreateCashGroupData): Promise<CashGroup> {
    const response = await apiClient.post<CashGroup>('/cash-groups', data);
    return response.data;
  },

  async update(id: string, data: UpdateCashGroupData): Promise<CashGroup> {
    const response = await apiClient.patch<CashGroup>(`/cash-groups/${id}`, data);
    return response.data;
  },

  async getReceivingSettings(groupId: string): Promise<ReceivingSettings> {
    const response = await apiClient.get<ReceivingSettings>(
      `/cash-groups/${groupId}/receiving-settings`,
    );
    return response.data;
  },

  async updateReceivingSettings(
    groupId: string,
    data: UpdateCashGroupData,
  ): Promise<CashGroup> {
    const response = await apiClient.patch<CashGroup>(
      `/cash-groups/${groupId}/receiving-settings`,
      data,
    );
    return response.data;
  },

  async restore(id: string): Promise<CashGroup> {
    const response = await apiClient.patch<CashGroup>(`/cash-groups/${id}/restore`);
    return response.data;
  },

  async delete(id: string): Promise<CashGroup> {
    const response = await apiClient.delete<CashGroup>(`/cash-groups/${id}`);
    return response.data;
  },

  async getPaymentRequests(groupId: string): Promise<AdminPaymentRequest[]> {
    const response = await apiClient.get<AdminPaymentRequest[]>(
      `/cash-groups/${groupId}/payment-requests`,
    );
    return response.data;
  },

  async confirmPaymentRequest(groupId: string, requestId: string, reviewNotes?: string): Promise<{ message: string }> {
    const response = await apiClient.post(
      `/cash-groups/${groupId}/payment-requests/${requestId}/confirm`,
      { reviewNotes },
    );
    return response.data;
  },

  async rejectPaymentRequest(groupId: string, requestId: string, reviewNotes?: string): Promise<{ message: string }> {
    const response = await apiClient.post(
      `/cash-groups/${groupId}/payment-requests/${requestId}/reject`,
      { reviewNotes },
    );
    return response.data;
  },
};
