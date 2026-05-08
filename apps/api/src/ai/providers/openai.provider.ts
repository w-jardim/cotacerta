import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIService, AIAnalysisRequest, AIAnalysisResult } from '../ai.service';

@Injectable()
export class OpenAIProvider extends AIService {
  private readonly logger = new Logger(OpenAIProvider.name);
  private apiKey: string | null = null;

  constructor(private configService: ConfigService) {
    super();
    const key = this.configService.get<string | undefined>('OPENAI_API_KEY');
    this.apiKey = key ?? null;
  }

  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    // Stub: não chama OpenAI ainda, apenas retorna mock
    const startTime = Date.now();

    return {
      suggestions: { note: 'OpenAI stub response (mock)' },
      confidence: 0.75,
      reasoning: 'Resposta simulada por OpenAIProvider stub - sem chamada real',
      metadata: { provider: 'openai', model: this.configService.get<string>('OPENAI_MODEL', 'gpt-4'), durationMs: Date.now() - startTime },
    } as AIAnalysisResult;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  getProviderInfo() {
    return { name: 'OpenAI Provider (stub)', version: '0.1.0', requiresApiKey: true };
  }
}
