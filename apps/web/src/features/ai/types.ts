export interface AIConfig {
  id: string;
  aiEnabled: boolean;
  provider: 'local' | 'openai';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAIConfigData {
  aiEnabled?: boolean;
  provider?: 'local' | 'openai';
}
