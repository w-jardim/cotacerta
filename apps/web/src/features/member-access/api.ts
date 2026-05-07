import { apiClient } from '../../lib/api-client';
import type { CreateAccessResult, AccessStatus } from './types';

export const memberAccessApi = {
  async createAccess(
    groupId: string,
    memberId: string,
    email: string,
  ): Promise<CreateAccessResult> {
    const response = await apiClient.post<CreateAccessResult>(
      `/cash-groups/${groupId}/members/${memberId}/access`,
      { email },
    );
    return response.data;
  },

  async getAccess(
    groupId: string,
    memberId: string,
  ): Promise<AccessStatus> {
    const response = await apiClient.get<AccessStatus>(
      `/cash-groups/${groupId}/members/${memberId}/access`,
    );
    return response.data;
  },

  async blockAccess(groupId: string, memberId: string): Promise<void> {
    await apiClient.patch(
      `/cash-groups/${groupId}/members/${memberId}/access/block`,
    );
  },

  async activateAccess(
    groupId: string,
    memberId: string,
  ): Promise<void> {
    await apiClient.patch(
      `/cash-groups/${groupId}/members/${memberId}/access/activate`,
    );
  },
};
