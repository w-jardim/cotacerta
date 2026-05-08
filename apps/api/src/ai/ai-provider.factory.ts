import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from './ai.service';
import { LocalAIProvider } from './providers/local.provider';
import { OpenAIProvider } from './providers/openai.provider';

@Injectable()
export class AIProviderFactory {
  constructor(
    private prisma: PrismaService,
    private localProvider: LocalAIProvider,
    private openaiProvider: OpenAIProvider,
  ) {}

  async getProvider(userId: string): Promise<AIService> {
    const config = await this.prisma.gestorAIConfig.findUnique({ where: { userId } });

    if (!config || !config.aiEnabled) return this.localProvider;

    if (config.provider === 'openai' && (await this.openaiProvider.isAvailable())) {
      return this.openaiProvider;
    }

    return this.localProvider;
  }

  async isAIEnabled(userId: string): Promise<boolean> {
    const config = await this.prisma.gestorAIConfig.findUnique({ where: { userId } });
    return config?.aiEnabled ?? false;
  }
}
