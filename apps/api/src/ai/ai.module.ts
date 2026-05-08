import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { LocalAIProvider } from './providers/local.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { AIProviderFactory } from './ai-provider.factory';
import { AIService } from './ai.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [LocalAIProvider, OpenAIProvider, AIProviderFactory],
  exports: [AIProviderFactory, LocalAIProvider, OpenAIProvider],
})
export class AIModule {}
