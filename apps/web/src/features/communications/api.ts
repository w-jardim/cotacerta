import { apiClient } from '../../lib/api-client';
import type { InboxResponse, UnreadCountResponse } from './types';

export const communicationsApi = {
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const res = await apiClient.get('/communications/unread-count');
    return res.data;
  },

  getInbox: async (page = 1, limit = 20): Promise<InboxResponse> => {
    const res = await apiClient.get('/communications/inbox', { params: { page, limit } });
    return res.data;
  },

  markRead: async (ids?: string[]): Promise<{ updated: number }> => {
    const res = await apiClient.patch('/communications/mark-read', { ids });
    return res.data;
  },

  markAllRead: async (): Promise<{ updated: number }> => {
    const res = await apiClient.patch('/communications/mark-read', {});
    return res.data;
  },

  // Cotista contacts admin
  contactAdmin: async (data: { title: string; body: string }): Promise<void> => {
    await apiClient.post('/member-portal/communications/contact-admin', data);
  },
};
