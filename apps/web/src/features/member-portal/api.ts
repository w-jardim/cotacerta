import { apiClient } from '../../lib/api-client';
import type {
  PortalMember,
  PortalGroup,
  PortalCharge,
  PortalPayment,
  PortalLoan,
  PortalDebts,
  UpdateProfileData,
  PortalPaymentRequest,
  SubmitPaymentRequestData,
  StartPixPaymentData,
  PixStartResponse,
  AttachPixReceiptData,
  MemberPortalReceivingSettings,
} from './types';

export const memberPortalApi = {
  async getMe(): Promise<PortalMember> {
    const response = await apiClient.get<PortalMember>('/member-portal/me');
    return response.data;
  },

  async updateMe(data: UpdateProfileData): Promise<{ message: string; request: { id: string; status: string; createdAt: string } }> {
    const response = await apiClient.patch('/member-portal/me', data);
    return response.data;
  },

  async getGroups(): Promise<PortalGroup[]> {
    const response = await apiClient.get<PortalGroup[]>('/member-portal/groups');
    return response.data;
  },

  async getReceivingSettings(groupId: string): Promise<MemberPortalReceivingSettings> {
    const response = await apiClient.get<MemberPortalReceivingSettings>(
      `/member-portal/groups/${groupId}/receiving-settings`,
    );
    return response.data;
  },

  async getCharges(params?: {
    groupId?: string;
    referenceMonth?: number;
    referenceYear?: number;
  }): Promise<PortalCharge[]> {
    const response = await apiClient.get<PortalCharge[]>('/member-portal/charges', { params });
    return response.data;
  },

  async getPayments(): Promise<PortalPayment[]> {
    const response = await apiClient.get<PortalPayment[]>('/member-portal/payments');
    return response.data;
  },

  async getLoans(): Promise<PortalLoan[]> {
    const response = await apiClient.get<PortalLoan[]>('/member-portal/loans');
    return response.data;
  },

  async getDebts(): Promise<PortalDebts> {
    const response = await apiClient.get<PortalDebts>('/member-portal/debts');
    return response.data;
  },

  async submitPaymentRequest(data: SubmitPaymentRequestData): Promise<{ message: string; request: { id: string; status: string; createdAt: string } }> {
    const response = await apiClient.post('/member-portal/payment-requests', data);
    return response.data;
  },

  async getPaymentRequests(): Promise<PortalPaymentRequest[]> {
    const response = await apiClient.get<PortalPaymentRequest[]>('/member-portal/payment-requests');
    return response.data;
  },

  async startChargePixPayment(
    chargeId: string,
    data: StartPixPaymentData,
  ): Promise<PixStartResponse> {
    const response = await apiClient.post<PixStartResponse>(
      `/member-portal/charges/${chargeId}/pay`,
      data,
    );
    return response.data;
  },

  async startLoanPixPayment(
    loanId: string,
    data: StartPixPaymentData,
  ): Promise<PixStartResponse> {
    const response = await apiClient.post<PixStartResponse>(
      `/member-portal/loans/${loanId}/pay`,
      data,
    );
    return response.data;
  },

  async attachPaymentReceipt(
    requestId: string,
    data: AttachPixReceiptData,
  ): Promise<PixStartResponse & { message: string }> {
    const response = await apiClient.patch<PixStartResponse & { message: string }>(
      `/member-portal/payment-requests/${requestId}/receipt`,
      data,
    );
    return response.data;
  },
};
