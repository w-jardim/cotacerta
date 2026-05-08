import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { LocalAIProvider } from './providers/local.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { AIProviderFactory } from './ai-provider.factory';
import { AIConfigService } from './ai-config.service';
import { AIConfigController } from './ai-config.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AIConfigController],
  providers: [LocalAIProvider, OpenAIProvider, AIProviderFactory, AIConfigService],
  exports: [AIProviderFactory, LocalAIProvider, OpenAIProvider],
})
export class AIModule {}
