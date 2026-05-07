import { apiClient } from '../../lib/api-client';
import type {
  PortalMember,
  PortalGroup,
  PortalCharge,
  PortalPayment,
  PortalLoan,
  PortalDebts,
} from './types';

export const memberPortalApi = {
  async getMe(): Promise<PortalMember> {
    const response = await apiClient.get<PortalMember>('/member-portal/me');
    return response.data;
  },

  async getGroups(): Promise<PortalGroup[]> {
    const response = await apiClient.get<PortalGroup[]>(
      '/member-portal/groups',
    );
    return response.data;
  },

  async getCharges(params?: {
    groupId?: string;
    referenceMonth?: number;
    referenceYear?: number;
  }): Promise<PortalCharge[]> {
    const response = await apiClient.get<PortalCharge[]>(
      '/member-portal/charges',
      { params },
    );
    return response.data;
  },

  async getPayments(): Promise<PortalPayment[]> {
    const response = await apiClient.get<PortalPayment[]>(
      '/member-portal/payments',
    );
    return response.data;
  },

  async getLoans(): Promise<PortalLoan[]> {
    const response = await apiClient.get<PortalLoan[]>(
      '/member-portal/loans',
    );
    return response.data;
  },

  async getDebts(): Promise<PortalDebts> {
    const response = await apiClient.get<PortalDebts>(
      '/member-portal/debts',
    );
    return response.data;
  },
};
