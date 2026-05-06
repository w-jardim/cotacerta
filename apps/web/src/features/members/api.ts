import { apiClient } from '../../lib/api-client';
import type { Member, CreateMemberData, UpdateMemberData } from './types';

export const membersApi = {
  async create(data: CreateMemberData): Promise<Member> {
    const response = await apiClient.post<Member>('/members', data);
    return response.data;
  },

  async getAll(cashGroupId: string): Promise<Member[]> {
    const response = await apiClient.get<Member[]>('/members', {
      params: { cashGroupId },
    });
    return response.data;
  },

  async getAllUserMembers(): Promise<any[]> {
    const response = await apiClient.get<any[]>('/members');
    return response.data;
  },

  async getOne(id: string): Promise<Member> {
    const response = await apiClient.get<Member>(`/members/${id}`);
    return response.data;
  },

  async update(id: string, data: UpdateMemberData): Promise<Member> {
    const response = await apiClient.patch<Member>(`/members/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<Member> {
    const response = await apiClient.delete<Member>(`/members/${id}`);
    return response.data;
  },
};
