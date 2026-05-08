import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AIConfigService } from './ai-config.service';
import { UpdateAIConfigDto } from './dto/update-ai-config.dto';

@Controller('ai/config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GESTOR_MASTER', 'ADMIN_PLATFORM')
export class AIConfigController {
  constructor(private readonly aiConfigService: AIConfigService) {}

  @Get()
  getConfig(@Request() req) {
    return this.aiConfigService.getConfig(req.user.id);
  }

  @Patch()
  updateConfig(@Request() req, @Body() dto: UpdateAIConfigDto) {
    return this.aiConfigService.updateConfig(req.user.id, dto);
  }
}
