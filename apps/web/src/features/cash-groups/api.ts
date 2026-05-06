import { apiClient } from '../../lib/api-client';
import type { CashGroup, CreateCashGroupData, UpdateCashGroupData } from './types';

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

  async delete(id: string): Promise<CashGroup> {
    const response = await apiClient.delete<CashGroup>(`/cash-groups/${id}`);
    return response.data;
  },
};
