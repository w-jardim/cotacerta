import { apiClient } from '../../lib/api-client';
import type { AnnualClosing, SimulateResult } from './types';

export const annualClosingsApi = {
  simulate(groupId: string, cycleYear: number): Promise<SimulateResult> {
    return apiClient
      .post(`/cash-groups/${groupId}/annual-closings/simulate`, { cycleYear })
      .then((r) => r.data);
  },

  save(groupId: string, cycleYear: number): Promise<AnnualClosing> {
    return apiClient
      .post(`/cash-groups/${groupId}/annual-closings`, { cycleYear })
      .then((r) => r.data);
  },

  list(groupId: string): Promise<AnnualClosing[]> {
    return apiClient
      .get(`/cash-groups/${groupId}/annual-closings`)
      .then((r) => r.data);
  },

  get(groupId: string, closingId: string): Promise<AnnualClosing> {
    return apiClient
      .get(`/cash-groups/${groupId}/annual-closings/${closingId}`)
      .then((r) => r.data);
  },

  confirm(groupId: string, closingId: string): Promise<AnnualClosing> {
    return apiClient
      .patch(`/cash-groups/${groupId}/annual-closings/${closingId}/confirm`)
      .then((r) => r.data);
  },

  cancel(groupId: string, closingId: string): Promise<AnnualClosing> {
    return apiClient
      .patch(`/cash-groups/${groupId}/annual-closings/${closingId}/cancel`)
      .then((r) => r.data);
  },
};
