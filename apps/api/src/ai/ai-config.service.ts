import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAIConfigDto } from './dto/update-ai-config.dto';

@Injectable()
export class AIConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(userId: string) {
    const config = await this.prisma.gestorAIConfig.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    return this.serialize(config);
  }

  async updateConfig(userId: string, dto: UpdateAIConfigDto) {
    const config = await this.prisma.gestorAIConfig.upsert({
      where: { userId },
      update: {
        ...(dto.aiEnabled !== undefined && { aiEnabled: dto.aiEnabled }),
        ...(dto.provider !== undefined && { provider: dto.provider }),
      },
      create: {
        userId,
        aiEnabled: dto.aiEnabled ?? false,
        provider: dto.provider ?? 'local',
      },
    });
    return this.serialize(config);
  }

  private serialize(config: { id: string; userId: string; aiEnabled: boolean; provider: string; createdAt: Date; updatedAt: Date }) {
    return {
      id: config.id,
      aiEnabled: config.aiEnabled,
      provider: config.provider,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }
}
