import { Injectable } from '@nestjs/common';

export interface AIAnalysisRequest {
  context: string;
  input: any;
  expectedOutput: string;
  userId: string;
  metadata?: {
    cashGroupId?: string;
    memberId?: string;
    paymentRequestId?: string;
  };
}

export interface AIAnalysisResult {
  suggestions: any;
  confidence: number; // 0-1
  reasoning: string;
  metadata: {
    provider: string;
    model?: string;
    tokensUsed?: number;
    durationMs: number;
  };
}

@Injectable()
export abstract class AIService {
  abstract analyze(request: AIAnalysisRequest): Promise<AIAnalysisResult>;
  abstract isAvailable(): Promise<boolean>;
  abstract getProviderInfo(): { name: string; version: string; requiresApiKey: boolean };
}
