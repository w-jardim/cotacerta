import { apiClient } from '../../lib/api-client';
import type { CommunicationMessage, InboxResponse, UnreadCountResponse } from './types';

export const communicationsApi = {
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const res = await apiClient.get('/communications/unread-count');
    return res.data;
  },

  getInbox: async (page = 1, limit = 30): Promise<InboxResponse> => {
    const res = await apiClient.get('/communications/inbox', { params: { page, limit } });
    return res.data;
  },

  getMessage: async (id: string): Promise<CommunicationMessage> => {
    const res = await apiClient.get(`/communications/${id}`);
    return res.data;
  },

  markRead: async (ids: string[]): Promise<{ updated: number }> => {
    const res = await apiClient.patch('/communications/mark-read', { ids });
    return res.data;
  },

  markAllRead: async (): Promise<{ updated: number }> => {
    const res = await apiClient.patch('/communications/mark-read', {});
    return res.data;
  },

  reply: async (messageId: string, body: string): Promise<CommunicationMessage> => {
    const res = await apiClient.post(`/communications/${messageId}/reply`, { body });
    return res.data;
  },

  sendToMember: async (data: {
    memberId: string;
    cashGroupId?: string;
    title: string;
    body: string;
  }): Promise<CommunicationMessage> => {
    const res = await apiClient.post('/communications/send', data);
    return res.data;
  },

  // Cotista contacts admin
  contactAdmin: async (data: { title: string; body: string }): Promise<void> => {
    await apiClient.post('/member-portal/communications/contact-admin', data);
  },
};
