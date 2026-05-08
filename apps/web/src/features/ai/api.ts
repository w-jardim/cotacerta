import { apiClient } from '../../lib/api-client';
import type { AIConfig, UpdateAIConfigData } from './types';

export const aiApi = {
  async getConfig(): Promise<AIConfig> {
    const response = await apiClient.get<AIConfig>('/ai/config');
    return response.data;
  },

  async updateConfig(data: UpdateAIConfigData): Promise<AIConfig> {
    const response = await apiClient.patch<AIConfig>('/ai/config', data);
    return response.data;
  },
};
